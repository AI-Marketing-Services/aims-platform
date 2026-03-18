import { NextResponse } from "next/server"
import { auth, currentUser } from "@clerk/nextjs/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { getOrCreateStripeCustomer } from "@/lib/stripe"
import { checkoutRatelimit, getIp } from "@/lib/ratelimit"
import Stripe from "stripe"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-02-24.acacia",
})

const cartSchema = z.object({
  items: z.array(
    z.object({
      slug: z.string().min(1).max(100),
      tierId: z.string().optional(),
    })
  ).min(1).max(10),
  successUrl: z.string().url().optional(),
  cancelUrl: z.string().url().optional(),
})

export async function POST(req: Request) {
  try {
    if (checkoutRatelimit) {
      const { success } = await checkoutRatelimit.limit(getIp(req))
      if (!success) return NextResponse.json({ error: "Too many requests" }, { status: 429 })
    }

    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json({ error: "Stripe not configured" }, { status: 503 })
    }

    // Validate input shape — NOTE: prices are NOT accepted from client
    let body: unknown
    try { body = await req.json() } catch {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
    }

    const parsed = cartSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid cart data" }, { status: 400 })
    }

    const { items, successUrl, cancelUrl } = parsed.data
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://aimseos.com"

    // Validate all allowed redirect hosts to prevent open redirect
    const allowedHost = new URL(appUrl).hostname
    if (successUrl) {
      try {
        const h = new URL(successUrl).hostname
        if (h !== allowedHost) return NextResponse.json({ error: "Invalid successUrl" }, { status: 400 })
      } catch {
        return NextResponse.json({ error: "Invalid successUrl" }, { status: 400 })
      }
    }
    if (cancelUrl) {
      try {
        const h = new URL(cancelUrl).hostname
        if (h !== allowedHost) return NextResponse.json({ error: "Invalid cancelUrl" }, { status: 400 })
      } catch {
        return NextResponse.json({ error: "Invalid cancelUrl" }, { status: 400 })
      }
    }

    // Get authenticated user (if signed in)
    let clerkId: string | null = null
    try {
      const authResult = await auth()
      clerkId = authResult.userId
    } catch (authErr) {
      console.warn("Checkout: auth() failed, proceeding as guest:", authErr)
    }

    let dbUserId: string | null = null
    let customerEmail: string | undefined
    let customerName: string | undefined
    let stripeCustomerId: string | undefined

    if (clerkId) {
      try {
        const clerkUser = await currentUser()
        customerEmail = clerkUser?.emailAddresses?.[0]?.emailAddress
        customerName = clerkUser?.fullName ?? undefined

        let dbUser = await db.user.findUnique({ where: { clerkId } })
        if (!dbUser && customerEmail) {
          dbUser = await db.user.upsert({
            where: { email: customerEmail },
            update: { clerkId },
            create: { clerkId, email: customerEmail, name: customerName },
          })
        }
        dbUserId = dbUser?.id ?? null

        if (dbUserId && customerEmail) {
          stripeCustomerId = await getOrCreateStripeCustomer(dbUserId, customerEmail, customerName)
        }
      } catch (userErr) {
        console.warn("Checkout: user resolution failed, proceeding without customer:", userErr)
      }
    }

    // ─── Resolve prices from DB — never trust client-supplied amounts ──────────
    const resolvedItems: {
      slug: string
      tierId: string | undefined
      tierName: string | undefined
      serviceName: string
      stripePriceId: string | null
      unitAmount: number // in cents, from DB
    }[] = []

    // Batch load all service arms + tiers to avoid N+1 queries
    const slugs = items.map((i) => i.slug)
    const serviceArms = await db.serviceArm.findMany({
      where: { slug: { in: slugs } },
      include: { tiers: true },
    })
    const serviceArmMap = new Map(serviceArms.map((s) => [s.slug, s]))

    for (const item of items) {
      const serviceArm = serviceArmMap.get(item.slug)

      if (!serviceArm) {
        return NextResponse.json({ error: `Service not found: ${item.slug}` }, { status: 400 })
      }

      // If tierId provided, resolve the tier from DB
      let tierName: string | undefined
      let stripePriceId: string | null = null
      let unitAmount = 0

      if (item.tierId) {
        const tierId = item.tierId!.toLowerCase()
        const tier = serviceArm.tiers.find((t) => t.slug.toLowerCase() === tierId || t.id === item.tierId || t.name.toLowerCase() === tierId)
        if (!tier) {
          return NextResponse.json({ error: `Tier not found: ${item.tierId} for ${item.slug}` }, { status: 400 })
        }
        tierName = tier.name
        stripePriceId = tier.stripePriceId ?? null
        unitAmount = tier.price // price in cents from DB
      } else if (serviceArm.tiers.length > 0) {
        // Default to first tier
        const defaultTier = serviceArm.tiers.find((t) => t.isPopular) ?? serviceArm.tiers[0]
        tierName = defaultTier.name
        stripePriceId = defaultTier.stripePriceId ?? null
        unitAmount = defaultTier.price
      }

      if (unitAmount === 0) {
        return NextResponse.json({ error: `No pricing available for: ${item.slug}. Contact sales for custom pricing.` }, { status: 400 })
      }

      resolvedItems.push({
        slug: item.slug,
        tierId: item.tierId,
        tierName,
        serviceName: serviceArm.name,
        stripePriceId,
        unitAmount,
      })
    }

    // Build Stripe line items — use stripePriceId when available, otherwise price_data
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = resolvedItems.map((item) => {
      const label = item.tierName ? `${item.serviceName} — ${item.tierName}` : item.serviceName

      if (item.stripePriceId) {
        // Prefer using a pre-configured Stripe Price ID (most reliable)
        return { price: item.stripePriceId, quantity: 1 }
      }

      // Fallback: build price_data from DB price (never from client)
      return {
        price_data: {
          currency: "usd",
          product_data: {
            name: label,
            metadata: { slug: item.slug, ...(item.tierId ? { tierId: item.tierId } : {}) },
          },
          unit_amount: item.unitAmount,
          recurring: { interval: "month" },
        },
        quantity: 1,
      }
    })

    const slugsStr  = resolvedItems.map((i) => i.slug).join(",")
    const tierIds   = resolvedItems.map((i) => i.tierId ?? "").join(",")
    const amounts   = resolvedItems.map((i) => i.unitAmount).join(",")

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: "subscription",
      line_items: lineItems,
      success_url: successUrl ?? `${appUrl}/portal/dashboard?checkout=success`,
      cancel_url:  cancelUrl  ?? `${appUrl}/marketplace?checkout=cancelled`,
      allow_promotion_codes: true,
      client_reference_id: clerkId ?? undefined,
      customer_email: !stripeCustomerId ? customerEmail : undefined,
      metadata: {
        source: "cart",
        slugs: slugsStr,
        tierIds,
        amounts,
        ...(dbUserId ? { userId: dbUserId } : {}),
      },
      subscription_data: {
        metadata: {
          source: "cart",
          slugs: slugsStr,
          tierIds,
          amounts,
          ...(dbUserId ? { userId: dbUserId } : {}),
        },
      },
    }

    if (stripeCustomerId) {
      sessionParams.customer = stripeCustomerId
    }

    const session = await stripe.checkout.sessions.create(sessionParams)
    return NextResponse.json({ url: session.url })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    console.error("Checkout error:", message, err)
    return NextResponse.json({ error: `Checkout failed: ${message}` }, { status: 500 })
  }
}
