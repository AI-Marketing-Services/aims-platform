// ============================================================
// Ops Excellence Configuration
// All business-configurable values live here.
// Change prices, questions, weights, labels — no code changes.
// ============================================================

// ── Engagement Tiers & Pricing ──────────────────────────────

export const ENGAGEMENT_TIERS = {
  DIAGNOSE: {
    label: "Diagnose",
    description: "Financial Clarity Package, CFO Test, V1 Score",
    pricingModel: "one-time" as const,
    price: 2500,
    features: [
      "Financial Clarity Package",
      "CFO Test Administration",
      "Tool & Vendor Inventory",
      "V1 Credit Score with Confidence Tier",
      "Unit Economics Baseline",
    ],
  },
  EXECUTE: {
    label: "Execute",
    description: "Diagnose + Process Discovery, Spend Challenge, automation builds, live dashboard",
    pricingModel: "monthly" as const,
    price: 5000,
    features: [
      "Everything in Diagnose",
      "Process Discovery Sprint",
      "Spend Challenge Waves",
      "3 Automation Builds",
      "Live Executive Dashboard",
      "Capacity ROI Tracking",
    ],
  },
  PROVE: {
    label: "Prove",
    description: "Execute + second wave automations, V2 scoring, playbook packaging",
    pricingModel: "monthly" as const,
    price: 7500,
    features: [
      "Everything in Execute",
      "Second Wave Automations (3-5 more)",
      "V2 Score with Delta Report",
      "Playbook Packaging",
      "Leadership Presentation Kit",
      "Dedicated Integrator",
    ],
  },
} as const

// ── Engagement Stage Config ─────────────────────────────────

export const ENGAGEMENT_STAGES = {
  INTAKE: {
    label: "Intake",
    description: "CEO submitted form, awaiting call",
    color: "text-yellow-400",
    bgColor: "bg-yellow-900/20",
  },
  ONBOARDING: {
    label: "Onboarding",
    description: "Call completed, gathering data",
    color: "text-blue-400",
    bgColor: "bg-blue-900/20",
  },
  PHASE_1_INSTRUMENT: {
    label: "Phase 1: Instrument",
    description: "Days 1-30: Financial Clarity + Discovery",
    color: "text-purple-400",
    bgColor: "bg-purple-900/20",
  },
  PHASE_2_EXECUTE: {
    label: "Phase 2: Execute",
    description: "Days 31-60: Spend Challenge + Automations",
    color: "text-cyan-400",
    bgColor: "bg-cyan-900/20",
  },
  PHASE_3_PROVE: {
    label: "Phase 3: Prove",
    description: "Days 61-90: Measure + Package",
    color: "text-emerald-400",
    bgColor: "bg-emerald-900/20",
  },
  ACTIVE_ONGOING: {
    label: "Active",
    description: "Post-90-day continuous engagement",
    color: "text-green-400",
    bgColor: "bg-green-900/20",
  },
  PAUSED: {
    label: "Paused",
    description: "Engagement paused",
    color: "text-muted-foreground",
    bgColor: "bg-muted/20",
  },
  COMPLETED: {
    label: "Completed",
    description: "Engagement completed",
    color: "text-muted-foreground",
    bgColor: "bg-muted/20",
  },
} as const

// ── CFO Test Questions ──────────────────────────────────────

export const CFO_TEST_QUESTIONS = [
  {
    id: "revenue_by_product",
    question: "What is your revenue by product or service line for the last 12 months?",
    greenAnswer: "Pulls up a segmented report without hesitation.",
    yellowAnswer: "Gives rough estimates or needs to check.",
    redAnswer: "Cannot break down revenue by product or service.",
  },
  {
    id: "labor_cost_by_dept",
    question: "What is your fully loaded labor cost by department?",
    greenAnswer: "Has salary plus benefits plus allocated tools by department.",
    yellowAnswer: "Knows salary totals but not fully loaded cost.",
    redAnswer: "Cannot answer or needs to ask finance.",
  },
  {
    id: "controllable_sga",
    question: "What is your controllable SG&A as a percentage of revenue?",
    greenAnswer: "Knows the number and can separate controllable from fixed.",
    yellowAnswer: "Knows total overhead but cannot isolate controllable.",
    redAnswer: "Has no SG&A visibility.",
  },
  {
    id: "customer_acquisition_cost",
    question: "What does it cost you to acquire one customer?",
    greenAnswer: "Has a real CAC number by channel, not an estimate.",
    yellowAnswer: "Has a blended estimate but no channel breakdown.",
    redAnswer: "No CAC tracking in place.",
  },
  {
    id: "cost_to_serve",
    question: "What is your cost to serve one customer per month?",
    greenAnswer: "Has loaded cost per account including support and tools.",
    yellowAnswer: "Has a rough estimate per account.",
    redAnswer: "Has never calculated this.",
  },
  {
    id: "unknown_subscriptions",
    question: "What software subscriptions are you paying for that you couldn't name their users?",
    greenAnswer: "Has a tool inventory with utilization data.",
    yellowAnswer: "Knows some tools are unused but no full audit.",
    redAnswer: "Has no centralized tool inventory.",
  },
  {
    id: "revenue_drop_plan",
    question: "If revenue dropped 20% next month, what would you cut first?",
    greenAnswer: "Has a prioritized list ready. Doesn't hesitate.",
    yellowAnswer: "Can name some cuts but needs to think through order.",
    redAnswer: "No contingency planning or prioritized cut list.",
  },
] as const

// ── Intake Form Configuration ───────────────────────────────

export const INTAKE_STEPS = [
  {
    id: "company",
    title: "Company Profile",
    description: "Tell us about your organization.",
  },
  {
    id: "leadership",
    title: "Leadership & Goals",
    description: "Who is involved and what outcomes matter most.",
  },
  {
    id: "cfo_test",
    title: "Financial Visibility Check",
    description: "A quick diagnostic on your financial clarity.",
  },
  {
    id: "technology",
    title: "Technology & Tools",
    description: "Your current tech stack and data maturity.",
  },
  {
    id: "schedule",
    title: "Next Steps",
    description: "Schedule a call and share any supporting documents.",
  },
] as const

export const REVENUE_RANGES = [
  "Under $5M",
  "$5M - $20M",
  "$20M - $50M",
  "$50M - $100M",
  "$100M - $200M",
  "$200M+",
] as const

export const EMPLOYEE_RANGES = [
  "1-10",
  "11-50",
  "51-200",
  "201-500",
  "500+",
] as const

export const OPERATING_SYSTEMS = [
  "EOS (Entrepreneurial Operating System)",
  "Scaling Up (Verne Harnish)",
  "OKRs",
  "Custom Framework",
  "None / Informal",
] as const

export const PAIN_POINTS = [
  "No visibility into actual operational costs",
  "Team is buried in repetitive manual work",
  "Too many tools that don't talk to each other",
  "Marketing spend with unclear ROI",
  "Sales pipeline is a black box",
  "No standardized processes documented",
  "Hiring without knowing true capacity needs",
  "Software subscriptions out of control",
  "Cannot produce board-ready metrics on demand",
  "AI initiatives that haven't produced measurable results",
] as const

export const COMMON_TOOLS = [
  "Salesforce",
  "HubSpot",
  "QuickBooks",
  "Xero",
  "NetSuite",
  "Slack",
  "Microsoft Teams",
  "Asana",
  "Monday.com",
  "Notion",
  "Google Workspace",
  "Microsoft 365",
  "Zapier",
  "Stripe",
  "Shopify",
  "Zendesk",
  "Intercom",
  "Mailchimp",
  "Klaviyo",
  "Tableau",
  "Looker",
] as const

export const TOOL_COUNT_RANGES = [
  "1-10",
  "11-25",
  "26-50",
  "50+",
] as const

export const DATA_MATURITY_OPTIONS = [
  {
    value: "GREEN",
    label: "Integrated",
    description: "All core tools are connected and we have dashboards.",
  },
  {
    value: "YELLOW",
    label: "Partial",
    description: "Some tools connected, some manual processes.",
  },
  {
    value: "RED",
    label: "Manual",
    description: "Most data lives in spreadsheets or people's heads.",
  },
] as const

export const AI_USAGE_OPTIONS = [
  "None",
  "Exploring / Researching",
  "Some tools in use",
  "Active deployment across departments",
] as const

// ── Scoring Configuration ───────────────────────────────────

export const SCORING_WEIGHTS = {
  financialClarity: 0.25,
  aiReadiness: 0.25,
  capacityRoi: 0.25,
  spendEfficiency: 0.25,
} as const

export const CONFIDENCE_TIERS = {
  GREEN: { label: "Green", min: 85, cap: 100, color: "text-emerald-400", bgColor: "bg-emerald-900/20" },
  YELLOW: { label: "Yellow", min: 60, cap: 80, color: "text-yellow-400", bgColor: "bg-yellow-900/20" },
  RED: { label: "Red", min: 0, cap: 60, color: "text-red-400", bgColor: "bg-red-900/20" },
} as const

// ── Complexity vs. Value Matrix ─────────────────────────────

export const TIER_DEFINITIONS = {
  1: {
    label: "Tier 1",
    description: "Low Complexity / High Value",
    action: "Build in Phase 2. Baseline first.",
    color: "text-emerald-400",
    bgColor: "bg-emerald-900/20",
  },
  2: {
    label: "Tier 2",
    description: "High Complexity / High Value",
    action: "Pipeline for Phase 3 or Q3.",
    color: "text-blue-400",
    bgColor: "bg-blue-900/20",
  },
  3: {
    label: "Tier 3",
    description: "Low Complexity / Low Value",
    action: "Batch build when capacity allows.",
    color: "text-yellow-400",
    bgColor: "bg-yellow-900/20",
  },
  4: {
    label: "Tier 4",
    description: "High Complexity / Low Value",
    action: "Park. Revisit if scale changes.",
    color: "text-muted-foreground",
    bgColor: "bg-muted/20",
  },
} as const

// ── Spend Decision Types ────────────────────────────────────

export const SPEND_DECISION_LABELS = {
  ELIMINATE: { label: "Eliminate", description: "Redundant, unused, or replaceable. Cancel.", color: "text-red-400", bgColor: "bg-red-900/20" },
  CONSOLIDATE: { label: "Consolidate", description: "Two tools do the same thing. Pick one.", color: "text-orange-400", bgColor: "bg-orange-900/20" },
  RENEGOTIATE: { label: "Renegotiate", description: "Needed but overpriced. Negotiate.", color: "text-yellow-400", bgColor: "bg-yellow-900/20" },
  JUSTIFY: { label: "Justify", description: "Needed at current price. Document.", color: "text-emerald-400", bgColor: "bg-emerald-900/20" },
} as const

// ── Dimension Display Config ────────────────────────────────

export const DIMENSION_CONFIG = {
  financialClarity: {
    label: "Financial Clarity",
    shortLabel: "FC",
    description: "Can the CEO answer basic financial questions about their own business?",
    maxScore: 25,
    color: "#C4972A",
  },
  aiReadiness: {
    label: "AI Readiness",
    shortLabel: "AI",
    description: "Are processes documented well enough for AI to act on?",
    maxScore: 25,
    color: "#60A5FA",
  },
  capacityRoi: {
    label: "Capacity ROI",
    shortLabel: "CR",
    description: "Is the time freed by automation converting to measurable output?",
    maxScore: 25,
    color: "#34D399",
  },
  spendEfficiency: {
    label: "Spend Efficiency",
    shortLabel: "SE",
    description: "Is overhead spend proportional to the revenue it supports?",
    maxScore: 25,
    color: "#A78BFA",
  },
} as const

// ── Process Frequency Labels ────────────────────────────────

export const FREQUENCY_LABELS = {
  DAILY: "Daily",
  WEEKLY: "Weekly",
  MONTHLY: "Monthly",
  AD_HOC: "Ad Hoc",
} as const

// ── Capacity Conversion Labels ──────────────────────────────

export const CAPACITY_CONVERSION_LABELS = {
  HIGHER_VALUE_WORK: {
    label: "Redirected to Higher-Value Work",
    description: "Freed time is being used for more impactful tasks.",
  },
  ABSORBED_NO_CHANGE: {
    label: "Absorbed into Existing Workload",
    description: "No visible change in how time is spent.",
  },
  NOT_VISIBLE_YET: {
    label: "Not Visible Yet",
    description: "Too early to tell how freed time is being used.",
  },
} as const

// ── Department Options ──────────────────────────────────────

export const DEPARTMENTS = [
  "Executive / Leadership",
  "Finance / Accounting",
  "Marketing",
  "Sales",
  "Operations",
  "Customer Success / Support",
  "Human Resources",
  "Engineering / IT",
  "Product",
  "Legal / Compliance",
] as const
