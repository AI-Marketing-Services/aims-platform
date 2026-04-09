import { NextResponse } from "next/server"
import { headers } from "next/headers"
import crypto from "crypto"
import { db } from "@/lib/db"
import { logger } from "@/lib/logger"
import { getDubWebhookSecret } from "@/lib/dub"

/**
 * POST /api/webhooks/dub
 *
 * Receives Dub.co webhook events and syncs them to local models:
 * - partner.created → log partner registration
 * - sale.created → create local Commission record (source: "dub")
 * - payout.processed → mark commissions as PAID
 *
 * Signature verification uses HMAC-SHA256 with DUB_WEBHOOK_SECRET.
 */
export async function POST(req: Request) {
  const body = await req.text()
  const headersList = await headers()
  const signature = headersList.get("dub-signature")

  const webhookSecret = getDubWebhookSecret()
  if (!webhookSecret) {
    logger.error("DUB_WEBHOOK_SECRET is not configured", undefined, {
      endpoint: "POST /api/webhooks/dub",
    })
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 })
  }

  // Verify signature
  if (signature) {
    const expected = crypto
      .createHmac("sha256", webhookSecret)
      .update(body)
      .digest("hex")
    if (signature !== expected) {
      logger.error("Dub webhook signature mismatch", undefined, {
        endpoint: "POST /api/webhooks/dub",
      })
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
    }
  }

  let event: DubWebhookEvent
  try {
    event = JSON.parse(body)
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  try {
    switch (event.event) {
      case "partner.created":
        await handlePartnerCreated(event.data)
        break

      case "sale.created":
        await handleSaleCreated(event.data)
        break

      case "payout.processed":
        await handlePayoutProcessed(event.data)
        break

      default:
        // Acknowledge unknown events gracefully
        break
    }

    return NextResponse.json({ received: true })
  } catch (err) {
    logger.error("Dub webhook handler error", err, {
      endpoint: "POST /api/webhooks/dub",
      action: event.event,
    })
    return NextResponse.json({ error: "Handler error" }, { status: 500 })
  }
}

// ============ Event types ============

interface DubWebhookEvent {
  event: string
  data: Record<string, unknown>
}

// ============ Handlers ============

async function handlePartnerCreated(data: Record<string, unknown>) {
  const partnerId = data.id as string | undefined
  const email = data.email as string | undefined

  if (!partnerId || !email) return

  // Try to match to an existing referral by email
  const user = await db.user.findUnique({ where: { email } })
  if (!user) return

  const referral = await db.referral.findFirst({
    where: { referrerId: user.id },
  })

  if (referral && !referral.dubPartnerId) {
    await db.referral.update({
      where: { id: referral.id },
      data: { dubPartnerId: partnerId },
    })
  }
}

async function handleSaleCreated(data: Record<string, unknown>) {
  const saleId = data.id as string | undefined
  const partnerId = data.partnerId as string | undefined
  const amount = data.amount as number | undefined // In cents
  const commissionAmount = data.earnings as number | undefined // In cents
  const customerId = data.customerId as string | undefined

  if (!saleId || !partnerId || amount === undefined) return

  // Find the referral by Dub partner ID
  const referral = await db.referral.findFirst({
    where: { dubPartnerId: partnerId },
  })
  if (!referral) {
    logger.error("Dub sale event for unknown partner", undefined, {
      action: `dub:sale:${saleId}`,
      userId: partnerId,
    })
    return
  }

  // Check for duplicate
  const existing = await db.commission.findFirst({
    where: { dubSaleId: saleId },
  })
  if (existing) return

  const sourceAmount = (amount ?? 0) / 100
  const commission = (commissionAmount ?? 0) / 100
  const rate = sourceAmount > 0 ? commission / sourceAmount : 0

  await db.commission.create({
    data: {
      referralId: referral.id,
      userId: referral.referrerId,
      amount: commission,
      percentage: rate * 100,
      sourceAmount,
      status: "APPROVED", // Dub-calculated commissions are pre-approved
      source: "dub",
      dubSaleId: saleId,
      stripePaymentId: (customerId as string) ?? null,
    },
  })

  // Update referral counters
  await db.referral.update({
    where: { id: referral.id },
    data: {
      conversions: { increment: 1 },
      pendingPayout: { increment: commission },
    },
  })
}

async function handlePayoutProcessed(data: Record<string, unknown>) {
  const partnerId = data.partnerId as string | undefined
  const amount = data.amount as number | undefined // In cents
  const saleIds = data.saleIds as string[] | undefined

  if (!partnerId) return

  const referral = await db.referral.findFirst({
    where: { dubPartnerId: partnerId },
  })
  if (!referral) return

  // Mark matching commissions as PAID
  if (saleIds && saleIds.length > 0) {
    await db.commission.updateMany({
      where: {
        referralId: referral.id,
        dubSaleId: { in: saleIds },
        status: { in: ["PENDING", "APPROVED"] },
      },
      data: {
        status: "PAID",
        paidAt: new Date(),
      },
    })
  }

  // Update referral totals
  const paidAmount = (amount ?? 0) / 100
  if (paidAmount > 0) {
    await db.referral.update({
      where: { id: referral.id },
      data: {
        totalEarned: { increment: paidAmount },
        pendingPayout: { decrement: Math.min(paidAmount, referral.pendingPayout) },
      },
    })
  }
}
