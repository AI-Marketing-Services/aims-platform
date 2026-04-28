import { NextResponse } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { logger } from "@/lib/logger"
import { ensureDbUserIdForApi } from "@/lib/auth/ensure-user"

export const dynamic = "force-dynamic"

const querySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional(),
  cursor: z.string().min(1).optional(),
})

// GET — list responses for a quiz the operator owns. Supports cursor pagination.
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const dbUserId = await ensureDbUserIdForApi()
  if (!dbUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  const { searchParams } = new URL(req.url)
  const parsedQuery = querySchema.safeParse({
    limit: searchParams.get("limit") ?? undefined,
    cursor: searchParams.get("cursor") ?? undefined,
  })
  if (!parsedQuery.success) {
    return NextResponse.json(
      { error: "Invalid query", issues: parsedQuery.error.issues },
      { status: 400 }
    )
  }

  const limit = parsedQuery.data.limit ?? 50
  const cursor = parsedQuery.data.cursor

  try {
    // Verify ownership before exposing responses.
    const quiz = await db.auditQuiz.findFirst({
      where: { id, ownerId: dbUserId },
      select: { id: true, title: true, slug: true, questions: true },
    })
    if (!quiz) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    const responses = await db.auditResponse.findMany({
      where: { quizId: id },
      select: {
        id: true,
        leadEmail: true,
        leadName: true,
        leadCompany: true,
        leadPhone: true,
        leadRole: true,
        answers: true,
        aiSummary: true,
        aiScore: true,
        aiTags: true,
        aiArms: true,
        aiGeneratedAt: true,
        utmSource: true,
        utmMedium: true,
        utmCampaign: true,
        completedAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    })

    const hasMore = responses.length > limit
    const trimmed = hasMore ? responses.slice(0, limit) : responses
    const nextCursor = hasMore ? trimmed[trimmed.length - 1]?.id ?? null : null

    return NextResponse.json({
      quiz: { id: quiz.id, title: quiz.title, slug: quiz.slug },
      responses: trimmed,
      nextCursor,
    })
  } catch (err) {
    logger.error("Failed to list audit responses", err, {
      endpoint: "GET /api/portal/audits/[id]/responses",
      userId: dbUserId,
      quizId: id,
    })
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
