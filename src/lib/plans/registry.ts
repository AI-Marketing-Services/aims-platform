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
  // Phase-2 features (proposals already exists nested in CRM; surfacing it as
  // a top-level entitlement so we can paywall the index page consistently
  // with the others).
  PROPOSALS: "feature_proposals",
  DEAL_ASSISTANT: "feature_deal_assistant",
  TEMPLATES: "feature_templates",
  SEQUENCES: "feature_sequences",
  CLIENT_UPDATES: "feature_client_updates",
  RECORDINGS: "feature_recordings",
  BOOKING: "feature_booking",
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
      "AI Scripts, Content Engine, Invoices, Proposals, Deal Assistant, Templates, Email Sequences, Follow-up Rules, Pricing Calculator, Playbooks, and Referrals. The Pro plan unlocks the daily-driver toolkit so you can write outreach, run sequences, generate content, send invoices, and follow up on autopilot.",
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
      FEATURE_ENTITLEMENTS.PROPOSALS,
      FEATURE_ENTITLEMENTS.DEAL_ASSISTANT,
      FEATURE_ENTITLEMENTS.TEMPLATES,
      FEATURE_ENTITLEMENTS.SEQUENCES,
    ],
    highlights: [
      "Everything in Free",
      "1,000 enrichment credits per month",
      "AI Scripts + Content Engine + Templates",
      "Email Sequences + Follow-up Rules",
      "Proposals + Deal Assistant",
      "Invoices + Pricing Calculator",
      "Playbooks + Referral tracking",
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
      "Everything in Pro plus the agency stack — Client CRM, Lead Scout, AI Audit, Revenue dashboard, Client Weekly Updates, Discovery Call Recorder, Booking Page, custom Branding, and your own Domain. The full operator workflow: prospect, audit, book, propose, record, close, deliver, white-label, repeat.",
    priceMonthly: 297,
    creditsPerMonth: 5000,
    entitlements: ALL_FEATURE_ENTITLEMENTS,
    highlights: [
      "Everything in Pro",
      "5,000 enrichment credits per month",
      "Client CRM + Lead Scout + Audits",
      "Discovery Call Recorder + AI summaries",
      "Branded Booking Page",
      "Client weekly update generator",
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
  feature_proposals: "Proposals",
  feature_deal_assistant: "Deal Assistant",
  feature_templates: "Templates Library",
  feature_sequences: "Email Sequences",
  feature_client_updates: "Client Updates",
  feature_recordings: "Discovery Recorder",
  feature_booking: "Booking Page",
}

// ---------------------------------------------------------------
// FEATURE CATALOG — marketing-grade copy for each gated feature.
// Used by /portal/marketplace + every paywall overlay.
// ---------------------------------------------------------------

export interface FeatureDef {
  /** Stable entitlement key. */
  key: FeatureEntitlement
  /** Display name. */
  name: string
  /** lucide icon name (rendered via dynamic <Icon /> lookup). */
  iconName: string
  /** One-liner shown on marketplace card under the title. */
  tagline: string
  /** Full description used in the paywall overlay + marketplace details. */
  description: string
  /** Bullet-point use cases / capabilities — the "what you get" copy. */
  highlights: string[]
  /** Direct link into the feature once unlocked (deep-link from card). */
  href: string
  /** Display order on the marketplace features grid. */
  sortOrder: number
}

export const FEATURE_CATALOG: FeatureDef[] = [
  {
    key: FEATURE_ENTITLEMENTS.CRM,
    name: "Client CRM",
    iconName: "Briefcase",
    tagline: "Pipeline, contacts, and deal management for every client.",
    description:
      "A purpose-built CRM for AI operators. Track every prospect from first touch to closed-won, manage contacts, log activity, and watch deals move through your pipeline. Built around the operator workflow — no Salesforce sprawl, no plug-ins to install.",
    highlights: [
      "Drag-and-drop kanban pipeline (Prospect → Discovery → Proposal → Won)",
      "Contact + company enrichment with one click",
      "Activity feed with email + meeting history",
      "Custom stages + win-rate analytics",
      "Bulk import from CSV or LinkedIn export",
    ],
    href: "/portal/crm",
    sortOrder: 0,
  },
  {
    key: FEATURE_ENTITLEMENTS.LEAD_SCOUT,
    name: "Lead Scout",
    iconName: "MapPin",
    tagline: "Find prospects on autopilot — filter, enrich, push to CRM.",
    description:
      "Tell Lead Scout your ICP — industry, geography, company size, tech stack — and it surfaces qualified prospects with verified emails, phone numbers, and signals worth a call. Push the winners straight into your CRM with one click.",
    highlights: [
      "Search 200M+ companies by ICP filters",
      "Verified emails + LinkedIn URLs out of the box",
      "Buying-signal alerts (hiring, funding, tech changes)",
      "Map-based discovery for local services",
      "Bulk-export to CRM with deduplication",
    ],
    href: "/portal/crm/scout",
    sortOrder: 1,
  },
  {
    key: FEATURE_ENTITLEMENTS.AUDITS,
    name: "AI Audits",
    iconName: "ClipboardCheck",
    tagline: "Branded intake quizzes that capture leads + score them with AI.",
    description:
      "Spin up a fully-branded intake quiz in minutes. Prospects answer 9 questions, your AI grades their fit, and you get a buyer summary in your inbox before the call. The single highest-converting top-of-funnel asset for AI operators.",
    highlights: [
      "9-question template — clone, customize, share",
      "AI-generated buyer summary on every submission",
      "Branded landing page (your logo, colors, copy)",
      "One-click convert quiz responses to CRM deals",
      "Embed on your site or run on a subdomain",
    ],
    href: "/portal/audits",
    sortOrder: 2,
  },
  {
    key: FEATURE_ENTITLEMENTS.INVOICES,
    name: "Invoices",
    iconName: "FileText",
    tagline: "Send branded invoices, track payment, get paid faster.",
    description:
      "Stop bouncing between Stripe, QuickBooks, and Google Docs. Build a professional invoice in 30 seconds, send it from your domain, and let your client pay with a card — your dollars land in your bank, not a marketplace's.",
    highlights: [
      "Branded invoice PDFs with your logo",
      "One-click 'pay now' Stripe checkout link",
      "Automatic late-payment reminders",
      "Recurring monthly retainers + usage-based add-ons",
      "Itemized line items with tax + discount support",
    ],
    href: "/portal/invoices",
    sortOrder: 3,
  },
  {
    key: FEATURE_ENTITLEMENTS.SCRIPTS,
    name: "AI Scripts",
    iconName: "FileCode2",
    tagline: "Generate cold emails, discovery scripts, and follow-ups in seconds.",
    description:
      "Stop staring at blank pages. AI Scripts writes you cold emails, discovery-call openers, follow-up nudges, LinkedIn DMs, and proposal narratives — tuned to YOUR ICP, your voice, and the exact deal stage you're working.",
    highlights: [
      "5 script types: cold email, discovery, follow-up, LinkedIn DM, proposal",
      "Personalized to the contact (auto-pulls company context)",
      "Save your favorites + iterate with one click",
      "Tone presets (professional, founder-led, direct)",
      "Export to your email client or copy-paste ready",
    ],
    href: "/portal/scripts",
    sortOrder: 4,
  },
  {
    key: FEATURE_ENTITLEMENTS.CONTENT,
    name: "Content Engine",
    iconName: "PenLine",
    tagline: "Spin up branded social posts, blog drafts, and email blasts.",
    description:
      "One prompt → an entire week of content. The Content Engine writes social posts, blog drafts, and newsletter blasts in your voice, with your CTA, ready to publish or queue. Stop hiring content writers — start shipping.",
    highlights: [
      "LinkedIn posts, Twitter threads, blog articles, email newsletters",
      "Trained on your existing content for consistent voice",
      "Generate a 7-day content calendar in one click",
      "Inline editing + AI-assisted rewrites",
      "Schedule directly to social or export drafts",
    ],
    href: "/portal/content",
    sortOrder: 5,
  },
  {
    key: FEATURE_ENTITLEMENTS.PLAYBOOKS,
    name: "Playbooks",
    iconName: "BookOpen",
    tagline: "Step-by-step workflows for every service track.",
    description:
      "The complete operator's library — proven workflows for every service track in the Collective. Each playbook is a checklist, a script, a doc template, and an asset bundle. Stop reinventing the process every client engagement.",
    highlights: [
      "Workflows for cold outbound, audits, voice agents, content, and more",
      "Bookmark + checklist your way through delivery",
      "Asset library: proposals, contracts, onboarding emails",
      "Updated monthly as the playbook evolves",
      "Share your own playbooks with the community",
    ],
    href: "/portal/playbooks",
    sortOrder: 6,
  },
  {
    key: FEATURE_ENTITLEMENTS.CALCULATOR,
    name: "Pricing Calculator",
    iconName: "Calculator",
    tagline: "Build proposals fast with instant scoped pricing.",
    description:
      "Input the scope, the calculator outputs your tiered pricing — Discovery, Build, Retainer — with margin baked in. Use it on a discovery call to quote on the spot, then export the line items straight into a proposal or invoice.",
    highlights: [
      "Pre-loaded with operator-tested service margins",
      "Tiered pricing (Lite / Standard / Premium)",
      "One-click export to invoice or proposal",
      "Adjust hourly rate, retainer length, scope multipliers",
      "Save quote templates for repeatable services",
    ],
    href: "/portal/calculator",
    sortOrder: 7,
  },
  {
    key: FEATURE_ENTITLEMENTS.BRANDING,
    name: "Custom Branding",
    iconName: "Sparkles",
    tagline: "White-label the entire portal under your brand.",
    description:
      "Upload your logo, set your brand colors, customize copy. Every client-facing touchpoint — audits, proposals, the portal itself — runs as YOUR brand instead of AIMS. Run an agency without ever mentioning the platform.",
    highlights: [
      "Logo + favicon + brand color palette",
      "Custom typography",
      "Replace 'AIMS' with your agency name everywhere",
      "Branded email templates (invoices, audit notifications)",
      "Branded login + sign-up pages",
    ],
    href: "/reseller/settings/branding",
    sortOrder: 8,
  },
  {
    key: FEATURE_ENTITLEMENTS.DOMAIN,
    name: "Custom Domain",
    iconName: "Globe",
    tagline: "Run the portal under app.youragency.com.",
    description:
      "Point a CNAME at your subdomain and the entire client portal runs under your domain — `app.youragency.com`, `portal.client.com`, anywhere you want. Zero AIMS branding in the URL bar, full SSL, two-minute DNS setup.",
    highlights: [
      "Subdomain or apex domain support",
      "Automatic SSL certificate provisioning",
      "DNS-verified live availability check",
      "Multiple domains per account (one per client tier)",
      "Per-domain branding overrides",
    ],
    href: "/reseller/settings/domain",
    sortOrder: 9,
  },
  {
    key: FEATURE_ENTITLEMENTS.FOLLOW_UP_RULES,
    name: "Follow-up Rules",
    iconName: "Bell",
    tagline: "Auto-nudge stale deals — let the system handle the chase.",
    description:
      "Set a rule: 'If a deal sits in Proposal Sent for 5 days, send the follow-up.' Then forget it. Follow-up Rules picks up the slack on every deal you'd otherwise let rot — and books meetings while you sleep.",
    highlights: [
      "Stage-triggered automation (any pipeline stage → action)",
      "Custom message templates per rule",
      "Time-based triggers (X days stale)",
      "Pause / resume per deal",
      "Activity log for every triggered nudge",
    ],
    href: "/portal/follow-up-rules",
    sortOrder: 10,
  },
  {
    key: FEATURE_ENTITLEMENTS.REVENUE,
    name: "Revenue Dashboard",
    iconName: "TrendingUp",
    tagline: "Track MRR, paid invoices, and outstanding balance.",
    description:
      "The CFO view of your agency — MRR, ARR, paid invoices, outstanding balance, cash-collected, and per-client lifetime value, all in one dashboard. Know exactly where you stand without exporting CSVs from Stripe.",
    highlights: [
      "MRR + ARR + churn metrics",
      "Outstanding invoice tracker with overdue alerts",
      "Per-client revenue + lifetime value",
      "Monthly + quarterly P&L view",
      "Export to CSV for accounting",
    ],
    href: "/portal/revenue",
    sortOrder: 11,
  },
  {
    key: FEATURE_ENTITLEMENTS.REFERRALS,
    name: "Referrals",
    iconName: "Users",
    tagline: "Earn 20% commission on every operator you bring in.",
    description:
      "Built-in affiliate program. Share your unique link, sign people up, and earn 20% recurring commission for the lifetime of every customer you refer. Real-time payout dashboard, automated tracking, monthly Stripe payouts.",
    highlights: [
      "Unique referral link + custom landing page",
      "20% recurring commission (lifetime, not just first month)",
      "Real-time click + signup + commission tracking",
      "Automated monthly Stripe Connect payouts",
      "Branded co-marketing assets to share",
    ],
    href: "/portal/referrals",
    sortOrder: 12,
  },
  {
    key: FEATURE_ENTITLEMENTS.PROPOSALS,
    name: "Proposals",
    iconName: "FileSignature",
    tagline: "Branded proposal builder with shareable links + e-signatures.",
    description:
      "Turn any deal into a branded proposal in minutes. Pull in scope from the calculator, line-item pricing from your templates, and send a public share link to your prospect. They review, accept, and sign — and the deal moves itself to Closed-Won. No more bouncing between Pandadoc and Google Docs.",
    highlights: [
      "Branded cover, scope, timeline, pricing, terms",
      "Public share link with view tracking",
      "Inline accept / reject / e-sign flow",
      "Auto-converts to invoice on acceptance",
      "Save your proposal layouts as templates",
    ],
    href: "/portal/proposals",
    sortOrder: 13,
  },
  {
    key: FEATURE_ENTITLEMENTS.DEAL_ASSISTANT,
    name: "Deal Assistant",
    iconName: "Bot",
    tagline: "An AI co-pilot inside every deal. Knows your pipeline.",
    description:
      "On every deal in your CRM, the Deal Assistant has full context — company, contact, audit response, proposal status, last touch. Ask it 'what should I send next?', 'score this deal', or 'draft the follow-up' and it answers using your data, your tone, your templates.",
    highlights: [
      "Context-aware AI sidebar on every deal page",
      "Drafts follow-ups using your CRM history",
      "Scores deals 1-10 with reasoning",
      "Suggests the next best action by stage",
      "Powered by Claude — fast, no setup needed",
    ],
    href: "/portal/deal-assistant",
    sortOrder: 14,
  },
  {
    key: FEATURE_ENTITLEMENTS.TEMPLATES,
    name: "Templates Library",
    iconName: "Library",
    tagline: "Save once, reuse forever — emails, proposals, scripts, content.",
    description:
      "Every artifact you build can be saved as a template. Email sequences, proposal sections, script openers, content drafts, follow-up notes. Curated public templates from the Collective plus your own private library. Variables auto-merge contact + company data on insert.",
    highlights: [
      "Universal template library across every feature",
      "Public + private templates with sharing controls",
      "{{contact.firstName}} variable merging",
      "One-click 'use template' on every artifact",
      "Curated starter pack from the Collective",
    ],
    href: "/portal/templates",
    sortOrder: 15,
  },
  {
    key: FEATURE_ENTITLEMENTS.SEQUENCES,
    name: "Email Sequences",
    iconName: "Send",
    tagline: "Multi-step cold outreach — drip prospects until they reply.",
    description:
      "Build a 5-step sequence once, run it across every lead from Lead Scout. Drips automatically, pauses on reply, syncs replies into the CRM as inbound activity. The bridge between 'I have 200 leads' and 'I have 20 booked calls'.",
    highlights: [
      "Multi-step sequences with delays + conditions",
      "Auto-pauses on reply (no awkward double-tap)",
      "Sends from your domain via Resend",
      "Per-step open/click/reply analytics",
      "Bulk-enroll CRM contacts in one click",
    ],
    href: "/portal/sequences",
    sortOrder: 16,
  },
  {
    key: FEATURE_ENTITLEMENTS.CLIENT_UPDATES,
    name: "Client Updates",
    iconName: "Mail",
    tagline: "Auto-generate weekly retainer recap emails.",
    description:
      "For each active retainer, the Client Updates engine pulls activity from your CRM, content shipped, and invoices, then drafts a friendly weekly recap email in YOUR voice. Review, edit, send. Your clients feel taken care of without you spending Friday afternoons writing recaps.",
    highlights: [
      "AI-drafted weekly recap per active client",
      "Pulls from CRM activity + content + invoices",
      "Branded email template (your domain, your voice)",
      "Edit before send — never autopilot a relationship",
      "Send-tracking back to the deal",
    ],
    href: "/portal/client-updates",
    sortOrder: 17,
  },
  {
    key: FEATURE_ENTITLEMENTS.RECORDINGS,
    name: "Discovery Recorder",
    iconName: "Mic",
    tagline: "Record discovery calls. Get AI summaries + action items.",
    description:
      "Paste a Zoom/Meet transcript or upload an audio file, and the Discovery Recorder extracts the buyer's pain, budget, decision-makers, and objections — then drafts the follow-up email and pushes action items into the deal. Every call becomes an activity log automatically.",
    highlights: [
      "Paste transcript OR upload audio (Whisper)",
      "AI buyer summary: pain, budget, DM, objections",
      "Auto-drafts the follow-up email",
      "Pushes action items into the linked deal",
      "Search every discovery call you've ever had",
    ],
    href: "/portal/recordings",
    sortOrder: 18,
  },
  {
    key: FEATURE_ENTITLEMENTS.BOOKING,
    name: "Booking Page",
    iconName: "CalendarDays",
    tagline: "Branded scheduler — book.youragency.com → CRM in one click.",
    description:
      "A Calendly-style booking page that runs under your brand and your domain. Set your weekly availability, share your link, prospects pick a slot. Each booking auto-creates a deal in your CRM with their context attached. End-to-end: audit → book → CRM → close — all inside your platform.",
    highlights: [
      "Branded booking page (your colors, your copy)",
      "Custom URL handle (book.youragency.com/you)",
      "Weekly availability windows",
      "Auto-creates a CRM deal on every booking",
      "Email confirmations + reminders",
    ],
    href: "/portal/booking",
    sortOrder: 19,
  },
]

const FEATURE_BY_KEY: Record<string, FeatureDef> = Object.fromEntries(
  FEATURE_CATALOG.map((f) => [f.key, f]),
)

export function getFeature(key: string): FeatureDef | null {
  return FEATURE_BY_KEY[key] ?? null
}

/** Plans that include a given feature, sorted by price (asc). */
export function plansIncludingFeature(key: FeatureEntitlement): PlanDef[] {
  return PLANS.filter((p) => p.entitlements.includes(key)).sort(
    (a, b) => a.priceMonthly - b.priceMonthly,
  )
}
