import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"

export async function PATCH(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId, sessionClaims } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const role = (sessionClaims?.metadata as { role?: string })?.role
  const isAdmin = role === "ADMIN" || role === "SUPER_ADMIN"

  // Resolve the DB user
  const dbUser = await db.user.findUnique({ where: { clerkId: userId }, select: { id: true } })
  if (!dbUser) return NextResponse.json({ error: "User not found" }, { status: 404 })

  // Fetch the notification first to verify ownership (admins may mark any notification)
  const notification = await db.notification.findUnique({ where: { id }, select: { userId: true } })
  if (!notification) return NextResponse.json({ error: "Not found" }, { status: 404 })

  // Non-admins can only mark their own notifications
  if (!isAdmin && notification.userId !== dbUser.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    await db.notification.update({ where: { id }, data: { read: true } })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error(`Failed to mark notification ${id} as read:`, err)
    return NextResponse.json({ error: "Failed to update" }, { status: 500 })
  }
}
