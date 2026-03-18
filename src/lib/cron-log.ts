import { db } from "@/lib/db"

export async function logCronExecution(
  jobName: string,
  status: "success" | "error",
  details?: string,
  duration?: number
) {
  try {
    await db.apiCostLog.create({
      data: {
        provider: "cron",
        model: jobName,
        endpoint: status,
        tokens: duration ?? 0,
        cost: 0,
        metadata: details ? { details } : undefined,
      },
    })
  } catch (err) {
    // Do not throw — cron logging should never break the cron job itself
    console.error(`Failed to log cron execution for ${jobName}:`, err)
  }
}
