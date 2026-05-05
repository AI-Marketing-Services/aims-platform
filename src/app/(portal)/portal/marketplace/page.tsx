import { ShoppingBag } from "lucide-react"
import { db } from "@/lib/db"
import { ensureDbUser } from "@/lib/auth/ensure-user"
import { PLANS, CREDIT_PACKS } from "@/lib/plans/registry"
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

  // Resolve catalog Product rows by slug. Both plans + credit packs live
  // in the same Product table, so one query covers everything.
  const slugs = [
    ...PLANS.map((p) => p.slug),
    ...CREDIT_PACKS.map((p) => p.slug),
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
      />
    </div>
  )
}
