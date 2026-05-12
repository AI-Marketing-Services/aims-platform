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
  // Optional trial — only honored for subscription products. Capped at 30
  // days so a malicious client can't extend their own trial via the wire.
  trialDays: z.number().int().min(0).max(30).optional(),
  // Last-touch UTM — the Buy CTA passes these along so we can stamp
  // them on Purchase.lastUtm* for "what made them upgrade" analytics.
  utmSource: z.string().max(100).optional(),
  utmMedium: z.string().max(100).optional(),
  utmCampaign: z.string().max(100).optional(),
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
  const trialDays = parsed.success ? parsed.data.trialDays : undefined
  const lastUtm = parsed.success
    ? {
        utmSource: parsed.data.utmSource,
        utmMedium: parsed.data.utmMedium,
        utmCampaign: parsed.data.utmCampaign,
      }
    : {}

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
  // Use `||` not `??` — at runtime in some Vercel build scenarios
  // `NEXT_PUBLIC_APP_URL` resolves to an empty string rather than
  // undefined. Empty string is a truthy-ish gotcha for nullish-coalescing
  // and Stripe rejects relative URLs with `url_invalid`. Belt-and-braces:
  // also strip any trailing slash so we never produce a `//` in the path.
  const rawAppUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_VERCEL_URL ||
    "https://www.aioperatorcollective.com"
  const appUrl = rawAppUrl
    .trim()
    .replace(/\/+$/, "")
    .replace(/^(?!https?:\/\/)/, "https://")

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
        ...(lastUtm.utmSource ? { utmSource: lastUtm.utmSource } : {}),
        ...(lastUtm.utmMedium ? { utmMedium: lastUtm.utmMedium } : {}),
        ...(lastUtm.utmCampaign ? { utmCampaign: lastUtm.utmCampaign } : {}),
      },
      // For subscriptions we pass through the same metadata to the
      // subscription itself so renewal webhooks see it without needing
      // to look up the original session.
      ...(isSubscription
        ? {
            subscription_data: {
              // trial_period_days only applies on subscription create; if
              // the customer is reactivating mid-cycle Stripe ignores it.
              ...(trialDays && trialDays > 0
                ? { trial_period_days: trialDays }
                : {}),
              metadata: {
                source: "product",
                productSlug: product.slug,
                userId: dbUser.id,
                ...(referringResellerId ? { referringResellerId } : {}),
                ...(lastUtm.utmSource ? { utmSource: lastUtm.utmSource } : {}),
                ...(lastUtm.utmMedium ? { utmMedium: lastUtm.utmMedium } : {}),
                ...(lastUtm.utmCampaign ? { utmCampaign: lastUtm.utmCampaign } : {}),
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
    // TEMP DEBUG 2026-05-11: persist the raw error to DB so I can query
    // it from the terminal without needing Vercel runtime logs (which
    // aren't exposed via API for this account). REVERT once root cause
    // identified — using ApiCostLog as a generic structured-log table.
    const errMsg = err instanceof Error ? err.message : String(err)
    const errStack = err instanceof Error ? err.stack : undefined
    const errCode =
      (err as { code?: string; type?: string })?.code ??
      (err as { code?: string; type?: string })?.type
    try {
      await db.apiCostLog.create({
        data: {
          provider: "DEBUG_CHECKOUT",
          model: "checkout-error",
          endpoint: `/api/checkout/${slug}`,
          cost: 0,
          clientId: dbUser.id,
          metadata: {
            slug,
            priceId,
            interval,
            userEmail: dbUser.email,
            errMsg,
            errCode,
            errStack: errStack?.slice(0, 2000),
          },
        },
      })
    } catch {}
    return NextResponse.json(
      {
        error: "checkout_failed",
        debug: { message: errMsg, code: errCode, slug, priceId, userEmail: dbUser.email },
      },
      { status: 500 },
    )
  }
}
