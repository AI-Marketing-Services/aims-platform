import { db } from "@/lib/db"
import { logger } from "@/lib/logger"

/**
 * Commission ledger ops. CommissionEvent is append-only — every
 * lifecycle transition (purchase, renewal, refund) gets a new row.
 *
 * Lifecycle invariants:
 *   - "pending"    is the only status created at write time
 *   - "payable"    flipped by a cron after the clawback window
 *   - "paid"       flipped by the payout batch (with stripeTransferId)
 *   - "clawed_back" appended (negative amount) when a refund lands
 *   - "voided"     appended by an admin when fraud/chargeback hits
 */

const DEFAULT_CLAWBACK_DAYS = 30

function addDays(d: Date, days: number): Date {
  const out = new Date(d)
  out.setUTCDate(out.getUTCDate() + days)
  return out
}

/**
 * Create a pending commission for a purchase (or renewal). Returns the
 * created row, or null if the purchase isn't commissionable (no
 * referring reseller, or the product has no commission rate).
 */
export async function createPendingCommission(params: {
  purchaseId: string
  type: "initial_purchase" | "renewal" | "upgrade"
  baseAmountCents: number
  notes?: string
}): Promise<{ id: string } | null> {
  const purchase = await db.purchase.findUnique({
    where: { id: params.purchaseId },
    include: { product: { select: { commissionBps: true } } },
  })
  if (!purchase) return null
  if (!purchase.referringResellerId) return null
  if (!purchase.product || purchase.product.commissionBps <= 0) return null

  const bps = purchase.product.commissionBps
  const amountCents = Math.round((params.baseAmountCents * bps) / 10_000)

  const event = await db.commissionEvent.create({
    data: {
      resellerId: purchase.referringResellerId,
      purchaseId: purchase.id,
      type: params.type,
      baseAmountCents: params.baseAmountCents,
      commissionBps: bps,
      amountCents,
      currency: purchase.currency,
      status: "pending",
      payableAt: addDays(new Date(), DEFAULT_CLAWBACK_DAYS),
      notes: params.notes ?? null,
    },
    select: { id: true },
  })
  return event
}

/**
 * Append a clawback row (negative amount) when a refund lands. Doesn't
 * mutate prior rows — keeps the ledger immutable.
 */
export async function appendClawback(params: {
  purchaseId: string
  refundAmountCents: number
  notes?: string
}): Promise<void> {
  const purchase = await db.purchase.findUnique({
    where: { id: params.purchaseId },
    include: { product: { select: { commissionBps: true } } },
  })
  if (!purchase) return
  if (!purchase.referringResellerId) return
  if (!purchase.product) return

  const bps = purchase.product.commissionBps
  if (bps <= 0) return

  const amountCents = -Math.round((params.refundAmountCents * bps) / 10_000)
  await db.commissionEvent.create({
    data: {
      resellerId: purchase.referringResellerId,
      purchaseId: purchase.id,
      type: "clawback",
      baseAmountCents: -params.refundAmountCents,
      commissionBps: bps,
      amountCents,
      currency: purchase.currency,
      status: "clawed_back",
      notes: params.notes ?? "refund clawback",
    },
  })
}

/**
 * Cron-safe: flip pending events whose payableAt has passed to "payable".
 * Called from a scheduled job once a day; safe to re-run.
 */
export async function ripenPendingCommissions(): Promise<number> {
  const result = await db.commissionEvent.updateMany({
    where: {
      status: "pending",
      payableAt: { lt: new Date() },
    },
    data: { status: "payable" },
  })
  return result.count
}

/**
 * Per-reseller summary used by the admin ledger view and the reseller
 * dashboard. Returns cents so the caller decides on display formatting.
 */
export async function getCommissionSummary(resellerId: string): Promise<{
  pendingCents: number
  payableCents: number
  paidCents: number
  clawedBackCents: number
}> {
  const grouped = await db.commissionEvent.groupBy({
    by: ["status"],
    where: { resellerId },
    _sum: { amountCents: true },
  })
  const map: Record<string, number> = {}
  for (const g of grouped) map[g.status] = g._sum.amountCents ?? 0
  return {
    pendingCents: map.pending ?? 0,
    payableCents: map.payable ?? 0,
    paidCents: map.paid ?? 0,
    clawedBackCents: map.clawed_back ?? 0,
  }
}

export async function logCommissionFailure(
  context: string,
  err: unknown,
  meta: Record<string, unknown>,
): Promise<void> {
  logger.error(`Commission ${context} failed`, err, meta)
}
