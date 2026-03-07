export interface ServiceTier {
  id: string
  name: string
  priceMonthly: number // cents
}

export interface ServicePricing {
  serviceId: string
  slug: string
  name: string
  tiers?: ServiceTier[]
  priceMonthly?: number // cents (if no tiers)
  interval: "month"
}

export const SERVICES_PRICING: ServicePricing[] = [
  {
    serviceId: "s1",
    slug: "website-crm-chatbot",
    name: "Website + CRM + Chatbot Bundle",
    interval: "month",
    tiers: [
      { id: "starter", name: "Starter", priceMonthly: 9700 },
      { id: "growth",  name: "Growth",  priceMonthly: 19700 },
      { id: "pro",     name: "Pro",     priceMonthly: 29700 },
      { id: "elite",   name: "Elite",   priceMonthly: 39700 },
    ],
  },
  {
    serviceId: "s2",
    slug: "cold-outbound",
    name: "Cold Outbound Engine",
    interval: "month",
    priceMonthly: 99700,
  },
  {
    serviceId: "s3",
    slug: "voice-agents",
    name: "AI Voice Agent Platform",
    interval: "month",
    priceMonthly: 79700,
  },
  {
    serviceId: "s4",
    slug: "seo-aeo",
    name: "SEO & AEO Automation",
    interval: "month",
    priceMonthly: 49700,
  },
  {
    serviceId: "s5",
    slug: "audience-targeting",
    name: "Audience Targeting & Segments",
    interval: "month",
    priceMonthly: 39700,
  },
  {
    serviceId: "s6",
    slug: "pixel-intelligence",
    name: "Pixel & Visitor Intelligence",
    interval: "month",
    priceMonthly: 19700,
  },
  {
    serviceId: "s7",
    slug: "inbound-orchestration",
    name: "Inbound Lead Orchestration",
    interval: "month",
    priceMonthly: 69700,
  },
  {
    serviceId: "s8",
    slug: "lead-reactivation",
    name: "Lead Reactivation System",
    interval: "month",
    priceMonthly: 99700,
  },
  {
    serviceId: "s9",
    slug: "linkedin-outbound",
    name: "LinkedIn Outbound System",
    interval: "month",
    priceMonthly: 59700,
  },
  {
    serviceId: "s10",
    slug: "ai-content-engine",
    name: "AI Content Engine",
    interval: "month",
    priceMonthly: 49700,
  },
  {
    serviceId: "s11",
    slug: "finance-automation",
    name: "P&L Finance Automation",
    interval: "month",
    priceMonthly: 100000,
  },
  {
    serviceId: "s12",
    slug: "ai-tool-tracker",
    name: "AI Tool Tracker (Trackr)",
    interval: "month",
    priceMonthly: 19700,
  },
]

export function getPricing(slug: string): ServicePricing | undefined {
  return SERVICES_PRICING.find((s) => s.slug === slug)
}

export function formatPrice(cents: number): string {
  return `$${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}/mo`
}
