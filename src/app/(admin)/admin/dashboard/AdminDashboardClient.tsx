"use client"

import Link from "next/link"
import {
  DollarSign,
  Users,
  Layers,
  Flame,
  ArrowUpRight,
  CheckCircle2,
  AlertCircle,
  Mail,
  Phone,
  Film,
  ArrowRight,
  StickyNote,
  CheckCircle,
  XCircle,
  CheckSquare,
  FileText,
  LifeBuoy,
  MessageSquare,
  ClipboardList,
  Briefcase,
  TicketCheck,
  TrendingUp,
  type LucideIcon,
} from "lucide-react"
import { motion } from "framer-motion"
import { formatDistanceToNow } from "date-fns"
import {
  PipelineFunnelChart,
  RevenueByServiceChart,
  type PipelineFunnelEntry,
  type RevenueByServiceEntry,
} from "@/components/admin/AdminCharts"
import { Sparkline } from "@/components/shared/Sparkline"
import {
  AnimatedPage,
  StaggerContainer,
  AnimatedCard,
  PopInItem,
  AnimatedDollar,
  AnimatedCounter,
  AnimatedPercent,
  AnimatedProgressBar,
} from "@/components/admin/AnimatedDashboard"

// ─── Types ───────────────────────────────────────────────────────────────────

interface DashboardData {
  mrr: number
  mrrDelta: number
  mrrPct: number
  activeClients: number
  clientDelta: number
  pipelineValue: number
  pipelineDelta: number
  hotLeads: Array<{
    id: string
    contactName: string
    company: string | null
    leadScore: number | null
    source: string | null
    channelTag: string | null
  }>
  funnelData: PipelineFunnelEntry[]
  revenueByService: RevenueByServiceEntry[]
  overdueTasks: Array<{
    id: string
    title: string
    assignedTo: string | null
    dueDate: string | null
    subscription: {
      user: {
        name: string | null
        company: string | null
        email: string
      } | null
    }
  }>
  recentActivity: Array<{
    id: string
    type: string
    detail: string | null
    createdAt: string
    deal: { contactName: string; company: string | null } | null
  }>
  teamWorkload: Array<{
    assignedTo: string
    total: number
    overdue: number
  }>
  weekSummary: {
    newDeals: number
    ticketsResolved: number
    revenue: number
    chats: number
  }
  openTickets: number
  mrrSparkline: number[]
  clientSparkline: number[]
  pipelineSparkline: number[]
  now: string
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function trendClass(n: number) {
  if (n > 0) return "text-green-400"
  if (n < 0) return "text-red-400"
  return "text-muted-foreground"
}

function trendArrow(n: number) {
  if (n > 0) return "\u2191"
  if (n < 0) return "\u2193"
  return ""
}

function trendLabel(n: number, prefix = "") {
  const arrow = trendArrow(n)
  if (prefix === "$") {
    const absVal = Math.abs(n)
    return `${arrow} ${n >= 0 ? "+" : "-"}$${absVal.toLocaleString()}`
  }
  if (n > 0) return `${arrow} +${n}`
  return `${arrow} ${n}`
}

const ACTIVITY_ICON_MAP: Record<string, LucideIcon> = {
  EMAIL_SENT: Mail,
  CALL_MADE: Phone,
  DEMO_COMPLETED: Film,
  STAGE_CHANGE: ArrowRight,
  NOTE_ADDED: StickyNote,
  SUBSCRIPTION_CREATED: CheckCircle,
  SUBSCRIPTION_CANCELLED: XCircle,
  PAYMENT_RECEIVED: DollarSign,
  TASK_CREATED: CheckSquare,
  FORM_SUBMITTED: FileText,
  TICKET_OPENED: LifeBuoy,
}

// ─── Component ───────────────────────────────────────────────────────────────

export function AdminDashboardClient({ data }: { data: DashboardData }) {
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
    weekSummary,
    openTickets,
    mrrSparkline,
    clientSparkline,
    pipelineSparkline,
    now: nowStr,
  } = data

  const now = new Date(nowStr)

  return (
    <AnimatedPage>
      <div className="space-y-5 p-0">
        {/* Page header */}
        <motion.div
          className="flex items-center justify-between"
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
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
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-muted hover:shadow-md transition-all duration-200"
          >
            View CRM <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </motion.div>

        {/* ── Quick Actions Bar ──────────────────────────────────────────────── */}
        <motion.div
          className="flex flex-wrap gap-3"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
        >
          {[
            { icon: Briefcase, label: "View CRM", href: "/admin/crm" },
            { icon: LifeBuoy, label: "Support Queue", href: "/admin/support", badge: openTickets > 0 ? openTickets : undefined },
            { icon: ClipboardList, label: "Fulfillment", href: "/admin/fulfillment" },
            { icon: MessageSquare, label: "Chat Sessions", href: "/admin/chat-sessions" },
          ].map(({ icon: Icon, label, href, badge }) => (
            <Link
              key={label}
              href={href}
              className="relative flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-card text-sm font-medium text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all duration-200"
            >
              <Icon className="h-4 w-4" />
              {label}
              {badge !== undefined && (
                <span className="ml-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-primary/20 px-1.5 text-[11px] font-semibold text-[#981B1B]">
                  {badge}
                </span>
              )}
            </Link>
          ))}
        </motion.div>

        {/* ── This Week Summary ────────────────────────────────────────────────── */}
        <motion.div
          className="grid grid-cols-2 gap-3 sm:grid-cols-4"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
        >
          {[
            { label: "New Deals", value: weekSummary.newDeals, icon: TrendingUp, color: "text-blue-400", bg: "bg-blue-900/20" },
            { label: "Tickets Resolved", value: weekSummary.ticketsResolved, icon: TicketCheck, color: "text-green-400", bg: "bg-green-900/15" },
            { label: "Revenue", value: `$${weekSummary.revenue.toLocaleString()}`, icon: DollarSign, color: "text-[#981B1B]", bg: "bg-primary/10" },
            { label: "Chats", value: weekSummary.chats, icon: MessageSquare, color: "text-purple-400", bg: "bg-purple-900/20" },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className="rounded-lg border border-border bg-card px-4 py-3">
              <div className="flex items-center gap-2 mb-1.5">
                <div className={`flex h-6 w-6 items-center justify-center rounded-md ${bg}`}>
                  <Icon className={`h-3 w-3 ${color}`} />
                </div>
                <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                  This Week
                </p>
              </div>
              <p className="text-xl font-mono font-bold text-foreground">{value}</p>
              <p className="text-[11px] text-muted-foreground">{label}</p>
            </div>
          ))}
        </motion.div>

        {/* ── Top Row: 4 Metric Cards ─────────────────────────────────────────── */}
        <StaggerContainer className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4" delay={0.15}>
          {/* MRR */}
          <AnimatedCard glow className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-start justify-between mb-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                MRR
              </p>
              <div className="flex items-center gap-2">
                {mrrSparkline.length > 1 && <Sparkline data={mrrSparkline} />}
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-[#981B1B]">
                  <DollarSign className="h-4 w-4" />
                </div>
              </div>
            </div>
            <p className="text-3xl font-mono font-bold text-foreground">
              <AnimatedDollar value={mrr} />
            </p>
            <p className={`mt-1 text-xs font-medium ${trendClass(mrrDelta)}`}>
              {trendLabel(mrrDelta, "$")} vs last month
            </p>
            <div className="mt-3">
              <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-1">
                <span>Target: $100K</span>
                <span className="font-semibold text-foreground">
                  <AnimatedPercent value={mrrPct} />
                </span>
              </div>
              <AnimatedProgressBar percentage={mrrPct} delay={0.5} />
            </div>
          </AnimatedCard>

          {/* Active Clients */}
          <AnimatedCard glow className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-start justify-between mb-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Active Clients
              </p>
              <div className="flex items-center gap-2">
                {clientSparkline.length > 1 && <Sparkline data={clientSparkline} color="#22c55e" />}
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-[#981B1B]">
                  <Users className="h-4 w-4" />
                </div>
              </div>
            </div>
            <p className="text-3xl font-mono font-bold text-foreground">
              <AnimatedCounter value={activeClients} />
            </p>
            <p className={`mt-1 text-xs font-medium ${trendClass(clientDelta)}`}>
              {trendLabel(clientDelta)} vs last month
            </p>
            <div className="mt-3">
              <AnimatedProgressBar percentage={Math.min((activeClients / 50) * 100, 100)} delay={0.6} />
              <p className="mt-1 text-[11px] text-muted-foreground">
                Target: 50 clients
              </p>
            </div>
          </AnimatedCard>

          {/* Pipeline Value */}
          <AnimatedCard glow className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-start justify-between mb-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Pipeline Value
              </p>
              <div className="flex items-center gap-2">
                {pipelineSparkline.length > 1 && <Sparkline data={pipelineSparkline} color="#60a5fa" />}
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-[#981B1B]">
                  <Layers className="h-4 w-4" />
                </div>
              </div>
            </div>
            <p className="text-3xl font-mono font-bold text-foreground">
              <AnimatedDollar value={pipelineValue} />
            </p>
            <p className={`mt-1 text-xs font-medium ${trendClass(pipelineDelta)}`}>
              {trendLabel(Math.round(pipelineDelta), "$")} vs last month
            </p>
            <div className="mt-3">
              <AnimatedProgressBar percentage={Math.min((pipelineValue / 500_000) * 100, 100)} delay={0.7} />
              <p className="mt-1 text-[11px] text-muted-foreground">
                Active stages only
              </p>
            </div>
          </AnimatedCard>

          {/* Hot Leads */}
          <AnimatedCard glow className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-start justify-between mb-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Hot Leads
              </p>
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-[#981B1B] relative">
                <Flame className="h-4 w-4" />
                {hotLeads.length > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary/100" />
                  </span>
                )}
              </div>
            </div>
            <p className="text-3xl font-mono font-bold text-foreground">
              <AnimatedCounter value={hotLeads.length} />
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Lead score &ge; 70
            </p>
            <div className="mt-3">
              <AnimatedProgressBar percentage={Math.min((hotLeads.length / 20) * 100, 100)} delay={0.8} />
              <p className="mt-1 text-[11px] text-muted-foreground">
                Ready to close
              </p>
            </div>
          </AnimatedCard>
        </StaggerContainer>

        {/* ── Second Row: Two Charts ───────────────────────────────────────────── */}
        <StaggerContainer className="grid grid-cols-1 gap-4 lg:grid-cols-2" delay={0.3}>
          {/* Pipeline Funnel */}
          <AnimatedCard glow className="bg-card border border-border rounded-lg p-5">
            <div className="mb-4">
              <h2 className="text-sm font-semibold text-foreground">
                Pipeline Funnel
              </h2>
              <p className="text-xs text-muted-foreground">
                Deals per stage (active only)
              </p>
            </div>
            <PipelineFunnelChart data={funnelData} />
          </AnimatedCard>

          {/* Revenue by Service Arm */}
          <AnimatedCard glow className="bg-card border border-border rounded-lg p-5">
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
          </AnimatedCard>
        </StaggerContainer>

        {/* ── Third Row: Three Panels ──────────────────────────────────────────── */}
        <StaggerContainer className="grid grid-cols-1 gap-4 lg:grid-cols-3" delay={0.45}>
          {/* Hot Leads Panel */}
          <AnimatedCard glow className="bg-card border border-border rounded-lg p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                <Flame className="h-3.5 w-3.5 text-primary" />
                Hot Leads
              </h2>
              <Link
                href="/admin/crm"
                className="text-xs text-primary hover:underline"
              >
                View all
              </Link>
            </div>

            {hotLeads.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                No hot leads right now. Lead magnets are running.
              </p>
            ) : (
              <StaggerContainer className="space-y-3" delay={0.6}>
                {hotLeads.map((lead) => (
                  <PopInItem
                    key={lead.id}
                    className="flex items-start justify-between gap-2"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground truncate">
                        {lead.contactName}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {lead.company ?? "\u2014"}
                      </p>
                      {lead.channelTag && (
                        <span className="mt-0.5 inline-block rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                          {lead.channelTag}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <span className="rounded bg-primary/10 border border-primary/30 px-1.5 py-0.5 text-[11px] font-semibold text-[#981B1B]">
                        {lead.leadScore}
                      </span>
                      <Link
                        href={`/admin/crm/${lead.id}`}
                        className="text-[11px] text-primary hover:underline"
                      >
                        View &rarr;
                      </Link>
                    </div>
                  </PopInItem>
                ))}
              </StaggerContainer>
            )}
          </AnimatedCard>

          {/* Overdue Fulfillment */}
          <AnimatedCard glow className="bg-card border border-border rounded-lg p-5">
            <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-1.5">
              <AlertCircle className="h-3.5 w-3.5 text-primary" />
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
              <StaggerContainer className="space-y-3" delay={0.65}>
                {overdueTasks.map((task) => {
                  const daysOverdue = task.dueDate
                    ? Math.floor(
                        (now.getTime() - new Date(task.dueDate).getTime()) /
                          (1000 * 60 * 60 * 24)
                      )
                    : 0
                  const clientLabel =
                    task.subscription?.user?.company ??
                    task.subscription?.user?.name ??
                    task.subscription?.user?.email ??
                    "Unknown client"
                  return (
                    <PopInItem key={task.id} className="border-l-2 border-primary pl-3">
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
                        <span className="text-[10px] font-semibold text-primary">
                          {daysOverdue}d overdue
                        </span>
                      </div>
                    </PopInItem>
                  )
                })}
              </StaggerContainer>
            )}
          </AnimatedCard>

          {/* Recent Activity */}
          <AnimatedCard glow className="bg-card border border-border rounded-lg p-5">
            <h2 className="text-sm font-semibold text-foreground mb-4">
              Recent Activity
            </h2>

            {recentActivity.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                No activity recorded yet
              </p>
            ) : (
              <StaggerContainer className="space-y-3" delay={0.7}>
                {recentActivity.map((activity) => {
                  const ActivityIcon = ACTIVITY_ICON_MAP[activity.type]
                  return (
                    <PopInItem key={activity.id} className="flex items-start gap-2.5">
                      <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded bg-muted">
                        {ActivityIcon ? (
                          <ActivityIcon className="h-3 w-3 text-muted-foreground" />
                        ) : (
                          <span className="text-[10px]">&#x2022;</span>
                        )}
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
                    </PopInItem>
                  )
                })}
              </StaggerContainer>
            )}
          </AnimatedCard>
        </StaggerContainer>

        {/* ── Bottom Row: Team Workload ─────────────────────────────────────────── */}
        <StaggerContainer delay={0.6}>
          <AnimatedCard glow className="bg-card border border-border rounded-lg p-5">
            <h2 className="text-sm font-semibold text-foreground mb-4">
              Team Workload
            </h2>

            {teamWorkload.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No open tasks assigned to team members.
              </p>
            ) : (
              <StaggerContainer className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5" delay={0.7}>
                {teamWorkload.map((member) => (
                  <PopInItem
                    key={member.assignedTo}
                    className={`rounded-lg border p-4 transition-shadow duration-200 hover:shadow-md ${
                      member.overdue > 0
                        ? "border-primary/30 bg-primary/10"
                        : "border-border bg-muted/20"
                    }`}
                  >
                    <p className="text-xs font-semibold text-foreground truncate mb-2">
                      {member.assignedTo}
                    </p>
                    <p className="text-2xl font-mono font-bold text-foreground">
                      <AnimatedCounter value={member.total} duration={1} />
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      open tasks
                    </p>
                    {member.overdue > 0 && (
                      <p className="mt-1 text-[11px] font-semibold text-primary">
                        {member.overdue} overdue
                      </p>
                    )}
                  </PopInItem>
                ))}
              </StaggerContainer>
            )}
          </AnimatedCard>
        </StaggerContainer>
      </div>
    </AnimatedPage>
  )
}
