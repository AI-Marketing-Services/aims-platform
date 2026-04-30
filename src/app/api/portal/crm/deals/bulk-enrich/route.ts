import { NextResponse } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { logger } from "@/lib/logger"
import { ensureDbUserIdForApi } from "@/lib/auth/ensure-user"
import { runEnrichmentPipeline } from "@/lib/enrichment/orchestrator"
import { InsufficientCreditsError } from "@/lib/enrichment/credits/ledger"
import { MAX_ENRICHMENT_COST } from "@/lib/enrichment/credits/pricing"

export const dynamic = "force-dynamic"
export const maxDuration = 300 // up to 5 min for bulk runs

/**
 * POST /api/portal/crm/deals/bulk-enrich
 *
 * Runs the 4-stage enrichment pipeline against multiple ClientDeals in
 * serial. Two modes:
 *
 *   { dealIds: ["..."] }            — explicit list (max 20)
 *   { onlyUnenriched: true, max: 20 } — auto-pick deals with no
 *                                       enrichment record yet (oldest
 *                                       lastEnrichedAt first)
 *
 * Pre-flight balance check uses MAX_ENRICHMENT_COST × N to verify
 * worst-case affordability before any work starts. Real cost is usually
 * lower because Prospeo dedup + Hunter caching reduce charges.
 *
 * Stops on first InsufficientCreditsError so operators see partial
 * results rather than empty failure.
 */

const bodySchema = z
  .object({
    dealIds: z.array(z.string()).min(1).max(20).optional(),
    onlyUnenriched: z.boolean().optional(),
    max: z.number().int().min(1).max(20).optional(),
  })
  .refine((d) => d.dealIds || d.onlyUnenriched, {
    message: "Provide either dealIds or onlyUnenriched=true",
  })

export async function POST(req: Request) {
  const dbUserId = await ensureDbUserIdForApi()
  if (!dbUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }
  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", issues: parsed.error.issues },
      { status: 400 },
    )
  }

  // Resolve target Deal IDs
  let targetDealIds: string[] = []
  if (parsed.data.dealIds) {
    // Verify ownership of every requested ID
    const owned = await db.clientDeal.findMany({
      where: { id: { in: parsed.data.dealIds }, userId: dbUserId },
      select: { id: true },
    })
    targetDealIds = owned.map((d) => d.id)
  } else if (parsed.data.onlyUnenriched) {
    const max = parsed.data.max ?? 20
    const candidates = await db.clientDeal.findMany({
      where: {
        userId: dbUserId,
        lastEnrichedAt: null,
        // Skip deals we obviously can't enrich (no website, no name)
        OR: [{ website: { not: null } }, { contactEmail: { not: null } }],
      },
      orderBy: { createdAt: "asc" },
      select: { id: true },
      take: max,
    })
    targetDealIds = candidates.map((d) => d.id)
  }

  if (targetDealIds.length === 0) {
    return NextResponse.json({
      ok: true,
      total: 0,
      enriched: 0,
      errors: 0,
      message: "No deals to enrich.",
    })
  }

  // Worst-case cost check before any work
  const worstCase = MAX_ENRICHMENT_COST * targetDealIds.length
  const user = await db.user.findUnique({
    where: { id: dbUserId },
    select: { creditBalance: true },
  })
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 })
  }
  if (user.creditBalance < MAX_ENRICHMENT_COST) {
    return NextResponse.json(
      {
        error: "Insufficient credits for even one enrichment",
        required: MAX_ENRICHMENT_COST,
        available: user.creditBalance,
      },
      { status: 402 },
    )
  }

  let enriched = 0
  let errors = 0
  let stopped = false
  const failures: Array<{ dealId: string; reason: string }> = []

  for (const dealId of targetDealIds) {
    try {
      await runEnrichmentPipeline({ dealId, userId: dbUserId })
      enriched += 1
    } catch (err) {
      if (err instanceof InsufficientCreditsError) {
        stopped = true
        break
      }
      errors += 1
      failures.push({
        dealId,
        reason: err instanceof Error ? err.message : "Unknown error",
      })
      logger.warn("Bulk enrich: one deal failed", {
        dealId,
        userId: dbUserId,
        error: err instanceof Error ? err.message : String(err),
      })
    }
  }

  return NextResponse.json({
    ok: true,
    total: targetDealIds.length,
    enriched,
    errors,
    stopped,
    stoppedReason: stopped ? "Out of credits — partial completion" : null,
    failures: failures.slice(0, 10),
    worstCaseCost: worstCase,
  })
}

/**
 * GET /api/portal/crm/deals/bulk-enrich
 *
 * Returns count of unenriched deals + estimated worst-case cost so the
 * UI banner can show 'Enrich 12 pending deals (~960 credits)' before
 * the operator commits.
 */
export async function GET() {
  const dbUserId = await ensureDbUserIdForApi()
  if (!dbUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const count = await db.clientDeal.count({
    where: {
      userId: dbUserId,
      lastEnrichedAt: null,
      OR: [{ website: { not: null } }, { contactEmail: { not: null } }],
    },
  })

  return NextResponse.json({
    pending: count,
    estimatedMaxCost: count * MAX_ENRICHMENT_COST,
    perDealMax: MAX_ENRICHMENT_COST,
  })
}
