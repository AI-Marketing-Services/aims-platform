import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { notifyChurnRisk } from "@/lib/notifications"

// Vercel Cron: runs daily at 9am UTC
// Configure in vercel.json: { "crons": [{ "path": "/api/cron/check-churn", "schedule": "0 9 * * *" }] }

export async function GET(req: Request) {
  // Verify cron secret to prevent unauthorized access
  const authHeader = req.headers.get("authorization")
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const fourteenDaysAgo = new Date()
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14)

  // Find active clients who haven't logged in for 14+ days
  const atRiskUsers = await db.user.findMany({
    where: {
      role: "CLIENT",
      lastLoginAt: { lt: fourteenDaysAgo },
      subscriptions: {
        some: { status: "ACTIVE" },
      },
    },
    include: {
      subscriptions: {
        where: { status: "ACTIVE" },
        select: { monthlyAmount: true },
      },
    },
  })

  let notified = 0
  for (const user of atRiskUsers) {
    const totalMrr = user.subscriptions.reduce((sum, s) => sum + s.monthlyAmount, 0)
    const daysSinceLogin = Math.floor(
      (Date.now() - (user.lastLoginAt?.getTime() ?? 0)) / 86400000
    )

    await notifyChurnRisk({
      clientName: user.name ?? user.email,
      email: user.email,
      daysSinceLogin,
      mrr: totalMrr,
    }).catch(console.error)

    // Also update any associated deals to AT_RISK
    await db.deal.updateMany({
      where: {
        userId: user.id,
        stage: "ACTIVE_CLIENT",
      },
      data: { stage: "AT_RISK" },
    })

    notified++
  }

  return NextResponse.json({
    checked: atRiskUsers.length,
    notified,
    timestamp: new Date().toISOString(),
  })
}
