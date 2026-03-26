import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { logger } from "@/lib/logger"

export async function GET() {
  const { userId: clerkId } = await auth()
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const dbUser = await db.user.findUnique({ where: { clerkId } })
    if (!dbUser) return NextResponse.json({ error: "User not found" }, { status: 404 })

    const referral = await db.referral.findFirst({
      where: { referrerId: dbUser.id },
    })

    if (!referral) {
      return NextResponse.json({
        commissions: [],
        summary: { totalEarned: 0, totalPending: 0, totalApproved: 0, count: 0 },
      })
    }

    const commissions = await db.commission.findMany({
      where: { referralId: referral.id },
      orderBy: { createdAt: "desc" },
    })

    const summary = {
      totalEarned: commissions.filter((c) => c.status === "PAID").reduce((sum, c) => sum + c.amount, 0),
      totalPending: commissions.filter((c) => c.status === "PENDING").reduce((sum, c) => sum + c.amount, 0),
      totalApproved: commissions.filter((c) => c.status === "APPROVED").reduce((sum, c) => sum + c.amount, 0),
      count: commissions.length,
    }

    return NextResponse.json({ commissions, summary })
  } catch (err) {
    logger.error("Failed to fetch reseller commissions", err, { endpoint: "GET /api/reseller/commissions" })
    return NextResponse.json({ error: "Failed to fetch commissions" }, { status: 500 })
  }
}
