"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { CheckCircle2, ArrowRight, Search } from "lucide-react"
import { cn } from "@/lib/utils"
import { ToolLogo } from "@/components/shared/ToolLogo"

type Pillar = "MARKETING" | "SALES" | "OPERATIONS" | "FINANCE"

interface ServiceArm {
  id: string
  slug: string
  name: string
  shortDesc: string
  pillar: Pillar
  status: string
  basePrice: number | null
  pricingModel: string
  tiers: { price: number; slug: string }[]
}

interface SubscribedService {
  name: string
  monthlyAmount: number
}

interface Props {
  services: ServiceArm[]
  subscribedIds: string[]
  subscribedServices: SubscribedService[]
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

const TOOL_MAP: Record<string, { name: string; domain: string }[]> = {
  "website-crm-chatbot": [
    { name: "GoHighLevel", domain: "gohighlevel.com" },
    { name: "OpenAI", domain: "openai.com" },
  ],
  "cold-outbound": [
    { name: "Clay", domain: "clay.com" },
    { name: "Instantly", domain: "instantly.ai" },
    { name: "Apollo", domain: "apollo.io" },
  ],
  "voice-agents": [
    { name: "Twilio", domain: "twilio.com" },
    { name: "GoHighLevel", domain: "gohighlevel.com" },
  ],
  "seo-aeo": [
    { name: "Google", domain: "search.google.com" },
    { name: "Perplexity", domain: "perplexity.ai" },
  ],
  "audience-targeting": [
    { name: "Meta", domain: "meta.com" },
    { name: "LinkedIn", domain: "linkedin.com" },
    { name: "Clay", domain: "clay.com" },
  ],
  "finance-automation": [
    { name: "Airtable", domain: "airtable.com" },
    { name: "Stripe", domain: "stripe.com" },
  ],
  "ai-tool-tracker": [
    { name: "Anthropic", domain: "anthropic.com" },
    { name: "Notion", domain: "notion.so" },
  ],
  "lead-reactivation": [
    { name: "GoHighLevel", domain: "gohighlevel.com" },
    { name: "Instantly", domain: "instantly.ai" },
  ],
  "database-reactivation": [
    { name: "HubSpot", domain: "hubspot.com" },
    { name: "Apollo", domain: "apollo.io" },
  ],
  "revops-pipeline": [
    { name: "HubSpot", domain: "hubspot.com" },
    { name: "Salesforce", domain: "salesforce.com" },
  ],
  "content-production": [
    { name: "OpenAI", domain: "openai.com" },
    { name: "LinkedIn", domain: "linkedin.com" },
  ],
  "ghl-community-os": [
    { name: "GoHighLevel", domain: "gohighlevel.com" },
    { name: "Twilio", domain: "twilio.com" },
  ],
  "ai-reputation-engine": [
    { name: "Twilio", domain: "twilio.com" },
    { name: "Google Business", domain: "googlebusiness.com" },
  ],
  "vendor-ordering-portal": [
    { name: "Stripe", domain: "stripe.com" },
    { name: "Airtable", domain: "airtable.com" },
  ],
  "ai-community-chatbot": [
    { name: "Anthropic", domain: "anthropic.com" },
    { name: "Slack", domain: "slack.com" },
  ],
  "sales-team-enablement": [
    { name: "Slack", domain: "slack.com" },
    { name: "OpenAI", domain: "openai.com" },
  ],
  "sms-compliance-setup": [
    { name: "Twilio", domain: "twilio.com" },
    { name: "Zapier", domain: "zapier.com" },
  ],
}

function priceLabel(svc: ServiceArm) {
  if (svc.pricingModel === "CUSTOM") return "Custom pricing"
  if (svc.tiers.length > 0) {
    const min = Math.min(...svc.tiers.map((t) => t.price))
    return `From $${min}/mo`
  }
  if (svc.basePrice) return `From $${svc.basePrice}/mo`
  return "Custom pricing"
}

function isCustomPriced(svc: ServiceArm) {
  if (svc.pricingModel === "CUSTOM") return true
  if (!svc.basePrice && svc.tiers.length === 0) return true
  return false
}

function getRecommendedSlug(subscribedSlugs: Set<string>): string | null {
  if (subscribedSlugs.size === 0) return "website-crm-chatbot"
  if (subscribedSlugs.has("website-crm-chatbot") && !subscribedSlugs.has("cold-outbound")) return "cold-outbound"
  if (subscribedSlugs.has("cold-outbound") && !subscribedSlugs.has("voice-agents")) return "voice-agents"
  return null
}

export function PortalMarketplaceClient({ services, subscribedIds, subscribedServices }: Props) {
  const router = useRouter()
  const subscribedSet = new Set(subscribedIds)
  const [pillar, setPillar] = useState("ALL")
  const [search, setSearch] = useState("")

  const subscribedSlugs = useMemo(() => {
    const subIdSet = new Set(subscribedIds)
    const slugSet = new Set<string>()
    services.forEach((s) => {
      if (subIdSet.has(s.id)) slugSet.add(s.slug)
    })
    return slugSet
  }, [services, subscribedIds])

  const recommendedSlug = useMemo(() => getRecommendedSlug(subscribedSlugs), [subscribedSlugs])

  const totalMrr = subscribedServices.reduce((sum, s) => sum + s.monthlyAmount, 0)

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
      {/* Your Stack summary bar */}
      <div className="rounded-xl border border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground mb-6">
        {subscribedServices.length > 0 ? (
          <span>
            Your current stack:{" "}
            {subscribedServices.map((s, i) => (
              <span key={s.name}>
                <span className="font-medium text-foreground">{s.name}</span>
                {i < subscribedServices.length - 1 && <span className="mx-1.5 opacity-40">·</span>}
              </span>
            ))}
            <span className="mx-1.5 opacity-40">·</span>
            <span className="font-medium text-foreground">{subscribedServices.length} service{subscribedServices.length !== 1 ? "s" : ""}</span>
            <span className="mx-1.5 opacity-40">·</span>
            <span className="font-semibold text-foreground">${totalMrr.toLocaleString()}/mo total</span>
          </span>
        ) : (
          <span>You haven&apos;t added any services yet. Browse below to get started.</span>
        )}
      </div>

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
          const isRecommended = svc.slug === recommendedSlug && !isSubscribed
          const tools = TOOL_MAP[svc.slug] ?? []
          const custom = isCustomPriced(svc)

          return (
            <div
              key={svc.id}
              className={cn(
                "flex flex-col rounded-xl border border-border bg-card overflow-hidden hover:border-border/70 transition-colors",
                isSubscribed && "border-l-4 border-l-green-500"
              )}
            >
              <div className="p-5 flex-1">
                {/* Top badge row */}
                <div className="flex items-start justify-between mb-3 gap-2">
                  <div className="flex flex-col gap-1">
                    {isRecommended && (
                      <span className="self-start bg-red-50 text-[#DC2626] border border-red-200 text-[10px] font-bold uppercase tracking-wider rounded-full px-2 py-0.5">
                        Recommended for you
                      </span>
                    )}
                    {!isSubscribed && (
                      <span className={cn("text-[11px] font-semibold px-2 py-0.5 rounded-full border self-start", PILLAR_PILL[svc.pillar])}>
                        {svc.pillar.charAt(0) + svc.pillar.slice(1).toLowerCase()}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    {isSubscribed && (
                      <span className="bg-green-50 text-green-700 border border-green-200 text-xs font-semibold rounded-full px-2 py-0.5">
                        Active
                      </span>
                    )}
                    {svc.status === "BETA" && !isSubscribed && (
                      <span className="text-[11px] font-semibold text-amber-400 border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 rounded-full">
                        Beta
                      </span>
                    )}
                  </div>
                </div>

                <h3 className="text-sm font-semibold text-foreground mb-1.5 leading-snug">{svc.name}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{svc.shortDesc}</p>
              </div>

              <div className="px-5 pb-5">
                {/* Tool logos row */}
                {tools.length > 0 && (
                  <div className="flex items-center gap-1.5 mb-3">
                    <span className="text-[10px] text-muted-foreground mr-0.5">Powered by</span>
                    {tools.map((tool) => (
                      <ToolLogo key={tool.domain} domain={tool.domain} name={tool.name} size={16} />
                    ))}
                  </div>
                )}

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
                ) : custom ? (
                  <button
                    onClick={() => router.push(`/get-started?service=${svc.slug}`)}
                    className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#DC2626] text-white text-xs font-semibold rounded-lg hover:bg-[#B91C1C] transition-colors"
                  >
                    Request Quote
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
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
