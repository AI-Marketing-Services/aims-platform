import { NextResponse } from "next/server"
import { Prisma } from "@prisma/client"
import { z } from "zod"
import { db } from "@/lib/db"
import { logger } from "@/lib/logger"
import { ensureDbUserIdForApi } from "@/lib/auth/ensure-user"

export const dynamic = "force-dynamic"

const QUESTION_TYPES = [
  "single_select",
  "multi_select",
  "short_text",
  "long_text",
  "number",
  "email",
] as const

const quizOptionSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1).max(200),
  value: z.union([z.string(), z.number()]).optional(),
})

const quizQuestionSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1).max(500),
  helper: z.string().max(500).optional(),
  type: z.enum(QUESTION_TYPES),
  required: z.boolean().optional(),
  options: z.array(quizOptionSchema).optional(),
  placeholder: z.string().max(200).optional(),
})

// Hex color or empty/null. Trim before validation in the patch path.
const hexColor = z
  .string()
  .regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, "Must be a hex color like #C4972A")

const optionalUrl = z.string().url().max(500)

const patchQuizSchema = z
  .object({
    title: z.string().min(1).max(200).optional(),
    subtitle: z.string().max(500).nullish(),
    ctaLabel: z.string().min(1).max(80).optional(),
    logoUrl: optionalUrl.nullish(),
    brandColor: hexColor.nullish(),
    accentColor: hexColor.nullish(),
    customDomain: z.string().max(255).nullish(),
    questions: z.array(quizQuestionSchema).min(1).max(40).optional(),
    successHeadline: z.string().max(200).nullish(),
    successMessage: z.string().max(2000).nullish(),
    successCta: z.string().max(80).nullish(),
    successCtaUrl: optionalUrl.nullish(),
    collectEmail: z.boolean().optional(),
    emailRequired: z.boolean().optional(),
    isPublished: z.boolean().optional(),
  })
  .strict()

// GET — fetch a single quiz the operator owns.
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const dbUserId = await ensureDbUserIdForApi()
  if (!dbUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params

  try {
    const quiz = await db.auditQuiz.findFirst({
      where: { id, ownerId: dbUserId },
      include: {
        _count: { select: { responses: true } },
      },
    })
    if (!quiz) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }
    return NextResponse.json({ quiz })
  } catch (err) {
    logger.error("Failed to fetch audit quiz", err, {
      endpoint: "GET /api/portal/audits/[id]",
      userId: dbUserId,
      quizId: id,
    })
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}

// PATCH — partial update; returns the updated quiz.
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const dbUserId = await ensureDbUserIdForApi()
  if (!dbUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params

  try {
    const raw = await req.json()
    const parsed = patchQuizSchema.safeParse(raw)
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid data", issues: parsed.error.issues },
        { status: 400 }
      )
    }

    const existing = await db.auditQuiz.findFirst({
      where: { id, ownerId: dbUserId },
      select: { id: true },
    })
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    // Build update payload — Prisma treats `undefined` as "leave alone" but
    // explicit `null` clears the field.
    const data: Prisma.AuditQuizUpdateInput = {}
    const d = parsed.data

    if (d.title !== undefined) data.title = d.title
    if (d.subtitle !== undefined) data.subtitle = d.subtitle ?? null
    if (d.ctaLabel !== undefined) data.ctaLabel = d.ctaLabel
    if (d.logoUrl !== undefined) data.logoUrl = d.logoUrl ?? null
    if (d.brandColor !== undefined) data.brandColor = d.brandColor ?? null
    if (d.accentColor !== undefined) data.accentColor = d.accentColor ?? null
    if (d.customDomain !== undefined) {
      const trimmed = d.customDomain?.trim()
      data.customDomain = trimmed ? trimmed : null
    }
    if (d.questions !== undefined) {
      data.questions = d.questions as unknown as Prisma.InputJsonValue
    }
    if (d.successHeadline !== undefined)
      data.successHeadline = d.successHeadline ?? null
    if (d.successMessage !== undefined)
      data.successMessage = d.successMessage ?? null
    if (d.successCta !== undefined) data.successCta = d.successCta ?? null
    if (d.successCtaUrl !== undefined)
      data.successCtaUrl = d.successCtaUrl ?? null
    if (d.collectEmail !== undefined) data.collectEmail = d.collectEmail
    if (d.emailRequired !== undefined) data.emailRequired = d.emailRequired
    if (d.isPublished !== undefined) data.isPublished = d.isPublished

    const quiz = await db.auditQuiz.update({
      where: { id },
      data,
    })

    return NextResponse.json({ quiz })
  } catch (err) {
    logger.error("Failed to update audit quiz", err, {
      endpoint: "PATCH /api/portal/audits/[id]",
      userId: dbUserId,
      quizId: id,
    })
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}

// DELETE — soft-delete by setting archivedAt. Preserves AuditResponse rows.
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const dbUserId = await ensureDbUserIdForApi()
  if (!dbUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params

  try {
    const existing = await db.auditQuiz.findFirst({
      where: { id, ownerId: dbUserId },
      select: { id: true },
    })
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    await db.auditQuiz.update({
      where: { id },
      data: { archivedAt: new Date(), isPublished: false },
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    logger.error("Failed to archive audit quiz", err, {
      endpoint: "DELETE /api/portal/audits/[id]",
      userId: dbUserId,
      quizId: id,
    })
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
