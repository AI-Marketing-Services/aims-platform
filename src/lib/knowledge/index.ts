// Intentionally no "server-only" — makes this callable from both API
// routes and from admin CLI utilities (sanity scripts, dev testing).
// The Prisma client is already server-only, so there's no real leak risk.
import { db } from "@/lib/db"
import { truncate } from "./html"

/**
 * Knowledge-base search backing the portal chatbot's search_knowledge
 * tool. Reads from KnowledgeEntry, which is populated by the Mighty
 * ingestion pipeline in src/lib/knowledge/ingest.ts.
 *
 * v1 uses token-AND matching over the body column via Prisma ILIKE.
 * That's fine for the current indexed corpus size (hundreds of posts).
 * When the corpus grows past ~10k entries, swap to Postgres FTS
 * (add a generated tsvector column + @@index) — the search() signature
 * here stays the same so the chatbot route doesn't need to change.
 */

export type KnowledgeEntry = {
  id: string
  title: string
  url: string | null
  snippet: string
  source: "mighty" | "doc" | "faq"
  updatedAt: string
}

export type KnowledgeSearchResult = {
  entries: KnowledgeEntry[]
  query: string
}

const STOPWORDS = new Set([
  "a", "an", "the", "is", "are", "was", "were", "be", "been", "being",
  "have", "has", "had", "do", "does", "did", "will", "would", "could",
  "should", "may", "might", "can", "of", "in", "on", "at", "to", "for",
  "with", "by", "from", "up", "down", "i", "you", "we", "they", "it",
  "what", "where", "when", "why", "how", "who", "which", "that", "this",
  "these", "those", "and", "or", "but", "so", "if", "as", "about",
])

function tokenize(query: string): string[] {
  return query
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length >= 3 && !STOPWORDS.has(t))
    .slice(0, 10)
}

function classifySource(source: string): "mighty" | "doc" | "faq" {
  if (source.startsWith("mighty:")) return "mighty"
  if (source.startsWith("doc:")) return "doc"
  return "faq"
}

function buildSnippet(body: string, tokens: string[]): string {
  if (!body) return ""
  const lower = body.toLowerCase()
  // Find the earliest occurrence of any token and center the snippet there.
  let bestIdx = -1
  for (const tok of tokens) {
    const idx = lower.indexOf(tok)
    if (idx >= 0 && (bestIdx === -1 || idx < bestIdx)) bestIdx = idx
  }
  const start = bestIdx >= 0 ? Math.max(0, bestIdx - 60) : 0
  const window = body.slice(start, start + 220)
  return truncate((start > 0 ? "…" : "") + window, 240)
}

/**
 * Search the Mighty + docs knowledge base for a query. Returns an
 * empty list when the index is empty (first run, clean DB), letting
 * callers degrade gracefully.
 */
export async function searchKnowledge(
  query: string,
  limit = 5,
): Promise<KnowledgeSearchResult> {
  const tokens = tokenize(query)
  if (tokens.length === 0) return { entries: [], query }

  try {
    // AND tokens across title OR body — every token must match somewhere.
    const entries = await db.knowledgeEntry.findMany({
      where: {
        AND: tokens.map((t) => ({
          OR: [
            { title: { contains: t, mode: "insensitive" as const } },
            { body: { contains: t, mode: "insensitive" as const } },
          ],
        })),
      },
      orderBy: [{ publishedAt: "desc" }, { updatedAt: "desc" }],
      take: limit * 3,
    })

    // Rank: title hits > body hits; more tokens matched > fewer.
    const ranked = entries
      .map((e) => {
        const title = e.title.toLowerCase()
        const body = e.body.toLowerCase()
        let score = 0
        for (const t of tokens) {
          if (title.includes(t)) score += 3
          if (body.includes(t)) score += 1
        }
        return { entry: e, score }
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)

    return {
      query,
      entries: ranked.map(({ entry }) => ({
        id: entry.id,
        title: entry.title,
        url: entry.url,
        snippet: buildSnippet(entry.body, tokens),
        source: classifySource(entry.source),
        updatedAt: entry.updatedAt.toISOString(),
      })),
    }
  } catch {
    // Never crash the chatbot on knowledge failures — degrade to empty.
    return { entries: [], query }
  }
}

/** Whether the knowledge base has any indexed content. */
export async function isKnowledgeReady(): Promise<boolean> {
  try {
    const count = await db.knowledgeEntry.count()
    return count > 0
  } catch {
    return false
  }
}

/** Admin-panel friendly aggregate stats about the knowledge base. */
export async function getKnowledgeStats(): Promise<{
  total: number
  bySource: Record<string, number>
  lastIndexedAt: string | null
}> {
  try {
    const [total, grouped, latest] = await Promise.all([
      db.knowledgeEntry.count(),
      db.knowledgeEntry.groupBy({ by: ["source"], _count: { _all: true } }),
      db.knowledgeEntry.findFirst({
        orderBy: { indexedAt: "desc" },
        select: { indexedAt: true },
      }),
    ])
    const bySource: Record<string, number> = {}
    for (const g of grouped) bySource[g.source] = g._count._all
    return { total, bySource, lastIndexedAt: latest?.indexedAt.toISOString() ?? null }
  } catch {
    return { total: 0, bySource: {}, lastIndexedAt: null }
  }
}
