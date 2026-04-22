import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { logger } from "@/lib/logger"
import { ContentPieceStatus } from "@prisma/client"

const patchSchema = z.object({
  title: z.string().min(1).max(300).optional(),
  content: z.string().min(1).optional(),
  status: z.nativeEnum(ContentPieceStatus).optional(),
})

async function getDbUserId(clerkId: string) {
  const u = await db.user.findUnique({ where: { clerkId }, select: { id: true } })
  return u?.id ?? null
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const dbUserId = await getDbUserId(userId)
  if (!dbUserId) return NextResponse.json({ error: "User not found" }, { status: 404 })

  const { id } = await params

  try {
    const piece = await db.contentPiece.findFirst({
      where: { id, userId: dbUserId },
      select: {
        id: true,
        type: true,
        status: true,
        title: true,
        content: true,
        prompt: true,
        clientDealId: true,
        clientDeal: { select: { companyName: true } },
        publishedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    if (!piece) return NextResponse.json({ error: "Not found" }, { status: 404 })

    return NextResponse.json({ piece })
  } catch (err) {
    logger.error("Failed to fetch content piece", err, { userId, endpoint: `GET /api/portal/content/${id}` })
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const dbUserId = await getDbUserId(userId)
  if (!dbUserId) return NextResponse.json({ error: "User not found" }, { status: 404 })

  const { id } = await params

  try {
    const body = await req.json()
    const parsed = patchSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid data", issues: parsed.error.issues }, { status: 400 })
    }

    const existing = await db.contentPiece.findFirst({
      where: { id, userId: dbUserId },
      select: { id: true },
    })
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 })

    const { title, content, status } = parsed.data

    const updated = await db.contentPiece.update({
      where: { id },
      data: {
        ...(title !== undefined ? { title } : {}),
        ...(content !== undefined ? { content } : {}),
        ...(status !== undefined ? { status } : {}),
        ...(status === "PUBLISHED" ? { publishedAt: new Date() } : {}),
      },
    })

    return NextResponse.json({ piece: updated })
  } catch (err) {
    logger.error("Failed to update content piece", err, { userId, endpoint: `PATCH /api/portal/content/${id}` })
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const dbUserId = await getDbUserId(userId)
  if (!dbUserId) return NextResponse.json({ error: "User not found" }, { status: 404 })

  const { id } = await params

  try {
    const existing = await db.contentPiece.findFirst({
      where: { id, userId: dbUserId },
      select: { id: true },
    })
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 })

    await db.contentPiece.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (err) {
    logger.error("Failed to delete content piece", err, { userId, endpoint: `DELETE /api/portal/content/${id}` })
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
