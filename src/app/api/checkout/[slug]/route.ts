import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { z } from "zod"
import type Stripe from "stripe"
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

  // Re-bind to non-null consts so the buildParams closure below can
  // reference these without losing the post-guard narrowing through
  // the function boundary.
  const finalPriceId: string = priceId
  const finalClerkId: string = clerkId
  const finalProduct = product

  // Build the params once so the retry path (auto-heal stale customer
  // ID) doesn't have to duplicate the entire literal.
  function buildParams(
    customer?: string | null,
    customerEmail?: string | null,
  ): Stripe.Checkout.SessionCreateParams {
    return {
      mode: isSubscription ? "subscription" : "payment",
      line_items: [{ price: finalPriceId, quantity: 1 }],
      ...(customer ? { customer } : {}),
      ...(customer ? {} : { customer_email: customerEmail ?? dbUser.email }),
      client_reference_id: finalClerkId,
      success_url: `${appUrl}/portal/dashboard?purchased=${slug}`,
      cancel_url: `${appUrl}/marketplace?canceled=${slug}`,
      allow_promotion_codes: true,
      metadata: {
        source: "product",
        productSlug: finalProduct.slug,
        userId: dbUser.id,
        intervalType: interval,
        ...(referringResellerId ? { referringResellerId } : {}),
        ...(lastUtm.utmSource ? { utmSource: lastUtm.utmSource } : {}),
        ...(lastUtm.utmMedium ? { utmMedium: lastUtm.utmMedium } : {}),
        ...(lastUtm.utmCampaign ? { utmCampaign: lastUtm.utmCampaign } : {}),
      },
      ...(isSubscription
        ? {
            subscription_data: {
              ...(trialDays && trialDays > 0
                ? { trial_period_days: trialDays }
                : {}),
              metadata: {
                source: "product",
                productSlug: finalProduct.slug,
                userId: dbUser.id,
                ...(referringResellerId ? { referringResellerId } : {}),
                ...(lastUtm.utmSource ? { utmSource: lastUtm.utmSource } : {}),
                ...(lastUtm.utmMedium ? { utmMedium: lastUtm.utmMedium } : {}),
                ...(lastUtm.utmCampaign ? { utmCampaign: lastUtm.utmCampaign } : {}),
              },
            },
          }
        : {}),
    }
  }

  try {
    let session
    try {
      session = await stripe.checkout.sessions.create(
        buildParams(dbUser.stripeCustomerId, dbUser.email),
      )
    } catch (firstErr) {
      // Auto-heal: if Stripe rejects with `resource_missing` on the
      // customer field (typically because the stored stripeCustomerId
      // is from a different Stripe mode — TEST id while we're now in
      // LIVE, or a different account entirely), null the column and
      // retry with customer_email. The webhook will create a fresh
      // live Customer on completion. Prevents the entire class of
      // "checkout_failed" we hit during the test→live migration.
      const e = firstErr as { code?: string; param?: string; raw?: { param?: string } }
      const isCustomerMissing =
        e?.code === "resource_missing" &&
        (e?.param === "customer" || e?.raw?.param === "customer") &&
        !!dbUser.stripeCustomerId
      if (!isCustomerMissing) throw firstErr
      logger.warn(
        "Stripe checkout: stale stripeCustomerId, auto-healing",
        {
          endpoint: "POST /api/checkout/[slug]",
          userId: dbUser.id,
          staleCustomerId: dbUser.stripeCustomerId,
        },
      )
      await db.user
        .update({
          where: { id: dbUser.id },
          data: { stripeCustomerId: null },
        })
        .catch(() => {})
      session = await stripe.checkout.sessions.create(
        buildParams(null, dbUser.email),
      )
    }

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
