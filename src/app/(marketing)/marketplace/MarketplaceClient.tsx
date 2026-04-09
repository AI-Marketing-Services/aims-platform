"use client"

import { useState, useMemo } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { Search, ArrowRight, Calendar } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

type Pillar = "MARKETING" | "SALES" | "OPERATIONS" | "FINANCE"

export interface PublicService {
  id: string
  slug: string
  name: string
  shortDesc: string
  pillar: Pillar
  isFeatured: boolean
  isBeta: boolean
  estimatedSetupDays: number | null
  basePrice: number | null
  pricingModel: "MONTHLY" | "QUARTERLY" | "ONE_TIME" | "USAGE_BASED" | "CUSTOM"
  // Lowest tier price in **cents** (ServiceTier.price is stored in cents in the seed).
  lowestTierPriceCents: number | null
  isSelfServe: boolean
  deliverables: string[]
}

const PILLAR_STYLES: Record<Pillar, string> = {
  MARKETING: "text-green-400 bg-green-900/15 border-green-800",
  SALES: "text-blue-400 bg-blue-900/15 border-blue-800",
  OPERATIONS: "text-orange-400 bg-orange-900/15 border-orange-800",
  FINANCE: "text-purple-400 bg-purple-900/15 border-purple-800",
}

function formatPrice(service: PublicService): string {
  if (service.pricingModel === "CUSTOM") return "Custom pricing"
  if (service.lowestTierPriceCents && service.lowestTierPriceCents > 0) {
    const dollars = Math.round(service.lowestTierPriceCents / 100)
    const suffix = service.pricingModel === "ONE_TIME" ? "" : "/mo"
    return `from $${dollars.toLocaleString()}${suffix}`
  }
  if (service.basePrice && service.basePrice > 0) {
    return `from $${service.basePrice.toLocaleString()}/mo`
  }
  return "Contact for pricing"
}

function ServiceCard({ service }: { service: PublicService }) {
  const price = formatPrice(service)
  const setupLabel = service.estimatedSetupDays
    ? `${service.estimatedSetupDays}${service.estimatedSetupDays > 1 ? " days" : " day"} setup`
    : "Custom setup"

  return (
    <div
      className={cn(
        "bg-card border rounded-2xl overflow-hidden flex flex-col h-full transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg",
        service.isFeatured ? "border-primary/40 ring-1 ring-primary/20" : "border-border"
      )}
    >
      {/* Card header */}
      <div className="px-5 pt-5 pb-4">
        <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            {service.isFeatured && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-sm bg-primary/15 text-primary border border-primary/30 uppercase tracking-wider">
                Featured
              </span>
            )}
            <span
              className={cn(
                "text-xs font-semibold px-2 py-0.5 rounded-full border",
                PILLAR_STYLES[service.pillar]
              )}
            >
              {service.pillar.charAt(0) + service.pillar.slice(1).toLowerCase()}
            </span>
            {service.isBeta && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full border border-border text-muted-foreground">
                BETA
              </span>
            )}
          </div>
          <span className="text-xs text-muted-foreground">{setupLabel}</span>
        </div>

        <h3 className="text-lg font-bold text-foreground mb-1.5 leading-tight line-clamp-2 min-h-[3.5rem]">
          {service.name}
        </h3>
        <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3 min-h-[3.75rem]">
          {service.shortDesc}
        </p>
      </div>

      {/* Deliverables */}
      {service.deliverables.length > 0 && (
        <div className="px-5 pb-4 flex-1">
          <ul className="space-y-2">
            {service.deliverables.slice(0, 3).map((d, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-foreground/80">
                <span className="text-muted-foreground mt-0.5 flex-shrink-0">-</span>
                <span className="line-clamp-1">{d}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Pricing + CTA */}
      <div className="px-5 pb-5 mt-auto">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-bold text-foreground">{price}</span>
          <Link
            href={`/services/${service.slug}`}
            className="text-xs text-muted-foreground hover:text-primary transition-colors"
          >
            Learn more →
          </Link>
        </div>
        {service.isSelfServe ? (
          <Link
            href={`/services/${service.slug}`}
            className="w-full flex items-center justify-center gap-2 py-3 text-sm font-semibold rounded-xl transition-colors bg-primary text-white hover:bg-primary/90"
          >
            View Plans & Pricing
            <ArrowRight className="h-4 w-4" />
          </Link>
        ) : (
          <Link
            href={`/get-started?engagement=${service.slug}`}
            className="w-full flex items-center justify-center gap-2 py-3 text-sm font-semibold rounded-xl transition-colors border border-border bg-card text-foreground hover:border-primary/40 hover:bg-primary/5"
          >
            <Calendar className="h-4 w-4" />
            Book a Consultation
          </Link>
        )}
      </div>
    </div>
  )
}

const FILTER_TABS = [
  { label: "All", value: "ALL" },
  { label: "Marketing", value: "MARKETING" },
  { label: "Sales", value: "SALES" },
  { label: "Operations", value: "OPERATIONS" },
  { label: "Finance", value: "FINANCE" },
] as const

const TYPE_TABS = [
  { label: "All Services", value: "ALL" },
  { label: "Self-Serve", value: "SELF_SERVE" },
  { label: "Consultation", value: "CUSTOM" },
] as const

export function MarketplaceClient({ services }: { services: PublicService[] }) {
  const [pillar, setPillar] = useState<string>("ALL")
  const [typeFilter, setTypeFilter] = useState<string>("ALL")
  const [search, setSearch] = useState("")

  const filtered = useMemo(() => {
    return services.filter((s) => {
      const matchPillar = pillar === "ALL" || s.pillar === pillar
      const matchType =
        typeFilter === "ALL" ||
        (typeFilter === "SELF_SERVE" && s.isSelfServe) ||
        (typeFilter === "CUSTOM" && !s.isSelfServe)
      const matchSearch =
        !search ||
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.shortDesc.toLowerCase().includes(search.toLowerCase())
      return matchPillar && matchType && matchSearch
    })
  }, [services, pillar, typeFilter, search])

  const selfServeCount = services.filter((s) => s.isSelfServe).length

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border">
        <div className="max-w-6xl mx-auto px-4 py-12">
          <h1 className="text-4xl font-bold text-foreground">Services Marketplace</h1>
          <p className="mt-3 text-lg text-muted-foreground max-w-3xl">
            Productized AI services you can buy today, plus custom engagements that start with a
            quick consultation. {selfServeCount} self-serve SKUs in stock.
          </p>

          {/* Search + filters */}
          <div className="mt-8 space-y-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search services..."
                  className="w-full pl-10 pr-4 py-2.5 border border-border rounded-xl bg-card text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {FILTER_TABS.map((tab) => (
                  <button
                    key={tab.value}
                    onClick={() => setPillar(tab.value)}
                    className={cn(
                      "px-4 py-1.5 rounded-full text-sm font-medium border transition-colors",
                      pillar === tab.value
                        ? "bg-primary text-white border-primary"
                        : "bg-card text-muted-foreground border-border hover:border-line-hover hover:text-foreground"
                    )}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {TYPE_TABS.map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => setTypeFilter(tab.value)}
                  className={cn(
                    "px-4 py-1.5 rounded-lg text-xs font-semibold border uppercase tracking-wider transition-colors",
                    typeFilter === tab.value
                      ? "bg-primary/15 text-primary border-primary/30"
                      : "bg-card text-muted-foreground border-border hover:text-foreground"
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="max-w-6xl mx-auto px-4 py-12">
        <p className="mb-6 text-sm text-muted-foreground">
          Showing {filtered.length} of {services.length} services
        </p>
        <AnimatePresence mode="popLayout">
          <motion.div layout className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((service) => (
              <motion.div
                key={service.id}
                layout
                className="h-full"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.18 }}
              >
                <ServiceCard service={service} />
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>

        {filtered.length === 0 && (
          <div className="py-24 text-center">
            <p className="text-muted-foreground">No services match your search.</p>
            <button
              onClick={() => {
                setPillar("ALL")
                setTypeFilter("ALL")
                setSearch("")
              }}
              className="mt-4 text-sm font-medium text-primary hover:underline"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
