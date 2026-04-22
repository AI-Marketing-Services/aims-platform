import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { getProgressForUser } from "@/lib/onboarding/progress"
import { BarChart3, TrendingUp, DollarSign, Users, Target, Zap } from "lucide-react"
import { UsageWidget } from "@/components/portal/UsageWidget"

async function getMetrics(clerkId: string) {
  const dbUser = await db.user.findUnique({ where: { clerkId }, select: { id: true } })
  if (!dbUser) return null

  const userId = dbUser.id

  const [deals, progress, totalActivities] = await Promise.all([
    db.clientDeal.findMany({
      where: { userId },
      select: {
        stage: true,
        value: true,
        currency: true,
        createdAt: true,
        wonAt: true,
        lostAt: true,
        _count: { select: { activities: true } },
      },
    }),
    getProgressForUser(userId),
    db.clientDealActivity.count({
      where: { clientDeal: { userId } },
    }),
  ])

  const totalDeals = deals.length
  const activeDeals = deals.filter((d) => d.stage === "ACTIVE_RETAINER")
  const completedDeals = deals.filter((d) => d.stage === "COMPLETED")
  const lostDeals = deals.filter((d) => d.stage === "LOST")
  const pipelineDeals = deals.filter((d) => !["COMPLETED", "LOST"].includes(d.stage))

  const totalMrr = activeDeals.reduce((s, d) => s + d.value, 0)
  const pipelineValue = pipelineDeals.reduce((s, d) => s + d.value, 0)
  const wonValue = completedDeals.reduce((s, d) => s + d.value, 0)

  const closedTotal = completedDeals.length + lostDeals.length
  const winRate = closedTotal > 0 ? Math.round((completedDeals.length / closedTotal) * 100) : null

  // Stage breakdown
  const stageBreakdown = {
    PROSPECT: deals.filter((d) => d.stage === "PROSPECT").length,
    DISCOVERY_CALL: deals.filter((d) => d.stage === "DISCOVERY_CALL").length,
    PROPOSAL_SENT: deals.filter((d) => d.stage === "PROPOSAL_SENT").length,
    ACTIVE_RETAINER: activeDeals.length,
    COMPLETED: completedDeals.length,
    LOST: lostDeals.length,
  }

  // Last 30 days
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const newDeals30d = deals.filter((d) => new Date(d.createdAt) > thirtyDaysAgo).length

  return {
    totalDeals,
    totalMrr,
    pipelineValue,
    wonValue,
    winRate,
    stageBreakdown,
    newDeals30d,
    totalActivities,
    onboardingPercent: progress.percent,
    onboardingCount: progress.completedCount,
  }
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  color = "text-primary",
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string | number
  sub?: string
  color?: string
}) {
  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{label}</p>
        <div className={`h-7 w-7 rounded-lg bg-current/10 flex items-center justify-center ${color}`}>
          <Icon className="h-3.5 w-3.5" />
        </div>
      </div>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
    </div>
  )
}

const STAGE_LABELS: Record<string, string> = {
  PROSPECT: "Prospect",
  DISCOVERY_CALL: "Discovery",
  PROPOSAL_SENT: "Proposal",
  ACTIVE_RETAINER: "Active",
  COMPLETED: "Completed",
  LOST: "Lost",
}

const STAGE_COLORS: Record<string, string> = {
  PROSPECT: "bg-blue-400",
  DISCOVERY_CALL: "bg-violet-400",
  PROPOSAL_SENT: "bg-amber-400",
  ACTIVE_RETAINER: "bg-emerald-400",
  COMPLETED: "bg-primary",
  LOST: "bg-red-400",
}

export const dynamic = "force-dynamic"

export default async function MetricsPage() {
  const { userId } = await auth()
  if (!userId) redirect("/sign-in")

  const metrics = await getMetrics(userId)
  if (!metrics) redirect("/sign-in")

  const totalDealsForBar = Math.max(metrics.totalDeals, 1)

  return (
    <div className="max-w-5xl mx-auto px-6 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
          <BarChart3 className="h-4.5 w-4.5 text-primary" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-foreground">My Metrics</h1>
          <p className="text-xs text-muted-foreground">Your AI consulting business at a glance</p>
        </div>
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <StatCard
          icon={DollarSign}
          label="Active MRR"
          value={metrics.totalMrr > 0 ? `$${metrics.totalMrr.toLocaleString()}` : "—"}
          sub="From active retainers"
          color="text-emerald-400"
        />
        <StatCard
          icon={TrendingUp}
          label="Pipeline Value"
          value={metrics.pipelineValue > 0 ? `$${metrics.pipelineValue.toLocaleString()}` : "—"}
          sub="Deals in progress"
          color="text-blue-400"
        />
        <StatCard
          icon={Target}
          label="Win Rate"
          value={metrics.winRate !== null ? `${metrics.winRate}%` : "—"}
          sub={`${metrics.stageBreakdown.COMPLETED} won · ${metrics.stageBreakdown.LOST} lost`}
          color="text-amber-400"
        />
        <StatCard
          icon={Users}
          label="Total Deals"
          value={metrics.totalDeals}
          sub={`${metrics.newDeals30d} added in last 30 days`}
        />
        <StatCard
          icon={Zap}
          label="Activities Logged"
          value={metrics.totalActivities}
          sub="Calls, emails, notes, meetings"
          color="text-violet-400"
        />
        <StatCard
          icon={BarChart3}
          label="Onboarding"
          value={`${metrics.onboardingPercent}%`}
          sub={`${metrics.onboardingCount}/12 steps complete`}
          color="text-primary"
        />
      </div>

      {/* Pipeline breakdown */}
      {metrics.totalDeals > 0 && (
        <div className="bg-card border border-border rounded-xl p-5">
          <h2 className="text-sm font-semibold text-foreground mb-4">Pipeline Breakdown</h2>
          <div className="space-y-3">
            {Object.entries(metrics.stageBreakdown).map(([stage, count]) => {
              const pct = Math.round((count / totalDealsForBar) * 100)
              return (
                <div key={stage} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{STAGE_LABELS[stage]}</span>
                    <span className="font-semibold text-foreground">{count}</span>
                  </div>
                  <div className="h-2 bg-surface rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${STAGE_COLORS[stage]}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* AI Credit Usage */}
      <UsageWidget />

      {/* Empty state */}
      {metrics.totalDeals === 0 && (
        <div className="bg-card border border-border border-dashed rounded-xl p-10 text-center">
          <BarChart3 className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="font-semibold text-muted-foreground">No deals tracked yet</p>
          <p className="text-sm text-muted-foreground/60 mt-1 mb-4">
            Add your first deal in Client CRM to start seeing metrics.
          </p>
          <a
            href="/portal/crm"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Open Client CRM →
          </a>
        </div>
      )}
    </div>
  )
}
