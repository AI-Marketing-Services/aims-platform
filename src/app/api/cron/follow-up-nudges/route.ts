import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { logCronExecution } from "@/lib/cron-log"
import { logger } from "@/lib/logger"

// Vercel Cron: runs daily at 9am UTC
// vercel.json: { "path": "/api/cron/follow-up-nudges", "schedule": "0 9 * * *" }
export const maxDuration = 120

const TERMINAL_STAGES = new Set(["COMPLETED", "LOST"])

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization")
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const startTime = Date.now()

  try {
    const activeRules = await db.followUpRule.findMany({
      where: { isActive: true },
    })

    let nudgeCount = 0

    await Promise.all(
      activeRules.map(async (rule) => {
        if (TERMINAL_STAGES.has(rule.stageTrigger)) return

        const staleThreshold = new Date()
        staleThreshold.setDate(staleThreshold.getDate() - rule.daysStale)

        const staleDeals = await db.clientDeal.findMany({
          where: {
            userId: rule.userId,
            stage: rule.stageTrigger,
            updatedAt: { lt: staleThreshold },
            ...(rule.clientDealId ? { id: rule.clientDealId } : {}),
          },
          select: { id: true, companyName: true, stage: true, updatedAt: true },
        })

        const notifications = staleDeals
          .filter((deal) => !TERMINAL_STAGES.has(deal.stage))
          .map((deal) => {
            const actualDays = Math.floor(
              (Date.now() - deal.updatedAt.getTime()) / 86_400_000
            )
            const message =
              rule.message ??
              `${deal.companyName} has been in ${deal.stage} for ${actualDays} days — time to follow up.`

            return db.notification.create({
              data: {
                userId: rule.userId,
                channel: "IN_APP",
                type: "followup_triggered",
                title: "Follow-up needed",
                message,
                metadata: { link: `/portal/crm/deals/${deal.id}` },
              },
            })
          })

        if (notifications.length === 0) return

        await Promise.allSettled(notifications)
        nudgeCount += notifications.length

        await db.followUpRule.update({
          where: { id: rule.id },
          data: { lastTriggered: new Date() },
        })
      })
    )

    const duration = Date.now() - startTime
    await logCronExecution(
      "follow-up-nudges",
      "success",
      `Rules checked: ${activeRules.length}, Nudges sent: ${nudgeCount}`,
      duration
    )

    return NextResponse.json({
      rulesChecked: activeRules.length,
      nudgesSent: nudgeCount,
      timestamp: new Date().toISOString(),
    })
  } catch (err) {
    const duration = Date.now() - startTime
    const errorMessage = err instanceof Error ? err.message : "Unknown error"
    await logCronExecution("follow-up-nudges", "error", errorMessage, duration)
    logger.error("Follow-up nudges cron failed", err)
    return NextResponse.json({ error: "Cron failed" }, { status: 500 })
  }
}
