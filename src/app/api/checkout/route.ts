import { NextResponse } from "next/server"
import Stripe from "stripe"

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

  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = items.map((item) => {
    const label = item.tierName ? `${item.name} — ${item.tierName}` : item.name
    return {
      price_data: {
        currency: "usd",
        product_data: {
          name: label,
          metadata: {
            serviceId: item.serviceId,
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

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: lineItems,
    success_url: successUrl ?? `${appUrl}/portal/dashboard?checkout=success`,
    cancel_url: cancelUrl ?? `${appUrl}/marketplace?checkout=cancelled`,
    allow_promotion_codes: true,
    metadata: {
      source: "marketplace-cart",
      serviceIds: items.map((i) => i.serviceId).join(","),
    },
  })

  return NextResponse.json({ url: session.url })
}
