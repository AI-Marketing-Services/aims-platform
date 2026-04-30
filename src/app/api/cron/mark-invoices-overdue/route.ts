import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { logCronExecution } from "@/lib/cron-log"
import { logger } from "@/lib/logger"

export const dynamic = "force-dynamic"
export const maxDuration = 60

/**
 * Daily cron — flips ClientInvoice status from SENT to OVERDUE when
 * dueAt is in the past. Runs at 09:00 UTC daily so operators see
 * fresh overdue counts in their morning digest.
 *
 * vercel.json: { "schedule": "0 9 * * *" }
 *
 * Idempotent: only updates rows still in SENT status with dueAt < now.
 */
export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization")
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const startTime = Date.now()
  try {
    const now = new Date()
    const result = await db.clientInvoice.updateMany({
      where: {
        status: "SENT",
        dueAt: { lt: now, not: null },
      },
      data: { status: "OVERDUE" },
    })

    const duration = Date.now() - startTime
    await logCronExecution(
      "mark-invoices-overdue",
      "success",
      `flipped=${result.count}`,
      duration,
    )

    return NextResponse.json({
      ok: true,
      flipped: result.count,
      durationMs: duration,
    })
  } catch (err) {
    logger.error("mark-invoices-overdue cron crashed", err)
    await logCronExecution(
      "mark-invoices-overdue",
      "error",
      `crash`,
      Date.now() - startTime,
    )
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
