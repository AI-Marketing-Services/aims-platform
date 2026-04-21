import { logApiCost } from "@/lib/ai"
import { logger } from "@/lib/logger"

export type Source = {
  url: string
  title: string
  snippet: string
  publishedAt?: string
  domain: string
}

const TAVILY_URL = "https://api.tavily.com/search"

export async function tavilySearch(query: string, opts: { max?: number; days?: number } = {}): Promise<Source[]> {
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
        topic: "news",
        days: opts.days ?? 1,
        max_results: opts.max ?? 8,
        include_answer: false,
      }),
    })

    if (!res.ok) {
      logger.warn("tavily search failed", { status: res.status, query })
      return []
    }

    const data = await res.json() as { results?: Array<{ url: string; title: string; content: string; published_date?: string }> }

    logApiCost({
      provider: "tavily",
      model: "search",
      endpoint: "/search",
      tokens: 0,
      cost: 0.008,
      serviceArm: "signal",
    })

    return (data.results ?? []).map((r) => ({
      url: r.url,
      title: r.title,
      snippet: r.content,
      publishedAt: r.published_date,
      domain: safeHost(r.url),
    }))
  } catch (err) {
    logger.error("tavily search error", err)
    return []
  }
}

export function canonicalize(url: string): string {
  try {
    const u = new URL(url)
    const strip = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "ref", "ref_src"]
    strip.forEach((k) => u.searchParams.delete(k))
    u.hash = ""
    return `${u.origin}${u.pathname}${u.search}`.replace(/\/$/, "")
  } catch {
    return url
  }
}

function safeHost(url: string): string {
  try { return new URL(url).hostname.replace(/^www\./, "") } catch { return "" }
}
