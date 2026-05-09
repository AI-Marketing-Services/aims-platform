import { ShoppingBag } from "lucide-react"
import { db } from "@/lib/db"
import { ensureDbUser } from "@/lib/auth/ensure-user"
import {
  PLANS,
  CREDIT_PACKS,
  FEATURE_CATALOG,
  plansIncludingFeature,
} from "@/lib/plans/registry"
import { ADDONS } from "@/lib/plans/addons"
import { listActiveEntitlements } from "@/lib/entitlements"
import { PortalMarketplaceClient } from "./PortalMarketplaceClient"

export const metadata = { title: "Marketplace" }
export const dynamic = "force-dynamic"

/**
 * The /portal/marketplace page is the single buy-surface for the
 * platform. It shows three Plan cards (Free / Pro / Operator) and the
 * one-time Credit Pack rail. Each card is rendered from the catalog in
 * `lib/plans/registry.ts` enriched with Stripe price IDs + the optional
 * marketingVideoUrl pulled from the matching Product row in DB.
 */
export default async function PortalMarketplacePage() {
  const dbUser = await ensureDbUser()

  // Resolve catalog Product rows by slug. Plans + credit packs + add-ons
  // all live in the same Product table, so one query covers everything.
  const slugs = [
    ...PLANS.map((p) => p.slug),
    ...CREDIT_PACKS.map((p) => p.slug),
    ...ADDONS.map((a) => a.slug),
  ]
  const products = await db.product.findMany({
    where: { slug: { in: slugs }, isActive: true },
    select: {
      slug: true,
      stripePriceMonthly: true,
      stripePriceOneTime: true,
      marketingVideoUrl: true,
    },
  })
  const productBySlug = Object.fromEntries(products.map((p) => [p.slug, p]))

  // Hydrate Plans for the client.
  const plans = PLANS.map((plan) => ({
    slug: plan.slug,
    name: plan.name,
    tagline: plan.tagline,
    description: plan.description,
    priceMonthly: plan.priceMonthly,
    creditsPerMonth: plan.creditsPerMonth,
    highlights: plan.highlights,
    badge: plan.badge ?? null,
    sortOrder: plan.sortOrder,
    marketingVideoUrl: productBySlug[plan.slug]?.marketingVideoUrl ?? null,
    isCheckoutReady:
      plan.priceMonthly === 0 ||
      Boolean(productBySlug[plan.slug]?.stripePriceMonthly),
  }))

  const creditPacks = CREDIT_PACKS.map((pack) => ({
    slug: pack.slug,
    name: pack.name,
    credits: pack.credits,
    price: pack.price,
    badge: pack.badge ?? null,
    sortOrder: pack.sortOrder,
    isCheckoutReady: Boolean(productBySlug[pack.slug]?.stripePriceOneTime),
  }))

  // A-la-carte add-on cards — recurring or one-time products that ride
  // on top of the plan tiers. Each card shows a "Buy" button that hits
  // /api/checkout/<slug>; the entitlement key drives the "Active" badge.
  const addons = ADDONS.map((a) => {
    const product = productBySlug[a.slug]
    return {
      slug: a.slug,
      name: a.name,
      tagline: a.tagline,
      description: a.description,
      highlights: a.highlights,
      iconName: a.iconName,
      category: a.category,
      price: a.price,
      pricing: a.pricing,
      entitlements: [...a.entitlements],
      href: a.href,
      launchStatus: a.launchStatus,
      sortOrder: a.sortOrder,
      badge: a.badge ?? null,
      isCheckoutReady:
        a.pricing === "recurring"
          ? Boolean(product?.stripePriceMonthly)
          : Boolean(product?.stripePriceOneTime),
    }
  })

  const allActive = await listActiveEntitlements(dbUser.id).catch(() => [])
  const activeAddonKeys = allActive.filter((k) => k.startsWith("addon_"))

  // Features grid — every gated feature with its full description, the
  // plans that include it, and the deep-link to use it once unlocked.
  // The lowest-priced plan that includes the feature wins as the "from $X"
  // label so users see the cheapest path to unlock.
  const features = FEATURE_CATALOG.map((feature) => {
    const includingPlans = plansIncludingFeature(feature.key)
    const cheapest = includingPlans[0] ?? null
    return {
      key: feature.key,
      name: feature.name,
      iconName: feature.iconName,
      tagline: feature.tagline,
      description: feature.description,
      highlights: feature.highlights,
      href: feature.href,
      sortOrder: feature.sortOrder,
      includedOnPlans: includingPlans.map((p) => p.name),
      cheapestPlanName: cheapest?.name ?? null,
      cheapestPlanPriceMonthly: cheapest?.priceMonthly ?? null,
    }
  })

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
          <ShoppingBag className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Marketplace</h1>
          <p className="text-sm text-muted-foreground">
            Pick a plan or top up your credits — every feature in the portal is
            unlocked through a subscription.
          </p>
        </div>
      </div>

      <PortalMarketplaceClient
        currentPlanSlug={dbUser.planSlug}
        plans={plans}
        creditPacks={creditPacks}
        features={features}
        addons={addons}
        activeAddonKeys={activeAddonKeys}
      />
    </div>
  )
}
