import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth"
import { ingestMighty } from "@/lib/knowledge/ingest"
import { logger } from "@/lib/logger"

export const dynamic = "force-dynamic"
export const maxDuration = 300

/**
 * POST /api/admin/knowledge/run
 *
 * Admin-triggered Mighty ingestion — same work the cron does, but
 * tagged trigger="admin" so the run log makes it clear this was a
 * manual kick-off. Useful after adding content to Mighty when you
 * want to refresh the index immediately instead of waiting for cron.
 */
export async function POST() {
  const adminId = await requireAdmin()
  if (!adminId) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  try {
    const result = await ingestMighty("admin")
    return NextResponse.json(result)
  } catch (err) {
    logger.error("Admin knowledge ingest failed", err, {
      endpoint: "POST /api/admin/knowledge/run",
    })
    return NextResponse.json({ error: "Ingest failed" }, { status: 500 })
  }
}
