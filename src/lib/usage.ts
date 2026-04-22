import { db } from "@/lib/db"

export type UsageEventType = "lead_scout" | "proposal_generate" | "signal_digest" | "ai_chat"

const MONTHLY_ALLOWANCES: Record<UsageEventType, number> = {
  lead_scout: 20,
  proposal_generate: 15,
  signal_digest: 30,
  ai_chat: 50,
}

export async function trackUsage(
  userId: string,
  type: UsageEventType,
  metadata?: Record<string, string | number | boolean | null>,
  credits = 1,
) {
  await db.usageEvent.create({
    data: { userId, type, credits, metadata },
  })
}

export async function getMonthlyUsage(userId: string): Promise<Record<UsageEventType, number>> {
  const start = new Date()
  start.setDate(1)
  start.setHours(0, 0, 0, 0)

  const rows = await db.usageEvent.groupBy({
    by: ["type"],
    where: { userId, createdAt: { gte: start } },
    _sum: { credits: true },
  })

  const base: Record<UsageEventType, number> = {
    lead_scout: 0,
    proposal_generate: 0,
    signal_digest: 0,
    ai_chat: 0,
  }
  for (const row of rows) {
    const key = row.type as UsageEventType
    if (key in base) base[key] = row._sum.credits ?? 0
  }
  return base
}

export async function getRemainingCredits(
  userId: string,
  type: UsageEventType,
): Promise<number> {
  const usage = await getMonthlyUsage(userId)
  return Math.max(0, MONTHLY_ALLOWANCES[type] - (usage[type] ?? 0))
}

export { MONTHLY_ALLOWANCES }
