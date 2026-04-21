import { analyzeWithClaude } from "@/lib/ai"
import { tavilySearch, canonicalize, type Source } from "./sources"

const MAX_ITERATIONS = 3
const WALL_CLOCK_MS = 45_000

export async function gatherSources(topic: { label: string; query: string }, programMd: string): Promise<Source[]> {
  const pool = new Map<string, Source>()
  const started = Date.now()

  const addAll = (items: Source[]) => {
    let fresh = 0
    for (const s of items) {
      const key = canonicalize(s.url)
      if (!pool.has(key)) {
        pool.set(key, { ...s, url: key })
        fresh++
      }
    }
    return fresh
  }

  addAll(await tavilySearch(topic.query, { max: 8, days: 1 }))

  let prevSize = 0
  for (let i = 0; i < MAX_ITERATIONS; i++) {
    if (Date.now() - started > WALL_CLOCK_MS) break
    if (pool.size - prevSize < 1 && i > 0) break
    prevSize = pool.size

    const queries = await proposeQueries(topic, Array.from(pool.values()), programMd)
    if (queries.length === 0) break

    const batches = await Promise.all(queries.slice(0, 3).map((q) => tavilySearch(q, { max: 5, days: 2 })))
    const added = addAll(batches.flat())
    if (added === 0) break
  }

  return Array.from(pool.values())
}

async function proposeQueries(
  topic: { label: string; query: string },
  known: Source[],
  programMd: string,
): Promise<string[]> {
  const seen = known.slice(0, 12).map((s) => `- ${s.domain}: ${s.title}`).join("\n")
  const { text } = await analyzeWithClaude({
    model: "claude-haiku-4-5-20251001",
    systemPrompt: `You generate search queries for a news research agent. Return ONLY a JSON array of 2-3 short search query strings. No prose.\n\n${programMd}`,
    prompt: `Topic: ${topic.label}\nSeed query: ${topic.query}\n\nAlready-found headlines:\n${seen || "(none yet)"}\n\nPropose 2-3 diverse follow-up queries that would surface NEW primary sources on this topic from the last 48 hours. Return JSON array only.`,
    maxTokens: 200,
    serviceArm: "signal",
  })
  try {
    const match = text.match(/\[[\s\S]*\]/)
    if (!match) return []
    const arr = JSON.parse(match[0]) as unknown
    return Array.isArray(arr) ? arr.filter((x): x is string => typeof x === "string") : []
  } catch {
    return []
  }
}
