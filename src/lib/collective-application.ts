/**
 * AI Operator Collective application questions, scoring, calendar routing,
 * and personalization logic.
 *
 * Source of truth for the form (ApplyForm.tsx + EmbedApplyForm.tsx) and
 * the API validator at /api/community/apply.
 *
 * Refreshed per Jess's typeform-application-spec.md (2026-05-06):
 *  - 10 application questions (was 5).
 *  - Three-tier routing: Green (book a call), Yellow (we'll review +
 *    follow up), Red/Nurture (waitlist).
 *  - Hard gates that drop applicants into Yellow/Red regardless of
 *    numeric score: hours <5/wk, refusal of outreach, refusal of sales
 *    conversations, or "not ready to invest" → Yellow or Red.
 *  - Internal tier names (hot/warm/cold) preserved for downstream
 *    compatibility — they are mapped from the public routing tier:
 *    green↔hot, yellow↔warm, red↔cold.
 */

export interface QuestionOption {
  label: string
  value: string
  points: number
}

export interface Question {
  id: string
  question: string
  description: string
  /** "single" (default) or "multi" — multi rendered as checkboxes. */
  selection?: "single" | "multi"
  /** Single-line free-text follow-up (rendered when this option is selected). */
  followUp?: { whenValue: string; question: string; minLength?: number }
  /** Top-level free-text input attached to the question (e.g. "Why now?"). */
  text?: { question: string; description?: string; minLength?: number }
  options: QuestionOption[]
  allowOther?: boolean
}

/**
 * 10-question application aligned to the Jess spec.
 *
 * Scoring is intentionally light — the routing tier is determined more
 * by hard gates (hours, outreach willingness, sales comfort, investment
 * readiness) than by a raw point total.
 */
export const QUESTIONS: Question[] = [
  {
    id: "current_role",
    question: "Which best describes you right now?",
    description:
      "Helps us understand where you're starting from. We don't gate on this — every background can become a strong operator.",
    options: [
      { label: "W2 employee", value: "w2", points: 2 },
      { label: "Between roles / recently laid off", value: "between_roles", points: 2 },
      { label: "Freelancer or consultant", value: "freelancer", points: 2 },
      { label: "Agency owner", value: "agency_owner", points: 2 },
      { label: "Other", value: "other", points: 1 },
    ],
    allowOther: true,
  },
  {
    id: "why_now",
    question: "What made you look at the AI Operator Collective now?",
    description:
      "20-30 characters, in your own words. We use this to score intent and prep for the call.",
    text: {
      question: "Why now?",
      minLength: 20,
    },
    // The text answer is the real signal here; options are required by the
    // form widget but a single placeholder option keeps scoring stable.
    options: [
      { label: "Submit", value: "submitted", points: 2 },
    ],
  },
  {
    id: "hours_per_week",
    question:
      "How many hours per week can you realistically commit over the next 30 days?",
    description:
      "The Collective is an apprenticeship, not a passive course. Real reps need real hours.",
    options: [
      { label: "0–4 hours", value: "0_4", points: 0 },
      { label: "5–9 hours", value: "5_9", points: 1 },
      { label: "10–14 hours", value: "10_14", points: 3 },
      { label: "15+ hours", value: "15_plus", points: 3 },
    ],
  },
  {
    id: "build_toward",
    question: "What are you trying to build toward first?",
    description:
      "There's no wrong answer — this just helps us know where to start with you.",
    options: [
      {
        label: "Better AI / operator judgment in my current role",
        value: "judgment_in_role",
        points: 2,
      },
      {
        label: "My first credible client conversations",
        value: "first_conversations",
        points: 2,
      },
      { label: "My first paid client", value: "first_paid_client", points: 2 },
      {
        label: "Better delivery for existing clients",
        value: "delivery_quality",
        points: 2,
      },
      {
        label: "I am still figuring that out",
        value: "still_figuring_out",
        points: 1,
      },
    ],
  },
  {
    id: "outreach_willingness",
    question:
      "Are you willing to practice finding and reaching out to businesses that may need help?",
    description:
      "Operators have to find their own opportunities. The Collective will give you the structure and reps — but the willingness has to come from you.",
    options: [
      { label: "Yes, I will do it", value: "yes_will_do", points: 3 },
      {
        label: "Yes, if I have a clear process",
        value: "yes_with_process",
        points: 3,
      },
      {
        label: "I am nervous, but willing to practice",
        value: "nervous_willing",
        points: 2,
      },
      {
        label: "No, I do not want to do outreach",
        value: "no_outreach",
        points: 0,
      },
    ],
  },
  {
    id: "industries",
    question:
      "Which industries or business types do you already understand or have access to?",
    description:
      "Pick all that apply. We use this to tailor your call — we never gate on industry alone.",
    selection: "multi",
    options: [
      { label: "Healthcare", value: "healthcare", points: 1 },
      { label: "Home services", value: "home_services", points: 1 },
      { label: "Real estate", value: "real_estate", points: 1 },
      { label: "Local retail", value: "local_retail", points: 1 },
      { label: "Professional services", value: "professional_services", points: 1 },
      { label: "E-commerce", value: "ecommerce", points: 1 },
      { label: "Manufacturing", value: "manufacturing", points: 1 },
      { label: "Finance / accounting", value: "finance_accounting", points: 1 },
      { label: "Marketing / sales teams", value: "marketing_sales", points: 1 },
      {
        label: "Operations-heavy businesses",
        value: "operations_heavy",
        points: 1,
      },
      { label: "Other", value: "other", points: 1 },
    ],
    allowOther: true,
  },
  {
    id: "tried_before",
    question:
      "What have you already tried to create opportunities or clients?",
    description: "Pick all that apply.",
    selection: "multi",
    followUp: {
      whenValue: "*", // always show the follow-up after this question
      question:
        "Add any context that would help us understand what happened.",
      minLength: 10,
    },
    options: [
      { label: "Nothing yet", value: "nothing_yet", points: 0 },
      { label: "Referrals / network", value: "referrals", points: 2 },
      { label: "LinkedIn outreach", value: "linkedin", points: 2 },
      { label: "Cold email", value: "cold_email", points: 2 },
      { label: "Cold DM", value: "cold_dm", points: 2 },
      { label: "Upwork / Fiverr", value: "marketplaces", points: 1 },
      { label: "Paid ads", value: "paid_ads", points: 1 },
      { label: "I already have clients", value: "have_clients", points: 3 },
    ],
  },
  {
    id: "discovery_comfort",
    question:
      "How comfortable are you having business discovery conversations?",
    description:
      "The job is asking better questions, not pitching harder. We'll teach the framework, but the willingness has to be there.",
    options: [
      { label: "Comfortable", value: "comfortable", points: 3 },
      {
        label: "I can do it with a framework",
        value: "with_framework",
        points: 3,
      },
      {
        label: "Nervous, but willing to practice",
        value: "nervous_willing",
        points: 2,
      },
      {
        label: "I do not want to do sales conversations",
        value: "no_sales",
        points: 0,
      },
    ],
  },
  {
    id: "operator_traits",
    question:
      "Which operator traits feel most natural to you right now?",
    description:
      "Pick the ones that genuinely sound like you — not what you think we want to hear.",
    selection: "multi",
    options: [
      { label: "Curiosity", value: "curiosity", points: 1 },
      { label: "High agency", value: "high_agency", points: 1 },
      { label: "Systems thinking", value: "systems_thinking", points: 1 },
      { label: "Clear communication", value: "clear_communication", points: 1 },
      { label: "Follow-through", value: "follow_through", points: 1 },
      {
        label: "Comfort with ambiguity",
        value: "comfort_ambiguity",
        points: 1,
      },
    ],
  },
  {
    id: "investment_readiness",
    question:
      "If the Collective is a strategic fit, are you prepared to invest time, effort, and money to start now?",
    description:
      "Pricing is shared with qualified applicants on the call. This is just about readiness, not commitment.",
    options: [
      { label: "Yes, I am ready", value: "ready", points: 3 },
      { label: "I need a few details first", value: "need_details", points: 2 },
      { label: "Not right now", value: "not_now", points: 0 },
    ],
  },
]

/* -------------------------------------------------------------------------- */
/*  Scoring + 3-tier routing                                                   */
/* -------------------------------------------------------------------------- */

/**
 * Max raw score across all single-select scored options.
 *
 * Most-points-per-question mapping:
 *   current_role:           2
 *   why_now (text):         2 (placeholder option)
 *   hours_per_week:         3
 *   build_toward:           2
 *   outreach_willingness:   3
 *   discovery_comfort:      3
 *   investment_readiness:   3
 * (Multi-select questions excluded — their points are caller-summed below.)
 *
 * Total: 18.
 */
export const MAX_RAW_SCORE = 18

/** Public tier the spec uses: green (book), yellow (we'll review), red (nurture). */
export type RoutingTier = "green" | "yellow" | "red"

/** Internal tier preserved for backward-compat with email/notify code. */
export type LegacyTier = "hot" | "warm" | "cold"

const ROUTING_TO_LEGACY: Record<RoutingTier, LegacyTier> = {
  green: "hot",
  yellow: "warm",
  red: "cold",
}

export function calculateScore(answers: Record<string, string | string[]>) {
  let rawScore = 0

  for (const q of QUESTIONS) {
    const selected = answers[q.id]
    if (q.selection === "multi" && Array.isArray(selected)) {
      // Multi-select: cap at 2 to avoid runaway "I picked everything" scores.
      const matched = q.options.filter((o) => selected.includes(o.value))
      const sum = matched.reduce((acc, o) => acc + o.points, 0)
      rawScore += Math.min(sum, 2)
    } else if (typeof selected === "string") {
      const option = q.options.find((o) => o.value === selected)
      if (option) rawScore += option.points
    }
  }

  const normalizedScore = Math.round((rawScore / MAX_RAW_SCORE) * 100)

  /* ── Hard gates (Jess spec) ──────────────────────────────────────
   *
   * Any of these → Red / nurture. We do not let a high numeric score
   * override these — the spec is explicit that operators who refuse
   * outreach or sales are not the right fit, regardless of polish.
   */
  const hours = answers.hours_per_week
  const outreach = answers.outreach_willingness
  const discovery = answers.discovery_comfort
  const investment = answers.investment_readiness

  let routingTier: RoutingTier
  if (
    hours === "0_4" ||
    outreach === "no_outreach" ||
    discovery === "no_sales"
  ) {
    routingTier = "red"
  } else if (investment === "not_now") {
    // Spec says "Not right now" routes to nurture — call it red so the
    // copy on the outcome page matches.
    routingTier = "red"
  } else if (hours === "5_9") {
    // Slower path — still allowed through but flagged for the team.
    routingTier = "yellow"
  } else if (normalizedScore >= 70) {
    routingTier = "green"
  } else if (normalizedScore >= 45) {
    routingTier = "yellow"
  } else {
    routingTier = "red"
  }

  const tier: LegacyTier = ROUTING_TO_LEGACY[routingTier]
  const priority: "HIGH" | "MEDIUM" | "LOW" =
    routingTier === "green" ? "HIGH" : routingTier === "yellow" ? "MEDIUM" : "LOW"

  const reason = `Application score: ${rawScore}/${MAX_RAW_SCORE} (${normalizedScore}%). Tier: ${tier} (routing=${routingTier}).`

  return { rawScore, normalizedScore, tier, routingTier, priority, reason }
}

/* -------------------------------------------------------------------------- */
/*  Calendar routing                                                           */
/* -------------------------------------------------------------------------- */

/**
 * Single AI Operator Collective consult calendar. Every tier books the
 * same link — no more tier-routing between Matt and Ryan, no more
 * accidental fallbacks to breakthroughclosing.com. Override with
 * NEXT_PUBLIC_CALENDLY_AOC if we ever need to swap it instance-wide.
 */
export const CALENDLY_AOC =
  process.env.NEXT_PUBLIC_CALENDLY_AOC ??
  "https://calendly.com/d/cvnj-4rm-9t6/ai-operator-collective-consult-call"

// Kept for callers that still import these names. Both alias the single
// AOC consult link so removing the old per-operator routing never
// silently drops a lead onto a stale calendar.
export const CALENDLY_MATT = CALENDLY_AOC
export const CALENDLY_RYAN = CALENDLY_AOC
export const CAL_LINK = CALENDLY_AOC

export function getCalendarUrl(_tier: LegacyTier) {
  return CALENDLY_AOC
}

export function getCalendarOwner(_tier: LegacyTier) {
  return "the AI Operator Collective team"
}

/**
 * Should this applicant see the Calendly embed on the success page?
 *
 * UPDATED: every completed application lands on the calendar. The
 * original spec gated the calendar to green-tier only — yellow/red
 * saw a "we'll follow up" or nurture screen instead. In practice that
 * was a dead end: applicants who finished the entire questionnaire
 * (real intent signal) hit a "thanks, bye" screen and never re-engaged.
 * Jess (a clear ideal-fit applicant) tripped the slow-path yellow gate
 * and lost the booking — that was the trigger for this change.
 *
 * The internal tier (hot/warm/cold) and routingTier are still computed
 * and stored on the Deal, so the team can prioritise who to actually
 * attend the call with from the CRM. The user-facing experience is now
 * uniform: complete the form → book a call → real human reads the
 * questionnaire and decides whether to keep, defer, or decline.
 */
export function shouldShowCalendar(_routingTier: RoutingTier): boolean {
  return true
}

/* -------------------------------------------------------------------------- */
/*  Personalization helpers (used by form components)                           */
/* -------------------------------------------------------------------------- */

/**
 * Returns a short, conversational lead-in shown above each question.
 * Dynamically references the applicant's name and prior answers.
 */
export function getStepIntro(
  questionIndex: number,
  firstName: string,
  answers: Record<string, string | string[]>,
): string {
  switch (questionIndex) {
    case 0:
      return `Hey ${firstName}, let's start with where you are right now.`
    case 1:
      return `Tell me what's pulling you toward the Collective.`
    case 2: {
      const role = answers.current_role
      if (role === "between_roles")
        return `Got it. Let's talk about how much time you can really commit.`
      return "Quick reality-check on your time."
    }
    case 3:
      return `Where do you want to land first?`
    case 4:
      return `This one's important, ${firstName}. Be honest with yourself.`
    case 5:
      return `Helps us tailor the call to where you already have context.`
    case 6:
      return `What you've already tried tells us a lot about your starting point.`
    case 7:
      return `Sales conversations — how do you feel about them?`
    case 8:
      return `Now the operator-traits question. Pick the ones that genuinely sound like you.`
    case 9:
      return `Last one, ${firstName}. The honest one.`
    default:
      return ""
  }
}

/**
 * Returns the heading + subheading for the calendar booking step,
 * personalized by score tier and answers.
 */
export function getCalendarIntro(
  firstName: string,
  tier: LegacyTier,
  _answers: Record<string, string | string[]>,
): { heading: string; subheading: string } {
  if (tier === "hot") {
    return {
      heading: `${firstName}, you look like a strong fit.`,
      subheading: `Pick a time that works and we'll have a strategic fit conversation about your goals, your timeline, and where the Collective can help.`,
    }
  }

  return {
    heading: `Thanks for applying, ${firstName}.`,
    subheading: `Let's get on a call to see if the Collective is the right next room for you.`,
  }
}

/**
 * Outcome-page copy for non-green applicants — yellow ("we'll review")
 * and red ("nurture / waitlist"). Matches the spec word-for-word.
 */
export function getOutcomeMessage(
  firstName: string,
  routingTier: RoutingTier,
): { heading: string; body: string; cta?: { label: string; href: string } } {
  if (routingTier === "yellow") {
    return {
      heading: `Thanks for applying, ${firstName}.`,
      body: "We'll review your responses and follow up with the best next step. The Collective is selective on purpose — we'll get back to you within a few days.",
    }
  }
  return {
    heading: `Thanks for sharing where you are, ${firstName}.`,
    body: "The Collective may not be the right next room yet, but we can send you resources and updates as the next cohort develops. No hard feelings — most great operators get here in their own time.",
    cta: { label: "Send me the resources", href: "/tools" },
  }
}

/** Intro shown above the contact-details step (after qualifying questions). */
export function getContactIntro(
  firstName: string,
  normalizedScore: number,
): string {
  if (normalizedScore >= 70)
    return `${firstName}, strong answers. Just a few details to wrap up.`
  return `Thanks ${firstName}. Last few details and we're done.`
}

/* -------------------------------------------------------------------------- */
/*  Allowed countries (US / Canada / UK)                                       */
/* -------------------------------------------------------------------------- */

export const ALLOWED_COUNTRIES = [
  { label: "United States", value: "US" },
  { label: "Canada", value: "CA" },
  { label: "United Kingdom", value: "UK" },
] as const

export type CountryCode = (typeof ALLOWED_COUNTRIES)[number]["value"]
