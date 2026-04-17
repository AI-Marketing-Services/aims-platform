import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { logger } from "@/lib/logger"

async function markRead(req: Request) {
  const { userId, sessionClaims } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const body = await req.json().catch(() => ({}))
    const { ids } = body as { ids?: string[] }

    const role = (sessionClaims?.metadata as { role?: string })?.role
    const isAdmin = role === "ADMIN" || role === "SUPER_ADMIN"

    const dbUser = isAdmin
      ? null
      : await db.user.findUnique({ where: { clerkId: userId }, select: { id: true } })

    if (ids?.length) {
      await db.notification.updateMany({
        where: {
          id: { in: ids },
          ...(isAdmin ? {} : { userId: dbUser?.id }),
        },
        data: { read: true },
      })
    } else {
      await db.notification.updateMany({
        where: isAdmin ? { read: false } : { read: false, userId: dbUser?.id },
        data: { read: true },
      })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    logger.error("[Notifications] markRead failed", err)
    return NextResponse.json(
      { error: "Failed to mark notifications as read" },
      { status: 500 }
    )
  }
}

export async function PATCH(req: Request) { return markRead(req) }
export async function POST(req:  Request) { return markRead(req) }
