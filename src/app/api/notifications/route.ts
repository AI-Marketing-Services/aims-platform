import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { logger } from "@/lib/logger"

export async function GET(req: Request) {
  const { userId, sessionClaims } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const role = (sessionClaims?.metadata as { role?: string })?.role
  const isAdmin = role === "ADMIN" || role === "SUPER_ADMIN"
  const { searchParams } = new URL(req.url)
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "20") || 20, 100)

  // Cache user lookup - used for both findMany and count below
  const dbUserId = isAdmin
    ? undefined
    : (await db.user.findUnique({ where: { clerkId: userId }, select: { id: true } }))?.id

  if (!isAdmin && !dbUserId) {
    return NextResponse.json({ notifications: [], unreadCount: 0 })
  }

  const whereClause = isAdmin ? {} : { userId: dbUserId }

  try {
    const [notifications, unreadCount] = await Promise.all([
      db.notification.findMany({
        where: whereClause,
        orderBy: { sentAt: "desc" },
        take: limit,
      }),
      db.notification.count({
        where: { ...whereClause, read: false },
      }),
    ])

    return NextResponse.json({ notifications, unreadCount })
  } catch (err) {
    logger.error("Failed to fetch notifications:", err)
    return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 })
  }
}
