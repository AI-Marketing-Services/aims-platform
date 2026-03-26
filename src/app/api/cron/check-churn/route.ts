import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { notifyChurnRisk } from "@/lib/notifications"
import { logCronExecution } from "@/lib/cron-log"
import { logger } from "@/lib/logger"

// Vercel Cron: runs daily at 9am UTC
// Configure in vercel.json: { "crons": [{ "path": "/api/cron/check-churn", "schedule": "0 9 * * *" }] }

export async function GET(req: Request) {
  // Verify cron secret to prevent unauthorized access
  const authHeader = req.headers.get("authorization")
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const startTime = Date.now()

  try {
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
      }).catch((err) => logger.error(`Churn risk notification failed for ${user.email}:`, err))

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

    const duration = Date.now() - startTime
    await logCronExecution("check-churn", "success", `Checked: ${atRiskUsers.length}, Notified: ${notified}`, duration)

    return NextResponse.json({
      checked: atRiskUsers.length,
      notified,
      timestamp: new Date().toISOString(),
    })
  } catch (err) {
    const duration = Date.now() - startTime
    const errorMessage = err instanceof Error ? err.message : "Unknown error"
    await logCronExecution("check-churn", "error", errorMessage, duration)
    logger.error("Churn check cron failed:", err)
    return NextResponse.json({ error: "Churn check failed" }, { status: 500 })
  }
}
