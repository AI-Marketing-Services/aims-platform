import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { logger } from "@/lib/logger"

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

  const { id: dealId } = await params

  const deal = await db.clientDeal.findFirst({
    where: { id: dealId, userId: dbUserId },
    select: { id: true },
  })
  if (!deal) return NextResponse.json({ error: "Not found" }, { status: 404 })

  try {
    const accesses = await db.clientPortalAccess.findMany({
      where: { clientDealId: dealId, userId: dbUserId },
      select: {
        id: true,
        guestEmail: true,
        guestName: true,
        expiresAt: true,
        lastAccessAt: true,
        revokedAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({ accesses })
  } catch (err) {
    logger.error("Failed to fetch portal accesses", err, { userId, dealId })
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
