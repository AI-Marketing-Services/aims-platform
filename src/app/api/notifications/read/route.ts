import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"

export async function PATCH(req: Request) {
  const { userId, sessionClaims } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const { ids } = body as { ids?: string[] }

  const role = (sessionClaims?.metadata as { role?: string })?.role
  const isAdmin = role === "ADMIN" || role === "SUPER_ADMIN"

  if (ids?.length) {
    await db.notification.updateMany({
      where: { id: { in: ids } },
      data: { read: true },
    })
  } else {
    // Mark all unread
    const user = isAdmin ? null : await db.user.findUnique({ where: { clerkId: userId }, select: { id: true } })
    await db.notification.updateMany({
      where: isAdmin ? { read: false } : { read: false, userId: user?.id },
      data: { read: true },
    })
  }

  return NextResponse.json({ ok: true })
}

// POST = mark all read (same as PATCH with no body)
export async function POST(req: Request) {
  return PATCH(req)
}
