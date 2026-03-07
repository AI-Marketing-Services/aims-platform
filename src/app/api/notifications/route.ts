import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"

export async function GET(req: Request) {
  const { userId, sessionClaims } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const role = (sessionClaims?.metadata as { role?: string })?.role
  const { searchParams } = new URL(req.url)
  const limit = parseInt(searchParams.get("limit") ?? "20")

  // Admins see all notifications; clients see only their own
  const where =
    role === "ADMIN" || role === "SUPER_ADMIN"
      ? {}
      : (() => {
          const user = db.user.findFirst({ where: { clerkId: userId }, select: { id: true } })
          return { userId: user as unknown as string }
        })()

  const notifications = await db.notification.findMany({
    where: role === "ADMIN" || role === "SUPER_ADMIN"
      ? {}
      : { userId: (await db.user.findUnique({ where: { clerkId: userId }, select: { id: true } }))?.id },
    orderBy: { sentAt: "desc" },
    take: limit,
  })

  const unreadCount = await db.notification.count({
    where: {
      ...( role === "ADMIN" || role === "SUPER_ADMIN"
        ? { read: false }
        : { read: false, userId: (await db.user.findUnique({ where: { clerkId: userId }, select: { id: true } }))?.id }),
    },
  })

  return NextResponse.json({ notifications, unreadCount })
}
