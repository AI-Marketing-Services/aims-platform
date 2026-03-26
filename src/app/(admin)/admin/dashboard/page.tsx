import { DealStage } from "@prisma/client"
import { db } from "@/lib/db"
import type { PipelineFunnelEntry, RevenueByServiceEntry } from "@/components/admin/AdminCharts"
import { AdminDashboardClient } from "./AdminDashboardClient"

// ─── Constants ───────────────────────────────────────────────────────────────

const FUNNEL_ORDER = [
  { key: "NEW_LEAD", label: "New Lead" },
  { key: "QUALIFIED", label: "Qualified" },
  { key: "DEMO_BOOKED", label: "Demo Booked" },
  { key: "PROPOSAL_SENT", label: "Proposal Sent" },
  { key: "ACTIVE_CLIENT", label: "Active Client" },
] as const

const MRR_TARGET = 100_000

// ─── Data Fetching ────────────────────────────────────────────────────────────

async function getDashboardData() {
  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000)

  // Fire all 7 independent DB queries in parallel via Promise.allSettled
  const [
    subsResult,
    pipelineResult,
    hotLeadsResult,
    funnelResult,
    revenueResult,
    overdueResult,
    activityResult,
    workloadResult,
  ] = await Promise.allSettled([
    // 1. Active subscriptions (for MRR + client counts)
    db.subscription.findMany({
      where: { status: "ACTIVE" },
      select: { monthlyAmount: true, createdAt: true, userId: true },
    }),
    // 2. Pipeline deals
    db.deal.findMany({
      where: { stage: { notIn: ["CHURNED", "LOST"] } },
      select: { value: true, createdAt: true },
    }),
    // 3. Hot leads
    db.deal.findMany({
      where: { leadScore: { gte: 70 } },
      orderBy: { leadScore: "desc" },
      take: 5,
      select: {
        id: true,
        contactName: true,
        company: true,
        leadScore: true,
        source: true,
        channelTag: true,
      },
    }),
    // 4. Pipeline funnel stage counts
    db.deal.groupBy({
      by: ["stage"],
      _count: { id: true },
      where: {
        stage: { in: FUNNEL_ORDER.map((f) => f.key as DealStage) },
      },
    }),
    // 5. Revenue by service arm + service names
    Promise.all([
      db.subscription.groupBy({
        by: ["serviceArmId"],
        _sum: { monthlyAmount: true },
        where: { status: "ACTIVE" },
      }),
      db.serviceArm.findMany({
        select: { id: true, name: true },
      }),
    ]),
    // 6. Overdue fulfillment tasks
    db.fulfillmentTask.findMany({
      where: {
        dueDate: { lt: now },
        status: { not: "done" },
      },
      orderBy: { dueDate: "asc" },
      take: 10,
      select: {
        id: true,
        title: true,
        assignedTo: true,
        dueDate: true,
        subscription: {
          select: {
            user: {
              select: { name: true, company: true, email: true },
            },
          },
        },
      },
    }),
    // 7. Recent activity
    db.dealActivity.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        type: true,
        detail: true,
        createdAt: true,
        deal: { select: { contactName: true, company: true } },
      },
    }),
    // 8. Team workload
    db.fulfillmentTask.findMany({
      where: {
        status: { not: "done" },
        assignedTo: { not: null },
      },
      select: { assignedTo: true, dueDate: true },
    }),
  ])

  // Process subscriptions -> MRR metrics
  let mrr = 0
  let mrrDeltaCurrentPeriod = 0
  let mrrDeltaPrevPeriod = 0
  let activeClients = 0
  let newClientsCurrentPeriod = 0
  let newClientsPrevPeriod = 0

  if (subsResult.status === "fulfilled") {
    const activeSubs = subsResult.value
    mrr = activeSubs.reduce((s, sub) => s + sub.monthlyAmount, 0)
    activeClients = new Set(activeSubs.map((s) => s.userId)).size

    const currentPeriodSubs = activeSubs.filter((s) => s.createdAt > thirtyDaysAgo)
    mrrDeltaCurrentPeriod = currentPeriodSubs.reduce((s, sub) => s + sub.monthlyAmount, 0)
    newClientsCurrentPeriod = new Set(currentPeriodSubs.map((s) => s.userId)).size

    const prevPeriodSubs = activeSubs.filter(
      (s) => s.createdAt > sixtyDaysAgo && s.createdAt <= thirtyDaysAgo
    )
    mrrDeltaPrevPeriod = prevPeriodSubs.reduce((s, sub) => s + sub.monthlyAmount, 0)
    newClientsPrevPeriod = new Set(prevPeriodSubs.map((s) => s.userId)).size
  }

  // Process pipeline deals
  let pipelineValue = 0
  let pipelineValueCurrentPeriod = 0
  let pipelineValuePrevPeriod = 0

  if (pipelineResult.status === "fulfilled") {
    const pipelineDeals = pipelineResult.value
    pipelineValue = pipelineDeals.reduce((s, d) => s + d.value, 0)
    const currentPeriodDeals = pipelineDeals.filter((d) => d.createdAt > thirtyDaysAgo)
    pipelineValueCurrentPeriod = currentPeriodDeals.reduce((s, d) => s + d.value, 0)
    const prevPeriodDeals = pipelineDeals.filter(
      (d) => d.createdAt > sixtyDaysAgo && d.createdAt <= thirtyDaysAgo
    )
    pipelineValuePrevPeriod = prevPeriodDeals.reduce((s, d) => s + d.value, 0)
  }

  // Hot leads
  const hotLeads = hotLeadsResult.status === "fulfilled" ? hotLeadsResult.value : []

  // Pipeline funnel
  const funnelData: PipelineFunnelEntry[] = []
  if (funnelResult.status === "fulfilled") {
    const countMap = Object.fromEntries(
      funnelResult.value.map((r) => [r.stage, r._count?.id ?? 0])
    )
    for (const { key, label } of FUNNEL_ORDER) {
      funnelData.push({ stage: label, count: countMap[key] ?? 0 })
    }
  } else {
    for (const { label } of FUNNEL_ORDER) {
      funnelData.push({ stage: label, count: 0 })
    }
  }

  // Revenue by service
  let revenueByService: RevenueByServiceEntry[] = []
  if (revenueResult.status === "fulfilled") {
    const [serviceRevenue, serviceArms] = revenueResult.value
    const nameMap = Object.fromEntries(serviceArms.map((s) => [s.id, s.name]))
    revenueByService = serviceRevenue
      .map((r) => ({
        name: nameMap[r.serviceArmId] ?? r.serviceArmId,
        mrr: r._sum.monthlyAmount ?? 0,
      }))
      .sort((a, b) => b.mrr - a.mrr)
      .slice(0, 8)
  }

  // Overdue tasks
  const overdueTasks = overdueResult.status === "fulfilled" ? overdueResult.value : []

  // Recent activity
  const recentActivity = activityResult.status === "fulfilled" ? activityResult.value : []

  // Team workload
  let teamWorkload: Array<{ assignedTo: string; total: number; overdue: number }> = []
  if (workloadResult.status === "fulfilled") {
    const workloadMap = new Map<string, { total: number; overdue: number }>()
    for (const task of workloadResult.value) {
      if (!task.assignedTo) continue
      const entry = workloadMap.get(task.assignedTo) ?? { total: 0, overdue: 0 }
      entry.total++
      if (task.dueDate && task.dueDate < now) entry.overdue++
      workloadMap.set(task.assignedTo, entry)
    }
    teamWorkload = Array.from(workloadMap.entries())
      .map(([assignedTo, stats]) => ({ assignedTo, ...stats }))
      .sort((a, b) => b.total - a.total)
  }

  // MRR trend delta
  const mrrDelta = mrrDeltaCurrentPeriod - mrrDeltaPrevPeriod
  const clientDelta = newClientsCurrentPeriod - newClientsPrevPeriod
  const pipelineDelta = pipelineValueCurrentPeriod - pipelineValuePrevPeriod
  const mrrPct = Math.round((mrr / MRR_TARGET) * 100)

  // Generate 7-day sparkline data from items with createdAt dates
  function buildSparkline<T extends { createdAt: Date }>(items: T[], extractValue: (item: T) => number = () => 1): number[] {
    const points: number[] = []
    for (let i = 6; i >= 0; i--) {
      const dayStart = new Date(now.getTime() - i * 86_400_000)
      dayStart.setHours(0, 0, 0, 0)
      const dayEnd = new Date(dayStart.getTime() + 86_400_000)
      const dayItems = items.filter((item) => item.createdAt >= dayStart && item.createdAt < dayEnd)
      points.push(dayItems.reduce((sum, item) => sum + extractValue(item), 0))
    }
    return points
  }

  const mrrSparkline = subsResult.status === "fulfilled"
    ? buildSparkline(subsResult.value, (s) => s.monthlyAmount)
    : []
  const clientSparkline = subsResult.status === "fulfilled"
    ? buildSparkline(subsResult.value)
    : []
  const pipelineSparkline = pipelineResult.status === "fulfilled"
    ? buildSparkline(pipelineResult.value, (d) => d.value)
    : []

  return {
    mrr,
    mrrDelta,
    mrrPct,
    activeClients,
    clientDelta,
    pipelineValue,
    pipelineDelta,
    hotLeads,
    funnelData,
    revenueByService,
    overdueTasks,
    recentActivity,
    teamWorkload,
    mrrSparkline,
    clientSparkline,
    pipelineSparkline,
    now,
  }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function AdminDashboard() {
  const data = await getDashboardData()

  // Serialize dates for client component
  const serializedData = {
    ...data,
    now: data.now.toISOString(),
    hotLeads: data.hotLeads,
    overdueTasks: data.overdueTasks.map((t) => ({
      ...t,
      dueDate: t.dueDate?.toISOString() ?? null,
    })),
    recentActivity: data.recentActivity.map((a) => ({
      ...a,
      createdAt: a.createdAt.toISOString(),
    })),
  }

  return <AdminDashboardClient data={serializedData} />
}
