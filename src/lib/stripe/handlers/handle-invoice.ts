import Stripe from "stripe"
import { db } from "@/lib/db"
import { logger } from "@/lib/logger"
import { handleInvoicePaid } from "@/lib/stripe"
import { sendRenewalEmail, sendPaymentFailedEmail } from "@/lib/email"

/**
 * Handles invoice.paid events — logs payment activity and calculates
 * referral commissions on the first invoice.
 */
export async function handleInvoicePaidEvent(invoice: Stripe.Invoice) {
  await handleInvoicePaid(invoice)

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

    const commissionRates: Record<string, number> = {
      AFFILIATE: 0.1,
      COMMUNITY_PARTNER: 0.15,
      RESELLER: 0.25,
    }
    const rate = commissionRates[referral.tier] ?? 0.2
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
  } catch (commErr) {
    logger.error("Failed to calculate commission", commErr, {
      endpoint: "POST /api/webhooks/stripe",
      action: "commission",
    })
  }
}

/**
 * Handles invoice.payment_failed events — marks subscriptions as PAST_DUE
 * and notifies the client via email.
 */
export async function handleInvoicePaymentFailedEvent(invoice: Stripe.Invoice) {
  if (!invoice.subscription) return

  await db.subscription.updateMany({
    where: { stripeSubId: invoice.subscription as string },
    data: { status: "PAST_DUE" },
  })

  // Notify client so they can update payment method
  try {
    const sub = await db.subscription.findFirst({
      where: { stripeSubId: invoice.subscription as string },
      include: { user: true, serviceArm: true },
    })
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
