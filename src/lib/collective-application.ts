/**
 * AI Operator Collective application questions, scoring, calendar routing,
 * and personalization logic.
 *
 * Shared by the client form components and the API validation route.
 *
 * Flow order (VP-flip model):
 *   1. Name + email (minimal friction)
 *   2–6. Qualifying questions with dynamic personalization
 *   7. Contact details (phone, zip, country, SMS consent)
 *   8. Score-based Calendly routing
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
  options: QuestionOption[]
  allowOther?: boolean
}

export const QUESTIONS: Question[] = [
  {
    id: "timeline",
    question: "When are you looking to make a move?",
    description:
      "Tells us your timeline so we can match you to the right cohort start date.",
    options: [
      { label: "Right now — I need this yesterday", value: "right_now", points: 3 },
      { label: "Within the next 30 days", value: "within_30", points: 3 },
      { label: "Next 60–90 days", value: "next_60_90", points: 2 },
      { label: "Just researching for now", value: "researching", points: 0 },
    ],
  },
  {
    id: "revenue_goal",
    question: "How much monthly consulting revenue are you aiming to generate?",
    description:
      "Helps us understand your goal so we can show you exactly what it takes to get there.",
    options: [
      { label: "$2,000 – $5,000 / mo", value: "2k_5k", points: 1 },
      { label: "$5,000 – $10,000 / mo", value: "5k_10k", points: 2 },
      { label: "$10,000 – $20,000 / mo", value: "10k_20k", points: 3 },
      { label: "$20,000+ / mo", value: "20k_plus", points: 3 },
    ],
  },
  {
    id: "investment",
    question:
      "What are you comfortable investing per month to build this business?",
    description:
      "We\u2019re upfront: this is a professional program, not a $97 course. We ask so neither side wastes time if it\u2019s not the right fit financially.",
    options: [
      { label: "Under $200 / mo", value: "under_200", points: 0 },
      { label: "$200 – $500 / mo", value: "200_500", points: 1 },
      { label: "$500 – $1,000 / mo", value: "500_1k", points: 2 },
      { label: "$1,000+ / mo", value: "1k_plus", points: 3 },
    ],
  },
  {
    id: "decision_maker",
    question:
      "Is this your decision to make, or do you need to loop someone else in?",
    description:
      "Not a trick question — helps us know whether to have one conversation or two.",
    options: [
      { label: "My decision entirely", value: "my_decision", points: 3 },
      {
        label: "I\u2019ll want to run it by my partner / spouse",
        value: "partner_spouse",
        points: 2,
      },
      { label: "I need to check finances first", value: "check_finances", points: 1 },
    ],
  },
  {
    id: "background",
    question:
      "What best describes your current or most recent professional background?",
    description:
      "Helps us match you with the right advisors and use cases from day one.",
    allowOther: true,
    options: [
      { label: "Technology / Software / IT", value: "technology", points: 3 },
      { label: "Sales / Business Development", value: "sales", points: 3 },
      {
        label: "Consulting / Professional Services",
        value: "consulting",
        points: 3,
      },
      {
        label: "Marketing / Advertising / Communications",
        value: "marketing",
        points: 2,
      },
      { label: "Finance / Accounting / Banking", value: "finance", points: 2 },
      {
        label: "Operations / Supply Chain / Logistics",
        value: "operations",
        points: 2,
      },
      { label: "Real Estate", value: "real_estate", points: 2 },
      { label: "Healthcare / Life Sciences", value: "healthcare", points: 1 },
      { label: "Legal / Compliance / HR", value: "legal", points: 1 },
      { label: "Other", value: "other", points: 1 },
    ],
  },
]

/* -------------------------------------------------------------------------- */
/*  Scoring                                                                    */
/* -------------------------------------------------------------------------- */

export const MAX_RAW_SCORE = 15 // 3 + 3 + 3 + 3 + 3

export function calculateScore(answers: Record<string, string>) {
  let rawScore = 0

  for (const q of QUESTIONS) {
    const selected = answers[q.id]
    const option = q.options.find((o) => o.value === selected)
    if (option) {
      rawScore += option.points
    }
  }

  const normalizedScore = Math.round((rawScore / MAX_RAW_SCORE) * 100)

  let tier: "hot" | "warm" | "cold"
  let priority: "HIGH" | "MEDIUM" | "LOW"

  if (normalizedScore >= 80) {
    tier = "hot"
    priority = "HIGH"
  } else if (normalizedScore >= 47) {
    tier = "warm"
    priority = "MEDIUM"
  } else {
    tier = "cold"
    priority = "LOW"
  }

  const reason = `Application score: ${rawScore}/${MAX_RAW_SCORE} (${normalizedScore}%). Tier: ${tier}.`

  return { rawScore, normalizedScore, tier, priority, reason }
}

/* -------------------------------------------------------------------------- */
/*  Calendar routing                                                           */
/* -------------------------------------------------------------------------- */

/**
 * Calendly routing.
 * - Hot tier (score ≥ 80) → Matt (most qualified leads, senior closer)
 * - Warm / cold tier       → Ryan
 *
 * Override per-operator via NEXT_PUBLIC_CALENDLY_MATT / NEXT_PUBLIC_CALENDLY_RYAN.
 */
export const CALENDLY_MATT =
  process.env.NEXT_PUBLIC_CALENDLY_MATT ??
  "https://calendly.com/matt-breakthroughclosing"

export const CALENDLY_RYAN =
  process.env.NEXT_PUBLIC_CALENDLY_RYAN ??
  "https://calendly.com/ryan-breakthroughclosing"

// Default link used before tier is known (e.g. step-1 previews). Points at
// Ryan because unqualified prospects shouldn't eat Matt's calendar.
export const CAL_LINK = CALENDLY_RYAN

export function getCalendarUrl(tier: "hot" | "warm" | "cold") {
  return tier === "hot" ? CALENDLY_MATT : CALENDLY_RYAN
}

export function getCalendarOwner(tier: "hot" | "warm" | "cold") {
  return tier === "hot" ? "Matt" : "Ryan"
}

/* -------------------------------------------------------------------------- */
/*  Personalization helpers (used by form components)                           */
/* -------------------------------------------------------------------------- */

const REVENUE_LABELS: Record<string, string> = {
  "2k_5k": "$2K–$5K/mo",
  "5k_10k": "$5K–$10K/mo",
  "10k_20k": "$10K–$20K/mo",
  "20k_plus": "$20K+/mo",
}

/**
 * Returns a short, conversational lead-in shown above each question.
 * Dynamically references the applicant's name and prior answers.
 */
export function getStepIntro(
  questionIndex: number,
  firstName: string,
  answers: Record<string, string>
): string {
  switch (questionIndex) {
    case 0: // Timeline
      return `Hey ${firstName}, let\u2019s start with timing.`

    case 1: {
      // Revenue goal — reference timeline
      const t = answers.timeline
      if (t === "right_now" || t === "within_30")
        return `Love the urgency, ${firstName}. Let\u2019s talk goals.`
      if (t === "next_60_90")
        return `Good timing. Let\u2019s talk about where you\u2019re headed.`
      return "Smart to do your homework. Where are you aiming?"
    }

    case 2: {
      // Investment — reference revenue goal
      const r = answers.revenue_goal
      const label = REVENUE_LABELS[r] ?? "your target"
      if (r === "20k_plus" || r === "10k_20k")
        return `${label} \u2014 you\u2019re thinking big. Let\u2019s talk investment.`
      return `Shooting for ${label}. One more on the financial side \u2014`
    }

    case 3: // Decision maker
      return `Almost there, ${firstName}. Quick logistical question.`

    case 4: // Background
      return `Last one, ${firstName}. This helps us match you with the right advisors.`

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
  tier: "hot" | "warm" | "cold",
  answers: Record<string, string>
): { heading: string; subheading: string } {
  const bgOption = QUESTIONS.find((q) => q.id === "background")?.options.find(
    (o) => o.value === answers.background
  )
  const bgLabel = bgOption ? bgOption.label.toLowerCase() : "your field"

  if (tier === "hot") {
    return {
      heading: `${firstName}, you look like a strong fit.`,
      subheading: `Based on your timeline, goals, and background in ${bgLabel}, we\u2019re connecting you with Matt Miller \u2014 one of our senior operators \u2014 for a strategy call.`,
    }
  }

  return {
    heading: `Great application, ${firstName}.`,
    subheading: `Let\u2019s get you on a call with Ryan to explore how the Collective can help you hit your goals.`,
  }
}

/** Intro shown above the contact-details step (after qualifying questions). */
export function getContactIntro(
  firstName: string,
  normalizedScore: number
): string {
  if (normalizedScore >= 80)
    return `${firstName}, you\u2019re looking like a strong candidate. Just a few more details to complete your application.`
  return `Great answers, ${firstName}. Let\u2019s get your details to wrap things up.`
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
