import { NextResponse } from "next/server"
import { logCronExecution } from "@/lib/cron-log"
import { logger } from "@/lib/logger"
import { runCloseSync } from "@/lib/close/sync"

/**
 * Hourly cron that pulls every AOC-tagged Close lead updated in the
 * last 2 hours into our CRM. Keeps revenue + stage state in sync
 * between Close and AIMS without the admin clicking anything.
 *
 * Scheduled in vercel.json under crons (see docs/CLOSE_INTEGRATION.md).
 */
export const maxDuration = 60

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization")
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const startTime = Date.now()
  const since = new Date(Date.now() - 2 * 3600_000) // 2h lookback

  try {
    const result = await runCloseSync({ since, includeOpportunities: true })
    const duration = Date.now() - startTime

    const summary = `Total=${result.total} created=${result.created} updated=${result.updated} skipped=${result.skipped} errors=${result.errors} revenue=$${result.totalOpportunityValue.toFixed(0)}`

    await logCronExecution(
      "close-sync",
      result.errors === 0 ? "success" : "error",
      summary,
      duration
    )

    return NextResponse.json({ ok: true, ...result, duration })
  } catch (err) {
    const duration = Date.now() - startTime
    const message = err instanceof Error ? err.message : "Unknown error"
    await logCronExecution("close-sync", "error", message, duration)
    logger.error("Close-sync cron failed", err, { action: "close_sync_cron" })
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
