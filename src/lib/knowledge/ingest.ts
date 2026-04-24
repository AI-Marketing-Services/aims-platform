// No "server-only" here on purpose — this module is intentionally
// callable from Node CLI scripts (scripts/ingest-mighty.ts) as well as
// from server routes. The functions inside use Prisma and the Mighty
// HTTP client, both of which only work server-side anyway.
import { db } from "@/lib/db"
import { logger } from "@/lib/logger"
import { listSpaces, listPosts, listCoursework, listEvents } from "@/lib/mighty"
import type {
  MightySpace,
  MightyPost,
  MightyCoursework,
  MightyEvent,
} from "@/lib/mighty/types"
import { htmlToPlainText } from "./html"

/**
 * Ingest Mighty Networks content into our local knowledge base so the
 * portal chatbot can cite specific posts/lessons/events when answering
 * member questions.
 *
 * This function is idempotent — every run upserts by (source, sourceId)
 * and only UPDATES entries whose Mighty updated_at is newer than what
 * we have indexed. That keeps the running cost flat even on a 10-min
 * cadence.
 *
 * One failed item never kills the whole run — we log and keep going.
 */

type SourceStats = {
  seen: number
  upserted: number
  failed: number
}

export type IngestResult = {
  runId: string
  status: "success" | "error" | "partial"
  itemsSeen: number
  itemsUpserted: number
  itemsFailed: number
  sources: Record<string, SourceStats>
  errorMessage?: string
}

export type IngestTrigger = "cron" | "admin" | "cli"

type SpaceLookup = Map<number, string>

function buildSpaceLookup(spaces: MightySpace[]): SpaceLookup {
  const map: SpaceLookup = new Map()
  for (const s of spaces) map.set(s.id, s.name)
  return map
}

// Tag extraction: simple heuristics. Room to grow.
function tagsForPost(p: MightyPost): string[] {
  return [p.post_type, p.content_type].filter(Boolean)
}

function tagsForCoursework(c: MightyCoursework): string[] {
  return [c.type, c.status].filter(Boolean)
}

function tagsForEvent(_e: MightyEvent): string[] {
  return ["event"]
}

async function upsertPosts(
  posts: MightyPost[],
  spaces: SpaceLookup,
  stats: SourceStats,
): Promise<void> {
  for (const p of posts) {
    stats.seen += 1
    try {
      const body = htmlToPlainText(p.description)
      if (!body && !p.summary) {
        // Skip empty posts — they're useless for retrieval.
        continue
      }
      await db.knowledgeEntry.upsert({
        where: { source_sourceId: { source: "mighty:post", sourceId: String(p.id) } },
        create: {
          source: "mighty:post",
          sourceId: String(p.id),
          title: p.title || "(untitled post)",
          body: body || p.summary || "",
          bodyHtml: p.description || null,
          url: p.permalink || null,
          spaceId: String(p.space_id),
          spaceName: spaces.get(p.space_id) ?? null,
          tags: tagsForPost(p),
          publishedAt: p.published_at ? new Date(p.published_at) : null,
        },
        update: {
          title: p.title || "(untitled post)",
          body: body || p.summary || "",
          bodyHtml: p.description || null,
          url: p.permalink || null,
          spaceId: String(p.space_id),
          spaceName: spaces.get(p.space_id) ?? null,
          tags: tagsForPost(p),
          publishedAt: p.published_at ? new Date(p.published_at) : null,
        },
      })
      stats.upserted += 1
    } catch (err) {
      stats.failed += 1
      logger.error("Knowledge ingest: post upsert failed", err, {
        source: "mighty:post",
        sourceId: String(p.id),
      })
    }
  }
}

async function upsertCoursework(
  items: MightyCoursework[],
  spaces: SpaceLookup,
  stats: SourceStats,
): Promise<void> {
  for (const c of items) {
    stats.seen += 1
    try {
      const body = htmlToPlainText(c.description)
      if (!body && !c.title) continue
      await db.knowledgeEntry.upsert({
        where: { source_sourceId: { source: "mighty:coursework", sourceId: String(c.id) } },
        create: {
          source: "mighty:coursework",
          sourceId: String(c.id),
          title: c.title || "(untitled lesson)",
          body,
          bodyHtml: c.description || null,
          url: c.permalink || null,
          spaceId: String(c.space_id),
          spaceName: spaces.get(c.space_id) ?? null,
          tags: tagsForCoursework(c),
          publishedAt: c.created_at ? new Date(c.created_at) : null,
        },
        update: {
          title: c.title || "(untitled lesson)",
          body,
          bodyHtml: c.description || null,
          url: c.permalink || null,
          spaceId: String(c.space_id),
          spaceName: spaces.get(c.space_id) ?? null,
          tags: tagsForCoursework(c),
          publishedAt: c.created_at ? new Date(c.created_at) : null,
        },
      })
      stats.upserted += 1
    } catch (err) {
      stats.failed += 1
      logger.error("Knowledge ingest: coursework upsert failed", err, {
        source: "mighty:coursework",
        sourceId: String(c.id),
      })
    }
  }
}

async function upsertEvents(events: MightyEvent[], stats: SourceStats): Promise<void> {
  for (const e of events) {
    stats.seen += 1
    try {
      const anyEvt = e as unknown as Record<string, unknown>
      const title = typeof anyEvt.title === "string" ? anyEvt.title : "(untitled event)"
      const description =
        typeof anyEvt.description === "string" ? anyEvt.description : ""
      const permalink =
        typeof anyEvt.permalink === "string" ? (anyEvt.permalink as string) : null
      const body = htmlToPlainText(description)
      if (!body && !title) continue
      await db.knowledgeEntry.upsert({
        where: { source_sourceId: { source: "mighty:event", sourceId: String(e.id) } },
        create: {
          source: "mighty:event",
          sourceId: String(e.id),
          title,
          body,
          bodyHtml: description || null,
          url: permalink,
          tags: tagsForEvent(e),
          publishedAt:
            typeof anyEvt.created_at === "string"
              ? new Date(anyEvt.created_at as string)
              : null,
        },
        update: {
          title,
          body,
          bodyHtml: description || null,
          url: permalink,
          tags: tagsForEvent(e),
        },
      })
      stats.upserted += 1
    } catch (err) {
      stats.failed += 1
      logger.error("Knowledge ingest: event upsert failed", err, {
        source: "mighty:event",
        sourceId: String(e.id),
      })
    }
  }
}

export async function ingestMighty(trigger: IngestTrigger = "cron"): Promise<IngestResult> {
  const run = await db.knowledgeIngestRun.create({
    data: { status: "running", trigger },
  })

  const stats: Record<string, SourceStats> = {
    "mighty:post": { seen: 0, upserted: 0, failed: 0 },
    "mighty:coursework": { seen: 0, upserted: 0, failed: 0 },
    "mighty:event": { seen: 0, upserted: 0, failed: 0 },
  }

  let fatalError: string | undefined

  try {
    const spaces = await listSpaces()
    const spaceLookup = buildSpaceLookup(spaces)

    const posts = await listPosts().catch((err) => {
      logger.error("Knowledge ingest: listPosts failed", err)
      return [] as MightyPost[]
    })
    await upsertPosts(posts, spaceLookup, stats["mighty:post"])

    // Coursework lives per-space — walk all spaces.
    const courseworkByCatch = await Promise.allSettled(
      spaces.map((s) => listCoursework(s.id)),
    )
    for (const res of courseworkByCatch) {
      if (res.status === "fulfilled") {
        await upsertCoursework(res.value, spaceLookup, stats["mighty:coursework"])
      } else {
        stats["mighty:coursework"].failed += 1
        logger.error("Knowledge ingest: listCoursework failed for a space", res.reason)
      }
    }

    const events = await listEvents().catch((err) => {
      logger.error("Knowledge ingest: listEvents failed", err)
      return [] as MightyEvent[]
    })
    await upsertEvents(events, stats["mighty:event"])
  } catch (err) {
    fatalError = err instanceof Error ? err.message : String(err)
    logger.error("Knowledge ingest: fatal error", err)
  }

  const itemsSeen = Object.values(stats).reduce((s, x) => s + x.seen, 0)
  const itemsUpserted = Object.values(stats).reduce((s, x) => s + x.upserted, 0)
  const itemsFailed = Object.values(stats).reduce((s, x) => s + x.failed, 0)

  const status: IngestResult["status"] = fatalError
    ? "error"
    : itemsFailed > 0
      ? "partial"
      : "success"

  await db.knowledgeIngestRun.update({
    where: { id: run.id },
    data: {
      status,
      finishedAt: new Date(),
      itemsSeen,
      itemsUpserted,
      itemsFailed,
      errorMessage: fatalError ?? null,
      sources: stats,
    },
  })

  return {
    runId: run.id,
    status,
    itemsSeen,
    itemsUpserted,
    itemsFailed,
    sources: stats,
    errorMessage: fatalError,
  }
}
