import { MIGHTY_IDS, MIGHTY_NETWORK_URL } from "@/lib/mighty"

const spaces = MIGHTY_IDS.spaces

function spaceUrl(spaceId: number) {
  return `${MIGHTY_NETWORK_URL}/spaces/${spaceId}`
}

export type OnboardingWeek = "week1" | "week2" | "week34"

export interface OnboardingStep {
  key: string
  week: OnboardingWeek
  weekLabel: string
  title: string
  description: string
  href: string
  ctaLabel: string
}

export const ONBOARDING_STEPS = [
  // ── Week 1: Get oriented ──────────────────────────────────────────────
  {
    key: "week1.complete_profile",
    week: "week1" as const,
    weekLabel: "Days 1–7: Get Oriented",
    title: "Complete your profile",
    description:
      "Add your photo, one-line bio, and what you build or operate. A complete profile gets 3× more responses when you post.",
    href: `${MIGHTY_NETWORK_URL}/profile`,
    ctaLabel: "Open profile",
  },
  {
    key: "week1.intro_post",
    week: "week1" as const,
    weekLabel: "Days 1–7: Get Oriented",
    title: "Post your intro in the Welcome space",
    description:
      "Tell the community who you are, what you're working on, and what you want to get out of this. Tag someone you want to meet.",
    href: spaceUrl(spaces.welcome),
    ctaLabel: "Open Welcome space",
  },
  {
    key: "week1.activity_feed",
    week: "week1" as const,
    weekLabel: "Days 1–7: Get Oriented",
    title: "Explore the activity feed",
    description:
      "Scroll the last 7 days of posts. Comment on at least two threads that resonate — this is how relationships start here.",
    href: `${MIGHTY_NETWORK_URL}/feed`,
    ctaLabel: "Open feed",
  },
  {
    key: "week1.chat",
    week: "week1" as const,
    weekLabel: "Days 1–7: Get Oriented",
    title: "Jump into the Chat space",
    description:
      "Introduce yourself in the #general channel and watch the real-time conversations already happening.",
    href: spaceUrl(spaces.chat),
    ctaLabel: "Open Chat",
  },

  // ── Week 2: AI Operator Playbook ──────────────────────────────────────
  {
    key: "week2.module_1",
    week: "week2" as const,
    weekLabel: "Days 8–14: Explore the AI Operator Playbook",
    title: "Start Module 1: AI Operator Foundations",
    description:
      "Five short lessons that define what an AI Operator actually does and how to position yourself.",
    href: spaceUrl(spaces.curriculumPlaybooks),
    ctaLabel: "Open Curriculum",
  },
  {
    key: "week2.beginner_track",
    week: "week2" as const,
    weekLabel: "Days 8–14: Explore the AI Operator Playbook",
    title: "Work through the Beginner Track",
    description:
      '"AI for Your Business" + "Finding and Landing Clients" + "Marketing Yourself" — plain-English, tool-forward, actionable this week.',
    href: spaceUrl(spaces.curriculumPlaybooks),
    ctaLabel: "Open Curriculum",
  },
  {
    key: "week2.case_study",
    week: "week2" as const,
    weekLabel: "Days 8–14: Explore the AI Operator Playbook",
    title: "Explore the Case Study Library",
    description:
      "Real operator projects with full problem / solution / results / pricing breakdowns. Read at least one end-to-end.",
    href: spaceUrl(spaces.curriculumPlaybooks),
    ctaLabel: "Open Case Studies",
  },
  {
    key: "week2.first_question",
    week: "week2" as const,
    weekLabel: "Days 8–14: Explore the AI Operator Playbook",
    title: "Ask your first question in the community",
    description:
      "Post something you're stuck on or curious about. The best thing about this room is that people actually answer.",
    href: `${MIGHTY_NETWORK_URL}/feed`,
    ctaLabel: "Open feed",
  },

  // ── Weeks 3–4: Go deeper ──────────────────────────────────────────────
  {
    key: "week34.rsvp_call",
    week: "week34" as const,
    weekLabel: "Days 15–30: Go Deeper & Engage",
    title: "RSVP and attend a live call",
    description:
      "Check Calls + Events for the next open session. These are where the real operator-to-operator conversations happen.",
    href: spaceUrl(spaces.callsEvents),
    ctaLabel: "Open Calls & Events",
  },
  {
    key: "week34.intermediate_track",
    week: "week34" as const,
    weekLabel: "Days 15–30: Go Deeper & Engage",
    title: "Continue into the Intermediate Track",
    description:
      "Automation Playbooks, AI-Powered Sales & Marketing, Pricing & GTM — work through whichever module matches your current bottleneck.",
    href: spaceUrl(spaces.curriculumPlaybooks),
    ctaLabel: "Open Curriculum",
  },
  {
    key: "week34.share_win",
    week: "week34" as const,
    weekLabel: "Days 15–30: Go Deeper & Engage",
    title: "Share a win, insight, or question",
    description:
      "Post something you learned or shipped in the last two weeks. Teaching accelerates your own learning faster than anything else.",
    href: `${MIGHTY_NETWORK_URL}/feed`,
    ctaLabel: "Open feed",
  },
  {
    key: "week34.schedule_1on1",
    week: "week34" as const,
    weekLabel: "Days 15–30: Go Deeper & Engage",
    title: "Schedule a 1:1 with Adam",
    description:
      "Book a 30-minute call to talk through where you are, what you're building, and what you should focus on next.",
    href: "https://cal.com/adamwolfe",
    ctaLabel: "Book a call",
  },
] satisfies OnboardingStep[]

export const TOTAL_STEPS = ONBOARDING_STEPS.length

export const ONBOARDING_STEP_KEYS = ONBOARDING_STEPS.map((s) => s.key) as [
  string,
  ...string[],
]

export function groupStepsByWeek(completedKeys: Set<string>) {
  const weeks: Record<OnboardingWeek, { label: string; steps: Array<OnboardingStep & { completed: boolean }> }> = {
    week1: { label: "Days 1–7: Get Oriented", steps: [] },
    week2: { label: "Days 8–14: Explore the AI Operator Playbook", steps: [] },
    week34: { label: "Days 15–30: Go Deeper & Engage", steps: [] },
  }
  for (const step of ONBOARDING_STEPS) {
    weeks[step.week].steps.push({ ...step, completed: completedKeys.has(step.key) })
  }
  return weeks
}
