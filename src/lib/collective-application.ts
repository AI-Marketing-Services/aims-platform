/**
 * AI Operator Collective application questions, options, and scoring logic.
 * Shared by the client form and API validation.
 */

export interface QuestionOption {
  label: string
  value: string
  points: number
}

export interface Question {
  id: string
  question: string
  options: QuestionOption[]
}

export const QUESTIONS: Question[] = [
  {
    id: "situation",
    question: "Which best describes your current professional situation?",
    options: [
      { label: "Recently laid off or actively job searching", value: "displaced", points: 3 },
      { label: "Employed but exploring an exit", value: "exploring", points: 2 },
      { label: "Already running a business or freelancing", value: "business_owner", points: 1 },
      { label: "Student or career switcher with no corporate background", value: "student", points: 0 },
    ],
  },
  {
    id: "website",
    question: "Do you have a website for your business or personal brand?",
    options: [
      { label: "Yes, and it generates leads or revenue", value: "yes_active", points: 1 },
      { label: "Yes, but it needs work", value: "yes_needs_work", points: 2 },
      { label: "I have a domain but no real site yet", value: "domain_only", points: 3 },
      { label: "No, I need one built from scratch", value: "no_website", points: 3 },
    ],
  },
  {
    id: "ai_familiarity",
    question: "How familiar are you with AI tools like ChatGPT, Claude, or automation platforms?",
    options: [
      { label: "I use AI tools daily in my work", value: "daily", points: 2 },
      { label: "I have experimented but not consistently", value: "experimented", points: 3 },
      { label: "I understand the concepts but have not used them hands-on", value: "conceptual", points: 1 },
      { label: "Completely new to AI", value: "new", points: 0 },
    ],
  },
  {
    id: "goal",
    question: "What is your primary goal for the next 12 months?",
    options: [
      { label: "Replace my W-2 income with a services business", value: "replace_income", points: 3 },
      { label: "Build a side income stream while staying employed", value: "side_income", points: 2 },
      { label: "Learn AI skills to advance my current career", value: "career_advance", points: 1 },
      { label: "General curiosity, no specific goal yet", value: "curious", points: 0 },
    ],
  },
  {
    id: "experience",
    question: "How many years of professional or industry experience do you have?",
    options: [
      { label: "10+ years in a specific domain", value: "10_plus", points: 3 },
      { label: "5 to 9 years of professional experience", value: "5_to_9", points: 2 },
      { label: "2 to 4 years of experience", value: "2_to_4", points: 1 },
      { label: "Less than 2 years", value: "less_than_2", points: 0 },
    ],
  },
  {
    id: "timeline",
    question: "How quickly are you looking to generate revenue from an AI services business?",
    options: [
      { label: "Within the next 30 to 60 days", value: "30_60_days", points: 3 },
      { label: "Within 3 to 6 months", value: "3_6_months", points: 2 },
      { label: "Within a year", value: "within_year", points: 1 },
      { label: "No specific timeline", value: "no_timeline", points: 0 },
    ],
  },
  {
    id: "decision_maker",
    question: "Are you the decision-maker when it comes to investing in your professional development?",
    options: [
      { label: "Yes, I make all my own investment decisions", value: "sole_decision", points: 3 },
      { label: "Yes, but I would want to discuss with a partner or spouse first", value: "discuss_first", points: 2 },
      { label: "I would need approval from someone else", value: "need_approval", points: 1 },
      { label: "I am not in a position to invest right now", value: "not_ready", points: 0 },
    ],
  },
  {
    id: "budget",
    question: "What is your budget range for a structured business-building program?",
    options: [
      { label: "$2,000 to $5,000+ for the right program", value: "2k_5k_plus", points: 3 },
      { label: "$500 to $2,000", value: "500_2k", points: 2 },
      { label: "Under $500", value: "under_500", points: 1 },
      { label: "I am only looking for free resources", value: "free_only", points: 0 },
    ],
  },
  {
    id: "priority",
    question: "What matters most to you in a program like this?",
    options: [
      { label: "Accountability and access to experienced operators", value: "accountability", points: 3 },
      { label: "A proven step-by-step system I can follow", value: "system", points: 2 },
      { label: "Networking and community", value: "networking", points: 1 },
      { label: "Just the AI tools and templates", value: "tools_only", points: 0 },
    ],
  },
]

export const MAX_RAW_SCORE = QUESTIONS.length * 3 // 24

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

  if (rawScore >= 19) {
    tier = "hot"
    priority = "HIGH"
  } else if (rawScore >= 12) {
    tier = "warm"
    priority = "HIGH"
  } else if (rawScore >= 6) {
    tier = "cold"
    priority = "MEDIUM"
  } else {
    tier = "cold"
    priority = "LOW"
  }

  const reason = `Application score: ${rawScore}/${MAX_RAW_SCORE} (${normalizedScore}%). Tier: ${tier}.`

  return { rawScore, normalizedScore, tier, priority, reason }
}
