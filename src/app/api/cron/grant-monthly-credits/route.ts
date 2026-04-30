import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { logCronExecution } from "@/lib/cron-log"
import { logger } from "@/lib/logger"
import { applyMonthlyGrantIfDue } from "@/lib/enrichment/credits/ledger"

export const dynamic = "force-dynamic"
export const maxDuration = 300

/**
 * Monthly credit grant cron — runs at 04:00 UTC on the 1st of every
 * month. vercel.json: { "schedule": "0 4 1 * *" }
 *
 * Walks every user whose plan tier grants monthly credits (operator,
 * pro, agency) and tops them up to their grant amount via the ledger.
 *
 * applyMonthlyGrantIfDue is idempotent within a calendar month — calling
 * twice in the same month won't double-grant. So a Vercel cron retry
 * (which can happen on transient failure) is safe.
 *
 * Trial users get nothing — they buy top-ups or upgrade to a paid plan.
 */
export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization")
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const startTime = Date.now()
  let granted = 0
  let skipped = 0
  let errors = 0

  try {
    const eligibleUsers = await db.user.findMany({
      where: {
        creditPlanTier: { in: ["operator", "pro", "agency"] },
      },
      select: { id: true, creditPlanTier: true, email: true },
    })

    for (const u of eligibleUsers) {
      try {
        const result = await applyMonthlyGrantIfDue({
          userId: u.id,
          planTier: u.creditPlanTier,
        })
        if (result) granted += 1
        else skipped += 1
      } catch (err) {
        errors += 1
        logger.error("Monthly grant failed for user", err, {
          userId: u.id,
          planTier: u.creditPlanTier,
        })
      }
    }

    const duration = Date.now() - startTime
    await logCronExecution(
      "grant-monthly-credits",
      errors === 0 ? "success" : "error",
      `granted=${granted} skipped=${skipped} errors=${errors} total=${eligibleUsers.length}`,
      duration,
    )
    return NextResponse.json({
      ok: true,
      granted,
      skipped,
      errors,
      total: eligibleUsers.length,
      durationMs: duration,
    })
  } catch (err) {
    logger.error("Monthly credit grant cron crashed", err)
    await logCronExecution(
      "grant-monthly-credits",
      "error",
      `crash granted=${granted}`,
      Date.now() - startTime,
    )
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
