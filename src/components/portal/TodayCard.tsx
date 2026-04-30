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
          accent="primary"
        />
        <StatCard
          icon={<Building2 className="h-4 w-4" />}
          label="Enriched today"
          value={dealsEnriched.length}
          accent="emerald"
        />
        <StatCard
          icon={<TrendingUp className="h-4 w-4" />}
          label="Stages moved"
          value={dealsAdvanced.length}
          accent="sky"
        />
        <StatCard
          icon={<Trophy className="h-4 w-4" />}
          label="Wins"
          value={dealsWon.length}
          accent="amber"
        />
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
              <span className="text-[11px] text-amber-500 font-semibold">
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
  accent,
}: {
  icon: React.ReactNode
  label: string
  value: number
  accent: "primary" | "emerald" | "sky" | "amber"
}) {
  const accentClass = {
    primary: "text-primary",
    emerald: "text-emerald-500",
    sky: "text-sky-500",
    amber: "text-amber-500",
  }[accent]
  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <div className={`flex items-center gap-1.5 ${accentClass}`}>
        {icon}
        <span className="text-[10px] uppercase tracking-wider font-semibold">{label}</span>
      </div>
      <p className="text-2xl font-bold text-foreground mt-1.5 tabular-nums">{value}</p>
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
