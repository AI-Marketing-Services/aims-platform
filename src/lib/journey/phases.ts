/**
 * AIOC member journey phases — Jess's "walk before they run" sequencing.
 *
 * Members do NOT see advanced AI/diagnostic tooling on day 1. They build
 * mindset → prospecting → revenue activities → problem diagnosis FIRST,
 * and only THEN do the lead magnets and AI tools come in. The reasoning,
 * straight from Jess:
 *
 *   "Coming in fresh, [the lead magnets] will feel overwhelming and like
 *    they're already falling behind / not capable of doing this. Walk
 *    before they run."
 *
 * Each phase has:
 *   - A focus: the operator capability we're building this week
 *   - Suggested elapsed-time bucket (helps the UI describe what's next)
 *   - A short "what unlocks here" copy line for the portal
 *
 * The PUBLIC top-of-funnel lead magnets at /tools/* stay accessible to
 * cold visitors — those are conversion hooks, not the member experience.
 * This phase model gates what we send and surface AFTER acceptance.
 */

export type JourneyPhaseKey =
  | "foundation"
  | "prospecting"
  | "revenue_activities"
  | "problem_diagnosis"
  | "solutioning"

export interface JourneyPhase {
  key: JourneyPhaseKey
  /** Display order (1-5). Used in UI badges + copy. */
  order: 1 | 2 | 3 | 4 | 5
  /** Short label rendered as a phase pill. */
  label: string
  /** One-line focus statement shown above the phase's lessons. */
  focus: string
  /** Approximate elapsed-time window — helps members orient. */
  weekRange: string
  /** Body copy explaining what this phase builds. */
  description: string
  /** What gets unlocked once a member reaches this phase. */
  unlocks: string[]
}

export const JOURNEY_PHASES: JourneyPhase[] = [
  {
    key: "foundation",
    order: 1,
    label: "Foundation",
    focus: "Mindset + what an operator actually does",
    weekRange: "Week 1",
    description:
      "Before any tools, before any tactics: we build the operator's mental model. What it means to think problem-first. Why the work is judgment-led, not tool-led. How the room thinks. How AI fits as gasoline (not as the engine).",
    unlocks: [
      "Welcome lessons + community access",
      "AI Operator Playbook (PDF)",
      "Operator Vault (curated reading + frameworks)",
      "Live community calls",
    ],
  },
  {
    key: "prospecting",
    order: 2,
    label: "Prospecting",
    focus: "Finding businesses worth talking to",
    weekRange: "Week 2",
    description:
      "Operators need their own prospect rhythm. We learn how to define an ICP, where to find them, how to research a target before approach, and how to spot the businesses where AI actually creates leverage versus the ones still figuring out their P&L.",
    unlocks: [
      "ICP definition templates",
      "Prospecting + lead-list workflows",
      "Researching companies before outreach",
    ],
  },
  {
    key: "revenue_activities",
    order: 3,
    label: "Revenue activities",
    focus: "Outreach, conversations, getting at-bats",
    weekRange: "Week 3",
    description:
      "Now we do the work that creates pipeline: cold outreach reps, LinkedIn outreach, warm intros, conversation openers, and how to handle the awkwardness of asking strangers if their business has a problem.",
    unlocks: [
      "Cold email + LinkedIn templates",
      "Outreach sequence builder (in-portal)",
      "Conversation openers + objection handling",
    ],
  },
  {
    key: "problem_diagnosis",
    order: 4,
    label: "Problem diagnosis",
    focus: "Understanding the buyer's pain BEFORE pitching",
    weekRange: "Week 4",
    description:
      "Discovery frameworks. Mapping handoffs. Spotting the small operational fires that AI can actually fix. The discovery rule that keeps new operators from promising a solution too early. Asking the question behind the question.",
    unlocks: [
      "Discovery call framework + scripts",
      "Workflow-mapping templates",
      "Hot/warm/cold lead scoring",
    ],
  },
  {
    key: "solutioning",
    order: 5,
    label: "Solutioning",
    focus: "Now AI comes in. Diagnose first, propose second.",
    weekRange: "Week 5+",
    description:
      "ONLY now do we open the AI/tool side: the audits, the ROI calculators, the opportunity-report generators, the credit-score tool, the AI Stack Configurator. Because by this point you understand what problem you're solving — the tools are leverage, not crutches.",
    unlocks: [
      "AI Opportunity Audit (custom report generator)",
      "Website Audit",
      "ROI Calculator",
      "Executive Ops Audit",
      "Business Credit Score",
      "AI Stack Configurator",
      "All advanced lead-magnet flows",
    ],
  },
]

const PHASE_BY_KEY: Record<JourneyPhaseKey, JourneyPhase> = Object.fromEntries(
  JOURNEY_PHASES.map((p) => [p.key, p]),
) as Record<JourneyPhaseKey, JourneyPhase>

export function getPhase(key: JourneyPhaseKey): JourneyPhase {
  return PHASE_BY_KEY[key]
}

/**
 * Lead-magnet → minimum journey phase mapping.
 *
 * If a member is in a phase BELOW the minimum, the magnet is hidden
 * inside the portal and not sent via the onboarding email sequence.
 * Public-facing /tools/* URLs are unaffected — those are top-of-funnel
 * conversion hooks for cold visitors, not the member experience.
 */
export const LEAD_MAGNET_PHASE: Record<string, JourneyPhaseKey> = {
  // Foundational — appropriate from day one
  ai_playbook: "foundation",
  operator_vault: "foundation",
  w2_playbook: "foundation",
  // Prospecting-stage tools
  ai_readiness_quiz: "prospecting",
  segment_explorer: "prospecting",
  // Revenue-stage tools
  daily_signal: "revenue_activities",
  // Diagnostic / advanced — only after the operator has reps
  website_audit: "solutioning",
  roi_calculator: "solutioning",
  business_credit_score: "solutioning",
  executive_ops_audit: "solutioning",
  ai_opportunity_audit: "solutioning",
  stack_configurator: "solutioning",
}

/**
 * True if a member at `currentPhase` should see / receive `magnetKey`.
 * Compares the order of the current phase against the magnet's required
 * phase — anything at or above the required order qualifies.
 */
export function isMagnetUnlocked(
  magnetKey: string,
  currentPhase: JourneyPhaseKey,
): boolean {
  const requiredKey = LEAD_MAGNET_PHASE[magnetKey]
  if (!requiredKey) return true // unknown magnet → don't gate
  return getPhase(currentPhase).order >= getPhase(requiredKey).order
}
