/**
 * Plan + Credit-Pack registry — single source of truth.
 *
 * - Plans (3) are recurring-monthly Products of type="tier". Buying one
 *   sets User.planSlug, grants the listed entitlements, and credits the
 *   monthly grant amount. The Stripe webhook keeps everything in sync.
 *
 * - Credit packs are one-time Products of type="addon" that grant a
 *   specific credit amount on `checkout.session.completed`. No
 *   entitlements, no recurring charge.
 *
 * Editing this file:
 *   1. Update the constants below.
 *   2. Run `tsx scripts/setup-plans.ts` to sync to Stripe + Product table.
 *   3. New users immediately see the updated catalog on /portal/marketplace.
 *
 * Pricing decisions:
 *   - Free is the default for every new user — gives them the dashboard,
 *     quests, billing, settings, support, marketplace browsing.
 *   - Pro is the productivity bundle — scripts, content, invoices,
 *     follow-up rules, calculator, playbooks, referrals.
 *   - Operator is the full agency stack — adds CRM, Lead Scout, Audits,
 *     Branding, Domain, Revenue dashboard.
 *   - Credit packs are one-time top-ups for users who burn through the
 *     monthly grant on enrichment / Lead Scout searches.
 */

/**
 * Feature entitlement keys — one per gated portal feature.
 *
 * Convention: `feature_<slug>`. These get stored as Entitlement rows on
 * purchase, and `EntitlementGate` server-checks them on each gated
 * route. Keep stable — renaming requires a migration.
 */
export const FEATURE_ENTITLEMENTS = {
  CRM: "feature_crm",
  LEAD_SCOUT: "feature_lead_scout",
  AUDITS: "feature_audits",
  INVOICES: "feature_invoices",
  SCRIPTS: "feature_scripts",
  CONTENT: "feature_content",
  PLAYBOOKS: "feature_playbooks",
  CALCULATOR: "feature_calculator",
  BRANDING: "feature_branding",
  DOMAIN: "feature_domain",
  FOLLOW_UP_RULES: "feature_follow_up_rules",
  REVENUE: "feature_revenue",
  REFERRALS: "feature_referrals",
} as const

export type FeatureEntitlement =
  (typeof FEATURE_ENTITLEMENTS)[keyof typeof FEATURE_ENTITLEMENTS]

// All gated features — handy for "grant everything" admin grant + grandfather.
export const ALL_FEATURE_ENTITLEMENTS: FeatureEntitlement[] = Object.values(
  FEATURE_ENTITLEMENTS,
)

// ---------------------------------------------------------------
// PLAN DEFINITIONS
// ---------------------------------------------------------------

export interface PlanDef {
  /** Stable slug used as Product.slug AND User.planSlug. Don't rename. */
  slug: "free" | "pro" | "operator"
  name: string
  /** One-liner shown on marketplace card. */
  tagline: string
  /** Full marketing copy for the plan landing / paywall. */
  description: string
  /** Monthly USD price. 0 = free. */
  priceMonthly: number
  /** Credits granted at the start of each billing cycle. */
  creditsPerMonth: number
  /** Entitlement keys this plan grants. */
  entitlements: FeatureEntitlement[]
  /** Bullet-point feature highlights for the marketplace card. */
  highlights: string[]
  /** Optional video embed URL — Vimeo / Loom / YouTube / Screen Studio. */
  marketingVideoUrl: string | null
  /** Display order on /portal/marketplace (lower = leftmost). */
  sortOrder: number
  /** UI accent — controls badge + CTA color. */
  badge?: "Most popular" | "Best value" | null
}

export const PLANS: PlanDef[] = [
  {
    slug: "free",
    name: "Free",
    tagline: "Get a feel for the platform.",
    description:
      "Dashboard, getting started flow, quests, support, and the marketplace. Browse what's available, complete a few quests for bonus credits, and upgrade when you're ready to ship.",
    priceMonthly: 0,
    creditsPerMonth: 100,
    entitlements: [],
    highlights: [
      "Full dashboard + onboarding flow",
      "100 enrichment credits per month",
      "Quests, badges, and XP",
      "Support + community access",
      "Browse the full marketplace",
    ],
    marketingVideoUrl: null,
    sortOrder: 0,
    badge: null,
  },
  {
    slug: "pro",
    name: "Pro",
    tagline: "Everything you need to run AI-assisted client work.",
    description:
      "AI Scripts, Content Engine, Invoices, Follow-up Rules, Pricing Calculator, Playbooks, and Referrals. The Pro plan unlocks the daily-driver toolkit so you can write outreach, generate content, send invoices, and follow up on autopilot.",
    priceMonthly: 97,
    creditsPerMonth: 1000,
    entitlements: [
      FEATURE_ENTITLEMENTS.SCRIPTS,
      FEATURE_ENTITLEMENTS.CONTENT,
      FEATURE_ENTITLEMENTS.INVOICES,
      FEATURE_ENTITLEMENTS.FOLLOW_UP_RULES,
      FEATURE_ENTITLEMENTS.CALCULATOR,
      FEATURE_ENTITLEMENTS.PLAYBOOKS,
      FEATURE_ENTITLEMENTS.REFERRALS,
    ],
    highlights: [
      "Everything in Free",
      "1,000 enrichment credits per month",
      "AI Scripts + Content Engine",
      "Invoices + Follow-up Rules",
      "Pricing Calculator + Playbooks",
      "Referral commission tracking",
    ],
    marketingVideoUrl: null,
    sortOrder: 1,
    badge: "Most popular",
  },
  {
    slug: "operator",
    name: "Operator",
    tagline: "Full white-label agency stack.",
    description:
      "Everything in Pro plus the heavy artillery — Client CRM, Lead Scout, AI Audit, Revenue dashboard, custom Branding, and your own Domain. The full operator workflow: prospect, audit, propose, close, deliver, white-label, repeat.",
    priceMonthly: 297,
    creditsPerMonth: 5000,
    entitlements: ALL_FEATURE_ENTITLEMENTS,
    highlights: [
      "Everything in Pro",
      "5,000 enrichment credits per month",
      "Client CRM + Lead Scout",
      "AI Audit (branded intake quizzes)",
      "Revenue dashboard",
      "Custom branding + domain (white-label)",
    ],
    marketingVideoUrl: null,
    sortOrder: 2,
    badge: "Best value",
  },
]

const PLAN_BY_SLUG: Record<string, PlanDef> = Object.fromEntries(
  PLANS.map((p) => [p.slug, p]),
)

export function getPlan(slug: string): PlanDef | null {
  return PLAN_BY_SLUG[slug] ?? null
}

/** The plan a user lands on if they have nothing else. */
export const DEFAULT_PLAN_SLUG = "free"

/**
 * Cheapest plan that includes a given entitlement, used by the paywall
 * so we can prompt "upgrade to Pro for $97/mo to unlock Scripts" with
 * the actual minimum-required tier.
 */
export function cheapestPlanFor(
  entitlement: FeatureEntitlement,
): PlanDef | null {
  const candidates = PLANS.filter((p) => p.entitlements.includes(entitlement))
  if (candidates.length === 0) return null
  return candidates.reduce((min, p) =>
    p.priceMonthly < min.priceMonthly ? p : min,
  )
}

// ---------------------------------------------------------------
// CREDIT PACKS (one-time top-ups)
// ---------------------------------------------------------------

export interface CreditPackDef {
  slug: string
  name: string
  /** Credits granted on checkout.session.completed. */
  credits: number
  /** USD price. */
  price: number
  /** Optional bonus copy — e.g. "Save 15%" badge. */
  badge?: string | null
  sortOrder: number
}

export const CREDIT_PACKS: CreditPackDef[] = [
  {
    slug: "credits-500",
    name: "500 credits",
    credits: 500,
    price: 25,
    badge: null,
    sortOrder: 0,
  },
  {
    slug: "credits-2000",
    name: "2,000 credits",
    credits: 2000,
    price: 79,
    badge: "Save 21%",
    sortOrder: 1,
  },
  {
    slug: "credits-5000",
    name: "5,000 credits",
    credits: 5000,
    price: 169,
    badge: "Save 32%",
    sortOrder: 2,
  },
]

const CREDIT_PACK_BY_SLUG: Record<string, CreditPackDef> = Object.fromEntries(
  CREDIT_PACKS.map((p) => [p.slug, p]),
)

export function getCreditPack(slug: string): CreditPackDef | null {
  return CREDIT_PACK_BY_SLUG[slug] ?? null
}

/**
 * Plan-aware feature label lookup. Maps an entitlement key to a friendly
 * feature name used in the paywall headline. Keep in lockstep with the
 * <FeatureGate> calls in each layout.tsx.
 */
export const FEATURE_LABELS: Record<FeatureEntitlement, string> = {
  feature_crm: "Client CRM",
  feature_lead_scout: "Lead Scout",
  feature_audits: "AI Audits",
  feature_invoices: "Invoices",
  feature_scripts: "AI Scripts",
  feature_content: "Content Engine",
  feature_playbooks: "Playbooks",
  feature_calculator: "Pricing Calculator",
  feature_branding: "Branding",
  feature_domain: "Custom Domain",
  feature_follow_up_rules: "Follow-up Rules",
  feature_revenue: "Revenue Dashboard",
  feature_referrals: "Referrals",
}
