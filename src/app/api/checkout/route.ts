import { NextResponse } from "next/server"
import { auth, currentUser } from "@clerk/nextjs/server"
import Stripe from "stripe"
import { db } from "@/lib/db"
import { getOrCreateStripeCustomer } from "@/lib/stripe"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "", {
  apiVersion: "2025-02-24.acacia",
})

interface CartItemPayload {
  serviceId: string
  slug: string
  name: string
  tierId?: string
  tierName?: string
  priceMonthly: number
}

export async function POST(req: Request) {
  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 503 })
  }

  const { items, successUrl, cancelUrl } = await req.json() as {
    items: CartItemPayload[]
    successUrl?: string
    cancelUrl?: string
  }

  if (!items?.length) {
    return NextResponse.json({ error: "Cart is empty" }, { status: 400 })
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://aimseos.com"

  // Get authenticated user (if signed in)
  const { userId: clerkId } = await auth()
  let dbUserId: string | null = null
  let customerEmail: string | undefined
  let customerName: string | undefined
  let stripeCustomerId: string | undefined

  if (clerkId) {
    const clerkUser = await currentUser()
    customerEmail = clerkUser?.emailAddresses?.[0]?.emailAddress
    customerName = clerkUser?.fullName ?? undefined

    // Find or create DB user
    let dbUser = await db.user.findUnique({ where: { clerkId } })
    if (!dbUser && customerEmail) {
      dbUser = await db.user.upsert({
        where: { email: customerEmail },
        update: { clerkId },
        create: {
          clerkId,
          email: customerEmail,
          name: customerName,
        },
      })
    }
    dbUserId = dbUser?.id ?? null

    if (dbUserId && customerEmail) {
      stripeCustomerId = await getOrCreateStripeCustomer(dbUserId, customerEmail, customerName)
    }
  }

  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = items.map((item) => {
    const label = item.tierName ? `${item.name} — ${item.tierName}` : item.name
    return {
      price_data: {
        currency: "usd",
        product_data: {
          name: label,
          metadata: {
            slug: item.slug,
            ...(item.tierId ? { tierId: item.tierId } : {}),
          },
        },
        unit_amount: item.priceMonthly,
        recurring: { interval: "month" },
      },
      quantity: 1,
    }
  })

  const slugs = items.map((i) => i.slug).join(",")
  const tierIds = items.map((i) => i.tierId ?? "").join(",")
  const amounts = items.map((i) => i.priceMonthly).join(",")

  const sessionParams: Stripe.Checkout.SessionCreateParams = {
    mode: "subscription",
    line_items: lineItems,
    success_url: successUrl ?? `${appUrl}/portal/dashboard?checkout=success`,
    cancel_url: cancelUrl ?? `${appUrl}/marketplace?checkout=cancelled`,
    allow_promotion_codes: true,
    client_reference_id: clerkId ?? undefined,
    customer_email: !stripeCustomerId ? customerEmail : undefined,
    metadata: {
      source: "cart",
      slugs,
      tierIds,
      amounts,
      ...(dbUserId ? { userId: dbUserId } : {}),
    },
    subscription_data: {
      metadata: {
        source: "cart",
        slugs,
        tierIds,
        amounts,
        ...(dbUserId ? { userId: dbUserId } : {}),
      },
    },
  }

  if (stripeCustomerId) {
    sessionParams.customer = stripeCustomerId
  }

  try {
    const session = await stripe.checkout.sessions.create(sessionParams)
    return NextResponse.json({ url: session.url })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Stripe error"
    console.error("Stripe checkout session creation failed:", message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
