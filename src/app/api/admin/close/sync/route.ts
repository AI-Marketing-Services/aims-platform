import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { z } from "zod"
import { logger } from "@/lib/logger"
import { runCloseSync } from "@/lib/close/sync"

/**
 * Admin-triggered Close -> AIMS sync.
 *
 * POST /api/admin/close/sync
 *   body: { since?: ISO string, includeOpportunities?: boolean }
 *
 * Pulls every lead from Close that's tagged BTC Business Line = AOC
 * and upserts into our Deal table. Response includes counts + total
 * won-opportunity dollar value so the admin can see "real revenue"
 * without leaving AIMS.
 *
 * Safe to re-run: dedups by closeLeadId + email, only bumps stage
 * forward (never backward unless Close says Lost).
 */
const schema = z.object({
  since: z.string().datetime().optional(),
  includeOpportunities: z.boolean().optional(),
})

export const maxDuration = 60

export async function POST(req: Request) {
  const { userId, sessionClaims } = await auth()
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const role = (sessionClaims?.metadata as { role?: string })?.role
  if (!role || !["ADMIN", "SUPER_ADMIN"].includes(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = await req.json().catch(() => ({}))
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid data", details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  try {
    const result = await runCloseSync({
      since: parsed.data.since ? new Date(parsed.data.since) : undefined,
      includeOpportunities: parsed.data.includeOpportunities ?? true,
    })

    logger.info(
      `[close-sync] pulled ${result.total} AOC leads (created=${result.created} updated=${result.updated} skipped=${result.skipped} errors=${result.errors}). Revenue: $${result.totalOpportunityValue.toFixed(2)} across ${result.wonOpportunityCount} won opps.`,
      { action: "close_sync_summary" }
    )

    return NextResponse.json({
      ok: true,
      ...result,
      triggeredAt: new Date().toISOString(),
    })
  } catch (err) {
    logger.error("Close sync failed at top level", err, {
      action: "close_sync_top_level",
    })
    const message = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
