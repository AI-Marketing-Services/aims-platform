import type { QuizQuestion } from "./types"

// Default AI Audit template — F1-F5 firmographics, B1 budget, Q6-Q8 open-ended.
// Sourced directly from the operator-facing template the team uses today.
export const AI_AUDIT_TEMPLATE_QUESTIONS: QuizQuestion[] = [
  {
    id: "f1_role",
    label: "What's your role?",
    type: "single_select",
    required: true,
    options: [
      { id: "founder_ceo", label: "Founder / CEO" },
      { id: "exec_leader", label: "Executive / Department Lead" },
      { id: "manager", label: "Manager / Operator" },
      { id: "ic", label: "Individual Contributor" },
      { id: "consultant", label: "Consultant / Advisor" },
      { id: "other", label: "Other" },
    ],
  },
  {
    id: "f2_revenue",
    label: "What's your company's annual revenue?",
    type: "single_select",
    required: true,
    options: [
      { id: "under_500k", label: "Under $500K" },
      { id: "500k_2m", label: "$500K – $2M" },
      { id: "2m_10m", label: "$2M – $10M" },
      { id: "10m_50m", label: "$10M – $50M" },
      { id: "50m_plus", label: "$50M+" },
    ],
  },
  {
    id: "f3_employees",
    label: "How many full-time employees do you have?",
    type: "single_select",
    required: true,
    options: [
      { id: "1_5", label: "1 – 5" },
      { id: "6_25", label: "6 – 25" },
      { id: "26_100", label: "26 – 100" },
      { id: "101_500", label: "101 – 500" },
      { id: "500_plus", label: "500+" },
    ],
  },
  {
    id: "f4_industry",
    label: "What's your primary industry?",
    type: "short_text",
    required: true,
    placeholder: "e.g. SaaS, e-commerce, professional services",
  },
  {
    id: "f5_growth",
    label: "What's your company's revenue growth rate over the last 12 months?",
    type: "single_select",
    required: true,
    options: [
      { id: "declining", label: "Declining" },
      { id: "flat", label: "Flat" },
      { id: "0_25", label: "Growing 0 – 25%" },
      { id: "25_100", label: "Growing 25 – 100%" },
      { id: "100_plus", label: "Growing 100%+" },
    ],
  },
  {
    id: "b1_software_spend",
    label:
      "Roughly what does your company spend annually on software, SaaS subscriptions, and tools?",
    helper: "Don't have to be exact.",
    type: "single_select",
    required: true,
    options: [
      { id: "under_25k", label: "Under $25K" },
      { id: "25k_100k", label: "$25K – $100K" },
      { id: "100k_500k", label: "$100K – $500K" },
      { id: "500k_2m", label: "$500K – $2M" },
      { id: "2m_plus", label: "$2M+" },
    ],
  },
  {
    id: "q6_blind_metric",
    label:
      "What's the one number in your business you wish you could see clearly today but can't?",
    helper: "Optional, but it helps us tailor your follow-up.",
    type: "long_text",
    required: false,
    placeholder: "e.g. true cost-per-lead by channel, real-time gross margin…",
  },
  {
    id: "q7_unlock",
    label:
      "If AI could take one thing off your team's plate that would unlock the most growth or save the most pain, what would it be?",
    helper: "Optional, but it helps us tailor your follow-up.",
    type: "long_text",
    required: false,
    placeholder: "e.g. inbox triage, proposal generation, lead qualification…",
  },
  {
    id: "q8_success",
    label:
      "Twelve months from now, what does success look like for your business as an AI-enabled operation?",
    helper: "Optional, but it helps us tailor your follow-up.",
    type: "long_text",
    required: false,
    placeholder: "e.g. 30% lift in close rate, 50% less manual reporting…",
  },
]

export const DEFAULT_QUIZ_DEFAULTS = {
  title: "AI Audit",
  subtitle:
    "9 quick questions to see where AI can save you the most time and unlock the most growth.",
  ctaLabel: "Start the Audit",
  successHeadline: "Thanks — we've got it.",
  successMessage:
    "We'll review your answers and send a tailored set of recommendations to your inbox shortly.",
}
