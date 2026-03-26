import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { logger } from "@/lib/logger"

interface CronJobSummary {
  jobName: string
  lastRun: string | null
  lastStatus: string | null
  lastDetails: string | null
  avgDuration: number
  totalRuns: number
  successCount: number
  errorCount: number
  recentExecutions: {
    id: string
    status: string
    details: string | null
    duration: number
    createdAt: string
  }[]
  isOverdue: boolean
  expectedIntervalHours: number
}

const JOB_INTERVALS: Record<string, number> = {
  "daily-digest": 25,
  "check-churn": 25,
  "process-email-queue": 2,
}

export async function GET() {
  const { userId, sessionClaims } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const role = (sessionClaims?.metadata as { role?: string })?.role
  if (!role || !["ADMIN", "SUPER_ADMIN"].includes(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    // Fetch all cron logs
    const cronLogs = await db.apiCostLog.findMany({
      where: { provider: "cron" },
      orderBy: { createdAt: "desc" },
      take: 500,
    })

    // Group by job name (stored in `model` field)
    const jobMap = new Map<string, typeof cronLogs>()
    for (const log of cronLogs) {
      const jobName = log.model ?? "unknown"
      if (!jobMap.has(jobName)) jobMap.set(jobName, [])
      jobMap.get(jobName)!.push(log)
    }

    // Ensure all known jobs are represented even if no logs exist
    const knownJobs = Object.keys(JOB_INTERVALS)
    for (const job of knownJobs) {
      if (!jobMap.has(job)) jobMap.set(job, [])
    }

    const now = Date.now()
    const summaries: CronJobSummary[] = []

    for (const [jobName, logs] of jobMap.entries()) {
      const sorted = logs.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )

      const last = sorted[0] ?? null
      const successLogs = sorted.filter((l) => l.endpoint === "success")
      const errorLogs = sorted.filter((l) => l.endpoint === "error")

      const durations = sorted
        .map((l) => l.tokens ?? 0)
        .filter((d) => d > 0)
      const avgDuration =
        durations.length > 0
          ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
          : 0

      const expectedHours = JOB_INTERVALS[jobName] ?? 25
      const lastRunTime = last ? new Date(last.createdAt).getTime() : 0
      const hoursSinceLastRun = lastRunTime > 0 ? (now - lastRunTime) / 3600000 : Infinity
      const isOverdue = hoursSinceLastRun > expectedHours

      summaries.push({
        jobName,
        lastRun: last ? last.createdAt.toISOString() : null,
        lastStatus: last?.endpoint ?? null,
        lastDetails: last?.metadata
          ? (last.metadata as { details?: string }).details ?? null
          : null,
        avgDuration,
        totalRuns: sorted.length,
        successCount: successLogs.length,
        errorCount: errorLogs.length,
        recentExecutions: sorted.slice(0, 10).map((l) => ({
          id: l.id,
          status: l.endpoint ?? "unknown",
          details: l.metadata
            ? (l.metadata as { details?: string }).details ?? null
            : null,
          duration: l.tokens ?? 0,
          createdAt: l.createdAt.toISOString(),
        })),
        isOverdue,
        expectedIntervalHours: expectedHours,
      })
    }

    // Sort: overdue first, then by name
    summaries.sort((a, b) => {
      if (a.isOverdue && !b.isOverdue) return -1
      if (!a.isOverdue && b.isOverdue) return 1
      return a.jobName.localeCompare(b.jobName)
    })

    return NextResponse.json({ jobs: summaries })
  } catch (err) {
    logger.error("Failed to fetch cron status:", err)
    return NextResponse.json({ error: "Failed to fetch cron status" }, { status: 500 })
  }
}
