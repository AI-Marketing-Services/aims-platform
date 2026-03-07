import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { ShoppingBag } from "lucide-react"
import { PortalMarketplaceClient } from "./PortalMarketplaceClient"

export const metadata = { title: "Marketplace" }

export default async function PortalMarketplacePage() {
  const { userId } = await auth()
  if (!userId) redirect("/sign-in")

  const dbUser = await db.user.findUnique({ where: { clerkId: userId } })
  if (!dbUser) redirect("/sign-in")

  const [services, subscriptions] = await Promise.all([
    db.serviceArm.findMany({
      where: { status: { not: "DEPRECATED" } },
      include: { tiers: { orderBy: { sortOrder: "asc" } } },
      orderBy: { sortOrder: "asc" },
    }),
    db.subscription.findMany({
      where: { userId: dbUser.id, status: { in: ["ACTIVE", "TRIALING", "PAST_DUE"] } },
      select: { serviceArmId: true },
    }),
  ])

  const subscribedIds = subscriptions.map((s) => s.serviceArmId)

  const serialized = services.map((s) => ({
    id: s.id,
    slug: s.slug,
    name: s.name,
    shortDesc: s.shortDesc,
    pillar: s.pillar,
    status: s.status,
    basePrice: s.basePrice,
    tiers: s.tiers.map((t) => ({ price: t.price, slug: t.slug })),
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
      />
    </div>
  )
}
