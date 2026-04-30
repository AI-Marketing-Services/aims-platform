import { NextResponse } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { logger } from "@/lib/logger"
import { ensureDbUserIdForApi } from "@/lib/auth/ensure-user"
import { emitEvent, EVENT_TYPES } from "@/lib/events/emit"
import type { Prisma } from "@prisma/client"

export const dynamic = "force-dynamic"

/**
 * POST /api/portal/audits/responses/[id]/convert-to-deal
 *
 * Promotes an AuditResponse into a ClientDeal in the operator's CRM.
 * Idempotent: re-running on a response that's already been converted
 * returns the existing deal id rather than creating a duplicate.
 *
 * What gets transferred:
 *   - companyName: from response.leadCompany (or fallback to leadName)
 *   - contactName + contactEmail + contactPhone: from response.lead*
 *   - notes: AI summary + per-question answer dump (formatted as a
 *     readable note so operators don't have to bounce between the audit
 *     and the deal to see context)
 *   - tags: aiTags from the response + 'audit-converted' marker
 *   - source: 'audit-converted' so reports can attribute pipeline back
 *     to specific audits
 *   - leadScore: aiScore if present (capped 0-100)
 *
 * The operator can override stage / industry / value via the body.
 */

const bodySchema = z.object({
  stage: z
    .enum([
      "PROSPECT",
      "DISCOVERY_CALL",
      "PROPOSAL_SENT",
      "ACTIVE_RETAINER",
      "COMPLETED",
      "LOST",
    ])
    .optional()
    .default("PROSPECT"),
  industry: z.string().max(80).optional(),
  value: z.number().min(0).optional(),
})

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const dbUserId = await ensureDbUserIdForApi()
  if (!dbUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let body: unknown = {}
  try {
    body = await req.json()
  } catch {
    // empty body is fine, defaults apply
  }
  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid options", issues: parsed.error.issues },
      { status: 400 },
    )
  }

  const { id: responseId } = await params

  // Pull the response, scoped to operator ownership via the parent quiz
  const response = await db.auditResponse.findFirst({
    where: { id: responseId, quiz: { ownerId: dbUserId } },
    include: { quiz: { select: { id: true, title: true, questions: true } } },
  })
  if (!response) {
    return NextResponse.json({ error: "Response not found" }, { status: 404 })
  }

  // Idempotency: check for an existing deal already converted from this
  // response. We tag converted deals with `auditResponseId` in their
  // notes JSON via metadata, easier to look up via ClientDealActivity
  // type=NOTE with metadata.sourceResponseId.
  const existingActivity = await db.clientDealActivity.findFirst({
    where: {
      type: "NOTE",
      metadata: {
        path: ["sourceResponseId"],
        equals: responseId,
      },
      clientDeal: { userId: dbUserId },
    },
    select: { clientDealId: true },
  })
  if (existingActivity) {
    return NextResponse.json({
      ok: true,
      dealId: existingActivity.clientDealId,
      alreadyConverted: true,
    })
  }

  // Resolve company name
  const companyName =
    response.leadCompany?.trim() ||
    response.leadName?.trim() ||
    response.leadEmail?.split("@")[1] ||
    "Unknown Company"

  // Build a readable notes block with AI summary + answers
  const notesBlock = buildNotesBlock(response)

  // Lead score
  const leadScore =
    typeof response.aiScore === "number"
      ? Math.max(0, Math.min(100, Math.round(response.aiScore)))
      : null

  try {
    const deal = await db.clientDeal.create({
      data: {
        userId: dbUserId,
        companyName,
        contactName: response.leadName?.trim() || null,
        contactEmail: response.leadEmail?.trim().toLowerCase() || null,
        contactPhone: response.leadPhone?.trim() || null,
        industry: parsed.data.industry?.trim() || null,
        notes: notesBlock,
        value: parsed.data.value ?? 0,
        stage: parsed.data.stage,
        source: "audit-converted",
        tags: Array.from(
          new Set([
            ...(response.aiTags ?? []).map((t) => t.toLowerCase()),
            "audit-converted",
          ]),
        ),
        leadScore,
        // Activity entry that doubles as the idempotency anchor
        activities: {
          create: {
            type: "NOTE",
            description: `Converted from audit submission: ${response.quiz.title}`,
            metadata: {
              sourceResponseId: responseId,
              sourceQuizId: response.quiz.id,
              quizTitle: response.quiz.title,
              aiScore: response.aiScore,
            },
          },
        },
      },
      select: { id: true, companyName: true },
    })

    void emitEvent({
      actorId: dbUserId,
      type: EVENT_TYPES.DEAL_CREATED,
      entityType: "ClientDeal",
      entityId: deal.id,
      metadata: {
        source: "audit-converted",
        responseId,
        quizTitle: response.quiz.title,
        leadScore,
      },
    })

    return NextResponse.json({
      ok: true,
      dealId: deal.id,
      companyName: deal.companyName,
      alreadyConverted: false,
    })
  } catch (err) {
    logger.error("Audit-to-deal conversion failed", err, {
      responseId,
      userId: dbUserId,
    })
    return NextResponse.json({ error: "Conversion failed" }, { status: 500 })
  }
}

interface AuditResponseLite {
  aiSummary: string | null
  answers: Prisma.JsonValue
  aiArms: Prisma.JsonValue
  quiz: { title: string; questions: Prisma.JsonValue }
}

function buildNotesBlock(response: AuditResponseLite): string {
  const lines: string[] = []
  if (response.aiSummary) {
    lines.push("AI summary:")
    lines.push(response.aiSummary.trim())
    lines.push("")
  }

  // Render Q+A so operators can see exactly what the lead said
  const questions = (response.quiz.questions as Array<{
    id: string
    label: string
  }> | null) ?? []
  const answers = (response.answers as Record<string, unknown>) ?? {}

  if (questions.length > 0) {
    lines.push(`From audit: ${response.quiz.title}`)
    for (const q of questions) {
      const a = answers[q.id]
      if (a == null || a === "") continue
      const formatted = Array.isArray(a) ? a.join(", ") : String(a)
      lines.push(`Q: ${q.label}`)
      lines.push(`A: ${formatted}`)
      lines.push("")
    }
  }

  // Recommended service arms (if AI flagged any)
  const arms = response.aiArms as
    | Array<{ name: string; reason: string }>
    | null
  if (Array.isArray(arms) && arms.length > 0) {
    lines.push("Recommended services from AI:")
    for (const arm of arms) {
      lines.push(`  - ${arm.name}: ${arm.reason}`)
    }
  }

  // Strip em-dashes defensively
  return lines.join("\n").replace(/\s*—\s*/g, ": ").replace(/—/g, ",").trim()
}
