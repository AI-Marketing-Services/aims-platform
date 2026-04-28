import { NextResponse } from "next/server"
import { Prisma } from "@prisma/client"
import { db } from "@/lib/db"
import { logger } from "@/lib/logger"
import { ensureDbUserIdForApi } from "@/lib/auth/ensure-user"
import {
  AI_AUDIT_TEMPLATE_QUESTIONS,
  DEFAULT_QUIZ_DEFAULTS,
} from "@/lib/audits/template"
import { generateUniqueSlug } from "@/lib/audits/slug"

export const dynamic = "force-dynamic"

// GET — list owner's audit quizzes (excludes archived).
export async function GET() {
  const dbUserId = await ensureDbUserIdForApi()
  if (!dbUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const quizzes = await db.auditQuiz.findMany({
      where: { ownerId: dbUserId, archivedAt: null },
      select: {
        id: true,
        slug: true,
        title: true,
        subtitle: true,
        ctaLabel: true,
        logoUrl: true,
        brandColor: true,
        accentColor: true,
        customDomain: true,
        isPublished: true,
        collectEmail: true,
        emailRequired: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { responses: true } },
        responses: {
          select: { createdAt: true },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
      orderBy: { updatedAt: "desc" },
    })

    return NextResponse.json({ quizzes })
  } catch (err) {
    logger.error("Failed to list audit quizzes", err, {
      endpoint: "GET /api/portal/audits",
      userId: dbUserId,
    })
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}

// POST — create a new audit quiz from the AI Audit template.
export async function POST() {
  const dbUserId = await ensureDbUserIdForApi()
  if (!dbUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const owner = await db.user.findUnique({
      where: { id: dbUserId },
      select: { name: true, company: true },
    })

    const seed =
      owner?.company?.trim() ||
      owner?.name?.trim() ||
      "ai-audit"

    const slug = await generateUniqueSlug(seed)

    const quiz = await db.auditQuiz.create({
      data: {
        ownerId: dbUserId,
        slug,
        title: DEFAULT_QUIZ_DEFAULTS.title,
        subtitle: DEFAULT_QUIZ_DEFAULTS.subtitle,
        ctaLabel: DEFAULT_QUIZ_DEFAULTS.ctaLabel,
        successHeadline: DEFAULT_QUIZ_DEFAULTS.successHeadline,
        successMessage: DEFAULT_QUIZ_DEFAULTS.successMessage,
        questions: AI_AUDIT_TEMPLATE_QUESTIONS as unknown as Prisma.InputJsonValue,
        collectEmail: true,
        emailRequired: true,
        isPublished: true,
      },
    })

    return NextResponse.json({ quiz }, { status: 201 })
  } catch (err) {
    logger.error("Failed to create audit quiz", err, {
      endpoint: "POST /api/portal/audits",
      userId: dbUserId,
    })
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
