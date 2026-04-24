import { redirect } from "next/navigation"
import { requireAdmin } from "@/lib/auth"
import { db } from "@/lib/db"
import { Package, AlertTriangle } from "lucide-react"
import { ProductsAdminClient, type ProductRow } from "./ProductsAdminClient"

export const metadata = { title: "Products & Tiers", robots: { index: false } }
export const dynamic = "force-dynamic"

export default async function AdminProductsPage() {
  const adminId = await requireAdmin()
  if (!adminId) redirect("/admin/dashboard")

  const stripeConfigured = !!process.env.STRIPE_SECRET_KEY

  const products = await db.product.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    include: {
      _count: { select: { purchases: true } },
    },
  })

  const rows: ProductRow[] = products.map((p) => ({
    id: p.id,
    slug: p.slug,
    name: p.name,
    description: p.description,
    type: p.type,
    isActive: p.isActive,
    sortOrder: p.sortOrder,
    stripePriceMonthly: p.stripePriceMonthly,
    stripePriceAnnual: p.stripePriceAnnual,
    stripePriceOneTime: p.stripePriceOneTime,
    entitlements: p.entitlements,
    commissionBps: p.commissionBps,
    grantsRole: p.grantsRole,
    purchaseCount: p._count.purchases,
    createdAt: p.createdAt.toISOString(),
  }))

  return (
    <div className="space-y-6">
      <div>
        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-primary mb-2">
          COMMERCE · CATALOG
        </div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Package className="h-6 w-6 text-primary" />
          Products & Tiers
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Tiers (Member / Operator / Reseller) and a la carte tools. Each product maps to one or more entitlements that gate features across the platform.
        </p>
      </div>

      {!stripeConfigured && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-semibold text-foreground">Stripe not configured</p>
            <p className="text-muted-foreground mt-1">
              Define products and entitlements freely; checkout flows won&apos;t work until <code className="font-mono bg-muted px-1 py-0.5 rounded">STRIPE_SECRET_KEY</code> is set.
            </p>
          </div>
        </div>
      )}

      <ProductsAdminClient initialRows={rows} />
    </div>
  )
}
