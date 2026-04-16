import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { sendAbandonedApplicationEmail } from "@/lib/email/abandoned-application"
import { logCronExecution } from "@/lib/cron-log"
import { logger } from "@/lib/logger"

// Runs hourly. Finds PartialApplication rows that are 4–72 hours old,
// still not marked completed, and have no prior reminder sent. Sends one
// "you forgot something" email and stamps reminderSentAt so we never
// double-send.

const MIN_AGE_HOURS = 4
const MAX_AGE_HOURS = 72
const MAX_PER_RUN = 200

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization")
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const startTime = Date.now()
  const now = Date.now()
  const minAge = new Date(now - MIN_AGE_HOURS * 3600_000)
  const maxAge = new Date(now - MAX_AGE_HOURS * 3600_000)

  try {
    const candidates = await db.partialApplication.findMany({
      where: {
        completedAt: null,
        reminderSentAt: null,
        createdAt: { lt: minAge, gt: maxAge },
      },
      take: MAX_PER_RUN,
    })

    let sent = 0
    let skipped = 0
    let errors = 0

    for (const partial of candidates) {
      // Defensive: skip if a full application has landed for this email
      // in the meantime (race between form submit and cron).
      const completedDeal = await db.deal.findFirst({
        where: {
          contactEmail: partial.email,
          source: "ai-operator-collective-application",
        },
        select: { id: true },
      })
      if (completedDeal) {
        await db.partialApplication.update({
          where: { id: partial.id },
          data: { completedAt: new Date(), dealId: completedDeal.id },
        })
        skipped++
        continue
      }

      try {
        const fullName = `${partial.firstName} ${partial.lastName}`.trim()
        const result = await sendAbandonedApplicationEmail({
          to: partial.email,
          name: fullName,
        })
        if (result && typeof result === "object" && "error" in result && result.error) {
          throw new Error(JSON.stringify(result.error))
        }
        await db.partialApplication.update({
          where: { id: partial.id },
          data: { reminderSentAt: new Date() },
        })
        sent++
      } catch (err) {
        errors++
        logger.error(
          `Abandoned-application email failed for ${partial.email}`,
          err,
          { action: "abandoned_applications" }
        )
      }
    }

    const duration = Date.now() - startTime
    await logCronExecution(
      "abandoned-applications",
      errors === 0 ? "success" : "error",
      `Sent: ${sent}, Skipped: ${skipped}, Errors: ${errors}, Candidates: ${candidates.length}`,
      duration
    )

    return NextResponse.json({
      sent,
      skipped,
      errors,
      candidates: candidates.length,
      timestamp: new Date().toISOString(),
    })
  } catch (err) {
    const duration = Date.now() - startTime
    const message = err instanceof Error ? err.message : "Unknown error"
    await logCronExecution("abandoned-applications", "error", message, duration)
    logger.error("abandoned-applications cron failed", err)
    return NextResponse.json({ error: "Cron failed" }, { status: 500 })
  }
}
