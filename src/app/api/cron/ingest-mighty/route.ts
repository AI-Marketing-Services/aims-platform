import { NextResponse } from "next/server"
import { ingestMighty } from "@/lib/knowledge/ingest"
import { logger } from "@/lib/logger"

export const dynamic = "force-dynamic"
export const maxDuration = 300

/**
 * GET /api/cron/ingest-mighty
 *
 * Scheduled Mighty → KnowledgeEntry sync. Authenticated with
 * CRON_SECRET via Bearer token, the same pattern as the other crons
 * in this project (signal-digest, nurture-unbooked, etc.).
 *
 * Idempotent — re-running before new content appears is a no-op in
 * practice (upserts match; nothing changes). Safe to run on a tight
 * cadence if needed.
 */
export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization")
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const result = await ingestMighty("cron")
    return NextResponse.json(result)
  } catch (err) {
    logger.error("Ingest-mighty cron failed", err, {
      endpoint: "GET /api/cron/ingest-mighty",
    })
    return NextResponse.json({ error: "Ingest failed" }, { status: 500 })
  }
}
