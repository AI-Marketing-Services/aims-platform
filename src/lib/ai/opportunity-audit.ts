/**
 * AI Opportunity Audit — Premium Lead Magnet Generator
 *
 * Generates a personalized AI integration report for a business based on:
 *   - 4 quiz answers (industry, company size, biggest bottleneck, current adoption)
 *   - A multi-page Firecrawl scrape of the prospect's website
 *   - Logo + company-name extraction from page metadata
 *   - A deep Claude Sonnet analysis with expert prompting
 *
 * This is the conversion engine for cold-email traffic landing on /tools/ai-opportunity-audit.
 * Premium feel matters more than speed — use Sonnet, generous max_tokens, and a rich prompt.
 *
 * Reuses helpers from src/lib/ai/index.ts:
 *   - firecrawlScrape() for content extraction
 *   - analyzeWithClaude() for the LLM call (handles cost logging automatically)
 */

import { firecrawlScrape, analyzeWithClaude, logApiCost } from "./index"
import { logger } from "@/lib/logger"

// ─── Public types ───────────────────────────────────────────────────────────

export type CompanySize = "1-5" | "6-25" | "26-100" | "100+"
export type CurrentAdoption = "none" | "dabbling" | "partial" | "scaled"
export type Impact = "high" | "medium" | "low"
export type Effort = "low" | "medium" | "high"

export interface OpportunityToolRec {
  name: string
  category: string
  pricing: string
  why: string
}

export interface AIOpportunity {
  rank: number
  title: string
  problem: string
  solution: string
  impact: Impact
  effort: Effort
  estimatedTimeSavings: string
  estimatedRoi: string
  tools: OpportunityToolRec[]
  whyTheCantBuildThisAlone: string
}

export interface OpportunityReport {
  // Company identity (extracted from scrape)
  companyName: string
  companyTagline: string
  logoUrl: string | null
  faviconUrl: string | null
  domain: string
  primaryColor: string | null

  // Inferred analysis
  businessType: string
  detectedRevenueModel: string
  detectedTechStack: string[]

  // The actual report
  executiveSummary: string
  opportunityScore: number  // 0-100 — higher = more gaps = more pain = hotter lead
  opportunityScoreReason: string
  opportunities: AIOpportunity[]
  priorityMove: {
    title: string
    rationale: string
    firstStep: string
  }
  competitiveLandscape: string
  collectivePitch: string  // Personalized angle for the AI Operator Collective CTA

  // Provenance
  scrapedAt: string
  pagesAnalyzed: string[]
  modelUsed: string
}

export interface AuditInput {
  url: string
  industry: string
  companySize: CompanySize
  bottleneck: string
  currentAdoption: CurrentAdoption
}

// ─── Internal helpers ───────────────────────────────────────────────────────

const MAX_CONTENT_CHARS = 12_000

function normalizeUrl(input: string): string {
  const trimmed = input.trim()
  if (!trimmed) return trimmed
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  return `https://${trimmed}`
}

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "")
  } catch {
    return url
  }
}

/**
 * Pulls the logo URL from Firecrawl metadata. Firecrawl returns the OpenGraph
 * image, Twitter card image, and structured data — we fall through them in order
 * of reliability.
 */
function extractLogoUrl(metadata: Record<string, unknown> | null, baseUrl: string): string | null {
  if (!metadata) return null

  const candidates = [
    metadata["og:image"],
    metadata.ogImage,
    metadata["twitter:image"],
    metadata.twitterImage,
    metadata.image,
    metadata.logo,
  ]

  for (const c of candidates) {
    if (typeof c === "string" && c.length > 0) {
      return resolveUrl(c, baseUrl)
    }
    if (Array.isArray(c) && typeof c[0] === "string") {
      return resolveUrl(c[0], baseUrl)
    }
  }

  return null
}

function resolveUrl(maybeRelative: string, base: string): string {
  try {
    return new URL(maybeRelative, base).toString()
  } catch {
    return maybeRelative
  }
}

function extractFaviconUrl(domain: string): string {
  // Google's favicon service is the most reliable cross-site favicon source
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=128`
}

function extractCompanyName(
  metadata: Record<string, unknown> | null,
  domain: string
): string {
  if (!metadata) return prettyDomain(domain)

  const title = (metadata.title as string | undefined) ?? ""
  const ogSiteName = (metadata["og:site_name"] as string | undefined) ?? (metadata.ogSiteName as string | undefined)
  const applicationName = metadata["application-name"] as string | undefined

  // og:site_name is the most reliable signal of the actual brand name
  if (ogSiteName && ogSiteName.length > 0) return ogSiteName.trim()
  if (applicationName && applicationName.length > 0) return applicationName.trim()

  // Fall back to title, but strip the site description after a separator
  if (title) {
    const separators = [" | ", " — ", " – ", " - ", " :: "]
    for (const sep of separators) {
      if (title.includes(sep)) {
        return title.split(sep)[0].trim()
      }
    }
    return title.trim()
  }

  return prettyDomain(domain)
}

function prettyDomain(domain: string): string {
  const root = domain.split(".")[0]
  return root.charAt(0).toUpperCase() + root.slice(1)
}

function extractTagline(metadata: Record<string, unknown> | null): string {
  if (!metadata) return ""
  const description =
    (metadata.description as string | undefined) ??
    (metadata["og:description"] as string | undefined) ??
    (metadata.ogDescription as string | undefined) ??
    ""
  return description.trim().slice(0, 240)
}

/**
 * Calls Firecrawl /map to discover key sub-pages on the prospect's site.
 * We then scrape up to 2 of the highest-signal pages (about / services / pricing)
 * for the LLM to analyze. Falls back gracefully if /map is unavailable.
 */
async function discoverRelevantPages(rootUrl: string): Promise<string[]> {
  const FIRECRAWL_API_KEY = process.env.FIRECRAWL_API_KEY
  if (!FIRECRAWL_API_KEY) return []

  try {
    const response = await fetch("https://api.firecrawl.dev/v1/map", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${FIRECRAWL_API_KEY}`,
      },
      body: JSON.stringify({
        url: rootUrl,
        limit: 50,
      }),
    })

    if (!response.ok) return []

    const data = await response.json()
    const links: string[] = data?.links ?? data?.data?.links ?? []

    await logApiCost({
      provider: "firecrawl",
      model: "map",
      endpoint: "/map",
      tokens: 0,
      cost: 0.005,
      serviceArm: "ai-opportunity-audit",
    }).catch(() => {})

    // Score each link by how likely it is to surface useful business context
    const SIGNAL_KEYWORDS = [
      /\/about/i,
      /\/services/i,
      /\/products?/i,
      /\/pricing/i,
      /\/solutions/i,
      /\/platform/i,
      /\/how-it-works/i,
      /\/features/i,
    ]

    const scored = links
      .map((link) => {
        const score = SIGNAL_KEYWORDS.reduce(
          (acc, pattern) => (pattern.test(link) ? acc + 10 : acc),
          0
        )
        // Prefer shallower URLs (closer to root = more important)
        const depth = link.split("/").filter(Boolean).length
        const depthScore = Math.max(0, 5 - depth)
        return { link, score: score + depthScore }
      })
      .filter((s) => s.score > 0)
      .sort((a, b) => b.score - a.score)

    return scored.slice(0, 2).map((s) => s.link)
  } catch (err) {
    logger.error("Firecrawl /map discovery failed", err)
    return []
  }
}

// ─── Public entry point ─────────────────────────────────────────────────────

export async function runOpportunityAudit(input: AuditInput): Promise<OpportunityReport | { error: string }> {
  const url = normalizeUrl(input.url)
  if (!url) {
    return { error: "URL is required" }
  }

  const domain = extractDomain(url)
  const startedAt = new Date()

  // 1. Scrape the homepage with Firecrawl (production-ready helper)
  const homepageScrape = await firecrawlScrape(url)

  if (!homepageScrape.content) {
    logger.error("Opportunity audit: homepage scrape returned no content", {
      url,
      error: homepageScrape.error,
    })
    return {
      error: homepageScrape.error ?? "We couldn't read your website. Make sure the URL is correct and publicly accessible.",
    }
  }

  // 2. Discover and scrape up to 2 high-signal sub-pages in parallel.
  // We don't await sub-page failures — homepage alone is sufficient if /map is unavailable.
  const subpageUrls = await discoverRelevantPages(url)
  const subpageScrapes = await Promise.all(
    subpageUrls.map((subUrl) =>
      firecrawlScrape(subUrl).catch(() => ({ content: null, metadata: null }))
    )
  )

  const pagesAnalyzed = [url, ...subpageUrls.filter((_, i) => subpageScrapes[i]?.content)]

  // 3. Extract company identity from the homepage metadata
  const companyName = extractCompanyName(homepageScrape.metadata, domain)
  const companyTagline = extractTagline(homepageScrape.metadata)
  const logoUrl = extractLogoUrl(homepageScrape.metadata, url)
  const faviconUrl = extractFaviconUrl(domain)

  // 4. Build the consolidated content blob for the LLM
  const consolidatedContent = [
    `=== HOMEPAGE: ${url} ===\n${homepageScrape.content}`,
    ...subpageScrapes
      .map((s, i) => (s.content ? `=== ${subpageUrls[i]} ===\n${s.content}` : null))
      .filter((s): s is string => s !== null),
  ]
    .join("\n\n")
    .slice(0, MAX_CONTENT_CHARS)

  const sizeLabel = sizeLabelFor(input.companySize)
  const adoptionLabel = adoptionLabelFor(input.currentAdoption)

  // 5. Build the prompt — heavy lifting happens here. We're paying Sonnet rates so
  // we want the model to act like a senior AI strategy consultant.
  const systemPrompt = `You are a senior AI strategy consultant at a top-tier firm preparing a personalized AI opportunity report for a real prospect. The prospect submitted their website and answered four qualification questions. Your job is to deliver a report that feels like it cost $5,000, not like a lead magnet.

Rules:
1. Be SPECIFIC. Reference details you actually see in the scraped content — product names, services, pricing tiers, customer segments mentioned, the actual industry vertical. Generic advice is unacceptable.
2. Be COMMERCIAL. Every opportunity must tie back to revenue, cost, or speed — never vanity metrics.
3. Be HONEST. If their adoption is already strong, score them lower and say so. We'd rather lose a deal than embarrass ourselves with sloppy work.
4. Recommend REAL TOOLS. Brand names with realistic pricing tiers. Never fabricate a tool that doesn't exist. Common AI tools to consider when relevant: Claude, ChatGPT, Cursor, Gamma, Perplexity, Notion AI, Make, n8n, Zapier, Bland AI, Vapi, Retell AI, Lindy, Apollo, Clay, Instantly, Smartlead, Pipedrive, HubSpot, Intercom Fin, Crisp, Tidio, Zendesk AI, Loom AI, Fireflies, Otter, Glean, Pinecone, Supabase, Vercel v0, Bolt, Lovable, Replicate, Eleven Labs, Heygen, Synthesia, Descript, Runway, Midjourney, Ideogram. Pick the ones that actually fit.
5. The opportunityScore (0-100) measures how MUCH OPPORTUNITY exists for them — not how AI-mature they are. A startup with no AI scores HIGH (lots of opportunity). An AI-native company scores LOW (less low-hanging fruit).
6. Output STRICT JSON. No markdown, no preamble, no explanation. The exact schema below.`

  const userPrompt = `Generate the AI opportunity report for this real prospect.

PROSPECT INTAKE:
- Website: ${url}
- Industry (self-reported): ${input.industry}
- Company size: ${sizeLabel}
- Biggest bottleneck (self-reported): ${input.bottleneck}
- Current AI adoption: ${adoptionLabel}

DETECTED COMPANY IDENTITY (from page metadata):
- Company name: ${companyName}
- Tagline / description: ${companyTagline || "(not found)"}
- Domain: ${domain}

SCRAPED WEBSITE CONTENT (multiple pages):
${consolidatedContent}

Return ONLY this JSON object — no markdown fences, no text outside the braces:
{
  "businessType": "<one-line classification — e.g. 'B2B SaaS analytics for ecommerce stores'>",
  "detectedRevenueModel": "<one-line — e.g. 'Subscription tiers $99–$999/mo with usage overages'>",
  "detectedTechStack": ["<tool>", "<tool>"],
  "executiveSummary": "<3-4 sentences. Reference the actual company. Lead with the biggest insight you found in the scrape. Sound like a real consultant, not a marketing bot.>",
  "opportunityScore": <0-100, higher = more gaps to fill = more value to capture>,
  "opportunityScoreReason": "<one sentence justifying the score>",
  "opportunities": [
    {
      "rank": 1,
      "title": "<short, specific, action-oriented — e.g. 'Replace inbound qualification with an AI voice agent'>",
      "problem": "<the specific manual problem they have right now, referencing what you saw on their site>",
      "solution": "<the specific AI-powered solution>",
      "impact": "high" | "medium" | "low",
      "effort": "low" | "medium" | "high",
      "estimatedTimeSavings": "<e.g. '15-25 hours/week'>",
      "estimatedRoi": "<e.g. '$3-8k/mo recovered labor + 40% faster lead response'>",
      "tools": [
        { "name": "<real tool name>", "category": "<e.g. AI voice agent>", "pricing": "<e.g. '$0.07/min'>", "why": "<one sentence specific to this prospect>" }
      ],
      "whyTheCantBuildThisAlone": "<one sentence — what's the implementation gap that makes this hard for an internal team to ship>"
    }
    // ... 4-6 total opportunities, ranked
  ],
  "priorityMove": {
    "title": "<the single highest-leverage move — usually opportunities[0]>",
    "rationale": "<2-3 sentences why this one first>",
    "firstStep": "<the literal first action they should take this week>"
  },
  "competitiveLandscape": "<2-3 sentences on what AI-native competitors in their space are already doing>",
  "collectivePitch": "<2-3 sentences positioning the AI Operator Collective as the implementation partner — should reference their specific situation, not be a generic blurb>"
}`

  const analysis = await analyzeWithClaude({
    systemPrompt,
    prompt: userPrompt,
    model: "claude-sonnet-4-20250514",
    maxTokens: 4096,
    serviceArm: "ai-opportunity-audit",
  }).catch((err) => {
    logger.error("Claude opportunity audit call failed", err)
    return null
  })

  if (!analysis) {
    return { error: "Our AI service is temporarily unavailable. Please try again in a moment." }
  }

  // 6. Parse the JSON. If parsing fails, the LLM hallucinated formatting — return graceful error.
  const parsed = parseReportJson(analysis.text)
  if (!parsed) {
    logger.error("Opportunity audit: failed to parse Claude JSON response", { rawText: analysis.text.slice(0, 500) })
    return { error: "We hit a parsing snag generating your report. Please try submitting again." }
  }

  // 7. Compose the final report
  return {
    companyName,
    companyTagline,
    logoUrl,
    faviconUrl,
    domain,
    primaryColor: null, // future enhancement: extract from theme-color meta tag
    businessType: String(parsed.businessType ?? ""),
    detectedRevenueModel: String(parsed.detectedRevenueModel ?? ""),
    detectedTechStack: Array.isArray(parsed.detectedTechStack) ? parsed.detectedTechStack.map(String) : [],
    executiveSummary: String(parsed.executiveSummary ?? ""),
    opportunityScore: clampScore(parsed.opportunityScore),
    opportunityScoreReason: String(parsed.opportunityScoreReason ?? ""),
    opportunities: Array.isArray(parsed.opportunities) ? parsed.opportunities.map(normalizeOpportunity) : [],
    priorityMove: extractPriorityMove(parsed.priorityMove),
    competitiveLandscape: String(parsed.competitiveLandscape ?? ""),
    collectivePitch: String(parsed.collectivePitch ?? ""),
    scrapedAt: startedAt.toISOString(),
    pagesAnalyzed,
    modelUsed: "claude-sonnet-4-20250514",
  }
}

// ─── Parsing helpers ────────────────────────────────────────────────────────

function parseReportJson(text: string): Record<string, unknown> | null {
  // Strip markdown code fences if Claude included them despite instructions
  const cleaned = text
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim()

  try {
    return JSON.parse(cleaned)
  } catch {
    // Last-ditch attempt: extract the first balanced JSON object
    const match = cleaned.match(/\{[\s\S]*\}/)
    if (!match) return null
    try {
      return JSON.parse(match[0])
    } catch {
      return null
    }
  }
}

function extractPriorityMove(raw: unknown): { title: string; rationale: string; firstStep: string } {
  const obj = (raw ?? {}) as Record<string, unknown>
  return {
    title: String(obj.title ?? ""),
    rationale: String(obj.rationale ?? ""),
    firstStep: String(obj.firstStep ?? ""),
  }
}

function clampScore(value: unknown): number {
  const num = typeof value === "number" ? value : Number(value)
  if (Number.isNaN(num)) return 50
  return Math.max(0, Math.min(100, Math.round(num)))
}

function normalizeOpportunity(raw: unknown): AIOpportunity {
  const o = (raw ?? {}) as Record<string, unknown>
  const tools = Array.isArray(o.tools)
    ? o.tools.map((t) => {
        const tool = (t ?? {}) as Record<string, unknown>
        return {
          name: String(tool.name ?? ""),
          category: String(tool.category ?? ""),
          pricing: String(tool.pricing ?? ""),
          why: String(tool.why ?? ""),
        }
      })
    : []

  const impact = (o.impact as string | undefined) ?? "medium"
  const effort = (o.effort as string | undefined) ?? "medium"

  return {
    rank: typeof o.rank === "number" ? o.rank : 0,
    title: String(o.title ?? ""),
    problem: String(o.problem ?? ""),
    solution: String(o.solution ?? ""),
    impact: ["high", "medium", "low"].includes(impact) ? (impact as Impact) : "medium",
    effort: ["high", "medium", "low"].includes(effort) ? (effort as Effort) : "medium",
    estimatedTimeSavings: String(o.estimatedTimeSavings ?? ""),
    estimatedRoi: String(o.estimatedRoi ?? ""),
    tools,
    whyTheCantBuildThisAlone: String(o.whyTheCantBuildThisAlone ?? ""),
  }
}

function sizeLabelFor(size: CompanySize): string {
  switch (size) {
    case "1-5": return "1–5 employees (founder-led / very small team)"
    case "6-25": return "6–25 employees (early stage with a small team)"
    case "26-100": return "26–100 employees (scaling, multiple departments)"
    case "100+": return "100+ employees (established mid-market or larger)"
  }
}

function adoptionLabelFor(adoption: CurrentAdoption): string {
  switch (adoption) {
    case "none": return "None yet — haven't started experimenting with AI"
    case "dabbling": return "Dabbling — using ChatGPT or similar individually, no team rollout"
    case "partial": return "Partial — one or two AI tools in production, not yet across the team"
    case "scaled": return "Scaled — AI is deeply integrated across multiple workflows"
  }
}
