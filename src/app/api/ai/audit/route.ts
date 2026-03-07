import { NextResponse } from "next/server"
import { z } from "zod"
import Anthropic from "@anthropic-ai/sdk"

const auditSchema = z.object({
  url: z.string().url(),
})

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: Request) {
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
