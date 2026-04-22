import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { logger } from "@/lib/logger"
import { AiScriptType } from "@prisma/client"

const createScriptSchema = z.object({
  type: z.nativeEnum(AiScriptType),
  title: z.string().min(1).max(200),
  content: z.string().min(1),
  prompt: z.string().optional(),
  clientDealId: z.string().optional(),
})

async function getDbUserId(clerkId: string) {
  const u = await db.user.findUnique({ where: { clerkId }, select: { id: true } })
  return u?.id ?? null
}

export async function GET(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const dbUserId = await getDbUserId(userId)
  if (!dbUserId) return NextResponse.json({ error: "User not found" }, { status: 404 })

  const { searchParams } = new URL(req.url)
  const typeParam = searchParams.get("type")

  const typeFilter = typeParam
    ? z.nativeEnum(AiScriptType).safeParse(typeParam)
    : null

  if (typeFilter && !typeFilter.success) {
    return NextResponse.json({ error: "Invalid type filter" }, { status: 400 })
  }

  try {
    const scripts = await db.aiScript.findMany({
      where: {
        userId: dbUserId,
        ...(typeFilter?.success ? { type: typeFilter.data } : {}),
      },
      select: {
        id: true,
        type: true,
        title: true,
        content: true,
        clientDealId: true,
        clientDeal: { select: { companyName: true } },
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: "desc" },
    })
    return NextResponse.json({ scripts })
  } catch (err) {
    logger.error("Failed to fetch AI scripts", err, { userId })
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
    const parsed = createScriptSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid data", issues: parsed.error.issues }, { status: 400 })
    }

    const { type, title, content, prompt, clientDealId } = parsed.data

    // Verify deal belongs to user if provided
    if (clientDealId) {
      const deal = await db.clientDeal.findFirst({
        where: { id: clientDealId, userId: dbUserId },
        select: { id: true },
      })
      if (!deal) {
        return NextResponse.json({ error: "Deal not found" }, { status: 404 })
      }
    }

    const script = await db.aiScript.create({
      data: {
        userId: dbUserId,
        type,
        title,
        content,
        prompt: prompt ?? null,
        clientDealId: clientDealId ?? null,
      },
    })

    return NextResponse.json({ script }, { status: 201 })
  } catch (err) {
    logger.error("Failed to create AI script", err, { userId })
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
