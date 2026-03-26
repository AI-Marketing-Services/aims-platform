import Anthropic from "@anthropic-ai/sdk"
import { db } from "@/lib/db"
import { logger } from "@/lib/logger"

function getAnthropicClient() {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY is not configured")
  }
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
}

// ============ COST TRACKING ============

export const AI_PRICING: Record<string, { input: number; output: number }> = {
  "claude-sonnet-4-20250514":     { input: 3 / 1_000_000,   output: 15 / 1_000_000 },
  "claude-haiku-4-5-20251001":    { input: 0.8 / 1_000_000, output: 4 / 1_000_000 },
  "claude-opus-4-20250514":       { input: 15 / 1_000_000,  output: 75 / 1_000_000 },
}

export function estimateAnthropicCost(model: string, inputTokens: number, outputTokens: number): number {
  const rates = AI_PRICING[model] ?? AI_PRICING["claude-sonnet-4-20250514"]
  return inputTokens * rates.input + outputTokens * rates.output
}

export async function logApiCost(params: {
  provider: string
  model: string
  endpoint: string
  tokens: number
  cost: number
  serviceArm?: string
  clientId?: string
  metadata?: Record<string, string | number | boolean | null>
}) {
  await db.apiCostLog.create({ data: params }).catch(() => {
    // Non-blocking: cost logging failure should not affect request processing
  })
}


// ============ CORE AI CALLS ============

export async function analyzeWithClaude(params: {
  prompt: string
  systemPrompt?: string
  model?: "claude-sonnet-4-20250514" | "claude-haiku-4-5-20251001" | "claude-opus-4-20250514"
  maxTokens?: number
  serviceArm?: string
  clientId?: string
}) {
  const model = params.model ?? "claude-haiku-4-5-20251001"
  const anthropic = getAnthropicClient()

  const response = await anthropic.messages.create({
    model,
    max_tokens: params.maxTokens ?? 1024,
    system: params.systemPrompt,
    messages: [{ role: "user", content: params.prompt }],
  })

  const text = response.content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("\n")

  // Log cost
  await logApiCost({
    provider: "anthropic",
    model,
    endpoint: "messages",
    tokens: (response.usage?.input_tokens ?? 0) + (response.usage?.output_tokens ?? 0),
    cost: estimateAnthropicCost(
      model,
      response.usage?.input_tokens ?? 0,
      response.usage?.output_tokens ?? 0
    ),
    serviceArm: params.serviceArm,
    clientId: params.clientId,
  })

  return { text, usage: response.usage }
}

// ============ WEBSITE AUDIT ============

export async function runWebsiteAudit(url: string) {
  // Step 1: Scrape with Firecrawl
  const scrapeResult = await firecrawlScrape(url)

  // Step 2: Analyze with Claude
  const analysis = await analyzeWithClaude({
    systemPrompt: `You are an expert website auditor. Analyze the provided website content and return a JSON object with this exact structure:
{
  "overallScore": <number 0-100>,
  "categories": {
    "seo": { "score": <0-100>, "issues": [{"title": "...", "severity": "high|medium|low", "fix": "..."}] },
    "aeo": { "score": <0-100>, "issues": [...] },
    "conversion": { "score": <0-100>, "issues": [...] },
    "mobile": { "score": <0-100>, "issues": [...] },
    "performance": { "score": <0-100>, "issues": [...] }
  },
  "topFixes": ["...", "...", "..."],
  "aimsRecommendations": [{"service": "slug", "reason": "..."}]
}
Only return valid JSON, no markdown or explanation.`,
    prompt: `Audit this website:\nURL: ${url}\n\nContent:\n${scrapeResult.content?.substring(0, 8000) ?? "Unable to scrape content"}\n\nMetadata:\n${JSON.stringify(scrapeResult.metadata ?? {}, null, 2)}`,
    serviceArm: "website-audit",
  })

  try {
    return JSON.parse(analysis.text)
  } catch {
    return { error: "Failed to parse audit results", raw: analysis.text }
  }
}

// ============ AI TOOL RESEARCH (Trackr pattern) ============

export async function researchTool(toolName: string) {
  const analysis = await analyzeWithClaude({
    systemPrompt: `You are a meticulous AI tool researcher. Research the given tool and return a JSON object:
{
  "name": "...",
  "category": "...",
  "description": "...",
  "pricing": { "free": <bool>, "startingPrice": "...", "model": "..." },
  "features": ["...", "..."],
  "pros": ["...", "..."],
  "cons": ["...", "..."],
  "alternatives": [{"name": "...", "comparison": "..."}],
  "score": <0-100>,
  "bestFor": "...",
  "verdict": "..."
}
Only return valid JSON.`,
    prompt: `Research this AI tool thoroughly: ${toolName}`,
    serviceArm: "ai-tool-tracker",
  })

  try {
    return JSON.parse(analysis.text)
  } catch {
    return { error: "Failed to parse research", raw: analysis.text }
  }
}

// ============ ROI ANALYSIS ============

export async function generateROIAnalysis(inputs: {
  locations: number
  employees: number
  avgSalary: number
  closeRate: number
  industry: string
}) {
  const monthlyCostManual =
    inputs.employees * (inputs.avgSalary / 12) * inputs.locations
  const projectedAIMSCost = inputs.locations * 297 // Pro tier baseline
  const monthlySavings = monthlyCostManual - projectedAIMSCost
  const paybackPeriod = projectedAIMSCost > 0 ? 1 : 0

  return {
    monthlyCostManual: Math.round(monthlyCostManual),
    projectedAIMSCost: Math.round(projectedAIMSCost),
    monthlySavings: Math.round(monthlySavings),
    annualSavings: Math.round(monthlySavings * 12),
    paybackPeriodMonths: paybackPeriod,
    costOfWaiting: Math.round(monthlySavings), // per month
    locations: inputs.locations,
    industry: inputs.industry,
  }
}

// ============ FIRECRAWL ============

const FIRECRAWL_API_KEY = process.env.FIRECRAWL_API_KEY
const FIRECRAWL_BASE = "https://api.firecrawl.dev/v1"

export async function firecrawlScrape(url: string) {
  if (!FIRECRAWL_API_KEY) {
    return { content: null, metadata: null, error: "Firecrawl API key not configured" }
  }

  try {
    const response = await fetch(`${FIRECRAWL_BASE}/scrape`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${FIRECRAWL_API_KEY}`,
      },
      body: JSON.stringify({
        url,
        formats: ["markdown", "html"],
        onlyMainContent: true,
      }),
    })

    const data = await response.json()

    await logApiCost({
      provider: "firecrawl",
      model: "scrape",
      endpoint: "/scrape",
      tokens: 0,
      cost: 0.01, // approximate per-scrape cost
    })

    return {
      content: data.data?.markdown ?? data.data?.html ?? null,
      metadata: data.data?.metadata ?? null,
    }
  } catch (error) {
    logger.error("Firecrawl scrape failed", error)
    return { content: null, metadata: null, error: String(error) }
  }
}

// ============ AI READINESS SCORING ============

export function calculateAIReadinessScore(answers: Record<string, number>) {
  const pillarWeights = {
    marketing: ["q1", "q2", "q3"],
    sales: ["q4", "q5"],
    operations: ["q6", "q7", "q8"],
    finance: ["q9", "q10"],
  }

  const pillarScores: Record<string, number> = {}
  let totalScore = 0
  let totalQuestions = 0

  for (const [pillar, questions] of Object.entries(pillarWeights)) {
    const scores = questions
      .map((q) => answers[q] ?? 0)
      .filter((s) => s > 0)

    if (scores.length > 0) {
      const avg = scores.reduce((a, b) => a + b, 0) / scores.length
      pillarScores[pillar] = Math.round(avg * 20) // Convert 1-5 scale to 0-100
      totalScore += pillarScores[pillar]
      totalQuestions++
    }
  }

  return {
    overall: totalQuestions > 0 ? Math.round(totalScore / totalQuestions) : 0,
    pillars: pillarScores,
    weakest: Object.entries(pillarScores).sort((a, b) => a[1] - b[1])[0]?.[0],
    strongest: Object.entries(pillarScores).sort((a, b) => b[1] - a[1])[0]?.[0],
  }
}
