import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { logger } from "@/lib/logger"
import { ContentPieceType, ContentPieceStatus } from "@prisma/client"
import { getOrCreateDbUserByClerkId } from "@/lib/auth/ensure-user"

const createContentSchema = z.object({
  type: z.nativeEnum(ContentPieceType),
  title: z.string().min(1).max(300),
  content: z.string().min(1),
  prompt: z.string().optional(),
  clientDealId: z.string().optional(),
  status: z.nativeEnum(ContentPieceStatus).optional(),
})

async function getDbUserId(clerkId: string): Promise<string | null> {
  const user = await getOrCreateDbUserByClerkId(clerkId)
  return user.id
}

export async function GET(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const dbUserId = await getDbUserId(userId)
  if (!dbUserId) return NextResponse.json({ error: "User not found" }, { status: 404 })

  const { searchParams } = new URL(req.url)
  const typeParam = searchParams.get("type")
  const statusParam = searchParams.get("status")

  const typeFilter = typeParam
    ? z.nativeEnum(ContentPieceType).safeParse(typeParam)
    : null
  const statusFilter = statusParam
    ? z.nativeEnum(ContentPieceStatus).safeParse(statusParam)
    : null

  if (typeFilter && !typeFilter.success) {
    return NextResponse.json({ error: "Invalid type filter" }, { status: 400 })
  }
  if (statusFilter && !statusFilter.success) {
    return NextResponse.json({ error: "Invalid status filter" }, { status: 400 })
  }

  try {
    const pieces = await db.contentPiece.findMany({
      where: {
        userId: dbUserId,
        ...(typeFilter?.success ? { type: typeFilter.data } : {}),
        ...(statusFilter?.success ? { status: statusFilter.data } : {}),
      },
      select: {
        id: true,
        type: true,
        status: true,
        title: true,
        content: true,
        clientDealId: true,
        clientDeal: { select: { companyName: true } },
        publishedAt: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: "desc" },
    })
    return NextResponse.json({ pieces })
  } catch (err) {
    logger.error("Failed to fetch content pieces", err, { userId })
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const dbUserId = await getDbUserId(userId)
  if (!dbUserId) return NextResponse.json({ error: "User not found" }, { status: 404 })

  try {
    const body = await req.json()
    const parsed = createContentSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid data", issues: parsed.error.issues }, { status: 400 })
    }

    const { type, title, content, prompt, clientDealId, status } = parsed.data

    if (clientDealId) {
      const deal = await db.clientDeal.findFirst({
        where: { id: clientDealId, userId: dbUserId },
        select: { id: true },
      })
      if (!deal) {
        return NextResponse.json({ error: "Deal not found" }, { status: 404 })
      }
    }

    const piece = await db.contentPiece.create({
      data: {
        userId: dbUserId,
        type,
        title,
        content,
        prompt: prompt ?? null,
        clientDealId: clientDealId ?? null,
        status: status ?? "DRAFT",
      },
    })

    return NextResponse.json({ piece }, { status: 201 })
  } catch (err) {
    logger.error("Failed to create content piece", err, { userId })
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
