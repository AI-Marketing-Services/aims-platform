import { analyzeWithClaude } from "@/lib/ai"
import { logger } from "@/lib/logger"

const TAVILY_URL = "https://api.tavily.com/search"

export interface ScoutedLead {
  companyName: string
  contactName: string | null
  contactEmail: string | null
  contactPhone: string | null
  website: string | null
  industry: string
  location: string
  sourceUrl: string
  snippet: string
}

async function tavilySearch(query: string): Promise<Array<{ url: string; title: string; content: string }>> {
  const key = process.env.TAVILY_API_KEY
  if (!key) return []

  try {
    const res = await fetch(TAVILY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: key,
        query,
        search_depth: "advanced",
        topic: "general",
        max_results: 10,
        include_answer: false,
      }),
    })

    if (!res.ok) return []
    const data = await res.json() as {
      results?: Array<{ url: string; title: string; content: string }>
    }
    return data.results ?? []
  } catch (err) {
    logger.error("Lead scout Tavily search failed", err)
    return []
  }
}

export async function scoutLeads(params: {
  businessType: string
  location: string
  count?: number
  userId?: string
}): Promise<ScoutedLead[]> {
  const { businessType, location, count = 8, userId } = params

  const query = `${businessType} businesses in ${location} contact phone email website`

  const results = await tavilySearch(query)

  if (results.length === 0) return []

  const snippets = results
    .slice(0, 12)
    .map((r, i) => `[${i + 1}] ${r.title}\nURL: ${r.url}\n${r.content.substring(0, 400)}`)
    .join("\n\n---\n\n")

  const { text } = await analyzeWithClaude({
    systemPrompt: `You are a lead extraction assistant. Given search results, extract business leads and return ONLY a valid JSON array. Each element:
{
  "companyName": "string (required)",
  "contactName": "string or null",
  "contactEmail": "string or null",
  "contactPhone": "string or null",
  "website": "string (URL with https://) or null",
  "industry": "string (the business type)",
  "location": "string (city, state)",
  "sourceUrl": "string (the URL from results)",
  "snippet": "string (1-2 sentence description)"
}

Rules:
- Extract only REAL businesses from the results (not directories or review aggregators)
- Only include businesses that match the requested business type
- Do NOT invent contact info — only extract what's explicitly in the content
- Return max ${count} leads
- Return ONLY the JSON array, no markdown, no explanation`,
    prompt: `Business type: ${businessType}\nLocation: ${location}\n\nSearch results:\n${snippets}`,
    model: "claude-haiku-4-5-20251001",
    maxTokens: 2000,
    serviceArm: "lead-scout",
    clientId: userId,
  })

  try {
    const cleaned = text.trim().replace(/^```json\n?/, "").replace(/\n?```$/, "")
    const parsed = JSON.parse(cleaned) as ScoutedLead[]
    return Array.isArray(parsed) ? parsed.slice(0, count) : []
  } catch (err) {
    logger.error("Failed to parse lead scout results", err, { raw: text.substring(0, 200) })
    return []
  }
}
