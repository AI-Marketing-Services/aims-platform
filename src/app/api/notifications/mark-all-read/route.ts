import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"

export async function PATCH() {
  const { userId, sessionClaims } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const role = (sessionClaims?.metadata as { role?: string })?.role
  const isAdmin = role === "ADMIN" || role === "SUPER_ADMIN"

  const dbUser = isAdmin
    ? null
    : await db.user.findUnique({ where: { clerkId: userId }, select: { id: true } })

  if (!isAdmin && !dbUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 })
  }

  try {
    const whereClause = isAdmin
      ? { read: false }
      : { read: false, userId: dbUser!.id }

    const result = await db.notification.updateMany({
      where: whereClause,
      data: { read: true },
    })

    return NextResponse.json({ ok: true, updated: result.count })
  } catch (err) {
    console.error("Failed to mark all notifications as read:", err)
    return NextResponse.json({ error: "Failed to mark notifications as read" }, { status: 500 })
  }
}
