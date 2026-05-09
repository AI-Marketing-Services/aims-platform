/**
 * A-la-carte upsell add-ons — single source of truth.
 *
 * These are recurring or one-time products that ride **on top of** the
 * three-tier plan system (`Free / Pro / Operator`). A member on Pro can
 * tack on the AI Voice Receptionist, the Branded Site Chatbot, and a
 * couple of Team Seats — each one a separate Stripe subscription, each
 * one granting an `addon_*` entitlement key.
 *
 * Editing this file:
 *   1. Update the constants below.
 *   2. Run `tsx scripts/setup-plans.ts` (re-uses the same setup pathway)
 *      to sync to Stripe + Product table.
 *   3. The portal marketplace renders the new card automatically.
 *
 * Naming convention: every entitlement key starts with `addon_` so the
 * marketplace UI can filter at-a-glance and admin grant/revoke flows
 * can distinguish a-la-carte upsells from plan-level features.
 *
 * "Real" vs "Configure-only" at launch:
 *   - "real"      — the surface ships with full functionality on day one.
 *   - "configure" — the surface ships as a configuration form + intake
 *                   that pings the services team for human fulfillment.
 *                   We promote these to "real" once we see who buys.
 */

/** Stable entitlement keys this file grants. */
export const ADDON_ENTITLEMENTS = {
  VOICE_AGENT: "addon_voice_agent",
  CHATBOT_PREMIUM: "addon_chatbot_premium",
  INBOX_WARMUP: "addon_inbox_warmup",
  SMS_PACK: "addon_sms_pack",
  WHITELABEL_MOBILE: "addon_mobile_app",
  CALL_COACH: "addon_call_coach",
  TEAM_SEATS: "addon_team_seats",
  API_WEBHOOKS: "addon_api_webhooks",
  SENDING_DOMAIN: "addon_sending_domain",
  KNOWLEDGE_PRO: "addon_knowledge_pro",
  UGC_AVATAR: "addon_ugc_avatar",
  MIGHTY_SYNC: "addon_mighty_sync",
  SLACK_ALERTS: "addon_slack_alerts",
  REPORTING_PRO: "addon_reporting_pro",
  DFY_SETUP: "addon_dfy_setup",
} as const

export type AddonEntitlement =
  (typeof ADDON_ENTITLEMENTS)[keyof typeof ADDON_ENTITLEMENTS]

export type AddonCategory =
  | "communications"
  | "growth"
  | "productivity"
  | "infrastructure"
  | "team"
  | "concierge"

export interface AddonDef {
  /** Stable slug used as Product.slug — DO NOT rename. */
  slug: string
  /** Display name on the marketplace card. */
  name: string
  /** One-liner under the title. */
  tagline: string
  /** Full description for the detail / paywall panel. */
  description: string
  /** Bullet list shown on the marketplace card. */
  highlights: string[]
  /** Lucide icon name. */
  iconName: string
  /** Marketplace card grouping. */
  category: AddonCategory
  /** USD/month for "recurring", USD total for "one_time". */
  price: number
  /** "recurring" = monthly subscription. "one_time" = single charge. */
  pricing: "recurring" | "one_time"
  /** Entitlements granted by an active purchase. */
  entitlements: AddonEntitlement[]
  /** Where the user lands after purchasing (deep link to surface). */
  href: string
  /** Real vs. configure-only at launch. */
  launchStatus: "real" | "configure"
  /** Marketplace sort. */
  sortOrder: number
  /** Optional badge — "Most popular", "New", "DFY". */
  badge?: string | null
}

export const ADDONS: AddonDef[] = [
  {
    slug: "addon-voice-agent",
    name: "AI Voice Receptionist",
    tagline: "Always-on AI that answers your phones, books meetings, and routes hot leads.",
    description:
      "A trained AI voice agent picks up your business line 24/7, qualifies the caller, books straight into your CRM-linked booking page, and SMS's you when a hot lead comes in. Every call is transcribed and summarized in your CRM so nothing slips. We handle the configuration — you give us a script and a phone number.",
    highlights: [
      "24/7 inbound coverage with natural-sounding voice",
      "Auto-books into your branded booking page",
      "Hot-lead Slack/SMS pings within 60 seconds",
      "Full transcript + summary attached to the deal",
      "Spam + telemarketer filtering built-in",
    ],
    iconName: "PhoneCall",
    category: "communications",
    price: 199,
    pricing: "recurring",
    entitlements: [ADDON_ENTITLEMENTS.VOICE_AGENT],
    href: "/portal/tools/voice-agent",
    launchStatus: "configure",
    sortOrder: 0,
    badge: "Most popular",
  },
  {
    slug: "addon-chatbot-premium",
    name: "Branded Site Chatbot",
    tagline: "A trained chatbot that lives on your site and books calls while you sleep.",
    description:
      "Drop a single embed snippet on your site (or your client's). The chatbot answers FAQ from your knowledge base, qualifies prospects, and books a call straight into your booking page. Your branding, your colors, your voice — no AIMS attribution.",
    highlights: [
      "One-line embed snippet, ready in 5 minutes",
      "Trained on your KB + audit responses",
      "Books calls + creates CRM deals in real-time",
      "Captures email even when the visitor abandons",
      "Conversation transcripts pipe into the CRM",
    ],
    iconName: "MessageSquare",
    category: "communications",
    price: 79,
    pricing: "recurring",
    entitlements: [ADDON_ENTITLEMENTS.CHATBOT_PREMIUM],
    href: "/portal/tools/chatbot",
    launchStatus: "configure",
    sortOrder: 1,
  },
  {
    slug: "addon-inbox-warmup",
    name: "Cold Email Inbox Warmup",
    tagline: "Auto-warm your sending domain so cold emails land in the primary tab.",
    description:
      "Your dedicated sending domain joins our automated warmup network — peer-to-peer sending and engagement that signals to Gmail/Outlook that your domain is healthy. Pair this with the Sequences feature and your reply rate jumps inside 30 days.",
    highlights: [
      "Daily warmup volume ramps automatically",
      "Reputation monitoring + bounce alerts",
      "DKIM/SPF/DMARC health checks weekly",
      "Spam-test scoring before every campaign send",
      "Deliverability dashboard with primary-tab %",
    ],
    iconName: "Flame",
    category: "growth",
    price: 59,
    pricing: "recurring",
    entitlements: [ADDON_ENTITLEMENTS.INBOX_WARMUP],
    href: "/portal/tools/inbox-warmup",
    launchStatus: "real",
    sortOrder: 2,
  },
  {
    slug: "addon-sms-pack",
    name: "Outbound SMS Pack",
    tagline: "10DLC-compliant SMS outbound + 2-way inbox, threaded into the CRM.",
    description:
      "Send SMS follow-ups from a verified 10DLC number, manage 2-way conversations in a unified inbox, and let our compliance layer handle opt-outs + STOP keywords. Each conversation auto-attaches to the matching deal.",
    highlights: [
      "10DLC registered number included",
      "2-way inbox with deal-level conversation threads",
      "Opt-out + STOP keyword handling automated",
      "1,000 outbound segments/mo included; overage at $0.015",
      "AI-drafted reply suggestions",
    ],
    iconName: "MessageCircle",
    category: "communications",
    price: 59,
    pricing: "recurring",
    entitlements: [ADDON_ENTITLEMENTS.SMS_PACK],
    href: "/portal/tools/sms",
    launchStatus: "configure",
    sortOrder: 3,
  },
  {
    slug: "addon-whitelabel-mobile",
    name: "Whitelabel Mobile App",
    tagline: "Your-brand iOS + Android apps that wrap your operator portal.",
    description:
      "We build, sign, and ship a mobile app under your developer accounts that opens to your branded portal. Real native shell, push notifications, deep-link auth. Six-week build + maintenance retainer included.",
    highlights: [
      "iOS + Android native shells (your bundle id)",
      "Push notifications wired to portal events",
      "Custom splash + icon set (we design)",
      "App Store + Play Store submission included",
      "Maintenance + OS updates monthly",
    ],
    iconName: "Smartphone",
    category: "infrastructure",
    price: 199,
    pricing: "recurring",
    entitlements: [ADDON_ENTITLEMENTS.WHITELABEL_MOBILE],
    href: "/portal/tools/mobile-app",
    launchStatus: "configure",
    sortOrder: 4,
    badge: "DFY",
  },
  {
    slug: "addon-call-coach",
    name: "AI Sales Call Coach",
    tagline: "AI grades every discovery call and surfaces objections in real time.",
    description:
      "Extends Discovery Recorder. Every call gets a 1-10 score across talk-time ratio, pain identification, budget surfacing, and next-step clarity, plus an AI-generated 'what to do differently next time'. Roll up team-level dashboards once you have multiple reps.",
    highlights: [
      "1-10 multi-axis call scoring",
      "Objection extraction with timestamp jumps",
      "AI-drafted 'what to do better next time'",
      "Team scoreboard once you add seats",
      "Side-by-side comparison vs. your top calls",
    ],
    iconName: "Headphones",
    category: "growth",
    price: 79,
    pricing: "recurring",
    entitlements: [ADDON_ENTITLEMENTS.CALL_COACH],
    href: "/portal/tools/call-coach",
    launchStatus: "real",
    sortOrder: 5,
  },
  {
    slug: "addon-team-seat",
    name: "Team Seat",
    tagline: "Add an SDR, AM, or partner to your portal with role-based access.",
    description:
      "The first user is included with every plan. Each additional team seat is $25/month — invite by email, set their role (SDR, AM, Admin, View-only), and watch them get to work inside the same CRM, calendar, and pipeline. All revenue + analytics roll up to the owner account.",
    highlights: [
      "Email-invite teammates",
      "Role-based access (SDR / AM / Admin / View-only)",
      "Per-seat activity + scorecard analytics",
      "Owner sees all rolled-up revenue",
      "Cancel any seat at any time",
    ],
    iconName: "Users2",
    category: "team",
    price: 25,
    pricing: "recurring",
    entitlements: [ADDON_ENTITLEMENTS.TEAM_SEATS],
    href: "/portal/settings/team",
    launchStatus: "real",
    sortOrder: 6,
  },
  {
    slug: "addon-api-webhooks",
    name: "Public API + Webhooks",
    tagline: "Plug AIMS into Zapier, Make, n8n, or your own stack.",
    description:
      "Generate API keys + outbound webhooks for every CRM event (deal.created, deal.stage_changed, invoice.paid, audit.submitted, booking.confirmed). Zapier-ready triggers + actions, plus typed REST endpoints documented at /api-docs.",
    highlights: [
      "Issue + rotate API keys self-serve",
      "20+ event types for outbound webhooks",
      "Zapier-ready triggers + actions",
      "Typed REST endpoints with full docs",
      "Webhook delivery log with replay",
    ],
    iconName: "Webhook",
    category: "infrastructure",
    price: 29,
    pricing: "recurring",
    entitlements: [ADDON_ENTITLEMENTS.API_WEBHOOKS],
    href: "/portal/settings/api",
    launchStatus: "real",
    sortOrder: 7,
  },
  {
    slug: "addon-sending-domain",
    name: "Dedicated Sending Domain",
    tagline: "Your own verified subdomain for sequences, invoices, and updates.",
    description:
      "Stop sharing send-reputation with other operators. We provision a dedicated subdomain (e.g. `mail.youragency.com`), set up SPF/DKIM/DMARC, and route ALL outbound mail through it — sequences, invoices, audit deliveries, client updates.",
    highlights: [
      "Dedicated subdomain with SPF/DKIM/DMARC",
      "All outbound mail switches over automatically",
      "Reputation isolation from other operators",
      "Domain health monitoring weekly",
      "Pairs perfectly with Inbox Warmup",
    ],
    iconName: "AtSign",
    category: "infrastructure",
    price: 19,
    pricing: "recurring",
    entitlements: [ADDON_ENTITLEMENTS.SENDING_DOMAIN],
    href: "/portal/settings/sending-domain",
    launchStatus: "real",
    sortOrder: 8,
  },
  {
    slug: "addon-knowledge-pro",
    name: "Knowledge Base Pro",
    tagline: "Upload docs, transcripts, SOPs — every AI on the platform reads them.",
    description:
      "Drop in PDFs, Loom transcripts, Notion exports, or pasted text. Our RAG layer indexes them and Deal Assistant + Chatbot + Voice Agent all read from your knowledge base before answering. Stop pasting context into every prompt.",
    highlights: [
      "Unlimited document uploads (PDF, MD, TXT)",
      "Loom + YouTube transcript ingestion",
      "RAG-powered context for every AI surface",
      "Per-document permission controls",
      "Re-index on-demand or auto-weekly",
    ],
    iconName: "Brain",
    category: "productivity",
    price: 49,
    pricing: "recurring",
    entitlements: [ADDON_ENTITLEMENTS.KNOWLEDGE_PRO],
    href: "/portal/knowledge",
    launchStatus: "real",
    sortOrder: 9,
  },
  {
    slug: "addon-ugc-avatar",
    name: "AI UGC + Avatar Studio",
    tagline: "Generate talking-head video DMs and UGC ads at scale.",
    description:
      "Pick an AI avatar (or upload your own), give it a script, and generate 30-second talking-head videos for outbound DMs, ads, or onboarding emails. 50 generations/month included.",
    highlights: [
      "10 starter avatars + custom upload option",
      "Multi-language voice generation",
      "Script-to-video in under 90 seconds",
      "50 generations/mo (overage at $1.99/each)",
      "Direct download or push to Sequences",
    ],
    iconName: "Video",
    category: "growth",
    price: 99,
    pricing: "recurring",
    entitlements: [ADDON_ENTITLEMENTS.UGC_AVATAR],
    href: "/portal/tools/ugc-avatar",
    launchStatus: "configure",
    sortOrder: 10,
    badge: "New",
  },
  {
    slug: "addon-mighty-sync",
    name: "Mighty Networks Sync",
    tagline: "Auto-onboard AOC community members straight into your portal.",
    description:
      "Already a member of the AI Operator Collective? Connect your Mighty Networks account and every new member who joins your tier auto-provisions inside your branded portal. Roles, badges, and posts sync hourly.",
    highlights: [
      "OAuth-connect your Mighty workspace",
      "Auto-provision portal users on join",
      "Member-tag → entitlement mapping",
      "Hourly sync (or on-demand)",
      "Pulls posts + replies into a Signal feed",
    ],
    iconName: "Network",
    category: "team",
    price: 29,
    pricing: "recurring",
    entitlements: [ADDON_ENTITLEMENTS.MIGHTY_SYNC],
    href: "/portal/settings/mighty",
    launchStatus: "real",
    sortOrder: 11,
  },
  {
    slug: "addon-slack-alerts",
    name: "Slack / Teams Alerts",
    tagline: "Real-time pings for hot leads, payments, and stalled deals.",
    description:
      "Connect a Slack or Teams workspace and pick which events ping you. New booking → ping. Invoice paid → ping. Hot-lead audit submitted → ping. Stale deal in Proposal Sent for 7 days → ping. Pre-built rule library, full custom routing.",
    highlights: [
      "Slack + Microsoft Teams supported",
      "20+ event types with channel routing",
      "Pre-built rule packs (sales, ops, billing)",
      "Per-channel mute hours + escalation",
      "Replay any event within 30 days",
    ],
    iconName: "Bell",
    category: "team",
    price: 19,
    pricing: "recurring",
    entitlements: [ADDON_ENTITLEMENTS.SLACK_ALERTS],
    href: "/portal/settings/alerts",
    launchStatus: "real",
    sortOrder: 12,
  },
  {
    slug: "addon-reporting-pro",
    name: "Scheduled Reports + BI Export",
    tagline: "Weekly CSV reports + Looker / Sheets export for your books.",
    description:
      "Pick the metrics — revenue, pipeline, API spend, member activity — and we email a CSV every Monday morning. Or hook our BigQuery / Sheets export to your BI tool of choice.",
    highlights: [
      "Weekly Monday-morning CSV digest",
      "BigQuery / Sheets / Snowflake export",
      "10+ pre-built report templates",
      "Custom SQL / column-builder for advanced",
      "30-day report history",
    ],
    iconName: "FileSpreadsheet",
    category: "productivity",
    price: 19,
    pricing: "recurring",
    entitlements: [ADDON_ENTITLEMENTS.REPORTING_PRO],
    href: "/portal/settings/reports",
    launchStatus: "real",
    sortOrder: 13,
  },
  {
    slug: "addon-dfy-setup",
    name: "Concierge Setup",
    tagline: "Our team configures your portal end-to-end in 7 days.",
    description:
      "Skip the setup. Buy 1 hour with the AOC services team and we'll connect your domain, brand the portal, write your first sequence, ship a website, and onboard your first 10 leads. Done in 7 business days.",
    highlights: [
      "1-on-1 onboarding kickoff call",
      "Domain + branding + email config",
      "First email sequence + audit form built",
      "Website template populated with your copy",
      "First 10 leads imported + Lead Scout primed",
    ],
    iconName: "Sparkles",
    category: "concierge",
    price: 499,
    pricing: "one_time",
    entitlements: [ADDON_ENTITLEMENTS.DFY_SETUP],
    href: "/portal/services/concierge",
    launchStatus: "configure",
    sortOrder: 14,
    badge: "DFY",
  },
]

const ADDON_BY_SLUG: Record<string, AddonDef> = Object.fromEntries(
  ADDONS.map((a) => [a.slug, a]),
)

export function getAddon(slug: string): AddonDef | null {
  return ADDON_BY_SLUG[slug] ?? null
}

/** Display labels for paywall + admin grant flows. */
export const ADDON_LABELS: Record<AddonEntitlement, string> = {
  addon_voice_agent: "AI Voice Receptionist",
  addon_chatbot_premium: "Branded Site Chatbot",
  addon_inbox_warmup: "Cold Email Inbox Warmup",
  addon_sms_pack: "Outbound SMS Pack",
  addon_mobile_app: "Whitelabel Mobile App",
  addon_call_coach: "AI Sales Call Coach",
  addon_team_seats: "Team Seat",
  addon_api_webhooks: "Public API + Webhooks",
  addon_sending_domain: "Dedicated Sending Domain",
  addon_knowledge_pro: "Knowledge Base Pro",
  addon_ugc_avatar: "AI UGC + Avatar Studio",
  addon_mighty_sync: "Mighty Networks Sync",
  addon_slack_alerts: "Slack / Teams Alerts",
  addon_reporting_pro: "Scheduled Reports + BI Export",
  addon_dfy_setup: "Concierge Setup",
}

/** All add-on entitlement keys — useful for "grant everything" admin grant. */
export const ALL_ADDON_ENTITLEMENTS: AddonEntitlement[] = Object.values(
  ADDON_ENTITLEMENTS,
)

/** Group add-ons by category for the marketplace UI. */
export function addonsByCategory(): Record<AddonCategory, AddonDef[]> {
  const out: Record<AddonCategory, AddonDef[]> = {
    communications: [],
    growth: [],
    productivity: [],
    infrastructure: [],
    team: [],
    concierge: [],
  }
  for (const a of ADDONS) out[a.category].push(a)
  return out
}
