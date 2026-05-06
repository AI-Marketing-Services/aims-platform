import { NextResponse } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { ensureDbUserIdForApi } from "@/lib/auth/ensure-user"
import { hasEntitlement } from "@/lib/entitlements"
import { FEATURE_ENTITLEMENTS } from "@/lib/plans/registry"
import { analyzeWithClaude, classifyAnthropicError } from "@/lib/ai"
import { logger } from "@/lib/logger"

export const dynamic = "force-dynamic"

const bodySchema = z.object({
  /**
   * Free-form question or one of the canned actions:
   *   "next_action" — what should I do next on this deal?
   *   "draft_followup" — draft my next follow-up email
   *   "score" — score this deal 1-10 with reasoning
   *   "summary" — give me a one-paragraph summary of where this deal is at
   * Anything else is treated as an open question.
   */
  prompt: z.string().min(1).max(2000),
  action: z
    .enum(["next_action", "draft_followup", "score", "summary", "ask"])
    .default("ask"),
})

/**
 * POST /api/portal/crm/deals/[id]/assistant
 *
 * Deal-aware AI co-pilot. Pulls full deal context (company, contact,
 * stage, audit response, proposal status, last activity) and asks Claude
 * to draft / score / advise based on the operator's question.
 *
 * Gated by feature_deal_assistant. ADMIN/SUPER_ADMIN bypasses.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = await ensureDbUserIdForApi()
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id: dealId } = await params

  // Entitlement check (admin bypass already inside hasEntitlement caller? No —
  // we check role separately so admins always pass).
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { role: true },
  })
  const isAdmin = user?.role === "ADMIN" || user?.role === "SUPER_ADMIN"
  if (!isAdmin) {
    const ok = await hasEntitlement(userId, FEATURE_ENTITLEMENTS.DEAL_ASSISTANT)
    if (!ok) {
      return NextResponse.json(
        { error: "upgrade_required", entitlement: FEATURE_ENTITLEMENTS.DEAL_ASSISTANT },
        { status: 402 },
      )
    }
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }
  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid body", details: parsed.error.flatten() },
      { status: 400 },
    )
  }

  // Load the deal with EVERYTHING the assistant needs to be useful — but
  // cap activity / notes / proposals to recent rows so the prompt stays
  // under the 200K context window even on busy deals.
  const deal = await db.clientDeal.findFirst({
    where: { id: dealId, userId },
    include: {
      contacts: { take: 5 },
      activities: { orderBy: { createdAt: "desc" }, take: 10 },
      proposals: { orderBy: { updatedAt: "desc" }, take: 3 },
      invoices: { orderBy: { createdAt: "desc" }, take: 3 },
      enrichment: true,
      meetingNotes: { orderBy: { createdAt: "desc" }, take: 3 },
    },
  })
  if (!deal) {
    return NextResponse.json({ error: "Deal not found" }, { status: 404 })
  }

  const dealContext = JSON.stringify(
    {
      company: deal.companyName,
      contact: deal.contactName,
      contactEmail: deal.contactEmail,
      website: deal.website,
      industry: deal.industry,
      stage: deal.stage,
      value: deal.value,
      leadScore: deal.leadScore,
      tags: deal.tags,
      notes: deal.notes,
      enrichment: deal.enrichment
        ? {
            description: deal.enrichment.description,
            industry: deal.enrichment.industry,
            employeeRange: deal.enrichment.employeeRange,
            revenueRange: deal.enrichment.revenueRange,
            city: deal.enrichment.city,
            state: deal.enrichment.state,
          }
        : null,
      activities: deal.activities.map((a) => ({
        type: a.type,
        description: a.description,
        createdAt: a.createdAt,
      })),
      proposals: deal.proposals.map((p) => ({
        title: p.title,
        status: p.status,
        totalValue: p.totalValue,
      })),
      invoices: deal.invoices.map((i) => ({
        total: i.total,
        currency: i.currency,
        status: i.status,
      })),
      meetingNotes: deal.meetingNotes.map((n) => ({
        title: n.title,
        content: n.content,
      })),
    },
    null,
    2,
  )

  const operatorMode = (() => {
    switch (parsed.data.action) {
      case "next_action":
        return "Recommend the single best next action this operator should take on this deal. Be specific — name the channel, a 1-line rationale, and the message body if applicable. No fluff."
      case "draft_followup":
        return "Draft a follow-up email this operator can send right now. Personalize using the contact + company context. Subject + body. Keep under 120 words. Match the tone the operator uses in past activities if visible."
      case "score":
        return "Score this deal from 1 to 10 (10 = most likely to close in the next 30 days). Output JSON only: {score: number, reasoning: string, riskFactors: string[], boosters: string[]}."
      case "summary":
        return "Write a one-paragraph executive summary of where this deal stands and what the operator should focus on this week."
      default:
        return "Answer the operator's question using ONLY the provided deal context. If the data is insufficient, say what's missing rather than inventing facts."
    }
  })()

  const systemPrompt = `You are the Deal Assistant — an AI co-pilot embedded inside an AI operator's CRM. You have full read-only access to one specific deal's context. You are precise, specific, and operator-friendly. Never invent contacts, dates, or metrics that aren't in the context.

Mode: ${operatorMode}`

  const userPrompt = `<deal_context>
${dealContext}
</deal_context>

Operator question: ${parsed.data.prompt}`

  try {
    const result = await analyzeWithClaude({
      prompt: userPrompt,
      systemPrompt,
      model: "claude-haiku-4-5-20251001",
      maxTokens: 1500,
      serviceArm: "deal-assistant",
      clientId: deal.id,
    })
    return NextResponse.json({
      ok: true,
      action: parsed.data.action,
      response: result.text,
    })
  } catch (err) {
    const classified = classifyAnthropicError(err)
    if (classified) {
      return NextResponse.json(
        { error: classified.message },
        { status: classified.status },
      )
    }
    logger.error("Deal Assistant call failed", err, { dealId, userId })
    return NextResponse.json(
      { error: "Deal Assistant unavailable right now" },
      { status: 500 },
    )
  }
}
