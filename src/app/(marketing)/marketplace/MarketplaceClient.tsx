"use client"

import { useState, useMemo } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { Search } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { ToolLogo } from "@/components/shared/ToolLogo"

type Pillar = "MARKETING" | "SALES" | "OPERATIONS" | "FINANCE"

interface AIMSService {
  id: string
  slug: string
  pillar: Pillar
  name: string
  desc: string
  setupTime: string
  pricing: string
  priceFrom?: string
  isBeta?: boolean
  featured?: boolean
  tools: { name: string; domain: string }[]
  deliverables: string[]
  outcome: string
}

const SERVICES: AIMSService[] = [
  {
    id: "s2",
    slug: "cold-outbound",
    pillar: "OPERATIONS",
    name: "Wild Ducks",
    featured: true,
    desc: "Forward-deployed engineering division that goes into your organization, installs time intelligence, and deploys AI solutions",
    setupTime: "5–10 days",
    pricing: "custom",
    tools: [
      { name: "Anthropic", domain: "anthropic.com" },
      { name: "Notion", domain: "notion.so" },
      { name: "Slack", domain: "slack.com" },
      { name: "Zapier", domain: "zapier.com" },
    ],
    deliverables: [
      "Time intelligence software installation",
      "Department-by-department discovery sessions",
      "Prioritized AI opportunity map",
      "Production AI deployments (EOS Agent, automation, etc.)",
    ],
    outcome: "AI-native team with forward-deployed engineers removing growth ceilings - avg 40% operational efficiency gain in 90 days",
  },
  {
    id: "s4",
    slug: "seo-aeo",
    pillar: "MARKETING",
    name: "Money Page",
    featured: true,
    desc: "Revenue intelligence diagnostic that tracks Cost of Media, MOIC by channel, elasticity curves, and AI recovery metrics",
    setupTime: "3–5 days",
    pricing: "contact",
    tools: [
      { name: "HubSpot", domain: "hubspot.com" },
      { name: "OpenAI", domain: "openai.com" },
      { name: "Stripe", domain: "stripe.com" },
      { name: "Slack", domain: "slack.com" },
    ],
    deliverables: [
      "C.O.M. baseline + channel efficiency scoring",
      "MOIC tracking at campaign and funnel level",
      "Elasticity curve analysis per channel",
      "AI Recovery metric dashboard",
    ],
    outcome: "Complete financial visibility into marketing ROI - know exactly which channels produce profitable business vs. waste budget",
  },
  {
    id: "s13",
    slug: "revops-pipeline",
    pillar: "SALES",
    name: "Steel Trap",
    featured: true,
    desc: "Deterministic sales data architecture with complete lead lifecycle tracking, AI-extracted loss patterns, and BTC closing integration",
    setupTime: "3–5 days",
    pricing: "custom",
    tools: [
      { name: "HubSpot", domain: "hubspot.com" },
      { name: "Slack", domain: "slack.com" },
      { name: "Anthropic", domain: "anthropic.com" },
      { name: "Zoom", domain: "zoom.us" },
    ],
    deliverables: [
      "Complete lead lifecycle tracking infrastructure",
      "AI-extracted loss reason pattern analysis",
      "7x contact rule enforcement system",
      "Pipeline accuracy scoring + 90-day forecast",
    ],
    outcome: "Zero-leak sales pipeline revealing whether you have a sales problem or a pipeline problem - with BTC closing partners to fix it",
  },
]

const PILLAR_STYLES: Record<Pillar, string> = {
  MARKETING: "text-green-400 bg-green-900/15 border-green-800",
  SALES: "text-blue-400 bg-blue-900/15 border-blue-800",
  OPERATIONS: "text-orange-400 bg-orange-900/15 border-orange-800",
  FINANCE: "text-purple-400 bg-purple-900/15 border-purple-800",
}


function ServiceCard({ service }: { service: AIMSService }) {
  return (
    <div className={cn(
      "bg-card border rounded-2xl overflow-hidden flex flex-col h-full hover:shadow-md transition-shadow duration-200",
      service.featured ? "border-primary/40 ring-1 ring-primary/20" : "border-border"
    )}>
      {/* Card header */}
      <div className="px-5 pt-5 pb-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {service.featured && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-sm bg-primary/15 text-primary border border-primary/30 uppercase tracking-wider">Featured</span>
            )}
            <span className={cn("text-xs font-semibold px-2 py-0.5 rounded-full border", PILLAR_STYLES[service.pillar])}>
              {service.pillar.charAt(0) + service.pillar.slice(1).toLowerCase()}
            </span>
            {service.isBeta && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full border border-border text-muted-foreground">BETA</span>
            )}
          </div>
          <span className="text-xs text-muted-foreground">{service.setupTime} setup</span>
        </div>

        <h3 className="text-lg font-bold text-foreground mb-1.5 leading-tight line-clamp-2 min-h-[3.5rem]">{service.name}</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">{service.desc}</p>
      </div>

      {/* Tool logos */}
      <div className="px-5 pb-4">
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground font-medium mr-1">Uses:</span>
          {service.tools.map((tool) => (
            <ToolLogo key={tool.domain} domain={tool.domain} name={tool.name} />
          ))}
        </div>
      </div>

      {/* Deliverables - always exactly 3 rows */}
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

      {/* Outcome box - fixed height */}
      <div className="mx-5 mb-4 px-4 py-3 bg-muted border border-border rounded-xl min-h-[72px]">
        <div className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-1">Outcome</div>
        <p className="text-sm text-foreground/80 leading-snug">{service.outcome}</p>
      </div>

      {/* Pricing + CTA */}
      <div className="px-5 pb-5 mt-auto">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-bold text-foreground">Custom engagement</span>
          <Link href={`/services/${service.slug}`} className="text-xs text-muted-foreground hover:text-primary transition-colors">
            Learn more →
          </Link>
        </div>
        <Link
          href={`/get-started?engagement=${service.slug}`}
          className="w-full flex items-center justify-center gap-2 py-3 text-sm font-semibold rounded-xl transition-colors bg-primary text-white hover:bg-primary/90"
        >
          Book a Consultation
        </Link>
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
]

export function MarketplaceClient() {
  const [pillar, setPillar] = useState("ALL")
  const [search, setSearch] = useState("")

  const filtered = useMemo(() => {
    const result = SERVICES.filter((s) => {
      const matchPillar = pillar === "ALL" || s.pillar === pillar
      const matchSearch =
        !search ||
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.desc.toLowerCase().includes(search.toLowerCase())
      return matchPillar && matchSearch
    })
    // Featured services always appear first
    return result.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0))
  }, [pillar, search])

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border">
        <div className="max-w-6xl mx-auto px-4 py-12">
          <h1 className="text-4xl font-bold text-foreground">Our Engagements</h1>
          <p className="mt-3 text-lg text-muted-foreground">Forward-deployed AI engineering. Three flagship engagements. Custom-scoped to your business.</p>

          {/* Search + filters */}
          <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
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
        </div>
      </div>

      {/* Grid */}
      <div className="max-w-6xl mx-auto px-4 py-12">
        <p className="mb-6 text-sm text-muted-foreground">
          Showing {filtered.length} of {SERVICES.length} services
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
              onClick={() => { setPillar("ALL"); setSearch("") }}
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
