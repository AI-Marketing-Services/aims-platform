import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { stripe } from "@/lib/stripe"
import { getValidatedAttributionResellerId } from "@/lib/tenant/attribution"
import { getOrCreateDbUserByClerkId } from "@/lib/auth/ensure-user"
import { logger } from "@/lib/logger"

export const dynamic = "force-dynamic"

const bodySchema = z.object({
  interval: z.enum(["monthly", "annual", "one_time"]).default("monthly"),
})

/**
 * POST /api/checkout/[slug]
 *
 * Creates a Stripe Checkout session for a Product. Picks the right
 * Stripe price based on the requested interval, attaches the visitor's
 * attribution cookie + clerkId as metadata so the webhook can wire
 * everything up on completion. Returns the Stripe Checkout URL.
 *
 * Requires sign-in: every purchase belongs to a User. Anonymous visitors
 * are bounced to /sign-in?redirect_url=...
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params
  const { userId: clerkId } = await auth()

  let body: unknown
  try {
    body = await req.json()
  } catch {
    body = {}
  }
  const parsed = bodySchema.safeParse(body)
  const interval = parsed.success ? parsed.data.interval : "monthly"

  if (!clerkId) {
    return NextResponse.json(
      {
        error: "sign_in_required",
        signInUrl: `/sign-in?redirect_url=${encodeURIComponent(`/marketplace?slug=${slug}&interval=${interval}`)}`,
      },
      { status: 401 },
    )
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: "stripe_not_configured" }, { status: 503 })
  }

  const product = await db.product.findUnique({ where: { slug } })
  if (!product || !product.isActive) {
    return NextResponse.json({ error: "product_not_available" }, { status: 404 })
  }

  // Pick the price ID for the requested interval. Fall back to whichever
  // price IS set so a single-pricing product (e.g. monthly-only) just
  // works regardless of what the client requested.
  const priceId =
    (interval === "monthly" && product.stripePriceMonthly) ||
    (interval === "annual" && product.stripePriceAnnual) ||
    (interval === "one_time" && product.stripePriceOneTime) ||
    product.stripePriceMonthly ||
    product.stripePriceAnnual ||
    product.stripePriceOneTime
  if (!priceId) {
    return NextResponse.json({ error: "price_not_configured" }, { status: 503 })
  }

  // Lazy-create the User row if Clerk's user.created webhook hasn't
  // landed yet — otherwise a fresh tester clicking Buy in the first
  // 30s after sign-up gets a confusing 404.
  const dbUser = await getOrCreateDbUserByClerkId(clerkId)

  // First-touch attribution from the cookie. If unset (visitor came in
  // straight to the marketplace without ever touching a tenant page),
  // it's fine — the deal stays unattributed.
  const referringResellerId = await getValidatedAttributionResellerId(db)

  const isSubscription = interval !== "one_time"
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.aioperatorcollective.com"

  try {
    const session = await stripe.checkout.sessions.create({
      mode: isSubscription ? "subscription" : "payment",
      line_items: [{ price: priceId, quantity: 1 }],
      customer: dbUser.stripeCustomerId ?? undefined,
      customer_email: dbUser.stripeCustomerId ? undefined : dbUser.email,
      client_reference_id: clerkId,
      success_url: `${appUrl}/portal/dashboard?purchased=${slug}`,
      cancel_url: `${appUrl}/marketplace?canceled=${slug}`,
      allow_promotion_codes: true,
      metadata: {
        source: "product",
        productSlug: product.slug,
        userId: dbUser.id,
        intervalType: interval,
        ...(referringResellerId ? { referringResellerId } : {}),
      },
      // For subscriptions we pass through the same metadata to the
      // subscription itself so renewal webhooks see it without needing
      // to look up the original session.
      ...(isSubscription
        ? {
            subscription_data: {
              metadata: {
                source: "product",
                productSlug: product.slug,
                userId: dbUser.id,
                ...(referringResellerId ? { referringResellerId } : {}),
              },
            },
          }
        : {}),
    })

    return NextResponse.json({ url: session.url, sessionId: session.id })
  } catch (err) {
    logger.error("Stripe checkout session creation failed", err, {
      endpoint: "POST /api/checkout/[slug]",
      slug,
      userId: dbUser.id,
    })
    return NextResponse.json({ error: "checkout_failed" }, { status: 500 })
  }
}
