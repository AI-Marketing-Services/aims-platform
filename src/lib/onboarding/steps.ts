import { MIGHTY_IDS, MIGHTY_NETWORK_URL } from "@/lib/mighty"
import type { JourneyPhaseKey } from "@/lib/journey/phases"

const spaces = MIGHTY_IDS.spaces

function spaceUrl(spaceId: number) {
  return `${MIGHTY_NETWORK_URL}/spaces/${spaceId}`
}

/**
 * Onboarding weeks — preserved for backward-compat with existing UI that
 * groups by week. Each week now corresponds 1:1 to a journey phase per
 * Jess's "walk before run" sequencing (mindset → prospecting → revenue
 * → diagnosis → solutioning).
 */
export type OnboardingWeek = "week1" | "week2" | "week3" | "week4" | "week5"

export interface OnboardingStep {
  key: string
  week: OnboardingWeek
  weekLabel: string
  /** Journey phase this step belongs to. Drives lead-magnet gating + UI labels. */
  phase: JourneyPhaseKey
  title: string
  description: string
  href: string
  ctaLabel: string
}

/**
 * Refreshed 5-phase onboarding curriculum per Jess's walk-before-run
 * spec. The sequence intentionally puts the AI tools / lead magnets
 * LAST — by the time a member reaches the Solutioning phase they have
 * the operator mindset, prospecting reps, and discovery framework that
 * make those tools actually useful instead of overwhelming.
 */
export const ONBOARDING_STEPS = [
  // ── Week 1 — FOUNDATION (mindset) ─────────────────────────────────────
  {
    key: "week1.complete_profile",
    week: "week1" as const,
    weekLabel: "Week 1: Foundation — operator mindset",
    phase: "foundation" as const,
    title: "Complete your profile",
    description:
      "Add your photo, one-line bio, and what you build or operate. A complete profile gets 3× more responses when you post in the community.",
    href: `${MIGHTY_NETWORK_URL}/profile`,
    ctaLabel: "Open profile",
  },
  {
    key: "week1.intro_post",
    week: "week1" as const,
    weekLabel: "Week 1: Foundation — operator mindset",
    phase: "foundation" as const,
    title: "Post your intro in the Welcome space",
    description:
      "Tell the community who you are, what you're working on, and what you want to build. The room is small on purpose — say hello.",
    href: spaceUrl(spaces.welcome),
    ctaLabel: "Open Welcome space",
  },
  {
    key: "week1.foundations_module",
    week: "week1" as const,
    weekLabel: "Week 1: Foundation — operator mindset",
    phase: "foundation" as const,
    title: "Start Module 1: AI Operator Foundations",
    description:
      "Five short lessons on what an AI operator actually does, why mindset comes before tools, and how problem-first thinking unlocks the rest of the work.",
    href: spaceUrl(spaces.curriculumPlaybooks),
    ctaLabel: "Open Curriculum",
  },
  {
    key: "week1.activity_feed",
    week: "week1" as const,
    weekLabel: "Week 1: Foundation — operator mindset",
    phase: "foundation" as const,
    title: "Comment on two community threads",
    description:
      "Scroll the last 7 days of posts. Drop a comment on at least two threads that resonate — relationships compound here.",
    href: `${MIGHTY_NETWORK_URL}/feed`,
    ctaLabel: "Open feed",
  },

  // ── Week 2 — PROSPECTING ──────────────────────────────────────────────
  {
    key: "week2.icp_definition",
    week: "week2" as const,
    weekLabel: "Week 2: Prospecting — finding the right businesses",
    phase: "prospecting" as const,
    title: "Define your ICP (ideal client profile)",
    description:
      "Use the ICP template in the curriculum. The goal isn't to pick the perfect niche on day one — it's to pick something specific enough to start prospecting against this week.",
    href: spaceUrl(spaces.curriculumPlaybooks),
    ctaLabel: "Open ICP Template",
  },
  {
    key: "week2.prospect_list",
    week: "week2" as const,
    weekLabel: "Week 2: Prospecting — finding the right businesses",
    phase: "prospecting" as const,
    title: "Build your first 25-prospect list",
    description:
      "Apply your ICP. Find 25 real businesses that match. Note the website, decision-maker name, and what you can already see about their operation. Practice picking targets BEFORE outreach.",
    href: spaceUrl(spaces.curriculumPlaybooks),
    ctaLabel: "Open Prospecting Playbook",
  },
  {
    key: "week2.research_three",
    week: "week2" as const,
    weekLabel: "Week 2: Prospecting — finding the right businesses",
    phase: "prospecting" as const,
    title: "Research the top 3 in depth",
    description:
      "Pick the three strongest names. Spend 15 minutes each understanding what they actually do, who they serve, and what visible operational pain looks like from the outside.",
    href: spaceUrl(spaces.curriculumPlaybooks),
    ctaLabel: "Open Research Framework",
  },

  // ── Week 3 — REVENUE ACTIVITIES ───────────────────────────────────────
  {
    key: "week3.outreach_message",
    week: "week3" as const,
    weekLabel: "Week 3: Revenue activities — outreach reps",
    phase: "revenue_activities" as const,
    title: "Draft your first cold outreach message",
    description:
      "Use the templates in the curriculum. Personalise to one of your three researched prospects. Don't pitch a solution — invite a 15-minute conversation.",
    href: spaceUrl(spaces.curriculumPlaybooks),
    ctaLabel: "Open Outreach Templates",
  },
  {
    key: "week3.send_outreach",
    week: "week3" as const,
    weekLabel: "Week 3: Revenue activities — outreach reps",
    phase: "revenue_activities" as const,
    title: "Send outreach to your top 10",
    description:
      "Personalise + send. The metric here is reps, not replies. Most operators stall at this step — your job is to get past it. Post in the community when you've sent.",
    href: spaceUrl(spaces.curriculumPlaybooks),
    ctaLabel: "Open Outreach Playbook",
  },
  {
    key: "week3.attend_call",
    week: "week3" as const,
    weekLabel: "Week 3: Revenue activities — outreach reps",
    phase: "revenue_activities" as const,
    title: "RSVP and attend a live operator call",
    description:
      "Bring one outreach question or one piece of feedback you got. The fastest way to debug your reps is to talk through them with operators ahead of you.",
    href: spaceUrl(spaces.callsEvents),
    ctaLabel: "Open Calls & Events",
  },

  // ── Week 4 — PROBLEM DIAGNOSIS ────────────────────────────────────────
  {
    key: "week4.discovery_framework",
    week: "week4" as const,
    weekLabel: "Week 4: Problem diagnosis — understanding the pain",
    phase: "problem_diagnosis" as const,
    title: "Learn the discovery framework",
    description:
      "How to run a discovery call without pitching. The questions that get the buyer to map their own problem out loud. The discovery rule that keeps new operators from promising a solution too early.",
    href: spaceUrl(spaces.curriculumPlaybooks),
    ctaLabel: "Open Discovery Framework",
  },
  {
    key: "week4.run_discovery",
    week: "week4" as const,
    weekLabel: "Week 4: Problem diagnosis — understanding the pain",
    phase: "problem_diagnosis" as const,
    title: "Run your first discovery call",
    description:
      "If outreach turned up a willing prospect, run a 20-minute discovery call. If not, run one with a friend who runs a small business — the reps are real either way.",
    href: spaceUrl(spaces.curriculumPlaybooks),
    ctaLabel: "Open Discovery Playbook",
  },
  {
    key: "week4.workflow_map",
    week: "week4" as const,
    weekLabel: "Week 4: Problem diagnosis — understanding the pain",
    phase: "problem_diagnosis" as const,
    title: "Map one of their workflows",
    description:
      "Pick the messiest part of the conversation. Sketch the workflow on paper. Where are the handoffs? The repeated questions? The manual steps nobody owns? That's where AI lives.",
    href: spaceUrl(spaces.curriculumPlaybooks),
    ctaLabel: "Open Workflow Templates",
  },

  // ── Week 5+ — SOLUTIONING (where AI tools come in) ────────────────────
  {
    key: "week5.unlock_tools",
    week: "week5" as const,
    weekLabel: "Week 5+: Solutioning — now the AI tools come in",
    phase: "solutioning" as const,
    title: "Unlock the diagnostic toolkit",
    description:
      "You've built the foundation. Now run the AI Opportunity Audit on a real prospect, generate a custom ROI calculator output, or use the Website Audit to score their site. The tools amplify the judgment you already built.",
    href: "/portal/tools",
    ctaLabel: "Open Toolkit",
  },
  {
    key: "week5.first_proposal",
    week: "week5" as const,
    weekLabel: "Week 5+: Solutioning — now the AI tools come in",
    phase: "solutioning" as const,
    title: "Draft your first scoped proposal",
    description:
      "Take what you learned in discovery + the AI tooling output. Use the in-portal proposal builder. The proposal isn't the close — the discovery was. The proposal just confirms what you already heard.",
    href: "/portal/proposals",
    ctaLabel: "Open Proposals",
  },
  {
    key: "week5.share_win",
    week: "week5" as const,
    weekLabel: "Week 5+: Solutioning — now the AI tools come in",
    phase: "solutioning" as const,
    title: "Share what you shipped",
    description:
      "Post a win, a shipped piece of work, or a question that came up in solutioning. Teaching the room accelerates your own learning faster than anything else here.",
    href: `${MIGHTY_NETWORK_URL}/feed`,
    ctaLabel: "Open feed",
  },
] satisfies OnboardingStep[]

export const TOTAL_STEPS = ONBOARDING_STEPS.length

export const ONBOARDING_STEP_KEYS = ONBOARDING_STEPS.map((s) => s.key) as [
  string,
  ...string[],
]

export interface WeekGroup {
  steps: OnboardingStep[]
  done: number
  label: string
  phase: JourneyPhaseKey
}

/**
 * Group steps by week and tag each group with its phase + label. Returned
 * as a plain object (keyed by week) so the admin UI can index it like
 * `weeks.week1` without needing Map.get(). The default record has empty
 * groups for every known week so `weeks.week3.label` is always defined.
 */
export function groupStepsByWeek(completedKeys: Set<string>) {
  const empty = (week: OnboardingWeek): WeekGroup => ({
    steps: [],
    done: 0,
    label: "",
    phase: "foundation",
  })
  const out: Record<OnboardingWeek, WeekGroup> = {
    week1: empty("week1"),
    week2: empty("week2"),
    week3: empty("week3"),
    week4: empty("week4"),
    week5: empty("week5"),
  }
  for (const s of ONBOARDING_STEPS) {
    const entry = out[s.week]
    entry.steps.push(s)
    entry.label = s.weekLabel
    entry.phase = s.phase
    if (completedKeys.has(s.key)) entry.done++
  }
  return out
}

/** Ordered list of weeks the UI should iterate when rendering all phases. */
export const ONBOARDING_WEEKS: OnboardingWeek[] = [
  "week1",
  "week2",
  "week3",
  "week4",
  "week5",
]

/**
 * Determine the member's current journey phase from their completed steps.
 *
 * Logic: walk the phases in order; the first phase where the member has
 * NOT completed every step is their current phase. If they've completed
 * all of week N, they've graduated to week N+1.
 *
 * This is intentionally lenient — we don't gate phase advancement on
 * elapsed time, only on the member actually doing the work.
 */
export function inferCurrentPhase(
  completedKeys: Set<string>,
): JourneyPhaseKey {
  const PHASE_ORDER: JourneyPhaseKey[] = [
    "foundation",
    "prospecting",
    "revenue_activities",
    "problem_diagnosis",
    "solutioning",
  ]
  for (const phase of PHASE_ORDER) {
    const phaseSteps = ONBOARDING_STEPS.filter((s) => s.phase === phase)
    const allDone = phaseSteps.every((s) => completedKeys.has(s.key))
    if (!allDone) return phase
  }
  return "solutioning" // graduated — full access
}
