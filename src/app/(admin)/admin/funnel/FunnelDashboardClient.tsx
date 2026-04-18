"use client"

import { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import {
  RefreshCw,
  ArrowRight,
  ArrowUp,
  Users,
  Flame,
  Calendar,
  UserPlus,
  CheckCircle2,
  AlertCircle,
  Clock,
  Mail,
  FileText,
  GraduationCap,
  TrendingUp,
} from "lucide-react"
import { cn, timeAgo } from "@/lib/utils"

const REFRESH_INTERVAL_MS = 30_000

interface FunnelResponse {
  generatedAt: string
  top: {
    partialsToday: number
    partialsWeek: number
    partialsMonth: number
    partialsAll: number
    applicationsToday: number
    applicationsYesterday: number
    applicationsWeek: number
    applicationsMonth: number
    applicationsAll: number
    hot: number
    warm: number
    cold: number
    bookingsEver: number
    invitedEver: number
    joinedEver: number
    invitesPending: number
    invitesFailed: number
  }
  funnel: {
    starts: number
    completed: number
    booked: number
    invited: number
    joined: number
    completionRate: number
    bookingRate: number
    mightyAcceptRate: number
    applicationToCollectiveRate: number
  }
  stages: Record<string, number>
  stagesWeek: Record<string, number>
  recentApplications: Array<{
    id: string
    name: string
    email: string
    stage: string
    score: number | null
    tier: string | null
    mightyStatus: string | null
    createdAt: string
  }>
  recentActivity: Array<{
    id: string
    type: string
    detail: string | null
    dealId: string
    createdAt: string
  }>
}

const STAGES_ORDER = [
  "APPLICATION_SUBMITTED",
  "CONSULT_BOOKED",
  "CONSULT_COMPLETED",
  "MIGHTY_INVITED",
  "MEMBER_JOINED",
] as const

const STAGE_LABELS: Record<string, string> = {
  APPLICATION_SUBMITTED: "Applied",
  CONSULT_BOOKED: "Consult Booked",
  CONSULT_COMPLETED: "Consult Done",
  MIGHTY_INVITED: "Invited",
  MEMBER_JOINED: "Joined",
  LOST: "Lost",
}

const ACTIVITY_ICONS: Record<string, React.ReactNode> = {
  FORM_SUBMITTED: <FileText className="w-3.5 h-3.5" />,
  DEMO_COMPLETED: <Calendar className="w-3.5 h-3.5" />,
  MIGHTY_INVITE_SENT: <UserPlus className="w-3.5 h-3.5" />,
  MIGHTY_MEMBER_JOINED: <CheckCircle2 className="w-3.5 h-3.5" />,
  MIGHTY_COURSE_COMPLETED: <GraduationCap className="w-3.5 h-3.5" />,
  EMAIL_SENT: <Mail className="w-3.5 h-3.5" />,
  STAGE_CHANGE: <TrendingUp className="w-3.5 h-3.5" />,
}

export function FunnelDashboardClient() {
  const [data, setData] = useState<FunnelResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastRefreshed, setLastRefreshed] = useState<number | null>(null)

  const fetchData = useCallback(async (signal?: AbortSignal) => {
    try {
      const res = await fetch("/api/admin/funnel", { cache: "no-store", signal })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = (await res.json()) as FunnelResponse
      if (signal?.aborted) return
      setData(json)
      setError(null)
      setLastRefreshed(Date.now())
    } catch (err) {
      if ((err as { name?: string })?.name === "AbortError") return
      setError(err instanceof Error ? err.message : "Failed to load")
    } finally {
      if (!signal?.aborted) setLoading(false)
    }
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    fetchData(controller.signal)
    const iv = setInterval(() => fetchData(controller.signal), REFRESH_INTERVAL_MS)
    return () => {
      controller.abort()
      clearInterval(iv)
    }
  }, [fetchData])

  if (loading && !data) {
    return (
      <div className="py-16 flex items-center justify-center">
        <RefreshCw className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error && !data) {
    return (
      <div className="rounded-md border border-primary/30 bg-primary/10 p-4 text-primary text-sm">
        Failed to load funnel: {error}
      </div>
    )
  }

  if (!data) return null

  const { top, funnel, stages, recentApplications, recentActivity } = data
  const dayOverDay =
    top.applicationsYesterday > 0
      ? ((top.applicationsToday - top.applicationsYesterday) /
          top.applicationsYesterday) *
        100
      : null

  const funnelSteps = [
    { label: "Started", count: funnel.starts, icon: Users },
    { label: "Completed", count: funnel.completed, icon: CheckCircle2 },
    { label: "Booked", count: funnel.booked, icon: Calendar },
    { label: "Invited", count: funnel.invited, icon: UserPlus },
    { label: "Joined", count: funnel.joined, icon: Flame },
  ]

  return (
    <div className="space-y-6">
      {/* ── Status bar ── */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          Live · refreshes every 30s
          {lastRefreshed && (
            <span className="ml-2 font-mono">
              · last {timeAgo(new Date(lastRefreshed).toISOString())}
            </span>
          )}
        </div>
        <button
          onClick={() => fetchData()}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-2 py-1 text-xs hover:text-foreground transition-colors"
        >
          <RefreshCw className={cn("w-3 h-3", loading && "animate-spin")} />
          Refresh now
        </button>
      </div>

      {/* ── TOP KPIs ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Kpi
          label="Apps Today"
          value={top.applicationsToday}
          sub={
            dayOverDay !== null ? (
              <span
                className={cn(
                  "inline-flex items-center gap-0.5 text-xs",
                  dayOverDay >= 0 ? "text-emerald-600" : "text-primary"
                )}
              >
                <ArrowUp
                  className={cn(
                    "w-3 h-3",
                    dayOverDay < 0 && "rotate-180"
                  )}
                />
                {Math.abs(dayOverDay).toFixed(0)}% vs yesterday
              </span>
            ) : (
              <span className="text-xs text-muted-foreground">
                first day of tracking
              </span>
            )
          }
          icon={<FileText className="w-3.5 h-3.5" />}
        />
        <Kpi
          label="Hot Leads (all-time)"
          value={top.hot}
          sub={
            <span className="text-xs text-muted-foreground">
              warm {top.warm} · cold {top.cold}
            </span>
          }
          icon={<Flame className="w-3.5 h-3.5" />}
          valueClass="text-primary"
        />
        <Kpi
          label="Calls Booked (all-time)"
          value={top.bookingsEver}
          sub={
            <span className="text-xs text-muted-foreground">
              {funnel.bookingRate.toFixed(0)}% of applicants book
            </span>
          }
          icon={<Calendar className="w-3.5 h-3.5" />}
        />
        <Kpi
          label="Joined Collective"
          value={top.joinedEver}
          sub={
            <span className="text-xs text-muted-foreground">
              {top.invitesPending} pending · {top.invitesFailed} failed
            </span>
          }
          icon={<CheckCircle2 className="w-3.5 h-3.5" />}
          valueClass="text-emerald-700"
        />
      </div>

      {/* ── FUNNEL BAR ── */}
      <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <div className="mb-4">
          <h2 className="text-sm font-semibold text-foreground">
            Conversion Funnel
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Stage-to-stage drop-off across the application flow.
          </p>
        </div>

        <div className="space-y-2">
          {funnelSteps.map((step, i) => {
            const prev = i > 0 ? funnelSteps[i - 1].count : null
            // Cap conversion at 100% — leads imported directly into
            // later stages (e.g. via Close) can otherwise produce
            // nonsense like "1000% conv".
            const rawRate =
              prev && prev > 0 ? (step.count / prev) * 100 : null
            const rateFromPrev =
              rawRate !== null ? Math.min(100, rawRate) : null
            const max = Math.max(1, ...funnelSteps.map((s) => s.count))
            const widthPct = (step.count / max) * 100
            const isWin = step.label === "Joined"
            const Icon = step.icon
            return (
              <div key={step.label} className="flex items-center gap-3">
                <div className="flex items-center gap-2 w-32 flex-shrink-0">
                  <Icon
                    className={cn(
                      "h-3.5 w-3.5",
                      isWin ? "text-emerald-600" : "text-primary"
                    )}
                  />
                  <span className="text-xs font-medium text-foreground">
                    {step.label}
                  </span>
                </div>
                <div className="flex-1 relative h-8 bg-muted/30 rounded overflow-hidden">
                  <div
                    className={cn(
                      "h-full transition-all duration-500",
                      isWin ? "bg-emerald-100" : "bg-primary/10"
                    )}
                    style={{
                      width: `${Math.max(widthPct, step.count > 0 ? 4 : 0)}%`,
                      opacity: isWin ? 1 : 0.5 + i * 0.12,
                    }}
                  />
                  <div className="absolute inset-0 flex items-center justify-between px-3">
                    <span className="text-[11px] text-muted-foreground font-mono">
                      {rateFromPrev !== null
                        ? `${rateFromPrev.toFixed(0)}% from prev`
                        : "entry point"}
                    </span>
                    <span
                      className={cn(
                        "text-sm font-bold font-mono",
                        isWin ? "text-emerald-700" : "text-foreground"
                      )}
                    >
                      {step.count}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-border text-xs">
          <Metric
            label="Form completion"
            value={`${Math.min(100, funnel.completionRate).toFixed(0)}%`}
          />
          <Metric
            label="Book rate"
            value={`${Math.min(100, funnel.bookingRate).toFixed(0)}%`}
          />
          <Metric
            label="Invite accept rate"
            value={`${Math.min(100, funnel.mightyAcceptRate).toFixed(0)}%`}
          />
          <Metric
            label="App → Member"
            value={`${Math.min(100, funnel.applicationToCollectiveRate).toFixed(0)}%`}
            highlight
          />
        </div>
      </section>

      {/* ── STAGE BREAKDOWN ── */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <h2 className="text-sm font-semibold text-foreground mb-4">
          Pipeline by Stage
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {STAGES_ORDER.map((s) => (
            <div
              key={s}
              className="rounded-md border border-border bg-muted/30 p-3 flex flex-col"
            >
              <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                {STAGE_LABELS[s]}
              </span>
              <span className="text-2xl font-bold font-mono text-foreground mt-1">
                {stages[s] ?? 0}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── TIME WINDOW ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <WindowCard
          title="Today"
          completed={top.applicationsToday}
          starts={top.partialsToday}
        />
        <WindowCard
          title="7 Days"
          completed={top.applicationsWeek}
          starts={top.partialsWeek}
        />
        <WindowCard
          title="Month-to-Date"
          completed={top.applicationsMonth}
          starts={top.partialsMonth}
        />
      </div>

      {/* ── RECENT ACTIVITY + APPLICATIONS ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent applications */}
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-foreground">
              Latest Applications
            </h2>
            <Link
              href="/admin/applications"
              className="text-xs text-[#981B1B] hover:underline"
            >
              View all →
            </Link>
          </div>
          {recentApplications.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              No applications yet.
            </p>
          ) : (
            <div className="space-y-2">
              {recentApplications.map((a) => (
                <Link
                  key={a.id}
                  href={`/admin/crm/${a.id}`}
                  className="block rounded-md border border-border bg-muted/30 p-3 hover:border-primary/40 transition-colors"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {a.name}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {a.email}
                      </p>
                    </div>
                    <div className="flex-shrink-0 text-right">
                      <span
                        className={cn(
                          "inline-block text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-sm border",
                          a.tier === "hot"
                            ? "text-primary border-primary/40 bg-primary/10"
                            : a.tier === "warm"
                              ? "text-primary/70 border-primary/20 bg-primary/5"
                              : "text-muted-foreground border-border bg-muted/40"
                        )}
                      >
                        {a.score ?? 0}/100 {a.tier ?? "—"}
                      </span>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                    <span>{STAGE_LABELS[a.stage] ?? a.stage}</span>
                    <span>{timeAgo(a.createdAt)}</span>
                    {a.mightyStatus && (
                      <span
                        className={cn(
                          "px-1.5 py-0.5 rounded border",
                          a.mightyStatus === "accepted"
                            ? "text-emerald-700 border-emerald-200 bg-emerald-50"
                            : a.mightyStatus === "failed"
                              ? "text-primary border-primary/30 bg-primary/10"
                              : "text-muted-foreground border-border bg-muted/40"
                        )}
                      >
                        Mighty: {a.mightyStatus}
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Recent activity */}
        <div className="rounded-2xl border border-border bg-card p-5">
          <h2 className="text-sm font-semibold text-foreground mb-4">
            Live Activity
          </h2>
          {recentActivity.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              No activity yet.
            </p>
          ) : (
            <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
              {recentActivity.map((act) => (
                <Link
                  key={act.id}
                  href={`/admin/crm/${act.dealId}`}
                  className="flex items-start gap-3 rounded-md border border-border bg-muted/30 p-3 hover:border-primary/40 transition-colors"
                >
                  <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md bg-surface text-muted-foreground mt-0.5">
                    {ACTIVITY_ICONS[act.type] ?? (
                      <Clock className="w-3.5 h-3.5" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground font-medium capitalize">
                      {act.type.replace(/_/g, " ").toLowerCase()}
                    </p>
                    {act.detail && (
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {act.detail}
                      </p>
                    )}
                  </div>
                  <span className="flex-shrink-0 text-[10px] font-mono uppercase text-muted-foreground">
                    {timeAgo(act.createdAt)}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/* ── primitives ── */

function Kpi({
  label,
  value,
  sub,
  icon,
  valueClass,
}: {
  label: string
  value: number | string
  sub?: React.ReactNode
  icon?: React.ReactNode
  valueClass?: string
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-muted-foreground">
        {icon}
        <span>{label}</span>
      </div>
      <p className={cn("text-3xl font-bold mt-1 font-mono", valueClass ?? "text-foreground")}>
        {value}
      </p>
      {sub && <div className="mt-1">{sub}</div>}
    </div>
  )
}

function Metric({
  label,
  value,
  highlight,
}: {
  label: string
  value: string
  highlight?: boolean
}) {
  return (
    <div>
      <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p
        className={cn(
          "text-lg font-bold font-mono mt-0.5",
          highlight ? "text-primary" : "text-foreground"
        )}
      >
        {value}
      </p>
    </div>
  )
}

function WindowCard({
  title,
  completed,
  starts,
}: {
  title: string
  completed: number
  starts: number
}) {
  const completionRate = starts > 0 ? (completed / starts) * 100 : 0
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-3">
        {title}
      </p>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-[10px] font-mono uppercase text-muted-foreground">
            Starts
          </p>
          <p className="text-2xl font-bold font-mono text-foreground">
            {starts}
          </p>
        </div>
        <div>
          <p className="text-[10px] font-mono uppercase text-muted-foreground">
            Applications
          </p>
          <p className="text-2xl font-bold font-mono text-foreground">
            {completed}
          </p>
        </div>
      </div>
      <div className="mt-4">
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="font-mono uppercase text-muted-foreground">
            Complete rate
          </span>
          <span className="font-mono text-foreground">
            {completionRate.toFixed(0)}%
          </span>
        </div>
        <div className="h-1.5 rounded-full bg-muted/30 overflow-hidden">
          <div
            className="h-full bg-primary transition-all"
            style={{ width: `${Math.min(100, completionRate)}%` }}
          />
        </div>
      </div>
    </div>
  )
}
