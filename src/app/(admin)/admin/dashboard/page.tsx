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

  // MRR: sum monthlyAmount for active subscriptions
  // Delta: compare new MRR added in last 30d vs new MRR added 30-60d ago
  let mrr = 0
  let mrrDeltaCurrentPeriod = 0
  let mrrDeltaPrevPeriod = 0
  let activeClients = 0
  let newClientsCurrentPeriod = 0
  let newClientsPrevPeriod = 0

  try {
    const activeSubs = await db.subscription.findMany({
      where: { status: "ACTIVE" },
      select: { monthlyAmount: true, createdAt: true, userId: true },
    })
    mrr = activeSubs.reduce((s, sub) => s + sub.monthlyAmount, 0)
    activeClients = new Set(activeSubs.map((s) => s.userId)).size

    // New MRR added in the current period (last 30 days)
    const currentPeriodSubs = activeSubs.filter((s) => s.createdAt > thirtyDaysAgo)
    mrrDeltaCurrentPeriod = currentPeriodSubs.reduce((s, sub) => s + sub.monthlyAmount, 0)
    newClientsCurrentPeriod = new Set(currentPeriodSubs.map((s) => s.userId)).size

    // New MRR added in the previous period (30-60 days ago)
    const prevPeriodSubs = activeSubs.filter(
      (s) => s.createdAt > sixtyDaysAgo && s.createdAt <= thirtyDaysAgo
    )
    mrrDeltaPrevPeriod = prevPeriodSubs.reduce((s, sub) => s + sub.monthlyAmount, 0)
    newClientsPrevPeriod = new Set(prevPeriodSubs.map((s) => s.userId)).size
  } catch {
    // model may not be populated yet
  }

  // Pipeline value
  let pipelineValue = 0
  let pipelineValueCurrentPeriod = 0
  let pipelineValuePrevPeriod = 0

  try {
    const pipelineDeals = await db.deal.findMany({
      where: {
        stage: {
          notIn: ["CHURNED", "LOST"],
        },
      },
      select: { value: true, createdAt: true },
    })
    pipelineValue = pipelineDeals.reduce((s, d) => s + d.value, 0)

    // Pipeline delta: deals created in last 30d vs deals created 30-60d ago
    const currentPeriodDeals = pipelineDeals.filter((d) => d.createdAt > thirtyDaysAgo)
    pipelineValueCurrentPeriod = currentPeriodDeals.reduce((s, d) => s + d.value, 0)
    const prevPeriodDeals = pipelineDeals.filter(
      (d) => d.createdAt > sixtyDaysAgo && d.createdAt <= thirtyDaysAgo
    )
    pipelineValuePrevPeriod = prevPeriodDeals.reduce((s, d) => s + d.value, 0)
  } catch {
    // model may not be populated
  }

  // Hot leads
  let hotLeads: Array<{
    id: string
    contactName: string
    company: string | null
    leadScore: number | null
    source: string | null
    channelTag: string | null
  }> = []

  try {
    hotLeads = await db.deal.findMany({
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
    })
  } catch {
    // model may not be populated
  }

  // Pipeline funnel counts
  const funnelData: PipelineFunnelEntry[] = []
  try {
    const stageCounts = await db.deal.groupBy({
      by: ["stage"],
      _count: { id: true },
      where: {
        stage: {
          in: FUNNEL_ORDER.map((f) => f.key as DealStage),
        },
      },
    })

    const countMap = Object.fromEntries(
      stageCounts.map((r) => [r.stage, r._count?.id ?? 0])
    )

    for (const { key, label } of FUNNEL_ORDER) {
      funnelData.push({ stage: label, count: countMap[key] ?? 0 })
    }
  } catch {
    for (const { label } of FUNNEL_ORDER) {
      funnelData.push({ stage: label, count: 0 })
    }
  }

  // Revenue by service arm
  let revenueByService: RevenueByServiceEntry[] = []
  try {
    const serviceRevenue = await db.subscription.groupBy({
      by: ["serviceArmId"],
      _sum: { monthlyAmount: true },
      where: { status: "ACTIVE" },
    })

    const serviceArms = await db.serviceArm.findMany({
      where: {
        id: { in: serviceRevenue.map((r) => r.serviceArmId) },
      },
      select: { id: true, name: true },
    })

    const nameMap = Object.fromEntries(serviceArms.map((s) => [s.id, s.name]))

    revenueByService = serviceRevenue
      .map((r) => ({
        name: nameMap[r.serviceArmId] ?? r.serviceArmId,
        mrr: r._sum.monthlyAmount ?? 0,
      }))
      .sort((a, b) => b.mrr - a.mrr)
      .slice(0, 8)
  } catch {
    // model may not be populated
  }

  // Overdue fulfillment tasks
  let overdueTasks: Array<{
    id: string
    title: string
    assignedTo: string | null
    dueDate: Date | null
    subscription: {
      user: {
        name: string | null
        company: string | null
        email: string
      } | null
    }
  }> = []

  try {
    overdueTasks = await db.fulfillmentTask.findMany({
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
              select: {
                name: true,
                company: true,
                email: true,
              },
            },
          },
        },
      },
    })
  } catch {
    // model may not be populated
  }

  // Recent activity
  let recentActivity: Array<{
    id: string
    type: string
    detail: string | null
    createdAt: Date
    deal: { contactName: string; company: string | null } | null
  }> = []

  try {
    recentActivity = await db.dealActivity.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        type: true,
        detail: true,
        createdAt: true,
        deal: {
          select: {
            contactName: true,
            company: true,
          },
        },
      },
    })
  } catch {
    // model may not be populated
  }

  // Team workload
  let teamWorkload: Array<{
    assignedTo: string
    total: number
    overdue: number
  }> = []

  try {
    const openTasks = await db.fulfillmentTask.findMany({
      where: {
        status: { not: "done" },
        assignedTo: { not: null },
      },
      select: {
        assignedTo: true,
        dueDate: true,
      },
    })

    const workloadMap = new Map<string, { total: number; overdue: number }>()
    for (const task of openTasks) {
      if (!task.assignedTo) continue
      const entry = workloadMap.get(task.assignedTo) ?? { total: 0, overdue: 0 }
      entry.total++
      if (task.dueDate && task.dueDate < now) entry.overdue++
      workloadMap.set(task.assignedTo, entry)
    }

    teamWorkload = Array.from(workloadMap.entries())
      .map(([assignedTo, stats]) => ({ assignedTo, ...stats }))
      .sort((a, b) => b.total - a.total)
  } catch {
    // model may not be populated
  }

  // MRR trend delta — true month-over-month: current 30d period vs previous 30d period
  const mrrDelta = mrrDeltaCurrentPeriod - mrrDeltaPrevPeriod
  const clientDelta = newClientsCurrentPeriod - newClientsPrevPeriod
  const pipelineDelta = pipelineValueCurrentPeriod - pipelineValuePrevPeriod
  const mrrPct = Math.round((mrr / MRR_TARGET) * 100)

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
