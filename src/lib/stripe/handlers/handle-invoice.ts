import Stripe from "stripe"
import { db } from "@/lib/db"
import { logger } from "@/lib/logger"
import { handleInvoicePaid } from "@/lib/stripe"
import { sendRenewalEmail, sendPaymentFailedEmail } from "@/lib/email"
import { getCommissionRate } from "@/lib/referrals/commission-config"
import { getDubClient } from "@/lib/dub"

/**
 * Handles invoice.paid events — logs payment activity and calculates
 * referral commissions on the first invoice.
 */
export async function handleInvoicePaidEvent(invoice: Stripe.Invoice) {
  await handleInvoicePaid(invoice)

  // Successful payment → reset dunning counters on both legacy
  // Subscription + new Purchase rows.
  if (invoice.subscription) {
    const subId = invoice.subscription as string
    await db.subscription
      .updateMany({
        where: { stripeSubId: subId, dunningAttempts: { gt: 0 } },
        data: { dunningAttempts: 0, lastDunningAt: null },
      })
      .catch(() => {})
  }

  // Send renewal confirmation email for subscription_cycle invoices (not first payment)
  if (invoice.billing_reason === "subscription_cycle" && invoice.subscription && invoice.amount_paid > 0) {
    try {
      const renewedSub = await db.subscription.findFirst({
        where: { stripeSubId: invoice.subscription as string },
        include: { user: true, serviceArm: true },
      })
      if (renewedSub?.user) {
        await sendRenewalEmail({
          to: renewedSub.user.email,
          name: renewedSub.user.name ?? "there",
          serviceName: renewedSub.serviceArm.name,
          amount: invoice.amount_paid / 100,
          nextBillingDate: renewedSub.currentPeriodEnd ?? new Date(Date.now() + 30 * 86400000),
          portalUrl: `${process.env.NEXT_PUBLIC_APP_URL}/portal/dashboard`,
        })
      }
    } catch (err) {
      logger.error("Failed to send renewal email", err, {
        endpoint: "POST /api/webhooks/stripe",
        action: "invoice.paid.renewal",
      })
    }
  }

  // Only create commissions on the first invoice (subscription creation)
  if (invoice.billing_reason !== "subscription_create") return

  // Calculate referral commissions on first invoice for referred users
  if (!invoice.subscription || invoice.amount_paid <= 0) return

  try {
    const sub = await db.subscription.findFirst({
      where: { stripeSubId: invoice.subscription as string },
      select: { userId: true, id: true },
    })
    if (!sub) return

    // Check if this user was referred
    const referral = await db.referral.findUnique({
      where: { referredId: sub.userId },
      select: { id: true, tier: true, referrerId: true },
    })
    if (!referral) return

    // Check if commission already exists for this payment
    const existingCommission = await db.commission.findFirst({
      where: {
        referralId: referral.id,
        stripePaymentId: invoice.id,
      },
    })
    if (existingCommission) return

    const rate = getCommissionRate(referral.tier)
    const sourceAmount = invoice.amount_paid / 100
    const commissionAmount = sourceAmount * rate

    await db.commission.create({
      data: {
        referralId: referral.id,
        userId: referral.referrerId,
        amount: commissionAmount,
        percentage: rate * 100,
        sourceAmount,
        status: "PENDING",
        source: "internal",
        stripePaymentId: invoice.id,
      },
    })

    // Update referral conversion count
    await db.referral.update({
      where: { id: referral.id },
      data: {
        conversions: { increment: 1 },
      },
    })

    // Report sale to Dub.co for attribution tracking (non-blocking)
    const dub = await getDubClient()
    if (dub) {
      try {
        await dub.track.sale({
          customerExternalId: sub.userId,
          amount: invoice.amount_paid, // Already in cents
          currency: "usd",
          paymentProcessor: "stripe",
          invoiceId: invoice.id,
        })
      } catch (dubErr) {
        logger.error("Failed to report sale to Dub.co", dubErr, {
          endpoint: "POST /api/webhooks/stripe",
          action: "dub:track:sale",
        })
      }
    }
  } catch (commErr) {
    logger.error("Failed to calculate commission", commErr, {
      endpoint: "POST /api/webhooks/stripe",
      action: "commission",
    })
  }
}

/**
 * Handles invoice.payment_failed events — marks subscriptions as PAST_DUE,
 * increments dunning attempt counters, sends graduated emails, and on the
 * 3rd consecutive failure auto-cancels at Stripe.
 *
 * The dunning state machine sits on the legacy Subscription model so the
 * /admin/cfo "at-risk MRR" panel can read it directly. We also bump
 * Purchase.status to "past_due" so the entitlement reconciler revokes
 * coverage if Stripe gives up.
 */
export async function handleInvoicePaymentFailedEvent(invoice: Stripe.Invoice) {
  if (!invoice.subscription) return

  const stripeSubId = invoice.subscription as string

  // Bump Subscription dunning state.
  const sub = await db.subscription.findFirst({
    where: { stripeSubId },
    include: { user: true, serviceArm: true },
  })

  const nextAttempts = (sub?.dunningAttempts ?? 0) + 1
  await db.subscription
    .updateMany({
      where: { stripeSubId },
      data: {
        status: "PAST_DUE",
        dunningAttempts: nextAttempts,
        lastDunningAt: new Date(),
      },
    })
    .catch(() => {})

  // Mirror onto Purchase so the new analytics layer sees it too.
  await db.purchase
    .updateMany({
      where: { stripeSubscriptionId: stripeSubId },
      data: { status: "past_due" },
    })
    .catch(() => {})

  // Auto-cancel at attempt 3 — anything past this point is wasted
  // Stripe retry credits + a worse customer relationship.
  if (nextAttempts >= 3) {
    try {
      const stripe = (await import("@/lib/stripe")).stripe
      await stripe.subscriptions.cancel(stripeSubId, {
        invoice_now: false,
        prorate: false,
      })
      logger.warn("Auto-cancelled subscription after 3 dunning failures", {
        stripeSubId,
        userId: sub?.userId,
      })
    } catch (cancelErr) {
      logger.error("Auto-cancel after dunning failed", cancelErr, { stripeSubId })
    }
  }

  // Notify client so they can update payment method
  try {
    if (sub?.user) {
      const retryDate = invoice.next_payment_attempt
        ? new Date(invoice.next_payment_attempt * 1000)
        : undefined
      await sendPaymentFailedEmail({
        to: sub.user.email,
        name: sub.user.name ?? "there",
        serviceName: sub.serviceArm.name,
        amount: invoice.amount_due / 100,
        retryDate,
        updatePaymentUrl: `${process.env.NEXT_PUBLIC_APP_URL}/portal/billing`,
      })
    }
  } catch (err) {
    logger.error("Failed to send payment failed email", err, {
      endpoint: "POST /api/webhooks/stripe",
      action: "invoice.payment_failed",
    })
  }
}
