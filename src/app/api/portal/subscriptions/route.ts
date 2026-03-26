import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { logger } from "@/lib/logger"

export async function GET() {
  const { userId: clerkId } = await auth()
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const user = await db.user.findUnique({ where: { clerkId } })
    if (!user) return NextResponse.json([], { status: 200 })

    const subs = await db.subscription.findMany({
      where: { userId: user.id, status: "ACTIVE" },
      include: { serviceArm: { select: { name: true, slug: true } } },
      orderBy: { createdAt: "asc" },
    })

    return NextResponse.json(
      subs.map((s) => ({ id: s.id, name: s.serviceArm.name, slug: s.serviceArm.slug }))
    )
  } catch (err) {
    logger.error("Failed to fetch portal subscriptions:", err)
    return NextResponse.json({ error: "Failed to fetch subscriptions" }, { status: 500 })
  }
}
