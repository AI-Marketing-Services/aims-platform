/**
 * Quest Registry — single source of truth for every quest in the system.
 *
 * Quests live in code (not DB) so we can version them with the rest of the
 * app and ship new quests on a deploy. Per-user state lives in `UserQuest`.
 *
 * Design rules:
 *  - Each quest has a stable `key` (snake_case, never rename — only deprecate).
 *  - Main quests are tiered (0..4) and gate features. Side quests are optional.
 *  - Triggers are *event names* — server-side hooks call markQuestComplete()
 *    with one of these event names from the appropriate API route.
 *  - `unlocksFeatureKey` ties to FEATURE_GATES below. A feature is unlocked
 *    when ALL quests that mention it in `unlocksFeatureKey` are CLAIMED
 *    (or COMPLETED — claiming is a UX nicety, not a gate).
 */

export type QuestCategory = "MAIN" | "SIDE" | "DAILY" | "HIDDEN"

export interface QuestDef {
  key: string
  title: string
  description: string
  shortHint?: string // shown on the "next quest" widget
  category: QuestCategory
  tier?: 0 | 1 | 2 | 3 | 4 // main quests only
  prerequisiteKeys?: string[]
  unlocksFeatureKey?: FeatureKey
  triggerEvent?: TriggerEvent
  /** for multi-step quests like "run 5 audits" */
  goal?: number
  xpReward: number
  creditReward: number
  badgeKey?: string
  hasMysteryBox?: boolean
  /** if true, awarded automatically with no UI claim step (e.g. day-0 endowed) */
  autoClaim?: boolean
  /** display order within tier/category */
  order: number
  /** optional emoji-free icon name (lucide) */
  iconName?: string
}

// ---------------------------------------------------------------
// FEATURE GATES — what gets locked/unlocked
// ---------------------------------------------------------------

export const FEATURE_KEYS = [
  "community",
  "playbooks",
  "ai_tools",
  "crm",
  "audits",
  "scripts",
  "cohort_replays",
  "proposals",
  "revenue",
  "marketplace",
  "lead_scout",
  "follow_up_rules",
  "signal",
  "reseller",
  "content",
  "calculator",
  "referrals",
  "tools_hub",
] as const

export type FeatureKey = (typeof FEATURE_KEYS)[number]

// Default-allowed features — never gated, available from day 0.
export const ALWAYS_AVAILABLE_FEATURES: FeatureKey[] = []

// ---------------------------------------------------------------
// TRIGGER EVENTS — fired from API routes / server actions
// ---------------------------------------------------------------

export const TRIGGER_EVENTS = [
  // Day 0
  "user.signed_up",
  "dashboard.visited",
  "welcome_video.watched",
  // Tier 1 — Foundation
  "profile.completed",
  "community.intro_posted",
  "onboarding.track_selected",
  "ai_chat.first_message",
  // Tier 2 — Activation
  "crm.first_contact_added",
  "audit.first_completed",
  "scripts.first_saved",
  "cohort.first_attended",
  // Tier 3 — Revenue
  "proposal.first_generated",
  "invoice.first_sent",
  "marketplace.first_used",
  "lead_scout.run_completed",
  // Tier 4 — Mastery
  "follow_up.first_rule_created",
  "deal.first_closed_won",
  "content.first_generated",
  "referral.first_signup",
  // Sidequests
  "page.visited",
  "community.post_reacted",
  "community.question_answered",
  "community.win_posted",
  "playbook.bookmarked",
  "ai_bot.used",
  // Streak
  "user.daily_login",
] as const

export type TriggerEvent = (typeof TRIGGER_EVENTS)[number]

// ---------------------------------------------------------------
// THE QUEST REGISTRY
// ---------------------------------------------------------------

export const QUESTS: QuestDef[] = [
  // ============ TIER 0 — DAY 0 (endowed progress, auto-claim) ============
  {
    key: "welcome_aboard",
    title: "Welcome aboard",
    description: "You're in. The Collective is yours to explore.",
    shortHint: "Auto-completed when you signed up",
    category: "MAIN",
    tier: 0,
    triggerEvent: "user.signed_up",
    xpReward: 25,
    creditReward: 10,
    badgeKey: "welcomed",
    autoClaim: true,
    order: 0,
    iconName: "Sparkles",
  },
  {
    key: "first_steps",
    title: "First Steps",
    description: "You found the dashboard. Everything starts here.",
    shortHint: "Visit your dashboard",
    category: "MAIN",
    tier: 0,
    triggerEvent: "dashboard.visited",
    xpReward: 25,
    creditReward: 5,
    autoClaim: true,
    order: 1,
    iconName: "Home",
  },
  {
    key: "lay_of_the_land",
    title: "The Lay of the Land",
    description: "Watch the 60-second welcome and meet your AI co-pilot.",
    shortHint: "Watch the welcome video",
    category: "MAIN",
    tier: 0,
    triggerEvent: "welcome_video.watched",
    xpReward: 50,
    creditReward: 15,
    order: 2,
    iconName: "PlayCircle",
  },

  // ============ TIER 1 — FOUNDATION (Day 1–3) ============
  {
    key: "operator_profile_complete",
    title: "Operator Profile Complete",
    description:
      "Fill in your business name, niche, and one-liner so the platform can tailor itself to you.",
    shortHint: "Complete your operator profile",
    category: "MAIN",
    tier: 1,
    prerequisiteKeys: ["first_steps"],
    triggerEvent: "profile.completed",
    xpReward: 75,
    creditReward: 25,
    badgeKey: "profile_complete",
    order: 0,
    iconName: "User",
  },
  {
    key: "introduce_yourself",
    title: "Introduce Yourself",
    description:
      "Drop a quick intro post in the Collective community. Tell us who you are and what you're building.",
    shortHint: "Post an intro in the community",
    category: "MAIN",
    tier: 1,
    prerequisiteKeys: ["first_steps"],
    triggerEvent: "community.intro_posted",
    unlocksFeatureKey: "community",
    xpReward: 100,
    creditReward: 25,
    badgeKey: "introduced",
    order: 1,
    iconName: "MessageSquare",
  },
  {
    key: "pick_your_lane",
    title: "Pick Your Lane",
    description:
      "Tell the AI co-pilot which service track you're focused on. It'll surface the right playbooks for you.",
    shortHint: "Choose a service track",
    category: "MAIN",
    tier: 1,
    prerequisiteKeys: ["operator_profile_complete"],
    triggerEvent: "onboarding.track_selected",
    unlocksFeatureKey: "playbooks",
    xpReward: 75,
    creditReward: 20,
    order: 2,
    iconName: "Compass",
  },
  {
    key: "meet_your_copilot",
    title: "Meet Your AI Co-pilot",
    description: "Send your first message to the AI assistant. It's here to help.",
    shortHint: "Send a message to the AI",
    category: "MAIN",
    tier: 1,
    prerequisiteKeys: ["first_steps"],
    triggerEvent: "ai_chat.first_message",
    unlocksFeatureKey: "ai_tools",
    xpReward: 75,
    creditReward: 20,
    badgeKey: "ai_handshake",
    order: 3,
    iconName: "Bot",
  },

  // ============ TIER 2 — ACTIVATION (Week 1) ============
  {
    key: "first_lead",
    title: "First Lead",
    description:
      "Add your first prospect to the CRM. This is where revenue starts.",
    shortHint: "Add a contact to your CRM",
    category: "MAIN",
    tier: 2,
    prerequisiteKeys: ["pick_your_lane"],
    triggerEvent: "crm.first_contact_added",
    unlocksFeatureKey: "crm",
    xpReward: 150,
    creditReward: 30,
    badgeKey: "prospector",
    order: 0,
    iconName: "UserPlus",
  },
  {
    key: "first_audit",
    title: "First Audit",
    description:
      "Run your first business audit on a prospect. This is the asset you'll lead with.",
    shortHint: "Complete an audit",
    category: "MAIN",
    tier: 2,
    prerequisiteKeys: ["pick_your_lane"],
    triggerEvent: "audit.first_completed",
    unlocksFeatureKey: "audits",
    xpReward: 200,
    creditReward: 40,
    badgeKey: "auditor",
    order: 1,
    iconName: "ClipboardCheck",
  },
  {
    key: "first_script",
    title: "First Script",
    description: "Save or generate one outreach script. Stop staring at blank pages.",
    shortHint: "Save a script",
    category: "MAIN",
    tier: 2,
    prerequisiteKeys: ["meet_your_copilot"],
    triggerEvent: "scripts.first_saved",
    unlocksFeatureKey: "scripts",
    xpReward: 100,
    creditReward: 25,
    order: 2,
    iconName: "FileText",
  },
  {
    key: "show_up",
    title: "Show Up",
    description:
      "Attend one cohort call. Real growth happens in rooms with other operators.",
    shortHint: "Attend a cohort call",
    category: "MAIN",
    tier: 2,
    prerequisiteKeys: ["introduce_yourself"],
    triggerEvent: "cohort.first_attended",
    unlocksFeatureKey: "cohort_replays",
    xpReward: 150,
    creditReward: 30,
    badgeKey: "showed_up",
    order: 3,
    iconName: "Video",
  },

  // ============ TIER 3 — REVENUE (Week 2) ============
  {
    key: "first_proposal",
    title: "First Proposal",
    description: "Generate your first proposal. Now you have something to send.",
    shortHint: "Generate a proposal",
    category: "MAIN",
    tier: 3,
    prerequisiteKeys: ["first_audit"],
    triggerEvent: "proposal.first_generated",
    unlocksFeatureKey: "proposals",
    xpReward: 200,
    creditReward: 50,
    order: 0,
    iconName: "FileSignature",
  },
  {
    key: "first_invoice_sent",
    title: "First Invoice Sent",
    description: "Send your first invoice. The dollar is in motion.",
    shortHint: "Send an invoice",
    category: "MAIN",
    tier: 3,
    prerequisiteKeys: ["first_proposal"],
    triggerEvent: "invoice.first_sent",
    unlocksFeatureKey: "revenue",
    xpReward: 250,
    creditReward: 50,
    badgeKey: "first_dollar",
    hasMysteryBox: true,
    order: 1,
    iconName: "Receipt",
  },
  {
    key: "first_marketplace_use",
    title: "First Marketplace Service",
    description: "Activate any service from the marketplace. Stack the wins.",
    shortHint: "Try a marketplace service",
    category: "MAIN",
    tier: 3,
    prerequisiteKeys: ["first_lead"],
    triggerEvent: "marketplace.first_used",
    unlocksFeatureKey: "marketplace",
    xpReward: 150,
    creditReward: 30,
    order: 2,
    iconName: "ShoppingBag",
  },
  {
    key: "lead_scout_apprentice",
    title: "Lead Scout Apprentice",
    description: "Run 3 Lead Scout searches and learn how prospect intelligence works.",
    shortHint: "Run 3 Lead Scout searches",
    category: "MAIN",
    tier: 3,
    prerequisiteKeys: ["first_lead"],
    triggerEvent: "lead_scout.run_completed",
    goal: 3,
    unlocksFeatureKey: "lead_scout",
    xpReward: 175,
    creditReward: 40,
    badgeKey: "scout",
    order: 3,
    iconName: "Search",
  },

  // ============ TIER 4 — MASTERY (Week 3–4) ============
  {
    key: "first_follow_up",
    title: "First Follow-Up Rule",
    description: "Set up your first automation. Your first manual task becomes a system.",
    shortHint: "Create a follow-up rule",
    category: "MAIN",
    tier: 4,
    prerequisiteKeys: ["first_invoice_sent"],
    triggerEvent: "follow_up.first_rule_created",
    unlocksFeatureKey: "follow_up_rules",
    xpReward: 200,
    creditReward: 50,
    order: 0,
    iconName: "Zap",
  },
  {
    key: "first_closed_deal",
    title: "First Closed Deal",
    description: "Move a deal to CLOSED_WON. This is what we're here for.",
    shortHint: "Close your first deal",
    category: "MAIN",
    tier: 4,
    prerequisiteKeys: ["first_invoice_sent"],
    triggerEvent: "deal.first_closed_won",
    unlocksFeatureKey: "reseller",
    xpReward: 500,
    creditReward: 200,
    badgeKey: "closer",
    hasMysteryBox: true,
    order: 1,
    iconName: "Trophy",
  },
  {
    key: "first_content",
    title: "First Content Asset",
    description: "Generate one piece of content via the engine.",
    shortHint: "Generate content",
    category: "MAIN",
    tier: 4,
    prerequisiteKeys: ["meet_your_copilot"],
    triggerEvent: "content.first_generated",
    unlocksFeatureKey: "content",
    xpReward: 150,
    creditReward: 30,
    order: 2,
    iconName: "Sparkles",
  },
  {
    key: "first_referral",
    title: "First Referral",
    description: "Bring another operator into the Collective.",
    shortHint: "Refer an operator",
    category: "MAIN",
    tier: 4,
    prerequisiteKeys: ["introduce_yourself"],
    triggerEvent: "referral.first_signup",
    unlocksFeatureKey: "referrals",
    xpReward: 300,
    creditReward: 100,
    badgeKey: "ambassador",
    order: 3,
    iconName: "Users",
  },

  // ============ SIDEQUESTS — Discovery ============
  {
    key: "tour_guide",
    title: "The Tour Guide",
    description: "Visit every page in your portal. See the whole map.",
    shortHint: "Visit all portal pages",
    category: "SIDE",
    triggerEvent: "page.visited",
    goal: 12,
    xpReward: 100,
    creditReward: 25,
    badgeKey: "explorer",
    order: 0,
    iconName: "Map",
  },
  {
    key: "tinkerer",
    title: "The Tinkerer",
    description: "Try each of the 4 AI bots at least once.",
    shortHint: "Use 4 different AI tools",
    category: "SIDE",
    triggerEvent: "ai_bot.used",
    goal: 4,
    xpReward: 100,
    creditReward: 25,
    order: 1,
    iconName: "Wrench",
  },
  {
    key: "investigator",
    title: "The Investigator",
    description: "Run 5 Lead Scout searches in a single week.",
    shortHint: "Run 5 Lead Scouts",
    category: "SIDE",
    triggerEvent: "lead_scout.run_completed",
    goal: 5,
    xpReward: 125,
    creditReward: 30,
    order: 2,
    iconName: "Telescope",
    hasMysteryBox: true,
  },
  {
    key: "curator",
    title: "The Curator",
    description: "Bookmark 10 playbooks for later.",
    shortHint: "Bookmark 10 playbooks",
    category: "SIDE",
    triggerEvent: "playbook.bookmarked",
    goal: 10,
    xpReward: 75,
    creditReward: 20,
    order: 3,
    iconName: "Bookmark",
  },

  // ============ SIDEQUESTS — Community ============
  {
    key: "networker",
    title: "The Networker",
    description: "React to 5 community posts.",
    shortHint: "React to 5 posts",
    category: "SIDE",
    triggerEvent: "community.post_reacted",
    goal: 5,
    xpReward: 50,
    creditReward: 15,
    order: 4,
    iconName: "Heart",
  },
  {
    key: "helper",
    title: "The Helper",
    description: "Answer 3 questions in the community.",
    shortHint: "Answer 3 questions",
    category: "SIDE",
    triggerEvent: "community.question_answered",
    goal: 3,
    xpReward: 100,
    creditReward: 25,
    badgeKey: "helper",
    order: 5,
    iconName: "HelpCircle",
  },
  {
    key: "storyteller",
    title: "The Storyteller",
    description: "Post a win in the community.",
    shortHint: "Share a win",
    category: "SIDE",
    triggerEvent: "community.win_posted",
    goal: 1,
    xpReward: 100,
    creditReward: 30,
    hasMysteryBox: true,
    order: 6,
    iconName: "Megaphone",
  },

  // ============ HIDDEN ============
  {
    key: "night_owl",
    title: "Night Owl",
    description: "Logged in past midnight 3 times.",
    category: "HIDDEN",
    goal: 3,
    xpReward: 50,
    creditReward: 15,
    badgeKey: "night_owl",
    order: 0,
    iconName: "Moon",
  },
  {
    key: "early_bird",
    title: "Early Bird",
    description: "Logged in before 7am 3 times.",
    category: "HIDDEN",
    goal: 3,
    xpReward: 50,
    creditReward: 15,
    badgeKey: "early_bird",
    order: 1,
    iconName: "Sunrise",
  },
  {
    key: "completionist_t1",
    title: "The Completionist",
    description: "Finished an entire tier in under 24 hours.",
    category: "HIDDEN",
    xpReward: 200,
    creditReward: 50,
    badgeKey: "completionist",
    hasMysteryBox: true,
    order: 2,
    iconName: "Award",
  },
]

// ---------------------------------------------------------------
// Lookups
// ---------------------------------------------------------------

const QUESTS_BY_KEY: Record<string, QuestDef> = Object.fromEntries(
  QUESTS.map((q) => [q.key, q]),
)

export function getQuest(key: string): QuestDef | undefined {
  return QUESTS_BY_KEY[key]
}

export function getQuestsByEvent(event: TriggerEvent): QuestDef[] {
  return QUESTS.filter((q) => q.triggerEvent === event)
}

export function getMainQuests(): QuestDef[] {
  return QUESTS.filter((q) => q.category === "MAIN").sort((a, b) => {
    if ((a.tier ?? 0) !== (b.tier ?? 0)) return (a.tier ?? 0) - (b.tier ?? 0)
    return a.order - b.order
  })
}

export function getSideQuests(): QuestDef[] {
  return QUESTS.filter((q) => q.category === "SIDE").sort(
    (a, b) => a.order - b.order,
  )
}

export function getHiddenQuests(): QuestDef[] {
  return QUESTS.filter((q) => q.category === "HIDDEN").sort(
    (a, b) => a.order - b.order,
  )
}

/** Quests in the same tier */
export function getQuestsInTier(tier: number): QuestDef[] {
  return QUESTS.filter((q) => q.category === "MAIN" && q.tier === tier).sort(
    (a, b) => a.order - b.order,
  )
}

/** Total tiers (highest tier number + 1) */
export const TOTAL_TIERS = 5
