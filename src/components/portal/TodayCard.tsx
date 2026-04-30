/**
 * Today card — the daily-open hook for the portal dashboard.
 *
 * Shows what's happened in the last 24h that the operator should care
 * about: new audit submissions, deals enriched, deals advanced, deals
 * won, credits used, follow-ups due. All powered by OperatorEvent so
 * the data source is universal — adding a new event type elsewhere in
 * the codebase automatically surfaces here if we want it to.
 */
import Link from "next/link"
import {
  Sparkles,
  Activity,
  ArrowRight,
  ClipboardCheck,
  Building2,
  TrendingUp,
  Trophy,
  X,
  Clock,
  AlertCircle,
  BarChart3,
} from "lucide-react"
import { db } from "@/lib/db"
import { EVENT_TYPES } from "@/lib/events/emit"

interface TodayCardProps {
  userId: string
}

export async function TodayCard({ userId }: TodayCardProps) {
  const sinceMidnight = startOfTodayUTC()
  const sinceWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

  // Pull all interesting events for this operator in the last 24h, plus
  // a wider 7d window for the hot-leads list (CRM activity is sparser).
  const [todayEvents, weekEvents, staleDeals] = await Promise.all([
    db.operatorEvent.findMany({
      where: { actorId: userId, createdAt: { gte: sinceMidnight } },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    db.operatorEvent.findMany({
      where: {
        actorId: userId,
        createdAt: { gte: sinceWeek },
        type: {
          in: [
            EVENT_TYPES.AUDIT_COMPLETED,
            EVENT_TYPES.DEAL_ENRICHED,
            EVENT_TYPES.DEAL_CREATED,
            EVENT_TYPES.DEAL_STAGE_ADVANCED,
            EVENT_TYPES.DEAL_WON,
          ],
        },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    // Stale follow-ups: deals untouched for 7+ days, still in active pipeline.
    db.clientDeal.findMany({
      where: {
        userId,
        stage: { notIn: ["COMPLETED", "LOST"] },
        updatedAt: { lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      },
      select: { id: true, companyName: true, stage: true, updatedAt: true },
      orderBy: { updatedAt: "asc" },
      take: 5,
    }),
  ])

  // Bucket events for the cards
  const auditCompleted = todayEvents.filter(
    (e) => e.type === EVENT_TYPES.AUDIT_COMPLETED,
  )
  const dealsEnriched = todayEvents.filter(
    (e) => e.type === EVENT_TYPES.DEAL_ENRICHED,
  )
  const dealsAdvanced = todayEvents.filter(
    (e) => e.type === EVENT_TYPES.DEAL_STAGE_ADVANCED,
  )
  const dealsWon = todayEvents.filter((e) => e.type === EVENT_TYPES.DEAL_WON)
  const creditsUsed = todayEvents
    .filter((e) => e.type === EVENT_TYPES.CREDITS_DEBITED)
    .reduce((sum, e) => {
      const meta = (e.metadata as Record<string, unknown> | null) ?? {}
      const amount = typeof meta.amount === "number" ? meta.amount : 0
      return sum + amount
    }, 0)

  // Hot leads = audits completed in the last 7 days (highest-intent surface)
  const hotLeads = weekEvents
    .filter((e) => e.type === EVENT_TYPES.AUDIT_COMPLETED)
    .slice(0, 5)
    .map((e) => {
      const meta = (e.metadata as Record<string, unknown> | null) ?? {}
      return {
        id: e.id,
        responseId: e.entityId,
        when: e.createdAt,
        leadEmail: typeof meta.leadEmail === "string" ? meta.leadEmail : null,
        leadCompany: typeof meta.leadCompany === "string" ? meta.leadCompany : null,
        quizTitle: typeof meta.quizTitle === "string" ? meta.quizTitle : "Audit",
      }
    })

  const totalActions =
    auditCompleted.length +
    dealsEnriched.length +
    dealsAdvanced.length +
    dealsWon.length

  // Build 7-day activity histogram from weekEvents. Each bar = one day.
  // We bucket every interesting event type so the chart reflects real
  // throughput, not just one metric.
  const days: Array<{ date: Date; label: string; count: number }> = []
  for (let i = 6; i >= 0; i--) {
    const start = new Date()
    start.setHours(0, 0, 0, 0)
    start.setDate(start.getDate() - i)
    const end = new Date(start)
    end.setDate(end.getDate() + 1)
    const dayName = start.toLocaleDateString("en-US", { weekday: "short" })
    const count = weekEvents.filter((e) => {
      const t = new Date(e.createdAt).getTime()
      return t >= start.getTime() && t < end.getTime()
    }).length
    days.push({ date: start, label: dayName, count })
  }
  const maxDayCount = Math.max(...days.map((d) => d.count), 1)
  const weekTotal = days.reduce((s, d) => s + d.count, 0)

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            Today
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {totalActions === 0
              ? "Quiet so far. Run an Enrich or share an audit link to get the day moving."
              : `${totalActions} action${totalActions === 1 ? "" : "s"} since midnight.`}
          </p>
        </div>
        <Link
          href="/portal/crm"
          className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1"
        >
          Open pipeline
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      {/* Activity strip — 4 stat cards across */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          icon={<ClipboardCheck className="h-4 w-4" />}
          label="Audits today"
          value={auditCompleted.length}
          isHero={auditCompleted.length > 0}
        />
        <StatCard
          icon={<Building2 className="h-4 w-4" />}
          label="Enriched today"
          value={dealsEnriched.length}
          isHero={dealsEnriched.length > 0}
        />
        <StatCard
          icon={<TrendingUp className="h-4 w-4" />}
          label="Stages moved"
          value={dealsAdvanced.length}
          isHero={dealsAdvanced.length > 0}
        />
        <StatCard
          icon={<Trophy className="h-4 w-4" />}
          label="Wins"
          value={dealsWon.length}
          isHero={dealsWon.length > 0}
        />
      </div>

      {/* 7-day activity histogram. Today's bar is filled solid primary;
          past days use a muted primary tint so the chart visually leads
          the eye to the current day. Empty days render as a thin
          baseline so the operator can still see the day axis. */}
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-3.5 w-3.5 text-primary" />
            <p className="text-xs font-semibold text-foreground uppercase tracking-wider">
              Last 7 days
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
              Total actions
            </p>
            <p className="text-lg font-bold tabular-nums text-foreground leading-tight">
              {weekTotal}
            </p>
          </div>
        </div>

        <div className="flex items-end gap-1.5 sm:gap-2 h-24">
          {days.map((d, i) => {
            const isToday = i === days.length - 1
            const heightPct =
              d.count === 0 ? 4 : Math.max(8, (d.count / maxDayCount) * 100)
            return (
              <div
                key={i}
                className="flex-1 flex flex-col items-center justify-end h-full group"
                title={`${d.count} action${d.count === 1 ? "" : "s"} on ${d.date.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}`}
              >
                <div className="relative w-full flex items-end justify-center h-[calc(100%-1.25rem)]">
                  {d.count > 0 && (
                    <span className="absolute -top-4 text-[10px] font-bold tabular-nums text-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                      {d.count}
                    </span>
                  )}
                  <div
                    className={`w-full rounded-t-md transition-all ${
                      isToday
                        ? "bg-primary"
                        : d.count > 0
                          ? "bg-primary/30 group-hover:bg-primary/50"
                          : "bg-muted"
                    }`}
                    style={{ height: `${heightPct}%`, minHeight: "4px" }}
                  />
                </div>
                <span
                  className={`text-[10px] mt-1.5 font-medium ${
                    isToday ? "text-primary font-bold" : "text-muted-foreground"
                  }`}
                >
                  {d.label}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Hot leads — last 7d audit submissions */}
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Hot leads (7d)
            </p>
            {hotLeads.length > 0 && (
              <span className="text-[11px] text-primary font-semibold">
                {hotLeads.length}
              </span>
            )}
          </div>
          {hotLeads.length === 0 ? (
            <div className="py-4 text-xs text-muted-foreground text-center">
              No audit submissions in the last 7 days.
              <br />
              <Link
                href="/portal/audits"
                className="text-primary hover:underline mt-1 inline-block"
              >
                Share your audit link →
              </Link>
            </div>
          ) : (
            <ul className="space-y-2">
              {hotLeads.map((l) => (
                <li key={l.id} className="flex items-start justify-between gap-2 text-sm">
                  <div className="flex-1 min-w-0">
                    <p className="text-foreground font-medium truncate">
                      {l.leadCompany ?? l.leadEmail ?? "Anonymous"}
                    </p>
                    <p className="text-[11px] text-muted-foreground truncate">
                      {l.quizTitle} · {timeAgoShort(l.when)}
                    </p>
                  </div>
                  {l.responseId && (
                    <Link
                      href={`/portal/audits`}
                      className="text-[11px] text-primary hover:underline shrink-0"
                    >
                      View →
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Follow-ups due — stale deals */}
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Follow-ups due
            </p>
            {staleDeals.length > 0 && (
              <span className="text-[11px] text-primary font-semibold">
                {staleDeals.length}
              </span>
            )}
          </div>
          {staleDeals.length === 0 ? (
            <div className="py-4 text-xs text-muted-foreground text-center">
              No stale deals — pipeline is fresh.
            </div>
          ) : (
            <ul className="space-y-2">
              {staleDeals.map((d) => {
                const days = Math.floor(
                  (Date.now() - new Date(d.updatedAt).getTime()) / 86400000,
                )
                return (
                  <li key={d.id} className="flex items-start justify-between gap-2 text-sm">
                    <div className="flex-1 min-w-0">
                      <p className="text-foreground font-medium truncate flex items-center gap-1.5">
                        {days >= 14 && <AlertCircle className="h-3 w-3 text-destructive" />}
                        {d.companyName}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {d.stage} · last touch {days}d ago
                      </p>
                    </div>
                    <Link
                      href={`/portal/crm/${d.id}`}
                      className="text-[11px] text-primary hover:underline shrink-0"
                    >
                      Reach out →
                    </Link>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>

      {/* Credits-used summary footer */}
      {creditsUsed > 0 && (
        <div className="text-[11px] text-muted-foreground flex items-center gap-1.5">
          <Activity className="h-3 w-3" />
          {creditsUsed.toLocaleString()} credits spent today on enrichment.
        </div>
      )}
    </section>
  )
}

function StatCard({
  icon,
  label,
  value,
  isHero,
}: {
  icon: React.ReactNode
  label: string
  value: number
  /** When true, the card has activity worth surfacing — primary accent.
   *  When false (zero activity), the card stays neutral so the eye
   *  jumps to the cards that actually have signal. */
  isHero: boolean
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-xl border bg-card p-4 transition-colors ${
        isHero
          ? "border-primary/30 bg-gradient-to-br from-primary/[0.06] to-transparent"
          : "border-border"
      }`}
    >
      <div
        className={`flex items-center gap-1.5 ${isHero ? "text-primary" : "text-muted-foreground"}`}
      >
        {icon}
        <span className="text-[10px] uppercase tracking-wider font-semibold">
          {label}
        </span>
      </div>
      <p
        className={`text-3xl font-bold mt-2 tabular-nums ${
          isHero ? "text-foreground" : "text-muted-foreground/40"
        }`}
      >
        {value}
      </p>
      {isHero && (
        <div className="absolute -right-2 -bottom-2 h-12 w-12 rounded-full bg-primary/5" />
      )}
    </div>
  )
}

function startOfTodayUTC(): Date {
  const d = new Date()
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
}

function timeAgoShort(when: Date): string {
  const ms = Date.now() - new Date(when).getTime()
  const mins = Math.floor(ms / 60000)
  if (mins < 1) return "now"
  if (mins < 60) return `${mins}m`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h`
  const days = Math.floor(hrs / 24)
  return `${days}d`
}

// Suppress unused-import warning for icons used conditionally
void X
void Clock
