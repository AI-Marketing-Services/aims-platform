export type ToolCategory =
  | "automation"
  | "outreach"
  | "content"
  | "research"
  | "finance"
  | "ops"

export type UnlockGate =
  | "free"               // Always visible
  | "onboarding:50"      // 50%+ onboarding done
  | "onboarding:100"     // Full onboarding complete
  | "crm:active_deal"    // Has at least one ACTIVE_RETAINER deal

export interface Tool {
  id: string
  name: string
  tagline: string
  description: string
  url: string
  logoEmoji: string
  category: ToolCategory
  gate: UnlockGate
  badge?: "New" | "Popular" | "Beta"
  isPaid?: boolean
  affiliateUrl?: string
}

export const TOOL_MANIFEST: Tool[] = [
  // ── FREE TIER ──────────────────────────────────────────────
  {
    id: "chatgpt",
    name: "ChatGPT",
    tagline: "General-purpose AI assistant",
    description:
      "The starting point for most AI operators. Use GPT-4 for client strategy, email drafts, research, and rapid prototyping.",
    url: "https://chatgpt.com",
    logoEmoji: "🤖",
    category: "automation",
    gate: "free",
    badge: "Popular",
  },
  {
    id: "claude",
    name: "Claude",
    tagline: "Anthropic's AI — best for long documents",
    description:
      "200K context window makes Claude the go-to for analyzing lengthy contracts, RFPs, and documents. Better at nuanced writing than GPT.",
    url: "https://claude.ai",
    logoEmoji: "🧠",
    category: "content",
    gate: "free",
    badge: "Popular",
  },
  {
    id: "perplexity",
    name: "Perplexity",
    tagline: "AI-powered research with citations",
    description:
      "Replace manual research. Use Perplexity to quickly qualify prospects, research industries, and surface competitive intel with source links.",
    url: "https://perplexity.ai",
    logoEmoji: "🔍",
    category: "research",
    gate: "free",
  },
  {
    id: "notion-ai",
    name: "Notion AI",
    tagline: "AI-enhanced project management",
    description:
      "Build your client delivery SOPs, project trackers, and knowledge bases with AI-assisted writing and summarization built in.",
    url: "https://notion.so",
    logoEmoji: "📝",
    category: "ops",
    gate: "free",
  },
  {
    id: "zapier",
    name: "Zapier",
    tagline: "Connect apps without code",
    description:
      "The bread-and-butter automation tool. Connect 7,000+ apps for client workflows — lead routing, CRM updates, notification pipelines.",
    url: "https://zapier.com",
    logoEmoji: "⚡",
    category: "automation",
    gate: "free",
    badge: "Popular",
  },

  // ── ONBOARDING 50% ──────────────────────────────────────────
  {
    id: "make",
    name: "Make (Integromat)",
    tagline: "Visual workflow automation",
    description:
      "More powerful than Zapier for complex multi-step flows. Visual canvas makes it easier to show clients what you built. Better pricing at scale.",
    url: "https://make.com",
    logoEmoji: "🔧",
    category: "automation",
    gate: "onboarding:50",
    badge: "Popular",
  },
  {
    id: "n8n",
    name: "n8n",
    tagline: "Self-hostable automation — max flexibility",
    description:
      "Open-source automation with 400+ integrations. Self-host for clients who need data sovereignty, or use n8n cloud for quick deploys.",
    url: "https://n8n.io",
    logoEmoji: "🔗",
    category: "automation",
    gate: "onboarding:50",
  },
  {
    id: "instantly",
    name: "Instantly",
    tagline: "Cold email at scale",
    description:
      "Unlimited sending accounts, AI personalization, and deliverability tools. Use for your own outreach or as a billable service for clients.",
    url: "https://instantly.ai",
    logoEmoji: "📧",
    category: "outreach",
    gate: "onboarding:50",
    isPaid: true,
  },
  {
    id: "apify",
    name: "Apify",
    tagline: "Web scraping & data extraction",
    description:
      "Scrape Google Maps, LinkedIn, directories, and competitors at scale. Build lead lists and feed them into your CRM or outreach tools automatically.",
    url: "https://apify.com",
    logoEmoji: "🕷️",
    category: "research",
    gate: "onboarding:50",
  },
  {
    id: "descript",
    name: "Descript",
    tagline: "AI video & podcast editing",
    description:
      "Edit video like a Word doc. Remove filler words automatically, generate transcripts, and produce client-facing demos and walkthroughs fast.",
    url: "https://descript.com",
    logoEmoji: "🎬",
    category: "content",
    gate: "onboarding:50",
    badge: "New",
  },
  {
    id: "loom",
    name: "Loom",
    tagline: "Async video for client communication",
    description:
      "Record walkthroughs, onboarding videos, and delivery updates. Clients love seeing your face — it builds trust and reduces back-and-forth.",
    url: "https://loom.com",
    logoEmoji: "🎥",
    category: "ops",
    gate: "onboarding:50",
  },

  // ── ONBOARDING 100% ─────────────────────────────────────────
  {
    id: "vapi",
    name: "Vapi",
    tagline: "AI voice agents",
    description:
      "Build inbound/outbound AI voice agents in minutes. Charge $500–$2,000/mo for AI receptionist and follow-up call services at local businesses.",
    url: "https://vapi.ai",
    logoEmoji: "📞",
    category: "automation",
    gate: "onboarding:100",
    badge: "Popular",
    isPaid: true,
  },
  {
    id: "relevance-ai",
    name: "Relevance AI",
    tagline: "Build and deploy AI agents",
    description:
      "No-code AI agent builder. Create autonomous agents that research leads, draft content, and handle workflows. Package them as retainer services.",
    url: "https://relevanceai.com",
    logoEmoji: "🤖",
    category: "automation",
    gate: "onboarding:100",
    badge: "New",
    isPaid: true,
  },
  {
    id: "close-crm",
    name: "Close CRM",
    tagline: "Built-in calling + pipeline CRM",
    description:
      "The operator's CRM of choice. Built-in calling, SMS, email sequences, and a power dialer. Resell setup and management as a monthly service.",
    url: "https://close.com",
    logoEmoji: "💼",
    category: "outreach",
    gate: "onboarding:100",
    isPaid: true,
  },
  {
    id: "writesonic",
    name: "Writesonic",
    tagline: "AI content at scale for clients",
    description:
      "Produce SEO blog posts, ad copy, product descriptions, and landing pages for clients. White-label the output — they don't need to know.",
    url: "https://writesonic.com",
    logoEmoji: "✍️",
    category: "content",
    gate: "onboarding:100",
    isPaid: true,
  },
  {
    id: "pandadoc",
    name: "PandaDoc",
    tagline: "Proposals + e-signatures",
    description:
      "Send professional proposals that clients can sign in one click. Integrates with your CRM. Track open rates and follow up at the right moment.",
    url: "https://pandadoc.com",
    logoEmoji: "📄",
    category: "ops",
    gate: "onboarding:100",
    isPaid: true,
  },
  {
    id: "stripe",
    name: "Stripe",
    tagline: "Payments and subscriptions",
    description:
      "Set up recurring retainer billing for clients. Use Stripe's invoicing to look polished from day one. Add payment links to your proposals.",
    url: "https://stripe.com",
    logoEmoji: "💳",
    category: "finance",
    gate: "onboarding:100",
  },
  {
    id: "qbo",
    name: "QuickBooks Online",
    tagline: "Small business accounting",
    description:
      "Track income, expenses, and invoices. Connect with Stripe for automatic reconciliation. Essential once you hit $5k/mo in client revenue.",
    url: "https://quickbooks.intuit.com",
    logoEmoji: "📊",
    category: "finance",
    gate: "onboarding:100",
    isPaid: true,
  },
]

export const CATEGORIES: Record<ToolCategory, { label: string; description: string }> = {
  automation: { label: "Automation", description: "Workflow and process automation" },
  outreach: { label: "Outreach & CRM", description: "Lead generation and client communication" },
  content: { label: "Content & AI", description: "AI writing, video, and content creation" },
  research: { label: "Research & Intel", description: "Market research and data extraction" },
  finance: { label: "Finance & Ops", description: "Billing, accounting, and business ops" },
  ops: { label: "Operations", description: "Project management and internal tools" },
}

export function getUnlockedTools(
  onboardingPercent: number,
  hasActiveDeal: boolean
): Set<UnlockGate> {
  const unlocked = new Set<UnlockGate>(["free"])
  if (onboardingPercent >= 50) unlocked.add("onboarding:50")
  if (onboardingPercent >= 100) unlocked.add("onboarding:100")
  if (hasActiveDeal) unlocked.add("crm:active_deal")
  return unlocked
}
