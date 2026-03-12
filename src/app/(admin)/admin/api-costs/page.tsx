import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { getApiCostSummary } from "@/lib/db/queries"
import { db } from "@/lib/db"
import ApiCostsClient from "./ApiCostsClient"

export const metadata = { title: "API Costs" }

export default async function AdminApiCostsPage() {
  const { userId, sessionClaims } = await auth()
  if (!userId) redirect("/sign-in")
  const role = (sessionClaims?.publicMetadata as { role?: string })?.role
  if (!role || !["ADMIN", "SUPER_ADMIN"].includes(role)) redirect("/portal/dashboard")

  const [costs30, costs7, costs60, subscriptions] = await Promise.all([
    getApiCostSummary(30).catch(() => ({ total: 0, byProvider: [], byServiceArm: [] })),
    getApiCostSummary(7).catch(() => ({ total: 0, byProvider: [], byServiceArm: [] })),
    getApiCostSummary(60).catch(() => ({ total: 0, byProvider: [], byServiceArm: [] })),
    db.subscription
      .findMany({
        where: { status: "ACTIVE" },
        select: {
          monthlyAmount: true,
          serviceArm: { select: { name: true } },
          user: { select: { name: true, email: true } },
        },
      })
      .catch(() => []),
  ])

  // Build per-client cost data using clientId on ApiCostLog
  const clientCostLogs = await db.apiCostLog
    .groupBy({
      by: ["clientId"],
      where: { clientId: { not: null }, createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
      _sum: { cost: true },
    })
    .catch(() => [])

  // This-week vs last-week per provider for anomaly detection
  const thisWeekSince = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  const lastWeekSince = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)

  const [thisWeekByProvider, lastWeekByProvider] = await Promise.all([
    db.apiCostLog
      .groupBy({
        by: ["provider"],
        where: { createdAt: { gte: thisWeekSince } },
        _sum: { cost: true },
      })
      .catch(() => []),
    db.apiCostLog
      .groupBy({
        by: ["provider"],
        where: { createdAt: { gte: lastWeekSince, lt: thisWeekSince } },
        _sum: { cost: true },
      })
      .catch(() => []),
  ])

  // Compute last-month total (days 30-60) for trend
  const lastMonthTotal = costs60.total - costs30.total
  const trendPct =
    lastMonthTotal > 0 ? Math.round(((costs30.total - lastMonthTotal) / lastMonthTotal) * 100) : null

  // Build per-client profit rows
  type ClientRow = {
    clientName: string
    service: string
    revenue: number
    apiCost: number
    profit: number
    margin: number
  }
  const clientRows: ClientRow[] = subscriptions.map((s) => {
    const revenue = s.monthlyAmount
    const matchedLog = clientCostLogs.find(() => false) // placeholder — no user→clientId mapping yet
    const apiCost = matchedLog ? (matchedLog._sum.cost ?? 0) : 0
    const profit = revenue - apiCost
    const margin = revenue > 0 ? Math.round((profit / revenue) * 100) : 0
    return {
      clientName: s.user?.name ?? s.user?.email ?? "Unknown",
      service: s.serviceArm?.name ?? "Unknown",
      revenue,
      apiCost,
      profit,
      margin,
    }
  })
  clientRows.sort((a, b) => a.margin - b.margin)

  // Anomaly detection
  type AnomalyAlert = { provider: string; pct: number }
  const anomalies: AnomalyAlert[] = []
  for (const twp of thisWeekByProvider) {
    const lwp = lastWeekByProvider.find((p) => p.provider === twp.provider)
    const thisWeekCost = twp._sum.cost ?? 0
    const lastWeekCost = lwp?._sum.cost ?? 0
    if (lastWeekCost > 0) {
      const pct = Math.round(((thisWeekCost - lastWeekCost) / lastWeekCost) * 100)
      if (pct >= 40) anomalies.push({ provider: twp.provider, pct })
    }
  }

  return (
    <ApiCostsClient
      costs30={costs30}
      trendPct={trendPct}
      clientRows={clientRows}
      anomalies={anomalies}
      hasAnyData={costs30.total > 0 || costs30.byProvider.length > 0}
    />
  )
}
