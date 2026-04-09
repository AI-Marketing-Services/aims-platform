import type { Metadata } from "next"
import { db } from "@/lib/db"
import { MarketplaceClient, type PublicService } from "./MarketplaceClient"

export const metadata: Metadata = {
  title: "Services Marketplace | AIMS",
  description:
    "Browse the full AIMS catalog of productized AI services. Self-serve SKUs you can buy today, plus custom engagements that start with a consultation.",
  alternates: { canonical: "https://aimseos.com/marketplace" },
}

// Revalidate every 10 minutes so catalog edits in admin propagate without a deploy.
export const revalidate = 600

export default async function MarketplacePage() {
  const services = await db.serviceArm.findMany({
    where: { status: { in: ["ACTIVE", "BETA"] } },
    include: {
      tiers: {
        orderBy: { sortOrder: "asc" },
        select: { price: true, slug: true, stripePriceId: true, name: true, isPopular: true },
      },
    },
    orderBy: [{ isFeatured: "desc" }, { sortOrder: "asc" }],
  })

  const publicServices: PublicService[] = services.map((s) => {
    // "Self-serve" = at least one tier has a Stripe price id — can take money without a sales call.
    const sellableTier = s.tiers.find((t) => !!t.stripePriceId)
    const lowestTier = s.tiers
      .filter((t) => t.price > 0)
      .sort((a, b) => a.price - b.price)[0]

    // Derive up to 4 deliverables from the features json (seed stores them as {icon,title,description}[]).
    const features = Array.isArray(s.features) ? (s.features as Array<{ title?: string }>) : []
    const deliverables = features
      .map((f) => (typeof f?.title === "string" ? f.title : null))
      .filter((t): t is string => !!t)
      .slice(0, 4)

    return {
      id: s.id,
      slug: s.slug,
      name: s.name,
      shortDesc: s.shortDesc,
      pillar: s.pillar,
      isFeatured: s.isFeatured,
      isBeta: s.status === "BETA",
      estimatedSetupDays: s.estimatedSetupDays,
      basePrice: s.basePrice,
      pricingModel: s.pricingModel,
      lowestTierPriceCents: lowestTier?.price ?? null,
      isSelfServe: !!sellableTier,
      deliverables,
    }
  })

  return <MarketplaceClient services={publicServices} />
}
