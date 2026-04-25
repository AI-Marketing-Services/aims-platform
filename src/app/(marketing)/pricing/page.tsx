import { db } from "@/lib/db"
import { PricingClient, type ProductCard } from "./PricingClient"

export const metadata = {
  title: "Pricing — AI Operator Collective",
  description:
    "Tiers, tools, and add-ons that unlock the AI Operator Collective platform. Member, Operator, and Reseller plans plus a la carte purchases.",
}

export const dynamic = "force-dynamic"

export default async function PricingPage() {
  const products = await db.product.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: "asc" }],
  })

  const cards: ProductCard[] = products.map((p) => ({
    id: p.id,
    slug: p.slug,
    name: p.name,
    description: p.description,
    type: p.type,
    entitlements: p.entitlements,
    grantsRole: p.grantsRole,
    hasMonthly: !!p.stripePriceMonthly,
    hasAnnual: !!p.stripePriceAnnual,
    hasOneTime: !!p.stripePriceOneTime,
  }))

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:py-24">
        <header className="text-center mb-12">
          <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-primary mb-3">
            PRICING
          </div>
          <h1 className="font-serif text-4xl sm:text-5xl text-foreground mb-4">
            Choose your access
          </h1>
          <p className="text-foreground/70 max-w-xl mx-auto">
            Tiers unlock progressively more of the platform. A la carte tools layer onto any tier.
          </p>
        </header>

        <PricingClient cards={cards} />
      </div>
    </div>
  )
}
