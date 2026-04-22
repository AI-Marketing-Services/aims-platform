import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { logger } from "@/lib/logger"

async function getDbUserId(clerkId: string) {
  const u = await db.user.findUnique({ where: { clerkId }, select: { id: true } })
  return u?.id ?? null
}

export async function POST(
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
      select: { id: true, status: true },
    })
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 })

    const updated = await db.contentPiece.update({
      where: { id },
      data: {
        status: "PUBLISHED",
        publishedAt: new Date(),
      },
      select: {
        id: true,
        status: true,
        publishedAt: true,
      },
    })

    return NextResponse.json({ piece: updated })
  } catch (err) {
    logger.error("Failed to publish content piece", err, { userId, endpoint: `POST /api/portal/content/${id}/publish` })
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
