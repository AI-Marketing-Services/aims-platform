import type { LeadMagnetType } from "@prisma/client"

/**
 * Canonical registry of lead-magnet tools that operators can host on
 * their own subdomain or custom domain. Drives:
 *
 * - the tenant-aware route `/sites/[slug]/tools/[tool]`
 * - the operator-side dashboard at `/portal/lead-magnets`
 * - the share-URL builder used in operator emails and onboarding
 *
 * Adding a new tool? Append an entry here AND make sure the matching
 * client component exists at
 * `src/app/(marketing)/tools/<slug>/<ClientComponent>.tsx`.
 */
export interface LeadMagnetDefinition {
  /** URL slug — must match the directory under /tools/ */
  slug: string
  /** Maps to the LeadMagnetType enum so submissions tag the right type. */
  submissionType: LeadMagnetType
  /** Human-readable name for dashboards. */
  name: string
  /** Short marketing line. */
  tagline: string
  /** Lucide icon name (resolved on the client to keep this file server-safe). */
  iconName: string
  /** Approximate completion time for end users — shown on dashboard cards. */
  estimatedMinutes: number
  /** Whether the tool generates a branded PDF deliverable on completion. */
  hasBrandedPdf: boolean
}

export const LEAD_MAGNETS: LeadMagnetDefinition[] = [
  {
    slug: "ai-readiness-quiz",
    submissionType: "AI_READINESS_QUIZ",
    name: "AI Readiness Quiz",
    tagline: "Score a business across 5 AI readiness pillars in under 3 minutes.",
    iconName: "Zap",
    estimatedMinutes: 3,
    hasBrandedPdf: false,
  },
  {
    slug: "roi-calculator",
    submissionType: "ROI_CALCULATOR",
    name: "ROI Calculator",
    tagline: "Calculate AI automation ROI based on team size and close rate.",
    iconName: "BarChart3",
    estimatedMinutes: 1,
    hasBrandedPdf: false,
  },
  {
    slug: "website-audit",
    submissionType: "WEBSITE_AUDIT",
    name: "Website Audit",
    tagline:
      "Full AI-powered audit — SEO, AEO, conversion, and mobile performance.",
    iconName: "Globe",
    estimatedMinutes: 2,
    hasBrandedPdf: true,
  },
  {
    slug: "executive-ops-audit",
    submissionType: "EXECUTIVE_OPS_AUDIT",
    name: "Executive Ops Audit",
    tagline:
      "5–7 minute diagnostic that maps operational bottlenecks to AI fixes.",
    iconName: "TrendingUp",
    estimatedMinutes: 6,
    hasBrandedPdf: true,
  },
  {
    slug: "business-credit-score",
    submissionType: "BUSINESS_CREDIT_SCORE",
    name: "Business Credit Score",
    tagline:
      "Personalized action plan to build, repair, or leverage business credit.",
    iconName: "Briefcase",
    estimatedMinutes: 4,
    hasBrandedPdf: false,
  },
  {
    slug: "segment-explorer",
    submissionType: "SEGMENT_EXPLORER",
    name: "Segment Explorer",
    tagline:
      "Sharpen ICP across industry, company size, and pain-point dimensions.",
    iconName: "Search",
    estimatedMinutes: 4,
    hasBrandedPdf: false,
  },
  {
    slug: "stack-configurator",
    submissionType: "STACK_CONFIGURATOR",
    name: "Stack Configurator",
    tagline:
      "Personalized AI tool stack based on business model and growth priorities.",
    iconName: "Layers",
    estimatedMinutes: 4,
    hasBrandedPdf: false,
  },
]

const BY_SLUG = Object.fromEntries(LEAD_MAGNETS.map((m) => [m.slug, m]))

export function getLeadMagnet(slug: string): LeadMagnetDefinition | null {
  return BY_SLUG[slug] ?? null
}

/**
 * Build a public share URL for a given operator + tool. Prefers a
 * verified custom domain when available, falls back to the operator's
 * subdomain, and finally to the platform tool URL with `?op=<slug>`.
 */
export function buildShareUrl(
  tool: LeadMagnetDefinition,
  operator: {
    subdomain: string | null
    customDomain: string | null
    customDomainVerified: boolean
  } | null,
): string {
  const path = `/tools/${tool.slug}`
  // Verified custom domain wins — it's the cleanest URL the operator
  // can paste into emails or LinkedIn.
  if (operator?.customDomain && operator.customDomainVerified) {
    return `https://${operator.customDomain}${path}`
  }
  // Otherwise serve the operator subdomain on the platform apex.
  if (operator?.subdomain) {
    return `https://${operator.subdomain}.aioperatorcollective.com${path}`
  }
  // No operator at all → bare platform URL. (No apex `?op=` fallback —
  // when there's no subdomain there's nothing to attribute to.)
  return `https://www.aioperatorcollective.com${path}`
}

/**
 * Industry-specific marketplace SKUs — concept lead magnets we list now
 * for operators to pre-order. Once an operator buys / unlocks one, we
 * provision an additional LeadMagnetDefinition for them and surface it
 * on their `/portal/lead-magnets` dashboard.
 *
 * Phase 1 ships them as "coming soon" cards so we can gauge demand
 * before building each industry-specific funnel.
 */
export interface MarketplaceLeadMagnetSku {
  slug: string
  name: string
  industry: string
  tagline: string
  description: string
  /** One-time unlock price in USD. */
  price: number
  /** Estimated ship date for the actual asset. */
  expectedShip: string
  /** Lucide icon name. */
  iconName: string
}

export const MARKETPLACE_LEAD_MAGNETS: MarketplaceLeadMagnetSku[] = [
  {
    slug: "hvac-lead-magnet",
    name: "HVAC Audit + Lead Magnet",
    industry: "HVAC & Home Services",
    tagline:
      "Branded HVAC website + GMB audit funnel — feeds directly into your CRM.",
    description:
      "A 9-question diagnostic that scores HVAC contractors on review velocity, GMB optimization, response time, and lead capture. Generates a branded PDF you send back as the cold-outreach opener.",
    price: 199,
    expectedShip: "2026 Q3",
    iconName: "Wrench",
  },
  {
    slug: "dental-practice-audit",
    name: "Dental Practice Growth Audit",
    industry: "Dental & Aesthetic",
    tagline: "Patient-acquisition + retention diagnostic for dental practices.",
    description:
      "Audits new-patient flow, recall systems, online reviews, and chair utilization. Built specifically for general + cosmetic dentistry. Pairs with a 'fix-it' proposal you can sell as a 90-day engagement.",
    price: 199,
    expectedShip: "2026 Q3",
    iconName: "Sparkle",
  },
  {
    slug: "real-estate-lead-magnet",
    name: "Real Estate Brokerage Audit",
    industry: "Real Estate",
    tagline:
      "Pipeline + agent-productivity audit for residential + commercial brokers.",
    description:
      "Scores agent productivity, MLS-to-CRM data flow, lead nurture, and listing-presentation tooling. Designed to open the conversation with broker-owners running 10–100+ agents.",
    price: 249,
    expectedShip: "2026 Q4",
    iconName: "Home",
  },
  {
    slug: "home-services-audit",
    name: "Home Services Growth Audit",
    industry: "Plumbing, Electrical, Roofing",
    tagline:
      "Truck-roll → revenue diagnostic for high-ticket residential trades.",
    description:
      "Audits dispatch, technician utilization, average ticket, financing-attach rate, and review velocity. The cold-call opener that gets owners to take a meeting.",
    price: 199,
    expectedShip: "2026 Q4",
    iconName: "Hammer",
  },
  {
    slug: "restaurant-hospitality-audit",
    name: "Restaurant & Hospitality Audit",
    industry: "Restaurants, Cafes, Hotels",
    tagline:
      "Online presence, reservations, and reputation audit for hospitality operators.",
    description:
      "Scores Google + Yelp presence, reservation funnel, online ordering hygiene, and review-response cadence. Built for multi-location independents and small chains.",
    price: 149,
    expectedShip: "2026 Q4",
    iconName: "UtensilsCrossed",
  },
]
