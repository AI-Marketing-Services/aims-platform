/**
 * POST /api/ai/opportunity-audit
 *
 * Generates a personalized AI opportunity report for a business based on a
 * URL + 4 quiz answers. Used by the /tools/ai-opportunity-audit funnel.
 *
 * This is a synchronous endpoint — Firecrawl + Sonnet + JSON parsing typically
 * completes in 15–30s. The route declares maxDuration = 60 to give us headroom
 * inside Vercel's serverless limit. If we ever start hitting timeouts we'll
 * move to a queued/polling pattern, but the simpler sync flow lets us keep the
 * client experience tight.
 */

import { NextResponse } from "next/server"
import { z } from "zod"
import { auditRatelimit, getIp } from "@/lib/ratelimit"
import { runOpportunityAudit } from "@/lib/ai/opportunity-audit"
import { logger } from "@/lib/logger"

export const maxDuration = 60

const inputSchema = z.object({
  url: z
    .string()
    .min(3)
    .max(500)
    .refine((u) => {
      // Allow naked domains (we'll prepend https:// in the helper) or full URLs.
      // Block obvious private addresses to prevent SSRF.
      const candidate = /^https?:\/\//i.test(u) ? u : `https://${u}`
      try {
        const parsed = new URL(candidate)
        if (!["https:", "http:"].includes(parsed.protocol)) return false

        const hostname = parsed.hostname
        const PRIVATE_PATTERNS = [
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
        return !PRIVATE_PATTERNS.some((p) => p.test(hostname))
      } catch {
        return false
      }
    }, "URL must be a publicly accessible website"),
  industry: z.string().min(1).max(80),
  companySize: z.enum(["1-5", "6-25", "26-100", "100+"]),
  bottleneck: z.string().min(1).max(120),
  currentAdoption: z.enum(["none", "dabbling", "partial", "scaled"]),
})

export async function POST(req: Request) {
  // Rate-limit aggressively — Firecrawl + Sonnet calls cost real money per request
  if (auditRatelimit) {
    const { success } = await auditRatelimit.limit(getIp(req))
    if (!success) {
      return NextResponse.json(
        { error: "Too many requests. Please wait a minute before generating another report." },
        { status: 429 }
      )
    }
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "AI audit is not configured" }, { status: 503 })
  }
  if (!process.env.FIRECRAWL_API_KEY) {
    return NextResponse.json({ error: "Website scraping is not configured" }, { status: 503 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 })
  }

  const parsed = inputSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  try {
    const report = await runOpportunityAudit(parsed.data)

    if ("error" in report) {
      return NextResponse.json({ error: report.error }, { status: 422 })
    }

    return NextResponse.json({ report }, { status: 200 })
  } catch (err) {
    logger.error("Opportunity audit endpoint failed", err, {
      endpoint: "POST /api/ai/opportunity-audit",
    })
    return NextResponse.json(
      { error: "We hit an unexpected error generating your report. Please try again." },
      { status: 500 }
    )
  }
}
