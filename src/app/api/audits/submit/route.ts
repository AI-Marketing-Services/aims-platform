import { NextResponse } from "next/server"
import { z } from "zod"

import { db } from "@/lib/db"
import { logger } from "@/lib/logger"
import { formRatelimit, getIp } from "@/lib/ratelimit"
import { summarizeAuditResponse } from "@/lib/audits/ai-summary"
import type {
  AnswerMap,
  AnswerValue,
  QuizQuestion,
} from "@/lib/audits/types"

const answerValueSchema: z.ZodType<AnswerValue> = z.union([
  z.string(),
  z.number(),
  z.array(z.string()),
  z.null(),
])

const submitSchema = z.object({
  slug: z.string().min(1),
  answers: z.record(answerValueSchema),
  lead: z
    .object({
      email: z.string().email().optional().or(z.literal("")).transform((v) => (v ? v : undefined)),
      name: z.string().optional(),
      company: z.string().optional(),
      phone: z.string().optional(),
      role: z.string().optional(),
    })
    .default({}),
  utm: z
    .object({
      source: z.string().optional(),
      medium: z.string().optional(),
      campaign: z.string().optional(),
    })
    .optional(),
  referer: z.string().optional(),
})

function isAnswered(value: AnswerValue | undefined): boolean {
  if (value === null || value === undefined) return false
  if (typeof value === "string") return value.trim().length > 0
  if (typeof value === "number") return Number.isFinite(value)
  if (Array.isArray(value)) return value.length > 0
  return false
}

export async function POST(req: Request) {
  // Best-effort IP-based rate limit. Skip silently when Upstash isn't configured.
  if (formRatelimit) {
    try {
      const { success } = await formRatelimit.limit(getIp(req))
      if (!success) {
        return NextResponse.json(
          { error: "Too many requests" },
          { status: 429 },
        )
      }
    } catch (err) {
      logger.warn("Audit submit ratelimit check failed", {
        error: err instanceof Error ? err.message : String(err),
      })
    }
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const parsed = submitSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", issues: parsed.error.flatten() },
      { status: 400 },
    )
  }

  const { slug, answers, lead, utm, referer } = parsed.data

  try {
    const quiz = await db.auditQuiz.findFirst({
      where: { slug, isPublished: true, archivedAt: null },
      select: {
        id: true,
        questions: true,
        collectEmail: true,
        emailRequired: true,
        successHeadline: true,
        successMessage: true,
        successCta: true,
        successCtaUrl: true,
      },
    })

    if (!quiz) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 })
    }

    const questions = (quiz.questions as unknown as QuizQuestion[]) ?? []
    const answerMap: AnswerMap = answers as AnswerMap

    // Required-question validation against the live schema (server-truth).
    const missing = questions.find(
      (q) => q.required && !isAnswered(answerMap[q.id]),
    )
    if (missing) {
      return NextResponse.json(
        {
          error: `"${missing.label}" is required.`,
          issues: { questionId: missing.id },
        },
        { status: 400 },
      )
    }

    if (quiz.collectEmail && quiz.emailRequired && !lead.email) {
      return NextResponse.json(
        { error: "Email is required.", issues: { field: "email" } },
        { status: 400 },
      )
    }

    const ip = getIp(req)
    const userAgent = req.headers.get("user-agent") ?? undefined

    const response = await db.auditResponse.create({
      data: {
        quizId: quiz.id,
        leadEmail: lead.email ?? null,
        leadName: lead.name ?? null,
        leadCompany: lead.company ?? null,
        leadPhone: lead.phone ?? null,
        leadRole: lead.role ?? null,
        answers: answerMap,
        utmSource: utm?.source ?? null,
        utmMedium: utm?.medium ?? null,
        utmCampaign: utm?.campaign ?? null,
        referer: referer ?? null,
        userAgent,
        ip: ip === "unknown" ? null : ip,
        completedAt: new Date(),
      },
      select: { id: true },
    })

    // Fire-and-forget AI summary so the user gets the success screen instantly.
    // The summary is written back to the row when it resolves; failures are
    // logged but never break the user-facing flow.
    void Promise.resolve()
      .then(async () => {
        const summary = await summarizeAuditResponse({
          questions,
          answers: answerMap,
          lead,
        })
        if (!summary) return
        await db.auditResponse.update({
          where: { id: response.id },
          data: {
            aiSummary: summary.summary,
            aiScore: summary.score,
            aiTags: summary.tags,
            aiArms: summary.recommendedArms,
            aiGeneratedAt: new Date(),
          },
        })
      })
      .catch((err) => {
        logger.error("Audit AI summary failed", err, {
          endpoint: "POST /api/audits/submit",
          action: "ai-summary",
        })
      })

    return NextResponse.json({
      ok: true,
      responseId: response.id,
      success: {
        headline: quiz.successHeadline,
        message: quiz.successMessage,
        cta: quiz.successCta,
        ctaUrl: quiz.successCtaUrl,
      },
    })
  } catch (err) {
    logger.error("Audit submit failed", err, {
      endpoint: "POST /api/audits/submit",
    })
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
