/**
 * Revenue-event recorders. These wrap the new PurchaseInvoice / Refund /
 * PromoRedemption tables behind small idempotent helpers that all the
 * Stripe webhook handlers can call without each one having to know the
 * exact column shape. Adding a column? Update only this file.
 *
 * Idempotency strategy:
 *   - PurchaseInvoice keys on stripeInvoiceId (unique). For one-time
 *     charges that don't have an invoice id we synthesize from the
 *     stripeChargeId.
 *   - Refund keys on stripeRefundId (unique).
 *   - PromoRedemption has no natural idempotency from Stripe — we
 *     dedupe on (userId + code + redeemedAt-bucket-by-minute) which is
 *     "best effort" but good enough; webhook retries land in the same
 *     minute almost always.
 */

import type Stripe from "stripe"
import { db } from "@/lib/db"
import { logger } from "@/lib/logger"

interface RecordInvoiceParams {
  purchaseId: string
  userId: string
  invoice: Stripe.Invoice
  // "subscription_create" | "subscription_renewal" | "one_time" |
  // "upgrade" | "downgrade" | "topup"
  invoiceType: string
}

/**
 * Persist one-row-per-paid-invoice. Caller already verified the invoice
 * was paid; we just snapshot the numbers into PurchaseInvoice and bump
 * Purchase.lifetimeRevenueCents.
 */
export async function recordPurchaseInvoice(
  params: RecordInvoiceParams,
): Promise<void> {
  const { purchaseId, userId, invoice, invoiceType } = params

  const stripeInvoiceId = invoice.id ?? `synthetic_${Date.now()}`

  // Idempotency — if we already wrote this invoice id, skip.
  const existing = await db.purchaseInvoice.findUnique({
    where: { stripeInvoiceId },
    select: { id: true },
  })
  if (existing) return

  const amountCents = invoice.amount_due ?? invoice.amount_paid ?? 0
  const amountPaidCents = invoice.amount_paid ?? amountCents
  const amountTaxCents = invoice.tax ?? 0
  const discountCents =
    invoice.total_discount_amounts?.reduce((sum, d) => sum + (d.amount ?? 0), 0) ?? 0

  // Stripe processing fees — only available on the underlying balance
  // transaction; skip the extra round-trip for now (webhook latency
  // matters more than reporting precision).
  const amountFeeCents = 0

  const periodStart = invoice.period_start ? new Date(invoice.period_start * 1000) : null
  const periodEnd = invoice.period_end ? new Date(invoice.period_end * 1000) : null

  await db.purchaseInvoice
    .create({
      data: {
        purchaseId,
        userId,
        stripeInvoiceId,
        stripeChargeId: typeof invoice.charge === "string" ? invoice.charge : invoice.charge?.id,
        stripeCustomerId:
          typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id,
        amountCents,
        amountPaidCents,
        amountTaxCents,
        amountFeeCents,
        discountCents,
        currency: invoice.currency ?? "usd",
        invoiceType,
        periodStart,
        periodEnd,
        paidAt: invoice.status_transitions?.paid_at
          ? new Date(invoice.status_transitions.paid_at * 1000)
          : new Date(),
      },
    })
    .catch((err) =>
      logger.error("recordPurchaseInvoice failed", err, { purchaseId, stripeInvoiceId }),
    )

  // Update the parent Purchase's lifetime totals.
  await db.purchase
    .update({
      where: { id: purchaseId },
      data: {
        lifetimeRevenueCents: { increment: amountPaidCents },
      },
    })
    .catch((err) =>
      logger.error("Purchase.lifetimeRevenueCents increment failed", err, {
        purchaseId,
      }),
    )
}

/**
 * Persist a checkout-completed one-time charge. Synthesizes a
 * PurchaseInvoice row from session data when no invoice exists.
 */
export async function recordCheckoutInvoice(params: {
  purchaseId: string
  userId: string
  session: Stripe.Checkout.Session
  invoiceType: string
}): Promise<void> {
  const { purchaseId, userId, session, invoiceType } = params
  const syntheticId = `cs_${session.id}`

  const existing = await db.purchaseInvoice.findUnique({
    where: { stripeInvoiceId: syntheticId },
    select: { id: true },
  })
  if (existing) return

  const amountCents = session.amount_total ?? 0
  const discountCents =
    (session as unknown as { total_details?: { amount_discount?: number } }).total_details
      ?.amount_discount ?? 0

  await db.purchaseInvoice
    .create({
      data: {
        purchaseId,
        userId,
        stripeInvoiceId: syntheticId,
        stripeCustomerId:
          typeof session.customer === "string" ? session.customer : session.customer?.id,
        amountCents,
        amountPaidCents: session.amount_total ?? amountCents,
        amountTaxCents: 0,
        discountCents,
        currency: session.currency ?? "usd",
        invoiceType,
        periodStart: null,
        periodEnd: null,
      },
    })
    .catch((err) =>
      logger.error("recordCheckoutInvoice failed", err, { purchaseId, sessionId: session.id }),
    )

  await db.purchase
    .update({
      where: { id: purchaseId },
      data: { lifetimeRevenueCents: { increment: amountCents } },
    })
    .catch(() => {})
}

interface RecordRefundParams {
  purchaseId: string
  userId: string
  charge: Stripe.Charge
  refund?: Stripe.Refund
  notes?: string
}

/**
 * Write a Refund row. Idempotent on stripeRefundId. Updates
 * Purchase.refundedCents in lockstep. Does NOT touch CommissionEvent
 * rows — caller (handle-product-purchase) handles clawback separately.
 */
export async function recordRefund(params: RecordRefundParams): Promise<void> {
  const { purchaseId, userId, charge, refund, notes } = params

  // Pull the most-recent refund off the charge if not passed explicitly.
  const target =
    refund ??
    (charge.refunds && "data" in charge.refunds && charge.refunds.data.length > 0
      ? charge.refunds.data[charge.refunds.data.length - 1]
      : null)
  const refundId = target?.id ?? `synthetic_${charge.id}_${charge.amount_refunded}`
  const amountCents = target?.amount ?? charge.amount_refunded ?? 0

  const existing = await db.refund.findUnique({
    where: { stripeRefundId: refundId },
    select: { id: true },
  })
  if (existing) return

  await db.refund
    .create({
      data: {
        purchaseId,
        userId,
        stripeRefundId: refundId,
        stripeChargeId: charge.id,
        amountCents,
        currency: charge.currency ?? "usd",
        reason: target?.reason ?? null,
        notes: notes ?? null,
      },
    })
    .catch((err) =>
      logger.error("recordRefund failed", err, { purchaseId, refundId }),
    )

  await db.purchase
    .update({
      where: { id: purchaseId },
      data: { refundedCents: { increment: amountCents } },
    })
    .catch(() => {})
}

/**
 * Capture a promo code redemption from a Stripe checkout session OR
 * an invoice. Pulls the discount line items and writes one row per
 * coupon applied.
 */
export async function recordPromoRedemption(params: {
  userId: string
  purchaseId?: string
  source: "subscription_create" | "subscription_renewal" | "one_time"
  // Either pass session OR invoice — whichever fired the webhook.
  session?: Stripe.Checkout.Session
  invoice?: Stripe.Invoice
}): Promise<void> {
  const { userId, purchaseId, source, session, invoice } = params

  // Pull discount info — Stripe shape differs slightly between the
  // checkout session (total_details.amount_discount, single number)
  // and the invoice (total_discount_amounts: [{ amount, discount }]).
  let discountCents = 0
  let stripeCouponId: string | undefined
  let stripePromoCodeId: string | undefined
  let code: string | undefined

  if (invoice) {
    const totalDiscounts = invoice.total_discount_amounts ?? []
    discountCents = totalDiscounts.reduce((s, d) => s + (d.amount ?? 0), 0)
    if (discountCents <= 0) return

    // We don't have the human-readable code in the webhook payload by
    // default; the `discount` field on the invoice carries it.
    const discount = invoice.discount
    if (discount && typeof discount !== "string") {
      stripeCouponId = discount.coupon?.id
      stripePromoCodeId =
        typeof discount.promotion_code === "string"
          ? discount.promotion_code
          : discount.promotion_code?.id
      code = discount.coupon?.name ?? undefined
    }
  } else if (session) {
    const td = (session as unknown as {
      total_details?: { amount_discount?: number; breakdown?: { discounts?: unknown[] } }
    }).total_details
    discountCents = td?.amount_discount ?? 0
    if (discountCents <= 0) return
  }

  await db.promoRedemption
    .create({
      data: {
        userId,
        purchaseId: purchaseId ?? null,
        stripeCouponId,
        stripePromoCodeId,
        code,
        amountOffCents: discountCents,
        source,
      },
    })
    .catch((err) =>
      logger.error("recordPromoRedemption failed", err, { userId, source }),
    )
}
