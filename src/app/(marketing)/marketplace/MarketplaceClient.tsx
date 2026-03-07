"use client"

import { useState, useMemo } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { Search, ShoppingCart, Check } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { ToolLogo } from "@/components/shared/ToolLogo"
import { useCart } from "@/components/shared/CartContext"
import { getPricing } from "@/lib/services-pricing"

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
  tools: { name: string; domain: string }[]
  deliverables: string[]
  outcome: string
}

const SERVICES: AIMSService[] = [
  {
    id: "s1",
    slug: "website-crm-chatbot",
    pillar: "MARKETING",
    name: "Website + CRM + Chatbot Bundle",
    desc: "GHL-powered website with built-in CRM, automations, and AI chatbot trained on your business",
    setupTime: "3–5 days",
    pricing: "from",
    priceFrom: "$97/mo",
    tools: [
      { name: "GoHighLevel", domain: "gohighlevel.com" },
      { name: "OpenAI", domain: "openai.com" },
      { name: "Calendly", domain: "calendly.com" },
      { name: "Slack", domain: "slack.com" },
    ],
    deliverables: [
      "Custom GoHighLevel website with your branding and copy",
      "CRM pipeline with automated lead nurture sequences",
      "AI chatbot trained on your FAQs, services, and pricing",
      "Instant lead notifications + booking calendar integration",
    ],
    outcome: "Full lead capture system with automated follow-up live in under a week — no developer required",
  },
  {
    id: "s2",
    slug: "cold-outbound",
    pillar: "SALES",
    name: "Cold Outbound Engine",
    desc: "Multi-domain email infrastructure with AI SDR sequences and bi-directional CRM sync",
    setupTime: "5–7 days",
    pricing: "custom",
    tools: [
      { name: "Instantly", domain: "instantly.ai" },
      { name: "Clay", domain: "clay.com" },
      { name: "Apollo", domain: "apollo.io" },
      { name: "HubSpot", domain: "hubspot.com" },
    ],
    deliverables: [
      "Multi-domain email infrastructure (3–5 domains, warmed and ready)",
      "ICP modeling + list building via Clay enrichment",
      "AI-written sequences personalized to each prospect's context",
      "Reply handling + CRM sync + Slack alerts for positive responses",
    ],
    outcome: "Personalized cold email sequences running at scale with 30%+ open rates within 14 days",
  },
  {
    id: "s3",
    slug: "voice-agents",
    pillar: "SALES",
    name: "AI Voice Agent Platform",
    desc: "Inbound and outbound AI calling with multi-location routing and CRM integration",
    setupTime: "3–5 days",
    pricing: "custom",
    tools: [
      { name: "GoHighLevel", domain: "gohighlevel.com" },
      { name: "OpenAI", domain: "openai.com" },
      { name: "Twilio", domain: "twilio.com" },
      { name: "Slack", domain: "slack.com" },
    ],
    deliverables: [
      "AI receptionist handling inbound calls 24/7",
      "Outbound dialing sequences for lead follow-up and reactivation",
      "Multi-location routing with custom scripts per scenario",
      "Call summaries + CRM logging + Slack notifications",
    ],
    outcome: "24/7 AI calling system that qualifies and books meetings — zero manual follow-up required",
  },
  {
    id: "s4",
    slug: "seo-aeo",
    pillar: "MARKETING",
    name: "SEO & AEO Automation",
    desc: "Search engine and AI answer engine optimization with monthly content and reporting",
    setupTime: "3–5 hours",
    pricing: "contact",
    tools: [
      { name: "Perplexity", domain: "perplexity.ai" },
      { name: "Surfer SEO", domain: "surferseo.com" },
      { name: "Notion", domain: "notion.so" },
      { name: "Search Console", domain: "search.google.com" },
    ],
    deliverables: [
      "Keyword gap analysis + topic cluster map",
      "AI-generated content calendar (4 articles/mo minimum)",
      "FAQ schema markup for AI search engine visibility",
      "Monthly ranking report with traffic and position tracking",
    ],
    outcome: "Automated content pipeline ranking on Google and showing up in ChatGPT / Perplexity answers",
  },
  {
    id: "s5",
    slug: "audience-targeting",
    pillar: "SALES",
    name: "Audience Targeting & Segments",
    desc: "20K+ prebuilt audience segments with semantic search, ICP scoring, and ad platform sync",
    setupTime: "4–6 hours",
    pricing: "contact",
    tools: [
      { name: "Clay", domain: "clay.com" },
      { name: "Apollo", domain: "apollo.io" },
      { name: "Meta", domain: "meta.com" },
      { name: "LinkedIn", domain: "linkedin.com" },
    ],
    deliverables: [
      "ICP definition + scored contact lists (Tier 1/2/3)",
      "Custom lookalike audiences built for Meta and LinkedIn ads",
      "Semantic segment builder — find anyone matching a description",
      "Automated list refresh keeping audiences always current",
    ],
    outcome: "Always-fresh targeting lists for ads and outbound, updated automatically every week",
  },
  {
    id: "s6",
    slug: "pixel-intelligence",
    pillar: "SALES",
    name: "Pixel & Visitor Intelligence",
    desc: "Website pixel with company-level visitor identification, enrichment, and intent scoring",
    setupTime: "1–2 hours",
    pricing: "contact",
    isBeta: true,
    tools: [
      { name: "RB2B", domain: "rb2b.com" },
      { name: "Clay", domain: "clay.com" },
      { name: "Slack", domain: "slack.com" },
      { name: "HubSpot", domain: "hubspot.com" },
    ],
    deliverables: [
      "1-line pixel deployed on your site (no dev required)",
      "Company name, industry, headcount, LinkedIn URL on every visit",
      "Intent scoring — prioritize visitors who match your ICP",
      "Real-time Slack alerts + auto-add to CRM outreach sequence",
    ],
    outcome: "Real-time alerts when your target accounts visit — with full contact details ready to act on",
  },
  {
    id: "s7",
    slug: "inbound-orchestration",
    pillar: "SALES",
    name: "Inbound Lead Orchestration",
    desc: "End-to-end inbound pipeline from capture to enrichment to booking — fully automated",
    setupTime: "4–8 hours",
    pricing: "custom",
    tools: [
      { name: "HubSpot", domain: "hubspot.com" },
      { name: "Clay", domain: "clay.com" },
      { name: "Cal.com", domain: "cal.com" },
      { name: "Slack", domain: "slack.com" },
    ],
    deliverables: [
      "Form → Clay enrichment → CRM routing in under 2 minutes",
      "Lead scoring model (firmographic + behavioral signals)",
      "Auto-book high-intent leads directly to your calendar",
      "Slack alerts for every qualified lead with full context",
    ],
    outcome: "Every inbound lead enriched, scored, and routed to the right rep within 2 minutes — zero manual triage",
  },
  {
    id: "s8",
    slug: "lead-reactivation",
    pillar: "SALES",
    name: "Lead Reactivation System",
    desc: "AI-personalized database reactivation sequences for dormant leads and past clients",
    setupTime: "2–3 days",
    pricing: "custom",
    tools: [
      { name: "GoHighLevel", domain: "gohighlevel.com" },
      { name: "Instantly", domain: "instantly.ai" },
      { name: "OpenAI", domain: "openai.com" },
      { name: "Clay", domain: "clay.com" },
    ],
    deliverables: [
      "Database audit — segment by recency, value, and fit",
      "AI-personalized reactivation sequences (email + SMS + voice)",
      "Win-back offers and re-engagement trigger logic",
      "Pipeline report showing recovered revenue and attribution",
    ],
    outcome: "15–25% of dormant leads reactivated into active pipeline within 30 days of launch",
  },
  {
    id: "s9",
    slug: "linkedin-outbound",
    pillar: "MARKETING",
    name: "LinkedIn Outbound System",
    desc: "Signal-based LinkedIn pipeline from ICP connection to booked meeting",
    setupTime: "3–5 hours",
    pricing: "custom",
    tools: [
      { name: "LinkedIn", domain: "linkedin.com" },
      { name: "Clay", domain: "clay.com" },
      { name: "Apollo", domain: "apollo.io" },
      { name: "Instantly", domain: "instantly.ai" },
    ],
    deliverables: [
      "Profile optimization + content strategy (3 posts/week)",
      "ICP connection sequencing with personalized openers",
      "Signal monitoring — triggers when prospects engage with content",
      "Tiered outreach routing based on engagement score",
    ],
    outcome: "50+ qualified LinkedIn connections per week flowing into a scored, automated outbound pipeline",
  },
  {
    id: "s10",
    slug: "ai-content-engine",
    pillar: "MARKETING",
    name: "AI Content Engine",
    desc: "High-volume content pipeline where AI handles research and drafting, humans handle final polish",
    setupTime: "3–5 hours",
    pricing: "contact",
    tools: [
      { name: "OpenAI", domain: "openai.com" },
      { name: "Perplexity", domain: "perplexity.ai" },
      { name: "Notion", domain: "notion.so" },
      { name: "Surfer SEO", domain: "surferseo.com" },
    ],
    deliverables: [
      "Content calendar + keyword-mapped topic clusters",
      "AI drafting pipeline — full article drafts in Notion per brief",
      "Human review + distribution workflow (blog, LinkedIn, email)",
      "SEO scoring for every piece before publish",
    ],
    outcome: "4x more content output with half the team time — every piece optimized for Google and AI search",
  },
  {
    id: "s11",
    slug: "finance-automation",
    pillar: "FINANCE",
    name: "P&L Finance Automation",
    desc: "Track, control, and optimize company spending with AI-powered visibility and renewal management",
    setupTime: "4–6 hours",
    pricing: "contact",
    tools: [
      { name: "Ramp", domain: "ramp.com" },
      { name: "Airtable", domain: "airtable.com" },
      { name: "Notion", domain: "notion.so" },
      { name: "Stripe", domain: "stripe.com" },
    ],
    deliverables: [
      "Spend tracking automation with vendor categorization",
      "P&L dashboard with real-time budget vs. actuals",
      "Renewal alert system — 30/7/1 day notices before charges",
      "Monthly cost report with optimization recommendations",
    ],
    outcome: "Full financial visibility with automated reporting and proactive cost optimization — no manual spreadsheets",
  },
  {
    id: "s12",
    slug: "ai-tool-tracker",
    pillar: "OPERATIONS",
    name: "AI Tool Tracker (Trackr)",
    desc: "Evaluate, track, and optimize every AI tool in your stack with automated research and scoring",
    setupTime: "1–2 hours",
    pricing: "contact",
    tools: [
      { name: "Trackr", domain: "trytrackr.com" },
      { name: "Notion", domain: "notion.so" },
      { name: "Slack", domain: "slack.com" },
      { name: "Linear", domain: "linear.app" },
    ],
    deliverables: [
      "Full AI stack audit — every tool scored across 7 dimensions",
      "Spend tracking dashboard with ROI per tool",
      "Automated research on any new tool in 30 minutes",
      "Renewal calendar with Slack alerts before auto-renews",
    ],
    outcome: "One source of truth for your entire AI stack — with ROI tracking and automated renewal management",
  },
]

const PILLAR_STYLES: Record<Pillar, string> = {
  MARKETING: "text-red-700 bg-red-50 border-red-200",
  SALES: "text-red-700 bg-red-50 border-red-200",
  OPERATIONS: "text-red-700 bg-red-50 border-red-200",
  FINANCE: "text-red-700 bg-red-50 border-red-200",
}


function ServiceCard({ service }: { service: AIMSService }) {
  const { addItem, items } = useCart()
  const pricing = getPricing(service.slug)
  const hasTiers = !!pricing?.tiers?.length
  const [selectedTier, setSelectedTier] = useState(pricing?.tiers?.[0]?.id ?? "")
  const inCart = items.some((i) => i.serviceId === service.id)

  const handleAddToCart = () => {
    if (!pricing) return
    if (hasTiers && pricing.tiers) {
      const tier = pricing.tiers.find((t) => t.id === selectedTier) ?? pricing.tiers[0]
      addItem({
        serviceId: service.id,
        slug: service.slug,
        name: service.name,
        tierId: tier.id,
        tierName: tier.name,
        priceMonthly: tier.priceMonthly,
      })
    } else {
      addItem({
        serviceId: service.id,
        slug: service.slug,
        name: service.name,
        priceMonthly: pricing.priceMonthly!,
      })
    }
  }

  const displayPrice = () => {
    if (!pricing) return service.pricing === "from" && service.priceFrom ? `From ${service.priceFrom}` : service.pricing === "custom" ? "Custom pricing" : "Contact us"
    if (hasTiers && pricing.tiers) {
      const tier = pricing.tiers.find((t) => t.id === selectedTier) ?? pricing.tiers[0]
      return `$${tier.priceMonthly / 100}/mo`
    }
    return `$${pricing.priceMonthly! / 100}/mo`
  }

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden flex flex-col hover:shadow-md transition-shadow duration-200">
      {/* Card header */}
      <div className="px-5 pt-5 pb-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className={cn("text-xs font-semibold px-2 py-0.5 rounded-full border", PILLAR_STYLES[service.pillar])}>
              {service.pillar.charAt(0) + service.pillar.slice(1).toLowerCase()}
            </span>
            {service.isBeta && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full border border-gray-300 text-muted-foreground">BETA</span>
            )}
          </div>
          <span className="text-xs text-muted-foreground">{service.setupTime} setup</span>
        </div>

        <h3 className="text-lg font-bold text-foreground mb-1.5 leading-tight">{service.name}</h3>
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

      {/* Deliverables */}
      <div className="px-5 pb-4 flex-1">
        <ul className="space-y-2">
          {service.deliverables.slice(0, 3).map((d, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-foreground/80">
              <span className="text-gray-300 mt-0.5 flex-shrink-0">—</span>
              <span>{d}</span>
            </li>
          ))}
          {service.deliverables.length > 3 && (
            <li className="text-xs text-muted-foreground pl-4">+{service.deliverables.length - 3} more deliverables</li>
          )}
        </ul>
      </div>

      {/* Outcome box */}
      <div className="mx-5 mb-4 px-4 py-3 bg-muted border border-border rounded-xl">
        <div className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-1">Outcome</div>
        <p className="text-sm text-foreground/80 leading-snug">{service.outcome}</p>
      </div>

      {/* Tier selector (only for tiered services) */}
      {hasTiers && pricing?.tiers && (
        <div className="px-5 pb-3">
          <div className="flex gap-1.5 flex-wrap">
            {pricing.tiers.map((tier) => (
              <button
                key={tier.id}
                onClick={() => setSelectedTier(tier.id)}
                className={cn(
                  "px-3 py-1 rounded-lg text-xs font-semibold border transition-colors",
                  selectedTier === tier.id
                    ? "bg-gray-900 text-white border-gray-900"
                    : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
                )}
              >
                {tier.name} — ${tier.priceMonthly / 100}/mo
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Pricing + CTA */}
      <div className="px-5 pb-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-bold text-foreground">{displayPrice()}</span>
          <Link href={`/services/${service.slug}`} className="text-xs text-muted-foreground hover:text-[#DC2626] transition-colors">
            Learn more →
          </Link>
        </div>
        <button
          onClick={handleAddToCart}
          className={cn(
            "w-full flex items-center justify-center gap-2 py-3 text-sm font-semibold rounded-xl transition-colors",
            inCart
              ? "bg-green-50 text-green-700 border border-green-200 hover:bg-green-100"
              : "bg-gray-900 text-white hover:bg-gray-800"
          )}
        >
          {inCart ? (
            <><Check className="w-4 h-4" /> Added to Cart</>
          ) : (
            <><ShoppingCart className="w-4 h-4" /> Add to Cart</>
          )}
        </button>
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
    return SERVICES.filter((s) => {
      const matchPillar = pillar === "ALL" || s.pillar === pillar
      const matchSearch =
        !search ||
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.desc.toLowerCase().includes(search.toLowerCase())
      return matchPillar && matchSearch
    })
  }, [pillar, search])

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border">
        <div className="max-w-6xl mx-auto px-4 py-12">
          <h1 className="text-4xl font-bold text-foreground">AI Services Marketplace</h1>
          <p className="mt-3 text-lg text-muted-foreground">Browse every AIMS service. Filter by pillar. Start with what matters most.</p>

          {/* Search + filters */}
          <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search services..."
                className="w-full pl-10 pr-4 py-2.5 border border-border rounded-xl bg-card text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[#DC2626]/20 focus:border-[#DC2626]"
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
                      ? "bg-[#DC2626] text-white border-[#DC2626]"
                      : "bg-card text-muted-foreground border-border hover:border-gray-400 hover:text-foreground"
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
          <motion.div layout className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((service) => (
              <motion.div
                key={service.id}
                layout
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
