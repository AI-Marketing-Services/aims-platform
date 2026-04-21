import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { logCronExecution } from "@/lib/cron-log"
import { logger } from "@/lib/logger"
import { runDigestForUser } from "@/lib/signal/digest"

export const maxDuration = 300

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization")
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const started = Date.now()
  const users = await db.user.findMany({
    where: {
      notifSignalDigest: true,
      signalTopics: { some: { enabled: true } },
    },
    select: { id: true },
  })

  const results = { sent: 0, empty: 0, skipped: 0, failed: 0 }

  for (const u of users) {
    try {
      const r = await runDigestForUser(u.id)
      if (r.status === "SENT") results.sent++
      else if (r.status === "EMPTY") results.empty++
      else results.skipped++
    } catch (err) {
      results.failed++
      logger.error("signal digest user failed", { userId: u.id, err })
    }
  }

  const duration = Date.now() - started
  await logCronExecution(
    "signal-digest",
    results.failed > 0 ? "error" : "success",
    `users=${users.length} sent=${results.sent} empty=${results.empty} failed=${results.failed}`,
    duration,
  )

  return NextResponse.json({ users: users.length, ...results, durationMs: duration })
}
