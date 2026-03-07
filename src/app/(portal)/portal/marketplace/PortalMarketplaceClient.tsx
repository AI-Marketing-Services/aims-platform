"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { CheckCircle2, ArrowRight, Search } from "lucide-react"
import { cn } from "@/lib/utils"

type Pillar = "MARKETING" | "SALES" | "OPERATIONS" | "FINANCE"

interface ServiceArm {
  id: string
  slug: string
  name: string
  shortDesc: string
  pillar: Pillar
  status: string
  basePrice: number | null
  tiers: { price: number; slug: string }[]
}

interface Props {
  services: ServiceArm[]
  subscribedIds: string[]
}

const PILLAR_TABS = [
  { label: "All", value: "ALL" },
  { label: "Marketing", value: "MARKETING" },
  { label: "Sales", value: "SALES" },
  { label: "Operations", value: "OPERATIONS" },
  { label: "Finance", value: "FINANCE" },
]

const PILLAR_PILL: Record<Pillar, string> = {
  MARKETING: "bg-green-500/10 text-green-400 border-green-500/20",
  SALES: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  OPERATIONS: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  FINANCE: "bg-purple-500/10 text-purple-400 border-purple-500/20",
}

function priceLabel(svc: ServiceArm) {
  if (svc.tiers.length > 0) {
    const min = Math.min(...svc.tiers.map((t) => t.price))
    return `From $${min}/mo`
  }
  if (svc.basePrice) return `From $${svc.basePrice}/mo`
  return "Custom pricing"
}

export function PortalMarketplaceClient({ services, subscribedIds }: Props) {
  const subscribedSet = new Set(subscribedIds)
  const [pillar, setPillar] = useState("ALL")
  const [search, setSearch] = useState("")

  const filtered = useMemo(() => {
    return services.filter((s) => {
      const matchPillar = pillar === "ALL" || s.pillar === pillar
      const matchSearch =
        !search ||
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.shortDesc.toLowerCase().includes(search.toLowerCase())
      return matchPillar && matchSearch
    })
  }, [services, pillar, search])

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search services..."
            className="w-full pl-9 pr-4 py-2 bg-card border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#DC2626]/30 focus:border-[#DC2626]"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {PILLAR_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setPillar(tab.value)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors",
                pillar === tab.value
                  ? "bg-[#DC2626] text-white border-[#DC2626]"
                  : "bg-card text-muted-foreground border-border hover:text-foreground hover:border-border/80"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        {filtered.length} service{filtered.length !== 1 ? "s" : ""}
        {pillar !== "ALL" ? ` in ${pillar.charAt(0) + pillar.slice(1).toLowerCase()}` : ""}
      </p>

      {/* Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((svc) => {
          const isSubscribed = subscribedSet.has(svc.id)

          return (
            <div
              key={svc.id}
              className="flex flex-col rounded-xl border border-border bg-card overflow-hidden hover:border-border/70 transition-colors"
            >
              <div className="p-5 flex-1">
                <div className="flex items-center justify-between mb-3">
                  <span className={cn("text-[11px] font-semibold px-2 py-0.5 rounded-full border", PILLAR_PILL[svc.pillar])}>
                    {svc.pillar.charAt(0) + svc.pillar.slice(1).toLowerCase()}
                  </span>
                  {isSubscribed && (
                    <span className="flex items-center gap-1 text-[11px] font-semibold text-green-400">
                      <CheckCircle2 className="h-3 w-3" />
                      Subscribed
                    </span>
                  )}
                  {svc.status === "BETA" && !isSubscribed && (
                    <span className="text-[11px] font-semibold text-amber-400 border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 rounded-full">
                      Beta
                    </span>
                  )}
                </div>

                <h3 className="text-sm font-semibold text-foreground mb-1.5 leading-snug">{svc.name}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{svc.shortDesc}</p>
              </div>

              <div className="px-5 pb-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs text-muted-foreground">{priceLabel(svc)}</span>
                </div>
                {isSubscribed ? (
                  <Link
                    href={`/portal/services/${svc.id}`}
                    className="w-full flex items-center justify-center gap-2 py-2.5 bg-white/5 text-foreground text-xs font-medium rounded-lg hover:bg-white/10 transition-colors border border-border"
                  >
                    View Service
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                ) : (
                  <Link
                    href={`/services/${svc.slug}`}
                    className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#DC2626] text-white text-xs font-semibold rounded-lg hover:bg-[#B91C1C] transition-colors"
                  >
                    Add to Plan
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {filtered.length === 0 && (
        <div className="py-16 text-center">
          <p className="text-muted-foreground text-sm">No services match your search.</p>
          <button
            onClick={() => { setPillar("ALL"); setSearch("") }}
            className="mt-3 text-sm font-medium text-[#DC2626] hover:underline"
          >
            Clear filters
          </button>
        </div>
      )}
    </div>
  )
}
