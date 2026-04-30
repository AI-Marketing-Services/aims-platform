import { NextResponse } from "next/server"
import { z } from "zod"
import { stripe } from "@/lib/stripe"
import { db } from "@/lib/db"
import { logger } from "@/lib/logger"
import { ensureDbUserIdForApi } from "@/lib/auth/ensure-user"

export const dynamic = "force-dynamic"

/**
 * POST /api/portal/credits/topup
 *
 * Creates a one-time Stripe Checkout session for the requested credit
 * pack and returns the redirect URL. The webhook handler in
 * /api/webhooks/stripe + handleCreditTopupCompleted grants the credits
 * once payment lands.
 *
 * Pricing (price-per-credit goes down with volume to incentivise larger
 * packs while still covering API costs comfortably):
 *   500 credits   → $20  (4¢ / credit)
 *   2,000 credits → $60  (3¢ / credit)
 *   10,000 credits → $200 (2¢ / credit)
 *
 * Prices are computed inline rather than relying on Stripe Price IDs
 * because credit packs are simple flat amounts and we don't need
 * coupons / multi-currency / proration here.
 */

const TOPUP_PRICING: Record<number, { unitAmount: number; description: string }> = {
  500: { unitAmount: 2000, description: "500 enrichment credits" },
  2_000: { unitAmount: 6000, description: "2,000 enrichment credits" },
  10_000: { unitAmount: 20_000, description: "10,000 enrichment credits" },
}

const topupSchema = z.object({
  credits: z.number().int().refine((c) => c in TOPUP_PRICING, {
    message: "Invalid credit pack — must be 500, 2000, or 10000",
  }),
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
  const parsed = topupSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid pack size", issues: parsed.error.issues },
      { status: 400 },
    )
  }

  const pricing = TOPUP_PRICING[parsed.data.credits]
  if (!pricing) {
    return NextResponse.json({ error: "Invalid pack size" }, { status: 400 })
  }

  const dbUser = await db.user.findUnique({
    where: { id: dbUserId },
    select: { id: true, email: true, stripeCustomerId: true },
  })
  if (!dbUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 })
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.aioperatorcollective.com"

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "usd",
            unit_amount: pricing.unitAmount,
            product_data: {
              name: pricing.description,
              description: `Top-up your AIMS enrichment credit balance.`,
            },
          },
          quantity: 1,
        },
      ],
      customer: dbUser.stripeCustomerId ?? undefined,
      customer_email: dbUser.stripeCustomerId ? undefined : dbUser.email,
      client_reference_id: dbUser.id,
      success_url: `${appUrl}/portal/billing?topup=success&credits=${parsed.data.credits}`,
      cancel_url: `${appUrl}/portal/billing?topup=cancelled`,
      // Webhook handler reads these to know how many credits to grant.
      metadata: {
        source: "credit-topup",
        userId: dbUser.id,
        credits: String(parsed.data.credits),
      },
      payment_intent_data: {
        metadata: {
          source: "credit-topup",
          userId: dbUser.id,
          credits: String(parsed.data.credits),
        },
      },
    })

    return NextResponse.json({ url: session.url, sessionId: session.id })
  } catch (err) {
    logger.error("Credit topup checkout session failed", err, {
      endpoint: "POST /api/portal/credits/topup",
      userId: dbUserId,
      credits: parsed.data.credits,
    })
    return NextResponse.json(
      { error: "Couldn't start checkout. Try again or contact support." },
      { status: 500 },
    )
  }
}
