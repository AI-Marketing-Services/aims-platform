import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { getEngagementByUserId } from "@/lib/ops-excellence/queries"
import { logger } from "@/lib/logger"

export async function GET() {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await db.user.findUnique({ where: { clerkId } })
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const engagement = await getEngagementByUserId(user.id)

    if (!engagement) {
      return NextResponse.json({ data: null })
    }

    return NextResponse.json({ data: engagement })
  } catch (err) {
    logger.error("Failed to fetch user engagement", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
