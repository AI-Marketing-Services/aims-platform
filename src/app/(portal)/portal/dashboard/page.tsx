import type { Metadata } from "next"
import { auth, currentUser } from "@clerk/nextjs/server"
import Link from "next/link"
import {
  ArrowRight,
  ArrowUpRight,
  Bell,
  Check,
  CheckCircle2,
  ClipboardCheck,
  MapPin,
  BookOpen,
  Calculator,
  Briefcase,
  TrendingUp,
  DollarSign,
  Trophy,
  PieChart,
  Layers,
  LineChart as LineChartIcon,
  Sparkles,
} from "lucide-react"
import { db } from "@/lib/db"
import { timeAgo } from "@/lib/utils"
import { getProgressForUser } from "@/lib/onboarding/progress"
import { TOTAL_STEPS } from "@/lib/onboarding/steps"
import { OnboardingChecklist } from "@/components/portal/OnboardingChecklist"
import { TodayCard } from "@/components/portal/TodayCard"
import { FirstRunWelcomeCard } from "@/components/portal/FirstRunWelcomeCard"
import { LineChart } from "@/components/portal/charts/LineChart"
import { DonutChart } from "@/components/portal/charts/DonutChart"

export const metadata: Metadata = { title: "Dashboard" }

interface CrmStats {
  totalDeals: number
  activeDeals: number
  pipelineValue: number
  funnel: Array<{ stage: string; label: string; count: number; value: number }>
  industryBreakdown: Array<{ label: string; value: number }>
  topDeals: Array<{
    id: string
    companyName: string
    stage: string
    value: number
    currency: string
    leadScore: number | null
    updatedAt: Date
  }>
  recentActivities: Array<{
    id: string
    type: string
    description: string | null
    clientDeal: { companyName: string }
    createdAt: Date
  }>
  monthlyMrr: number
  wonThisMonthCount: number
  wonThisMonthValue: number
  wonLastMonthValue: number
}

interface RevenueSeries {
  daily: Array<{ label: string; value: number; date: Date }>
  total30d: number
  total7d: number
  prior7d: number
}

export default async function PortalDashboard({
  searchParams,
}: {
  searchParams: Promise<{ checkout?: string }>
}) {
  const { checkout } = await searchParams
  const { userId: clerkId } = await auth()
  const user = await currentUser()

  const dbUser = clerkId
    ? await db.user.findUnique({ where: { clerkId } })
    : null

  const firstName =
    user?.firstName ||
    user?.fullName?.split(" ")[0] ||
    dbUser?.name?.split(" ")[0] ||
    "there"

  // Onboarding progress
  let onboardingCompletedKeys: string[] = []
  let onboardingCompletedCount = 0
  let onboardingPercent = 0

  if (dbUser) {
    try {
      const progress = await getProgressForUser(dbUser.id)
      onboardingCompletedKeys = [...progress.completedKeys]
      onboardingCompletedCount = progress.completedCount
      onboardingPercent = progress.percent
    } catch {
      // graceful degradation
    }
  }

  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)

  // CRM + revenue stats — only if they have deals
  let crmStats: CrmStats | null = null
  let revenue: RevenueSeries | null = null

  if (dbUser) {
    try {
      const [
        crmDeals,
        topOpenDeals,
        recentCrmActivities,
        wonThisMonth,
        wonLastMonth,
        paidInvoices30d,
      ] = await Promise.all([
        db.clientDeal.findMany({
          where: { userId: dbUser.id },
          select: { stage: true, value: true, industry: true },
        }),
        db.clientDeal.findMany({
          where: {
            userId: dbUser.id,
            stage: { notIn: ["COMPLETED", "LOST"] },
          },
          select: {
            id: true,
            companyName: true,
            stage: true,
            value: true,
            currency: true,
            leadScore: true,
            updatedAt: true,
          },
          orderBy: [{ value: "desc" }, { updatedAt: "desc" }],
          take: 5,
        }),
        db.clientDealActivity.findMany({
          where: { clientDeal: { userId: dbUser.id } },
          include: { clientDeal: { select: { companyName: true } } },
          orderBy: { createdAt: "desc" },
          take: 6,
        }),
        // Won deals this month — for "wins" stat tile
        db.clientDeal.findMany({
          where: {
            userId: dbUser.id,
            stage: "COMPLETED",
            wonAt: { gte: startOfThisMonth },
          },
          select: { value: true },
        }),
        // Won deals last month — for trend pill comparison
        db.clientDeal.findMany({
          where: {
            userId: dbUser.id,
            stage: "COMPLETED",
            wonAt: { gte: startOfLastMonth, lt: startOfThisMonth },
          },
          select: { value: true },
        }),
        // Paid invoices last 30 days for the revenue line chart
        db.clientInvoice.findMany({
          where: {
            userId: dbUser.id,
            status: "PAID",
            paidAt: {
              gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
            },
          },
          select: { total: true, paidAt: true },
        }),
      ])

      if (crmDeals.length > 0) {
        const FUNNEL_STAGES: Array<{ stage: string; label: string }> = [
          { stage: "PROSPECT", label: "Prospect" },
          { stage: "DISCOVERY_CALL", label: "Discovery" },
          { stage: "PROPOSAL_SENT", label: "Proposal" },
          { stage: "ACTIVE_RETAINER", label: "Active" },
          { stage: "COMPLETED", label: "Won" },
        ]
        const funnel = FUNNEL_STAGES.map(({ stage, label }) => {
          const matching = crmDeals.filter((d) => d.stage === stage)
          return {
            stage,
            label,
            count: matching.length,
            value: matching.reduce((s, d) => s + d.value, 0),
          }
        })

        // Industry breakdown by total deal value (open deals only)
        const industryMap = new Map<string, number>()
        for (const d of crmDeals) {
          if (["COMPLETED", "LOST"].includes(d.stage)) continue
          const ind = d.industry?.trim() || "Uncategorized"
          industryMap.set(ind, (industryMap.get(ind) ?? 0) + d.value)
        }
        const industryBreakdown = Array.from(industryMap.entries())
          .map(([label, value]) => ({ label, value }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 6)

        // Monthly recurring revenue from active retainers
        const monthlyMrr = crmDeals
          .filter((d) => d.stage === "ACTIVE_RETAINER")
          .reduce((s, d) => s + d.value, 0)

        crmStats = {
          totalDeals: crmDeals.length,
          activeDeals: crmDeals.filter((d) => d.stage === "ACTIVE_RETAINER").length,
          pipelineValue: crmDeals
            .filter((d) => !["COMPLETED", "LOST"].includes(d.stage))
            .reduce((s, d) => s + d.value, 0),
          funnel,
          industryBreakdown,
          topDeals: topOpenDeals,
          recentActivities: recentCrmActivities,
          monthlyMrr,
          wonThisMonthCount: wonThisMonth.length,
          wonThisMonthValue: wonThisMonth.reduce((s, d) => s + d.value, 0),
          wonLastMonthValue: wonLastMonth.reduce((s, d) => s + d.value, 0),
        }
      }

      // Build a 30-day revenue series. Each bucket = one calendar day.
      // Sum of paid invoices on that day. We synthesize the buckets
      // even when zero so the chart shows a full timeline (not just
      // the days with data).
      const dailyMap = new Map<string, number>()
      for (let i = 29; i >= 0; i--) {
        const d = new Date(today)
        d.setDate(d.getDate() - i)
        const key = d.toISOString().slice(0, 10)
        dailyMap.set(key, 0)
      }
      for (const inv of paidInvoices30d) {
        if (!inv.paidAt) continue
        const key = inv.paidAt.toISOString().slice(0, 10)
        if (dailyMap.has(key)) {
          dailyMap.set(key, (dailyMap.get(key) ?? 0) + inv.total)
        }
      }
      const daily = Array.from(dailyMap.entries()).map(([key, value]) => {
        const date = new Date(key)
        return {
          label: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
          value,
          date,
        }
      })
      const total30d = daily.reduce((s, d) => s + d.value, 0)
      const sevenDayCutoff = new Date(today)
      sevenDayCutoff.setDate(sevenDayCutoff.getDate() - 6)
      const fourteenDayCutoff = new Date(today)
      fourteenDayCutoff.setDate(fourteenDayCutoff.getDate() - 13)
      const total7d = daily
        .filter((d) => d.date >= sevenDayCutoff)
        .reduce((s, d) => s + d.value, 0)
      const prior7d = daily
        .filter((d) => d.date >= fourteenDayCutoff && d.date < sevenDayCutoff)
        .reduce((s, d) => s + d.value, 0)
      revenue = { daily, total30d, total7d, prior7d }
    } catch {
      // graceful degradation
    }
  }

  // Recent notifications
  let recentNotifications: Array<{
    id: string
    title: string
    message: string
    sentAt: Date
  }> = []
  if (dbUser) {
    try {
      recentNotifications = await db.notification.findMany({
        where: { userId: dbUser.id },
        orderBy: { sentAt: "desc" },
        take: 5,
      })
    } catch {
      // graceful degradation
    }
  }

  // Trend pill helpers — week-over-week revenue + month-over-month wins
  const revenueTrendPct =
    revenue && revenue.prior7d > 0
      ? ((revenue.total7d - revenue.prior7d) / revenue.prior7d) * 100
      : null
  const winsTrendPct =
    crmStats && crmStats.wonLastMonthValue > 0
      ? ((crmStats.wonThisMonthValue - crmStats.wonLastMonthValue) /
          crmStats.wonLastMonthValue) *
        100
      : null

  const fmtCurrencyShort = (n: number) =>
    n >= 1_000_000
      ? `$${(n / 1_000_000).toFixed(1)}M`
      : n >= 1000
        ? `$${(n / 1000).toFixed(1)}K`
        : `$${n.toLocaleString()}`

  return (
    <div className="space-y-5">
      {/* Checkout success banner */}
      {checkout === "success" && (
        <div className="rounded-xl border border-primary/30 bg-primary/5 px-5 py-4 text-sm text-foreground font-medium">
          You&apos;re in. Our team will be in touch within 24 hours. Check your email for next steps.
        </div>
      )}

      {/* Header — onboarding progress as a compact pill on the right */}
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Welcome, {firstName}</h1>
          <p className="mt-1 text-muted-foreground text-xs sm:text-sm">
            Here&apos;s what&apos;s happening across your pipeline today.
          </p>
        </div>
        {dbUser && (
          <Link
            href="/portal/onboard"
            className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 hover:border-primary/40 hover:bg-primary/5 transition-colors group"
          >
            {onboardingPercent === 100 ? (
              <>
                <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                <span className="text-xs font-semibold text-foreground">
                  Setup complete
                </span>
              </>
            ) : (
              <>
                <span className="text-xs font-medium text-muted-foreground">
                  Setup
                </span>
                <span className="text-xs font-bold text-foreground tabular-nums">
                  {onboardingCompletedCount}/{TOTAL_STEPS}
                </span>
                <div className="h-1.5 w-12 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-primary"
                    style={{ width: `${onboardingPercent}%` }}
                  />
                </div>
              </>
            )}
            <ArrowRight className="h-3 w-3 text-muted-foreground group-hover:text-primary transition-colors" />
          </Link>
        )}
      </div>

      {/* ── FIRST-RUN — only renders for fresh operators with zero activity ── */}
      {dbUser && <FirstRunWelcomeCard userId={dbUser.id} firstName={firstName} />}

      {/* ── HEADLINE STAT TILES (4 across) ── */}
      {crmStats && revenue && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatTile
            href="/portal/revenue"
            icon={<DollarSign className="h-4 w-4" />}
            label="MRR open"
            value={fmtCurrencyShort(crmStats.monthlyMrr)}
            sub={`${crmStats.activeDeals} active retainer${crmStats.activeDeals === 1 ? "" : "s"}`}
            primary
          />
          <StatTile
            href="/portal/revenue"
            icon={<TrendingUp className="h-4 w-4" />}
            label="Revenue (30d)"
            value={fmtCurrencyShort(revenue.total30d)}
            sub={`${fmtCurrencyShort(revenue.total7d)} last 7 days`}
            trendPct={revenueTrendPct}
          />
          <StatTile
            href="/portal/crm"
            icon={<Layers className="h-4 w-4" />}
            label="Pipeline value"
            value={fmtCurrencyShort(crmStats.pipelineValue)}
            sub={`${crmStats.totalDeals} deal${crmStats.totalDeals === 1 ? "" : "s"} tracked`}
          />
          <StatTile
            href="/portal/crm"
            icon={<Trophy className="h-4 w-4" />}
            label="Wins this month"
            value={fmtCurrencyShort(crmStats.wonThisMonthValue)}
            sub={`${crmStats.wonThisMonthCount} closed deal${crmStats.wonThisMonthCount === 1 ? "" : "s"}`}
            trendPct={winsTrendPct}
          />
        </div>
      )}

      {/* ── REVENUE TREND + DONUT BREAKDOWNS (3 cards across on desktop) ── */}
      {crmStats && revenue && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Revenue line chart — 6 cols */}
          <Link
            href="/portal/revenue"
            className="lg:col-span-6 group rounded-2xl border border-border bg-card p-5 hover:border-primary/30 hover:shadow-md hover:shadow-primary/5 transition-all"
          >
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center">
                  <LineChartIcon className="h-3.5 w-3.5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    Revenue, last 30 days
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    Paid invoices, daily trend
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-foreground tabular-nums leading-tight">
                  {fmtCurrencyShort(revenue.total30d)}
                </p>
                {revenueTrendPct !== null && (
                  <p
                    className={`text-[11px] font-semibold tabular-nums ${
                      revenueTrendPct >= 0 ? "text-primary" : "text-muted-foreground"
                    }`}
                  >
                    {revenueTrendPct >= 0 ? "+" : ""}
                    {revenueTrendPct.toFixed(0)}% vs prior 7d
                  </p>
                )}
              </div>
            </div>
            <LineChart
              data={revenue.daily.map((d) => ({ label: d.label, value: d.value }))}
              height={140}
              formatValue={(n) => fmtCurrencyShort(n)}
              ariaLabel="30-day revenue trend"
            />
            <div className="mt-3 flex items-center justify-end text-[11px] text-primary opacity-0 group-hover:opacity-100 transition-opacity">
              Open revenue page <ArrowUpRight className="h-3 w-3 ml-1" />
            </div>
          </Link>

          {/* Pipeline by stage donut — 3 cols */}
          <Link
            href="/portal/crm"
            className="lg:col-span-3 group rounded-2xl border border-border bg-card p-5 hover:border-primary/30 hover:shadow-md hover:shadow-primary/5 transition-all"
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center">
                <PieChart className="h-3.5 w-3.5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  By stage
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Open pipeline value
                </p>
              </div>
            </div>
            <DonutChart
              data={crmStats.funnel
                .filter((s) => s.value > 0 && s.stage !== "COMPLETED")
                .map((s) => ({ label: s.label, value: s.value }))}
              size={140}
              thickness={18}
              centerLabel="Pipeline"
              centerValue={fmtCurrencyShort(crmStats.pipelineValue)}
              formatValue={(n) => fmtCurrencyShort(n)}
              ariaLabel="Pipeline value by stage"
            />
          </Link>

          {/* Pipeline by industry donut — 3 cols */}
          <Link
            href="/portal/crm"
            className="lg:col-span-3 group rounded-2xl border border-border bg-card p-5 hover:border-primary/30 hover:shadow-md hover:shadow-primary/5 transition-all"
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center">
                <Briefcase className="h-3.5 w-3.5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  By industry
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Where your book lives
                </p>
              </div>
            </div>
            <DonutChart
              data={crmStats.industryBreakdown}
              size={140}
              thickness={18}
              centerLabel="Industries"
              centerValue={String(crmStats.industryBreakdown.length)}
              formatValue={(n) => fmtCurrencyShort(n)}
              ariaLabel="Pipeline value by industry"
            />
          </Link>
        </div>
      )}

      {/* ── TODAY CARD — daily-open hook, surfaces hot leads + follow-ups ── */}
      {dbUser && <TodayCard userId={dbUser.id} />}

      {/* ── ONBOARDING CHECKLIST — only show full when incomplete ── */}
      {onboardingPercent < 100 && (
        <div className="rounded-2xl border border-border bg-card p-4 sm:p-6">
          <div className="flex items-center justify-between gap-2 mb-5">
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-semibold text-foreground">Getting Started</h2>
              <span className="text-xs text-muted-foreground">
                {onboardingCompletedCount}/{TOTAL_STEPS} complete
              </span>
            </div>
            <Link
              href="/portal/onboard"
              className="text-xs font-medium text-primary hover:text-primary/80 flex items-center gap-1 transition-colors"
            >
              View full roadmap <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="mb-5">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-muted-foreground">{onboardingPercent}% complete</span>
              <span className="text-xs text-muted-foreground">
                {TOTAL_STEPS - onboardingCompletedCount} remaining
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all duration-500"
                style={{ width: `${onboardingPercent}%` }}
              />
            </div>
          </div>
          <OnboardingChecklist
            initialCompletedKeys={onboardingCompletedKeys}
            variant="compact"
          />
        </div>
      )}

      {/* ── CRM PIPELINE — funnel + top deals leaderboard ── */}
      {crmStats && (
        <div className="rounded-2xl border border-border bg-card p-4 sm:p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center">
                <Briefcase className="h-3.5 w-3.5 text-primary" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-foreground">Your Pipeline</h2>
                <p className="text-[11px] text-muted-foreground">
                  {crmStats.pipelineValue > 0
                    ? `${fmtCurrencyShort(crmStats.pipelineValue)} open across ${crmStats.totalDeals} deal${crmStats.totalDeals === 1 ? "" : "s"}`
                    : `${crmStats.totalDeals} deal${crmStats.totalDeals === 1 ? "" : "s"} tracked`}
                </p>
              </div>
            </div>
            <Link
              href="/portal/crm"
              className="text-xs text-primary hover:text-primary/80 flex items-center gap-1 font-medium"
            >
              Open CRM <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-3">
                Stage breakdown
              </p>
              {(() => {
                const maxCount = Math.max(...crmStats.funnel.map((s) => s.count), 1)
                return (
                  <div className="space-y-2">
                    {crmStats.funnel.map((s) => {
                      const widthPct =
                        s.count > 0 ? Math.max(8, (s.count / maxCount) * 100) : 0
                      const isWon = s.stage === "COMPLETED"
                      return (
                        <Link
                          key={s.stage}
                          href="/portal/crm"
                          className="group flex items-center gap-3 hover:bg-primary/5 -mx-2 px-2 py-1.5 rounded-md transition-colors"
                        >
                          <span className="w-16 sm:w-20 text-xs font-medium text-muted-foreground group-hover:text-foreground shrink-0">
                            {s.label}
                          </span>
                          <div className="flex-1 h-6 rounded-md bg-muted/40 overflow-hidden relative">
                            {s.count > 0 && (
                              <div
                                className={`h-full rounded-md transition-all ${
                                  isWon
                                    ? "bg-primary"
                                    : "bg-primary/30 group-hover:bg-primary/50"
                                }`}
                                style={{ width: `${widthPct}%` }}
                              />
                            )}
                          </div>
                          <div className="shrink-0 w-20 sm:w-24 text-right">
                            <span className="text-sm font-bold tabular-nums text-foreground">
                              {s.count}
                            </span>
                            {s.value > 0 && (
                              <span className="ml-1.5 text-[10px] text-muted-foreground tabular-nums">
                                {fmtCurrencyShort(s.value)}
                              </span>
                            )}
                          </div>
                        </Link>
                      )
                    })}
                  </div>
                )
              })()}
            </div>

            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-3">
                Top open deals
              </p>
              {crmStats.topDeals.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border p-6 text-center">
                  <p className="text-xs text-muted-foreground">
                    No open deals yet. Scout for leads or import a CSV.
                  </p>
                </div>
              ) : (
                (() => {
                  const maxValue = Math.max(
                    ...crmStats.topDeals.map((d) => d.value),
                    1,
                  )
                  return (
                    <div className="space-y-2">
                      {crmStats.topDeals.map((d) => {
                        const widthPct =
                          d.value > 0 ? Math.max(8, (d.value / maxValue) * 100) : 0
                        return (
                          <Link
                            key={d.id}
                            href={`/portal/crm/${d.id}`}
                            className="group block rounded-lg border border-border bg-background hover:border-primary/40 hover:bg-primary/[0.02] transition-all px-3 py-2"
                          >
                            <div className="flex items-center justify-between gap-2 mb-1.5">
                              <p className="text-xs font-semibold text-foreground truncate flex-1">
                                {d.companyName}
                              </p>
                              <div className="flex items-center gap-1.5 shrink-0">
                                {typeof d.leadScore === "number" && d.leadScore > 0 && (
                                  <span className="text-[10px] font-bold tabular-nums text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                                    {d.leadScore}
                                  </span>
                                )}
                                <span className="text-xs font-bold tabular-nums text-foreground">
                                  {d.value > 0
                                    ? `$${d.value.toLocaleString()}`
                                    : "—"}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-1.5 rounded-full bg-muted/60 overflow-hidden">
                                {d.value > 0 && (
                                  <div
                                    className="h-full rounded-full bg-primary transition-all"
                                    style={{ width: `${widthPct}%` }}
                                  />
                                )}
                              </div>
                              <span className="text-[10px] text-muted-foreground uppercase tracking-wider shrink-0 w-16 text-right">
                                {d.stage.replace(/_/g, " ").toLowerCase()}
                              </span>
                            </div>
                          </Link>
                        )
                      })}
                    </div>
                  )
                })()
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── COMPACT QUICK ACTIONS + RECENT ACTIVITY (2-col) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Compact icon-row quick actions */}
        <div className="lg:col-span-7 rounded-2xl border border-border bg-card p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <p className="text-xs font-semibold text-foreground uppercase tracking-wider">
              Jump in
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { icon: MapPin, label: "Find Leads", href: "/portal/crm/scout" },
              { icon: ClipboardCheck, label: "AI Audit", href: "/portal/audits" },
              { icon: BookOpen, label: "Playbooks", href: "/portal/playbooks" },
              { icon: Calculator, label: "Price Builder", href: "/portal/calculator" },
            ].map(({ icon: Icon, label, href }) => (
              <Link
                key={label}
                href={href}
                className="group flex flex-col items-start gap-2 rounded-xl border border-border bg-background hover:border-primary/40 hover:bg-primary/5 transition-all p-3"
              >
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/15 transition-colors">
                  <Icon className="h-4 w-4 text-primary" />
                </div>
                <span className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors">
                  {label}
                </span>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent activity feed */}
        {(() => {
          type FeedItem = { id: string; icon: "crm" | "bell"; title: string; sub: string; time: Date }
          const feed: FeedItem[] = []

          if (crmStats?.recentActivities) {
            for (const a of crmStats.recentActivities) {
              feed.push({
                id: `crm-${a.id}`,
                icon: "crm",
                title: a.description ?? a.type.replace(/_/g, " ").toLowerCase(),
                sub: a.clientDeal.companyName,
                time: new Date(a.createdAt),
              })
            }
          }
          for (const n of recentNotifications) {
            feed.push({ id: n.id, icon: "bell", title: n.title, sub: n.message, time: new Date(n.sentAt) })
          }
          feed.sort((a, b) => b.time.getTime() - a.time.getTime())
          const top = feed.slice(0, 5)

          if (top.length === 0) {
            return (
              <div className="lg:col-span-5 rounded-2xl border border-border bg-card p-5">
                <p className="text-xs font-semibold text-foreground uppercase tracking-wider mb-3">
                  Recent activity
                </p>
                <p className="text-xs text-muted-foreground text-center py-8">
                  No activity yet. Run an enrichment or send a proposal to get started.
                </p>
              </div>
            )
          }

          return (
            <div className="lg:col-span-5 rounded-2xl border border-border bg-card overflow-hidden">
              <div className="px-5 py-3 border-b border-border flex items-center justify-between">
                <p className="text-xs font-semibold text-foreground uppercase tracking-wider">
                  Recent activity
                </p>
                <Link
                  href="/portal/crm"
                  className="text-[10px] text-primary hover:text-primary/80 inline-flex items-center gap-1"
                >
                  All <ArrowRight className="h-2.5 w-2.5" />
                </Link>
              </div>
              <ul className="divide-y divide-border">
                {top.map((item) => (
                  <li key={item.id} className="flex items-start gap-3 px-5 py-2.5">
                    <div className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${item.icon === "crm" ? "bg-primary/10" : "bg-muted"}`}>
                      {item.icon === "crm" ? (
                        <Briefcase className="h-3 w-3 text-primary" />
                      ) : (
                        <Bell className="h-3 w-3 text-muted-foreground" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-foreground capitalize truncate">{item.title}</p>
                      <p className="mt-0.5 text-[11px] text-muted-foreground truncate">{item.sub}</p>
                    </div>
                    <span className="shrink-0 text-[10px] text-muted-foreground">{timeAgo(item.time)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )
        })()}
      </div>
    </div>
  )
}

/**
 * Headline stat tile. Optionally renders a trend pill (+/-X% vs prior
 * period) and a "primary" hero treatment for the most-important stat
 * in the row (typically MRR).
 */
function StatTile({
  href,
  icon,
  label,
  value,
  sub,
  trendPct,
  primary,
}: {
  href: string
  icon: React.ReactNode
  label: string
  value: string
  sub: string
  trendPct?: number | null
  primary?: boolean
}) {
  return (
    <Link
      href={href}
      className={`group relative overflow-hidden rounded-2xl border p-4 transition-all hover:shadow-md hover:shadow-primary/5 ${
        primary
          ? "border-primary/30 bg-gradient-to-br from-primary/[0.06] to-transparent hover:border-primary/50"
          : "border-border bg-card hover:border-primary/30"
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <div
          className={`h-7 w-7 rounded-lg flex items-center justify-center ${
            primary ? "bg-primary/15 text-primary" : "bg-primary/10 text-primary"
          }`}
        >
          {icon}
        </div>
        {trendPct !== null && trendPct !== undefined && (
          <span
            className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums ${
              trendPct >= 0
                ? "bg-primary/10 text-primary"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {trendPct >= 0 ? "+" : ""}
            {trendPct.toFixed(0)}%
          </span>
        )}
      </div>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="text-2xl sm:text-3xl font-bold text-foreground tabular-nums leading-tight mt-0.5">
        {value}
      </p>
      <p className="text-[11px] text-muted-foreground mt-1 truncate">
        {sub}
      </p>
      {primary && (
        <div className="absolute -right-3 -bottom-3 h-16 w-16 rounded-full bg-primary/10 pointer-events-none" />
      )}
    </Link>
  )
}
