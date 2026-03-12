import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"

export async function GET(req: Request) {
  const { userId, sessionClaims } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const role = (sessionClaims?.publicMetadata as { role?: string })?.role
  const isAdmin = role === "ADMIN" || role === "SUPER_ADMIN"
  const { searchParams } = new URL(req.url)
  const limit = parseInt(searchParams.get("limit") ?? "20")

  // Cache user lookup — used for both findMany and count below
  const dbUserId = isAdmin
    ? undefined
    : (await db.user.findUnique({ where: { clerkId: userId }, select: { id: true } }))?.id

  const whereClause = isAdmin ? {} : { userId: dbUserId }

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
}
