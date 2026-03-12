import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"

async function markRead(req: Request) {
  const { userId, sessionClaims } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const { ids } = body as { ids?: string[] }

  const role = (sessionClaims?.publicMetadata as { role?: string })?.role
  const isAdmin = role === "ADMIN" || role === "SUPER_ADMIN"

  const dbUser = isAdmin
    ? null
    : await db.user.findUnique({ where: { clerkId: userId }, select: { id: true } })

  if (ids?.length) {
    // Non-admins: only mark notifications that belong to them
    await db.notification.updateMany({
      where: {
        id: { in: ids },
        // Admins can mark any notification; users can only mark their own
        ...(isAdmin ? {} : { userId: dbUser?.id }),
      },
      data: { read: true },
    })
  } else {
    // Mark all unread — scoped to current user unless admin
    await db.notification.updateMany({
      where: isAdmin ? { read: false } : { read: false, userId: dbUser?.id },
      data: { read: true },
    })
  }

  return NextResponse.json({ ok: true })
}

export async function PATCH(req: Request) { return markRead(req) }
export async function POST(req:  Request) { return markRead(req) }
