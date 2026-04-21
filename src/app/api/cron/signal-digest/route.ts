import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { logCronExecution } from "@/lib/cron-log"
import { logger } from "@/lib/logger"
import { runDigestForSubscriber, runDigestForUser, startOfUtcDay } from "@/lib/signal/digest"

export const maxDuration = 300

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization")
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const started = Date.now()
  const today = startOfUtcDay()

  const users = await db.user.findMany({
    where: {
      notifSignalDigest: true,
      signalTopics: { some: { enabled: true } },
    },
    select: { id: true },
  })

  const subscribers = await db.signalSubscriber.findMany({
    where: {
      status: "ACTIVE",
      OR: [{ lastSentDate: null }, { lastSentDate: { lt: today } }],
    },
    select: { id: true },
  })

  const userResults = { sent: 0, empty: 0, skipped: 0, failed: 0 }
  for (const u of users) {
    try {
      const r = await runDigestForUser(u.id)
      if (r.status === "SENT") userResults.sent++
      else if (r.status === "EMPTY") userResults.empty++
      else userResults.skipped++
    } catch (err) {
      userResults.failed++
      logger.error("signal digest user failed", { userId: u.id, err })
    }
  }

  const subResults = { sent: 0, empty: 0, skipped: 0, failed: 0 }
  for (const s of subscribers) {
    try {
      const r = await runDigestForSubscriber(s.id)
      if (r.status === "SENT") subResults.sent++
      else if (r.status === "EMPTY") subResults.empty++
      else subResults.skipped++
    } catch (err) {
      subResults.failed++
      logger.error("signal digest subscriber failed", { subscriberId: s.id, err })
    }
  }

  const duration = Date.now() - started
  const totalFailed = userResults.failed + subResults.failed
  await logCronExecution(
    "signal-digest",
    totalFailed > 0 ? "error" : "success",
    `users=${users.length} sent=${userResults.sent} empty=${userResults.empty} | subs=${subscribers.length} sent=${subResults.sent} empty=${subResults.empty} | failed=${totalFailed}`,
    duration,
  )

  return NextResponse.json({
    users: { count: users.length, ...userResults },
    subscribers: { count: subscribers.length, ...subResults },
    durationMs: duration,
  })
}
