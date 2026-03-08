import Link from "next/link"
import {
  DollarSign,
  Users,
  Layers,
  Flame,
  ArrowUpRight,
  CheckCircle2,
  AlertCircle,
} from "lucide-react"
import { DealStage } from "@prisma/client"
import { db } from "@/lib/db"
import {
  PipelineFunnelChart,
  RevenueByServiceChart,
  type PipelineFunnelEntry,
  type RevenueByServiceEntry,
} from "@/components/admin/AdminCharts"
import { formatDistanceToNow } from "date-fns"

// ─── Helpers ──────────────────────────────────────────────────────────────────

const ACTIVE_STAGES = [
  "NEW_LEAD",
  "QUALIFIED",
  "DEMO_BOOKED",
  "PROPOSAL_SENT",
  "NEGOTIATION",
  "ACTIVE_CLIENT",
  "UPSELL_OPPORTUNITY",
  "AT_RISK",
] as const

const FUNNEL_ORDER = [
  { key: "NEW_LEAD", label: "New Lead" },
  { key: "QUALIFIED", label: "Qualified" },
  { key: "DEMO_BOOKED", label: "Demo Booked" },
  { key: "PROPOSAL_SENT", label: "Proposal Sent" },
  { key: "ACTIVE_CLIENT", label: "Active Client" },
] as const

const MRR_TARGET = 100_000

function fmtUsd(n: number) {
  return `$${n.toLocaleString()}`
}

function trendClass(n: number) {
  if (n > 0) return "text-green-500"
  if (n < 0) return "text-red-400"
  return "text-muted-foreground"
}

function trendLabel(n: number) {
  if (n > 0) return `+${n}`
  return `${n}`
}

// ─── Activity icon helper ─────────────────────────────────────────────────────

const ACTIVITY_ICON_MAP: Record<string, string> = {
  EMAIL_SENT: "✉",
  CALL_MADE: "📞",
  DEMO_COMPLETED: "🎬",
  STAGE_CHANGE: "→",
  NOTE_ADDED: "📝",
  SUBSCRIPTION_CREATED: "✅",
  SUBSCRIPTION_CANCELLED: "✖",
  PAYMENT_RECEIVED: "$",
  TASK_CREATED: "☑",
  FORM_SUBMITTED: "📋",
}

// ─── Data Fetching ────────────────────────────────────────────────────────────

async function getDashboardData() {
  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000)

  // MRR: sum monthlyAmount for active subscriptions
  let mrr = 0
  let mrrPrev = 0
  let activeClients = 0
  let activeClientsPrev = 0

  try {
    const activeSubs = await db.subscription.findMany({
      where: { status: "ACTIVE" },
      select: { monthlyAmount: true, createdAt: true, userId: true },
    })
    mrr = activeSubs.reduce((s, sub) => s + sub.monthlyAmount, 0)
    activeClients = new Set(activeSubs.map((s) => s.userId)).size

    // Prev period: subs active before 30d ago
    const prevSubs = activeSubs.filter((s) => s.createdAt <= thirtyDaysAgo)
    mrrPrev = prevSubs.reduce((s, sub) => s + sub.monthlyAmount, 0)
    activeClientsPrev = new Set(prevSubs.map((s) => s.userId)).size
  } catch {
    // model may not be populated yet
  }

  // Pipeline value
  let pipelineValue = 0
  let pipelineValuePrev = 0

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
    const prevDeals = pipelineDeals.filter((d) => d.createdAt <= thirtyDaysAgo)
    pipelineValuePrev = prevDeals.reduce((s, d) => s + d.value, 0)
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

  // MRR trend delta
  const mrrDelta = mrr - mrrPrev
  const clientDelta = activeClients - activeClientsPrev
  const pipelineDelta = pipelineValue - pipelineValuePrev
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
  const {
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
  } = data

  return (
    <div className="space-y-5 p-0">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Command Center
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            AIMS live operational overview
          </p>
        </div>
        <Link
          href="/admin/crm"
          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition"
        >
          View CRM <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* ── Top Row: 4 Metric Cards ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* MRR */}
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-start justify-between mb-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              MRR
            </p>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-red-950 text-red-400">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <p className="text-3xl font-mono font-bold text-foreground">
            {fmtUsd(mrr)}
          </p>
          <p className={`mt-1 text-xs font-medium ${trendClass(mrrDelta)}`}>
            {trendLabel(mrrDelta)} vs last month
          </p>
          {/* Progress bar toward $100K */}
          <div className="mt-3">
            <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-1">
              <span>Target: $100K</span>
              <span className="font-semibold text-foreground">{mrrPct}%</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-red-600 transition-all duration-700"
                style={{ width: `${Math.min(mrrPct, 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Active Clients */}
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-start justify-between mb-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Active Clients
            </p>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-red-950 text-red-400">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <p className="text-3xl font-mono font-bold text-foreground">
            {activeClients}
          </p>
          <p className={`mt-1 text-xs font-medium ${trendClass(clientDelta)}`}>
            {trendLabel(clientDelta)} vs last month
          </p>
          <div className="mt-3">
            <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-red-600 transition-all duration-700"
                style={{
                  width: `${Math.min((activeClients / 50) * 100, 100)}%`,
                }}
              />
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Target: 50 clients
            </p>
          </div>
        </div>

        {/* Pipeline Value */}
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-start justify-between mb-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Pipeline Value
            </p>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-red-950 text-red-400">
              <Layers className="h-4 w-4" />
            </div>
          </div>
          <p className="text-3xl font-mono font-bold text-foreground">
            {fmtUsd(pipelineValue)}
          </p>
          <p
            className={`mt-1 text-xs font-medium ${trendClass(pipelineDelta)}`}
          >
            {trendLabel(Math.round(pipelineDelta))} vs last month
          </p>
          <div className="mt-3">
            <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-red-600 transition-all duration-700"
                style={{
                  width: `${Math.min((pipelineValue / 500_000) * 100, 100)}%`,
                }}
              />
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Active stages only
            </p>
          </div>
        </div>

        {/* Hot Leads */}
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-start justify-between mb-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Hot Leads
            </p>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-red-950 text-red-400 relative">
              <Flame className="h-4 w-4" />
              {hotLeads.length > 0 && (
                <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
                </span>
              )}
            </div>
          </div>
          <p className="text-3xl font-mono font-bold text-foreground">
            {hotLeads.length}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Lead score &ge; 70
          </p>
          <div className="mt-3">
            <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-red-600 transition-all duration-700"
                style={{ width: `${Math.min((hotLeads.length / 20) * 100, 100)}%` }}
              />
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Ready to close
            </p>
          </div>
        </div>
      </div>

      {/* ── Second Row: Two Charts ───────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Pipeline Funnel */}
        <div className="bg-card border border-border rounded-lg p-5">
          <div className="mb-4">
            <h2 className="text-sm font-semibold text-foreground">
              Pipeline Funnel
            </h2>
            <p className="text-xs text-muted-foreground">
              Deals per stage (active only)
            </p>
          </div>
          <PipelineFunnelChart data={funnelData} />
        </div>

        {/* Revenue by Service Arm */}
        <div className="bg-card border border-border rounded-lg p-5">
          <div className="mb-4">
            <h2 className="text-sm font-semibold text-foreground">
              Revenue by Service Arm
            </h2>
            <p className="text-xs text-muted-foreground">
              MRR by service, descending
            </p>
          </div>
          {revenueByService.length > 0 ? (
            <RevenueByServiceChart data={revenueByService} />
          ) : (
            <div className="flex h-[210px] items-center justify-center text-sm text-muted-foreground">
              No active subscriptions yet
            </div>
          )}
        </div>
      </div>

      {/* ── Third Row: Three Panels ──────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Hot Leads Panel */}
        <div className="bg-card border border-border rounded-lg p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
              <Flame className="h-3.5 w-3.5 text-red-500" />
              Hot Leads
            </h2>
            <Link
              href="/admin/crm"
              className="text-xs text-red-500 hover:underline"
            >
              View all
            </Link>
          </div>

          {hotLeads.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              No hot leads right now. Lead magnets are running.
            </p>
          ) : (
            <div className="space-y-3">
              {hotLeads.map((lead) => (
                <div
                  key={lead.id}
                  className="flex items-start justify-between gap-2"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground truncate">
                      {lead.contactName}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {lead.company ?? "—"}
                    </p>
                    {lead.channelTag && (
                      <span className="mt-0.5 inline-block rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                        {lead.channelTag}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <span className="rounded bg-red-900/40 px-1.5 py-0.5 text-[11px] font-semibold text-red-400">
                      {lead.leadScore}
                    </span>
                    <Link
                      href={`/admin/crm/${lead.id}`}
                      className="text-[11px] text-red-500 hover:underline"
                    >
                      View →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Overdue Fulfillment */}
        <div className="bg-card border border-border rounded-lg p-5">
          <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-1.5">
            <AlertCircle className="h-3.5 w-3.5 text-red-500" />
            Overdue Fulfillment
          </h2>

          {overdueTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-6 text-center">
              <CheckCircle2 className="h-8 w-8 text-green-500" />
              <p className="text-sm font-medium text-foreground">
                All fulfillment on track
              </p>
              <p className="text-xs text-muted-foreground">No overdue tasks</p>
            </div>
          ) : (
            <div className="space-y-3">
              {overdueTasks.map((task) => {
                const daysOverdue = task.dueDate
                  ? Math.floor(
                      (now.getTime() - task.dueDate.getTime()) /
                        (1000 * 60 * 60 * 24)
                    )
                  : 0
                const clientLabel =
                  task.subscription?.user?.company ??
                  task.subscription?.user?.name ??
                  task.subscription?.user?.email ??
                  "Unknown client"
                return (
                  <div key={task.id} className="border-l-2 border-red-600 pl-3">
                    <p className="text-xs font-medium text-foreground truncate">
                      {task.title}
                    </p>
                    <p className="text-[11px] text-muted-foreground truncate">
                      {clientLabel}
                    </p>
                    <div className="mt-0.5 flex items-center gap-2">
                      {task.assignedTo && (
                        <span className="text-[10px] text-muted-foreground">
                          {task.assignedTo}
                        </span>
                      )}
                      <span className="text-[10px] font-semibold text-red-400">
                        {daysOverdue}d overdue
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="bg-card border border-border rounded-lg p-5">
          <h2 className="text-sm font-semibold text-foreground mb-4">
            Recent Activity
          </h2>

          {recentActivity.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              No activity recorded yet
            </p>
          ) : (
            <div className="space-y-3">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start gap-2.5">
                  <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded bg-muted text-[10px]">
                    {ACTIVITY_ICON_MAP[activity.type] ?? "•"}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-foreground truncate">
                      {activity.detail ??
                        activity.type
                          .replace(/_/g, " ")
                          .toLowerCase()
                          .replace(/\b\w/g, (c) => c.toUpperCase())}
                    </p>
                    {activity.deal && (
                      <p className="text-[11px] text-muted-foreground truncate">
                        {activity.deal.company ?? activity.deal.contactName}
                      </p>
                    )}
                    <p className="text-[10px] text-muted-foreground/60">
                      {formatDistanceToNow(new Date(activity.createdAt), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Bottom Row: Team Workload ─────────────────────────────────────────── */}
      <div className="bg-card border border-border rounded-lg p-5">
        <h2 className="text-sm font-semibold text-foreground mb-4">
          Team Workload
        </h2>

        {teamWorkload.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No open tasks assigned to team members.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {teamWorkload.map((member) => (
              <div
                key={member.assignedTo}
                className={`rounded-lg border p-4 ${
                  member.overdue > 0
                    ? "border-red-800 bg-red-950/20"
                    : "border-border bg-muted/20"
                }`}
              >
                <p className="text-xs font-semibold text-foreground truncate mb-2">
                  {member.assignedTo}
                </p>
                <p className="text-2xl font-mono font-bold text-foreground">
                  {member.total}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  open tasks
                </p>
                {member.overdue > 0 && (
                  <p className="mt-1 text-[11px] font-semibold text-red-400">
                    {member.overdue} overdue
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
