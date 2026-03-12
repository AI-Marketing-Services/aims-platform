import { NextResponse } from "next/server"
import { z } from "zod"
import Anthropic from "@anthropic-ai/sdk"
import { auditRatelimit, getIp } from "@/lib/ratelimit"
import { logApiCost, estimateAnthropicCost } from "@/lib/ai"

const auditSchema = z.object({
  url: z
    .string()
    .url()
    .refine((u) => {
      try {
        const { hostname, protocol } = new URL(u)
        // Only allow public HTTPS/HTTP URLs — block private/internal IP ranges
        if (!["https:", "http:"].includes(protocol)) return false
        const privatePatterns = [
          /^localhost$/i,
          /^127\./,
          /^10\./,
          /^172\.(1[6-9]|2\d|3[01])\./,
          /^192\.168\./,
          /^0\./,
          /^::1$/,
          /^fc00:/i,
          /^fe80:/i,
          /\.internal$/i,
          /\.local$/i,
        ]
        return !privatePatterns.some((p) => p.test(hostname))
      } catch {
        return false
      }
    }, "URL must be a publicly accessible address"),
})

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: Request) {
  if (auditRatelimit) {
    const { success } = await auditRatelimit.limit(getIp(req))
    if (!success) return NextResponse.json({ error: "Too many requests" }, { status: 429 })
  }

  try {
    const body = await req.json()
    const parsed = auditSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid URL" }, { status: 400 })
    }

    const { url } = parsed.data
    const domain = new URL(url).hostname

    // 1. Fetch the page content via Tavily extract
    let pageContent = ""
    let pageTitle = ""
    let metaDesc = ""

    try {
      const extractRes = await fetch("https://api.tavily.com/extract", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.TAVILY_API_KEY}`,
        },
        body: JSON.stringify({ urls: [url], extract_depth: "basic", format: "markdown" }),
      })

      if (extractRes.ok) {
        const extractData = await extractRes.json()
        const result = extractData?.results?.[0]
        if (result) {
          pageContent = result.raw_content?.slice(0, 8000) ?? ""
          pageTitle = result.title ?? ""
        }
      }
    } catch {
      // Fallback — proceed with limited data
    }

    // 2. Search for company info + SEO signals
    let competitorContext = ""
    try {
      const searchRes = await fetch("https://api.tavily.com/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.TAVILY_API_KEY}`,
        },
        body: JSON.stringify({
          query: `site:${domain} OR "${domain}" reviews lead generation`,
          max_results: 3,
          search_depth: "fast",
        }),
      })

      if (searchRes.ok) {
        const searchData = await searchRes.json()
        competitorContext = searchData?.results
          ?.slice(0, 3)
          .map((r: { title: string; content: string }) => `${r.title}: ${r.content}`)
          .join("\n") ?? ""
      }
    } catch {}

    // 3. AI analysis
    const prompt = `You are an expert digital marketing and conversion rate optimization analyst. Audit the following website and return a JSON analysis.

Website URL: ${url}
Domain: ${domain}
Page Title: ${pageTitle || "Unknown"}

Page Content (truncated):
${pageContent || "Could not extract page content — analyze based on URL and domain only."}

Additional context from web:
${competitorContext || "None available."}

Return ONLY valid JSON with this exact structure (no markdown, no explanation):
{
  "scores": {
    "seo": <0-100>,
    "speed": <0-100>,
    "conversion": <0-100>,
    "ai": <0-100>,
    "overall": <0-100>
  },
  "issues": [
    {
      "severity": "critical" | "high" | "medium",
      "issue": "<specific issue found on this site>",
      "fix": "<concrete AIMS solution>"
    }
  ],
  "strengths": ["<what is working well>"],
  "summary": "<2-3 sentence summary of the site's marketing health>",
  "topOpportunity": "<the single highest-leverage improvement for this site>"
}

Be specific to this actual website. For scores: consider actual presence of meta tags, calls-to-action, content quality, mobile design signals, structured data, AI-answer optimization. Issues array should have 3-5 items. Strengths should have 2-3 items.`

    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    })

    const rawText = message.content[0].type === "text" ? message.content[0].text : ""

    // Log cost
    const auditModel = "claude-haiku-4-5-20251001"
    await logApiCost({
      provider: "anthropic",
      model: auditModel,
      endpoint: "website-audit",
      tokens: (message.usage?.input_tokens ?? 0) + (message.usage?.output_tokens ?? 0),
      cost: estimateAnthropicCost(auditModel, message.usage?.input_tokens ?? 0, message.usage?.output_tokens ?? 0),
      serviceArm: "website-audit",
      metadata: { url, inputTokens: message.usage?.input_tokens, outputTokens: message.usage?.output_tokens },
    })

    // Extract JSON from response
    const jsonMatch = rawText.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error("Failed to parse AI response")
    }

    const analysis = JSON.parse(jsonMatch[0])

    return NextResponse.json({ analysis, url, domain }, { status: 200 })
  } catch (err) {
    console.error("Website audit failed:", err)
    return NextResponse.json({ error: "Audit failed" }, { status: 500 })
  }
}
