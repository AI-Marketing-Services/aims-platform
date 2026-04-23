import { NextResponse } from "next/server"
import { auth, clerkClient } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { logger } from "@/lib/logger"

export const dynamic = "force-dynamic"

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId: actingUserId, sessionClaims } = await auth()
  if (!actingUserId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const actingRole = (sessionClaims?.metadata as { role?: string })?.role
  if (!actingRole || !["ADMIN", "SUPER_ADMIN"].includes(actingRole)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { userId } = await params

  if (userId === actingUserId) {
    return NextResponse.json({ error: "Cannot delete your own account" }, { status: 400 })
  }

  try {
    const clerk = await clerkClient()

    // Delete from Clerk — this revokes all sessions immediately
    await clerk.users.deleteUser(userId)

    // Clean up local DB records (non-fatal if user never had a local record)
    await db.user.deleteMany({ where: { clerkId: userId } }).catch(() => {})

    logger.info(`User deleted: ${userId} by ${actingUserId}`, { action: "admin_delete_user" })

    return NextResponse.json({ ok: true })
  } catch (err) {
    logger.error(`Failed to delete user ${userId}`, err)
    const message = err instanceof Error ? err.message : "Failed to delete user"
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
