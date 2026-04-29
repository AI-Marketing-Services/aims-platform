import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { logger } from "@/lib/logger"
import { runEnrichmentPipeline } from "@/lib/enrichment/orchestrator"
import { InsufficientCreditsError } from "@/lib/enrichment/credits/ledger"
import { MAX_ENRICHMENT_COST } from "@/lib/enrichment/credits/pricing"
import { ensureDbUserIdForApi } from "@/lib/auth/ensure-user"

export const dynamic = "force-dynamic"
export const maxDuration = 60 // pipeline can take 30+ seconds end-to-end

/**
 * POST /api/portal/crm/deals/:id/enrich
 *
 * Runs the full 4-stage enrichment pipeline for a single ClientDeal owned
 * by the authenticated user. Charges the user's enrichment credits, writes
 * structured results to ClientDealEnrichment + ClientContact.
 *
 * Returns 402 (Payment Required) when the user is below the worst-case
 * cost — UI shows "buy more credits" CTA.
 */
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const dbUserId = await ensureDbUserIdForApi()
  if (!dbUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id: dealId } = await params

  // Verify ownership before starting any work — same pattern used elsewhere
  // in the portal CRM routes.
  const deal = await db.clientDeal.findFirst({
    where: { id: dealId, userId: dbUserId },
    select: { id: true, lastEnrichedAt: true },
  })
  if (!deal) {
    return NextResponse.json({ error: "Deal not found" }, { status: 404 })
  }

  // Soft cooldown — re-enriching within 24h is allowed but flagged so the
  // UI can warn the operator they're about to spend credits on data
  // that's likely unchanged.
  const recentlyEnriched =
    deal.lastEnrichedAt &&
    Date.now() - deal.lastEnrichedAt.getTime() < 24 * 60 * 60 * 1000

  try {
    const result = await runEnrichmentPipeline({ dealId, userId: dbUserId })
    return NextResponse.json({
      ok: true,
      enrichmentId: result.enrichmentId,
      totalCreditsCost: result.totalCreditsCost,
      contactsAdded: result.contactsAdded,
      sources: result.sources,
      recentlyEnriched,
    })
  } catch (err) {
    if (err instanceof InsufficientCreditsError) {
      return NextResponse.json(
        {
          error: "Insufficient credits",
          required: err.required,
          available: err.available,
        },
        { status: 402 },
      )
    }
    logger.error("Enrichment pipeline failed", err, {
      endpoint: "POST /api/portal/crm/deals/[id]/enrich",
      userId: dbUserId,
      dealId,
    })
    return NextResponse.json(
      {
        error: "Enrichment failed. Your credits have been refunded for any incomplete steps.",
      },
      { status: 500 },
    )
  }
}

/**
 * GET /api/portal/crm/deals/:id/enrich
 *
 * Returns the cached enrichment record + contacts so the Deal detail page
 * can render the research card without re-running the pipeline.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const dbUserId = await ensureDbUserIdForApi()
  if (!dbUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id: dealId } = await params

  const deal = await db.clientDeal.findFirst({
    where: { id: dealId, userId: dbUserId },
    select: {
      id: true,
      lastEnrichedAt: true,
      enrichment: true,
    },
  })
  if (!deal) {
    return NextResponse.json({ error: "Deal not found" }, { status: 404 })
  }

  return NextResponse.json({
    ok: true,
    lastEnrichedAt: deal.lastEnrichedAt,
    enrichment: deal.enrichment,
    estimatedMaxCost: MAX_ENRICHMENT_COST,
  })
}
