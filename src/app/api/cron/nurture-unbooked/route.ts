import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { sendBookingReminderEmail } from "@/lib/email/booking-reminder"
import { logCronExecution } from "@/lib/cron-log"
import { logger } from "@/lib/logger"

// Up to 200 deals × 3 reminder days × Resend latency (~150ms) ≈ 90s. Default
// Vercel serverless timeout is 10s on Hobby / 60s on Pro — both can fail
// mid-batch. Bump to 5min so a single run can drain a backlog cleanly.
export const maxDuration = 300

// Runs daily. For every applicant still in APPLICATION_SUBMITTED (i.e. they
// applied but didn't book a consult), send a nudge on day 2, 5, or 9 from
// application. Marks each reminder with a DealActivity to dedupe.

const REMINDER_DAYS = [2, 5, 9] as const
type ReminderDay = (typeof REMINDER_DAYS)[number]

const WINDOW_HOURS = 26 // catch deals that turned N-days-old in the last 24h + buffer
const MAX_PER_RUN = 200

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization")
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const startTime = Date.now()
  let sent = 0
  let skipped = 0
  let errors = 0

  try {
    for (const day of REMINDER_DAYS) {
      const { sent: s, skipped: k, errors: e } = await processDay(day)
      sent += s
      skipped += k
      errors += e
    }

    const duration = Date.now() - startTime
    await logCronExecution(
      "nurture-unbooked",
      errors === 0 ? "success" : "error",
      `Sent: ${sent}, Skipped: ${skipped}, Errors: ${errors}`,
      duration
    )

    return NextResponse.json({
      sent,
      skipped,
      errors,
      timestamp: new Date().toISOString(),
    })
  } catch (err) {
    const duration = Date.now() - startTime
    const message = err instanceof Error ? err.message : "Unknown error"
    await logCronExecution("nurture-unbooked", "error", message, duration)
    logger.error("nurture-unbooked cron failed", err)
    return NextResponse.json({ error: "Cron failed" }, { status: 500 })
  }
}

async function processDay(day: ReminderDay): Promise<{ sent: number; skipped: number; errors: number }> {
  // Deals whose age (now − createdAt) is within [day, day + window) hours.
  const now = Date.now()
  const ageStart = now - (day * 24 + WINDOW_HOURS) * 3600_000
  const ageEnd = now - day * 24 * 3600_000

  const deals = await db.deal.findMany({
    where: {
      source: "ai-operator-collective-application",
      stage: "APPLICATION_SUBMITTED",
      createdAt: { gte: new Date(ageStart), lt: new Date(ageEnd) },
    },
    take: MAX_PER_RUN,
  })

  let sent = 0
  let skipped = 0
  let errors = 0

  for (const deal of deals) {
    if (!deal.contactEmail) {
      skipped++
      continue
    }

    const already = await db.dealActivity.findFirst({
      where: {
        dealId: deal.id,
        type: "EMAIL_SENT",
        detail: `booking-reminder-day-${day}`,
      },
      select: { id: true },
    })
    if (already) {
      skipped++
      continue
    }

    // Defensive: if a DEMO_COMPLETED or stage flip already happened, skip.
    const demoActivity = await db.dealActivity.findFirst({
      where: { dealId: deal.id, type: { in: ["DEMO_COMPLETED", "MIGHTY_MEMBER_JOINED"] } },
      select: { id: true },
    })
    if (demoActivity) {
      skipped++
      continue
    }

    try {
      const result = await sendBookingReminderEmail({
        to: deal.contactEmail,
        name: deal.contactName ?? "",
        day,
        tier: (deal.leadScoreTier as "hot" | "warm" | "cold" | null) ?? "cold",
      })
      if (result && typeof result === "object" && "error" in result && result.error) {
        throw new Error(JSON.stringify(result.error))
      }
      await db.dealActivity.create({
        data: {
          dealId: deal.id,
          type: "EMAIL_SENT",
          detail: `booking-reminder-day-${day}`,
          metadata: { day, to: deal.contactEmail, sentAt: new Date().toISOString() },
        },
      })
      sent++
    } catch (err) {
      errors++
      logger.error(`Booking reminder day ${day} failed for ${deal.contactEmail}`, err, {
        action: "nurture_unbooked",
      })
    }
  }

  return { sent, skipped, errors }
}
