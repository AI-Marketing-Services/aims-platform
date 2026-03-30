import { NextResponse } from "next/server"
import { z } from "zod"
import { createLeadMagnetSubmission } from "@/lib/db/queries"
import { formRatelimit, getIp } from "@/lib/ratelimit"
import { sendLeadMagnetResults } from "@/lib/email"
import { queueEmailSequence } from "@/lib/email/queue"
import { sendQuizResultsEmail, sendCalculatorResultsEmail, sendAuditResultsEmail, sendCreditScoreEmail, sendOpsAuditEmail } from "@/lib/email/lead-magnet-results"
import { db } from "@/lib/db"
import { notifyNewLead, notify } from "@/lib/notifications"
import { createCloseLead } from "@/lib/close"
import { logger } from "@/lib/logger"

const submitSchema = z.object({
  type: z.enum([
    "AI_READINESS_QUIZ",
    "ROI_CALCULATOR",
    "WEBSITE_AUDIT",
    "SEGMENT_EXPLORER",
    "STACK_CONFIGURATOR",
    "BUSINESS_CREDIT_SCORE",
    "EXECUTIVE_OPS_AUDIT",
  ]),
  email: z.string().email(),
  name: z.string().optional(),
  company: z.string().optional(),
  phone: z.string().optional(),
  data: z.record(z.unknown()),
  results: z.record(z.unknown()).optional(),
  score: z.number().optional(),
  source: z.string().optional(),
  utmSource: z.string().optional(),
  utmMedium: z.string().optional(),
  utmCampaign: z.string().optional(),
})

// Map quiz score → lead tier and priority
function scoreToTier(score: number | undefined, type: string): {
  score: number
  tier: "hot" | "warm" | "cold"
  priority: "HIGH" | "MEDIUM" | "LOW"
  reason: string
} {
  if (type === "ROI_CALCULATOR") {
    // ROI calculator: any completion is warm+
    return { score: 65, tier: "warm", priority: "MEDIUM", reason: "ROI calculator completed" }
  }
  if (type === "WEBSITE_AUDIT") {
    const s = score ?? 50
    if (s < 40) return { score: 75, tier: "hot", priority: "HIGH", reason: `Low audit score (${s}/100) - high pain, ready to fix` }
    if (s < 65) return { score: 60, tier: "warm", priority: "MEDIUM", reason: `Moderate audit score (${s}/100) - improvement opportunity` }
    return { score: 40, tier: "cold", priority: "LOW", reason: `Good audit score (${s}/100) - less urgency` }
  }
  if (type === "BUSINESS_CREDIT_SCORE") {
    const s = score ?? 50
    if (s < 40) return { score: 85, tier: "hot", priority: "HIGH", reason: `Very low business credit score (${s}/100) — high urgency, motivated to build credit` }
    if (s < 60) return { score: 65, tier: "hot", priority: "HIGH", reason: `Low-developing business credit (${s}/100) — clear need, high intent` }
    if (s < 80) return { score: 50, tier: "warm", priority: "MEDIUM", reason: `Established business credit (${s}/100) — optimization opportunity` }
    return { score: 35, tier: "cold", priority: "LOW", reason: `Strong business credit (${s}/100) — less immediate need` }
  }
  if (type === "EXECUTIVE_OPS_AUDIT") {
    const s = score ?? 50
    // All exec audit completions are hot — they've invested 5-7 minutes and revealed deep pain
    if (s < 40) return { score: 92, tier: "hot", priority: "HIGH", reason: `Very low ops efficiency (${s}/100) — high pain, multiple bottlenecks identified, ready to engage` }
    if (s < 70) return { score: 78, tier: "hot", priority: "HIGH", reason: `Moderate ops efficiency (${s}/100) — clear automation opportunities, strong ROI case` }
    return { score: 55, tier: "warm", priority: "MEDIUM", reason: `High ops efficiency (${s}/100) — optimization opportunity, scaling focus` }
  }
  if (type === "AI_READINESS_QUIZ") {
    const s = score ?? 50
    if (s < 40) return { score: 80, tier: "hot", priority: "HIGH", reason: `Low AI readiness (${s}/100) - clear gap, high intent` }
    if (s < 70) return { score: 55, tier: "warm", priority: "MEDIUM", reason: `Moderate AI readiness (${s}/100) - growing awareness` }
    return { score: 35, tier: "cold", priority: "LOW", reason: `High AI readiness (${s}/100) - already advanced` }
  }
  return { score: 50, tier: "warm", priority: "MEDIUM", reason: "Lead magnet completed" }
}

// Map type → sequence key
const SEQUENCE_MAP: Record<string, "post-quiz" | "post-calculator" | "post-audit"> = {
  AI_READINESS_QUIZ: "post-quiz",
  ROI_CALCULATOR: "post-calculator",
  WEBSITE_AUDIT: "post-audit",
}

export async function POST(req: Request) {
  if (formRatelimit) {
    const { success } = await formRatelimit.limit(getIp(req))
    if (!success) return NextResponse.json({ error: "Too many requests" }, { status: 429 })
  }

  try {
    const body = await req.json()
    const parsed = submitSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid data", details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const submission = await createLeadMagnetSubmission(parsed.data)

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://aimseos.com"
    const typeSlug = parsed.data.type.toLowerCase().replace(/_/g, "-")

    // Score the lead
    const { score, tier, priority, reason } = scoreToTier(parsed.data.score, parsed.data.type)

    // Auto-create Deal with scoring
    const deal = await db.deal.create({
      data: {
        contactName: parsed.data.name ?? parsed.data.email.split("@")[0],
        contactEmail: parsed.data.email,
        company: parsed.data.company,
        phone: parsed.data.phone,
        source: typeSlug,
        sourceDetail: `Score: ${score}/100 (${tier}). ${reason}`,
        channelTag: parsed.data.utmSource ?? "organic",
        utmSource: parsed.data.utmSource,
        utmMedium: parsed.data.utmMedium,
        utmCampaign: parsed.data.utmCampaign,
        value: 0,
        leadScore: score,
        leadScoreTier: tier,
        leadScoreReason: reason,
        priority,
        stage: tier === "hot" ? "QUALIFIED" : "NEW_LEAD",
        activities: {
          create: {
            type: "FORM_SUBMITTED",
            detail: `${parsed.data.type} completed. Score: ${score}/100 (${tier}). ${reason}`,
          },
        },
      },
    }).catch((e) => { logger.error("Failed to create deal from lead magnet", e); return null })

    if (deal) {
      // Link submission to deal
      await db.leadMagnetSubmission.update({
        where: { id: submission.id },
        data: { convertedToDeal: true, dealId: deal.id },
      }).catch((e) => logger.error("Failed to link submission to deal", e))

      // Notify team
      await notifyNewLead({
        contactName: parsed.data.name ?? parsed.data.email,
        contactEmail: parsed.data.email,
        company: parsed.data.company,
        source: typeSlug,
        channelTag: parsed.data.utmSource,
      }).catch((e) => logger.error("Failed to notify new lead", e))

      // Urgent Slack alert for hot leads
      if (tier === "hot") {
        await notify({
          type: "hot_lead",
          title: `HOT Lead - ${parsed.data.type}`,
          message: `${parsed.data.name ?? parsed.data.email}${parsed.data.company ? ` (${parsed.data.company})` : ""} scored ${score}/100. ${reason}`,
          urgency: "high",
        }).catch((e) => logger.error("Failed to send hot lead notification", e))
      }

      // Sync to Close CRM
      createCloseLead({
        contactName: parsed.data.name ?? parsed.data.email,
        contactEmail: parsed.data.email,
        company: parsed.data.company,
        phone: parsed.data.phone,
        source: typeSlug,
        dealId: deal.id,
      }).then((closeLeadId) => {
        if (closeLeadId) {
          db.deal.update({ where: { id: deal.id }, data: { closeLeadId } }).catch((e) => logger.error("Failed to update deal with closeLeadId", e))
        }
      }).catch((e) => logger.error("Failed to sync lead to Close CRM", e))
    }

    // Queue email sequence
    const sequenceKey = SEQUENCE_MAP[parsed.data.type]
    if (sequenceKey) {
      await queueEmailSequence(parsed.data.email, sequenceKey, {
        name: parsed.data.name,
        score: parsed.data.score,
        monthlySavings: (parsed.data.results as Record<string, unknown>)?.monthlySavings as number | undefined,
        auditScore: parsed.data.score,
      }).catch((e) => logger.error("Failed to queue email sequence", e))
    }

    // Build results URL - dedicated page for quiz/calculator/audit, generic for others
    const RESULTS_PAGE_TYPES = new Set(["ai-readiness-quiz", "roi-calculator", "website-audit", "business-credit-score", "executive-ops-audit"])
    const resultsUrl = RESULTS_PAGE_TYPES.has(typeSlug)
      ? `${appUrl}/tools/${typeSlug}/results/${submission.id}`
      : `${appUrl}/tools/${typeSlug}`

    // Send type-specific results email for quiz/calculator/audit, generic for others
    const detailedEmailParams = {
      to: parsed.data.email,
      name: parsed.data.name ?? "",
      score: parsed.data.score,
      resultsUrl,
      data: parsed.data.data as Record<string, unknown>,
      results: parsed.data.results as Record<string, unknown> | undefined,
    }

    switch (parsed.data.type) {
      case "AI_READINESS_QUIZ":
        await sendQuizResultsEmail(detailedEmailParams).catch(
          (err) => logger.error("Failed to send quiz results email", err)
        )
        break
      case "ROI_CALCULATOR":
        await sendCalculatorResultsEmail(detailedEmailParams).catch(
          (err) => logger.error("Failed to send calculator results email", err)
        )
        break
      case "WEBSITE_AUDIT":
        await sendAuditResultsEmail(detailedEmailParams).catch(
          (err) => logger.error("Failed to send audit results email", err)
        )
        break
      case "BUSINESS_CREDIT_SCORE":
        await sendCreditScoreEmail(detailedEmailParams).catch(
          (err) => logger.error("Failed to send credit score results email", err)
        )
        break
      case "EXECUTIVE_OPS_AUDIT":
        await sendOpsAuditEmail(detailedEmailParams).catch(
          (err) => logger.error("Failed to send ops audit email", err)
        )
        break
      default:
        // Generic fallback for SEGMENT_EXPLORER, STACK_CONFIGURATOR, etc.
        await sendLeadMagnetResults({
          to: parsed.data.email,
          name: parsed.data.name ?? "",
          type: typeSlug,
          score: parsed.data.score,
          resultsUrl,
        }).catch((err) => logger.error("Failed to send generic results email", err))
        break
    }

    return NextResponse.json(
      { id: submission.id, score: submission.score },
      { status: 201 }
    )
  } catch (err) {
    logger.error("Lead magnet submission failed", err, { endpoint: "POST /api/lead-magnets/submit" })
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
