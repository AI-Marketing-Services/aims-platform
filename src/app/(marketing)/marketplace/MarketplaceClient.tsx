"use client"

import { useState, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Search } from "lucide-react"
import { ProductCard } from "@/components/marketing/ProductCard"

type ServiceStatus = "ACTIVE" | "COMING_SOON" | "BETA" | "INTERNAL_ONLY" | "DEPRECATED"
type ServicePillar = "MARKETING" | "SALES" | "OPERATIONS" | "FINANCE"

interface Service {
  id: string
  slug: string
  name: string
  shortDesc: string
  pillar: ServicePillar
  status: ServiceStatus
  basePrice?: number
  pricingModel: string
  demoType?: string
  isFeatured: boolean
}

const PILLARS: { label: string; value: string; color: string }[] = [
  { label: "All", value: "ALL", color: "" },
  { label: "Marketing", value: "MARKETING", color: "text-green-700 bg-green-50 border-green-200" },
  { label: "Sales", value: "SALES", color: "text-blue-700 bg-blue-50 border-blue-200" },
  { label: "Operations", value: "OPERATIONS", color: "text-orange-700 bg-orange-50 border-orange-200" },
  { label: "Finance", value: "FINANCE", color: "text-purple-700 bg-purple-50 border-purple-200" },
]

export function MarketplaceClient({ services }: { services: Service[] }) {
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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-white">
        <div className="container mx-auto max-w-6xl px-4 py-12">
          <h1 className="text-4xl font-bold tracking-tight">AI Services Marketplace</h1>
          <p className="mt-3 text-lg text-muted-foreground">
            Browse every AIMS service. Filter by pillar. Start with what matters most.
          </p>

          {/* Search + filters */}
          <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
            {/* Search */}
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search services..."
                className="w-full rounded-lg border border-border bg-white pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#DC2626]/20 focus:border-[#DC2626]"
              />
            </div>

            {/* Pillar filters */}
            <div className="flex flex-wrap gap-2">
              {PILLARS.map((p) => (
                <button
                  key={p.value}
                  onClick={() => setPillar(p.value)}
                  className={`rounded-full border px-4 py-1.5 text-sm font-medium transition ${
                    pillar === p.value
                      ? p.value === "ALL"
                        ? "bg-[#DC2626] text-white border-[#DC2626]"
                        : p.color + " border-current"
                      : "border-border text-muted-foreground hover:border-foreground hover:text-foreground"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="container mx-auto max-w-6xl px-4 py-12">
        <p className="mb-6 text-sm text-muted-foreground">
          Showing {filtered.length} of {services.length} services
        </p>
        <AnimatePresence mode="popLayout">
          <motion.div
            layout
            className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
          >
            {filtered.map((service) => (
              <motion.div
                key={service.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                <ProductCard service={service} />
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>

        {filtered.length === 0 && (
          <div className="py-24 text-center">
            <p className="text-muted-foreground">No services match your search.</p>
            <button
              onClick={() => { setPillar("ALL"); setSearch("") }}
              className="mt-4 text-sm font-medium text-[#DC2626] hover:underline"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
