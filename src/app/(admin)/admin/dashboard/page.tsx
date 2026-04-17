import { DealStage } from "@prisma/client"
import { db } from "@/lib/db"
import type { PipelineFunnelEntry, RevenueByServiceEntry } from "@/components/admin/AdminCharts"
import { AdminDashboardClient } from "./AdminDashboardClient"

// ─── Constants ───────────────────────────────────────────────────────────────

const FUNNEL_ORDER = [
  { key: "APPLICATION_SUBMITTED", label: "Applied" },
  { key: "CONSULT_BOOKED", label: "Consult Booked" },
  { key: "CONSULT_COMPLETED", label: "Consult Done" },
  { key: "MIGHTY_INVITED", label: "Invited" },
  { key: "MEMBER_JOINED", label: "Joined" },
] as const

const MRR_TARGET = 100_000

function startOfWeek(): Date {
  const now = new Date()
  const day = now.getDay()
  const diff = now.getDate() - day + (day === 0 ? -6 : 1) // Monday start
  const start = new Date(now)
  start.setDate(diff)
  start.setHours(0, 0, 0, 0)
  return start
}

// ─── Data Fetching ────────────────────────────────────────────────────────────

async function getDashboardData() {
  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000)
  const weekStart = startOfWeek()

  // Fire all independent DB queries in parallel via Promise.allSettled
  const [
    subsResult,
    pipelineResult,
    hotLeadsResult,
    funnelResult,
    revenueResult,
    overdueResult,
    activityResult,
    workloadResult,
    // This Week Summary queries
    weekDealsResult,
    weekTicketsResolvedResult,
    weekRevenueResult,
    weekChatsResult,
    // Quick Actions: open ticket count
    openTicketsResult,
    // Enriched activity feed: support tickets + subscriptions + chat sessions
    recentTicketsResult,
    recentSubscriptionsResult,
  ] = await Promise.allSettled([
    // 1. Active subscriptions (for MRR + client counts)
    db.subscription.findMany({
      where: { status: "ACTIVE" },
      select: { monthlyAmount: true, createdAt: true, userId: true },
    }),
    // 2. Pipeline deals
    db.deal.findMany({
      where: { stage: { notIn: ["LOST"] } },
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
    // 7. Recent deal activity
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
    // 9. This Week: new deals
    db.deal.count({ where: { createdAt: { gte: weekStart } } }),
    // 10. This Week: tickets resolved
    db.supportTicket.count({ where: { resolvedAt: { gte: weekStart } } }),
    // 11. This Week: revenue (subscriptions created this week)
    db.subscription.findMany({
      where: { createdAt: { gte: weekStart }, status: "ACTIVE" },
      select: { monthlyAmount: true },
    }),
    // 12. This Week: chat sessions
    db.chatSession.count({ where: { createdAt: { gte: weekStart } } }),
    // 13. Open ticket count for quick actions badge
    db.supportTicket.count({ where: { status: "open" } }),
    // 14. Recent support tickets for activity feed
    db.supportTicket.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        subject: true,
        status: true,
        createdAt: true,
        user: { select: { name: true, email: true } },
      },
    }),
    // 15. Recent subscriptions for activity feed
    db.subscription.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        tier: true,
        monthlyAmount: true,
        createdAt: true,
        serviceArm: { select: { name: true } },
        user: { select: { name: true, email: true } },
      },
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

  // Recent activity — merge deal activities, support tickets, and subscriptions
  const dealActivities = activityResult.status === "fulfilled" ? activityResult.value : []
  const recentTickets = recentTicketsResult.status === "fulfilled" ? recentTicketsResult.value : []
  const recentSubs = recentSubscriptionsResult.status === "fulfilled" ? recentSubscriptionsResult.value : []

  type UnifiedActivity = {
    id: string
    type: string
    detail: string | null
    createdAt: Date
    deal: { contactName: string; company: string | null } | null
  }

  const unifiedActivity: UnifiedActivity[] = [
    ...dealActivities,
    ...recentTickets.map((t) => ({
      id: `ticket-${t.id}`,
      type: "TICKET_OPENED",
      detail: `Support ticket: ${t.subject}`,
      createdAt: t.createdAt,
      deal: { contactName: t.user?.name ?? t.user?.email ?? "Unknown", company: null },
    })),
    ...recentSubs.map((s) => ({
      id: `sub-${s.id}`,
      type: "SUBSCRIPTION_CREATED",
      detail: `Subscribed to ${s.serviceArm.name}${s.tier ? ` (${s.tier})` : ""} at $${s.monthlyAmount}/mo`,
      createdAt: s.createdAt,
      deal: { contactName: s.user?.name ?? s.user?.email ?? "Unknown", company: null },
    })),
  ]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 10)

  const recentActivity = unifiedActivity

  // This Week Summary
  const weekNewDeals = weekDealsResult.status === "fulfilled" ? weekDealsResult.value : 0
  const weekTicketsResolved = weekTicketsResolvedResult.status === "fulfilled" ? weekTicketsResolvedResult.value : 0
  const weekRevenue = weekRevenueResult.status === "fulfilled"
    ? weekRevenueResult.value.reduce((sum, s) => sum + s.monthlyAmount, 0)
    : 0
  const weekChats = weekChatsResult.status === "fulfilled" ? weekChatsResult.value : 0

  // Open tickets count for quick actions badge
  const openTickets = openTicketsResult.status === "fulfilled" ? openTicketsResult.value : 0

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
    weekSummary: {
      newDeals: weekNewDeals,
      ticketsResolved: weekTicketsResolved,
      revenue: weekRevenue,
      chats: weekChats,
    },
    openTickets,
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
    weekSummary: data.weekSummary,
    openTickets: data.openTickets,
  }

  return <AdminDashboardClient data={serializedData} />
}
