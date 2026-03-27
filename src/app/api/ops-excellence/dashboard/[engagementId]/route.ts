import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { getDashboardData } from "@/lib/ops-excellence/queries"
import { db } from "@/lib/db"
import { logger } from "@/lib/logger"

type RouteContext = { params: Promise<{ engagementId: string }> }

export async function GET(_req: NextRequest, context: RouteContext) {
  try {
    const { userId, sessionClaims } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { engagementId } = await context.params

    const role = (sessionClaims?.metadata as { role?: string })?.role
    const isAdmin = role === "ADMIN" || role === "SUPER_ADMIN"

    if (!isAdmin) {
      const user = await db.user.findUnique({ where: { clerkId: userId } })
      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 })
      }

      const engagement = await db.opsExcellenceEngagement.findUnique({
        where: { id: engagementId },
        select: { userId: true },
      })

      if (!engagement) {
        return NextResponse.json({ error: "Engagement not found" }, { status: 404 })
      }

      if (engagement.userId !== user.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }
    }

    const dashboard = await getDashboardData(engagementId)

    if (!dashboard) {
      return NextResponse.json({ error: "Engagement not found" }, { status: 404 })
    }

    return NextResponse.json({ data: dashboard })
  } catch (err) {
    logger.error("Failed to fetch dashboard data", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
