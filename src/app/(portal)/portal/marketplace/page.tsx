import { db } from "@/lib/db"
import { ShoppingBag } from "lucide-react"
import { PortalMarketplaceClient } from "./PortalMarketplaceClient"
import { ensureDbUser } from "@/lib/auth/ensure-user"

export const metadata = { title: "Marketplace" }

export default async function PortalMarketplacePage() {
  const dbUser = await ensureDbUser()

  const [services, subscriptions] = await Promise.all([
    db.serviceArm.findMany({
      where: { status: { not: "DEPRECATED" } },
      include: { tiers: { orderBy: { sortOrder: "asc" } } },
      orderBy: { sortOrder: "asc" },
    }),
    db.subscription.findMany({
      where: { userId: dbUser.id, status: { in: ["ACTIVE", "TRIALING", "PAST_DUE"] } },
      select: { serviceArmId: true, monthlyAmount: true, serviceArm: { select: { name: true } } },
    }),
  ])

  const subscribedIds = subscriptions.map((s) => s.serviceArmId)

  const subscribedServices = subscriptions.map((s) => ({
    name: s.serviceArm.name,
    monthlyAmount: s.monthlyAmount,
  }))

  const serialized = services.map((s) => ({
    id: s.id,
    slug: s.slug,
    name: s.name,
    shortDesc: s.shortDesc,
    pillar: s.pillar,
    status: s.status,
    basePrice: s.basePrice,
    pricingModel: s.pricingModel,
    tiers: s.tiers.map((t) => ({ price: t.price, slug: t.slug, stripePriceId: t.stripePriceId, name: t.name })),
  }))

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted">
          <ShoppingBag className="h-5 w-5 text-muted-foreground" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Marketplace</h1>
          <p className="text-sm text-muted-foreground">Add new AI services to your stack</p>
        </div>
      </div>

      <PortalMarketplaceClient
        services={serialized}
        subscribedIds={subscribedIds}
        subscribedServices={subscribedServices}
      />
    </div>
  )
}
