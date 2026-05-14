import { redirect } from "next/navigation"
import { Compass } from "lucide-react"
import { db } from "@/lib/db"
import { requireAdmin } from "@/lib/auth"
import { Breadcrumbs } from "@/components/shared/Breadcrumbs"

export const metadata = { title: "Wizard Funnel", robots: { index: false } }
export const dynamic = "force-dynamic"

// Ordered steps in the first-run wizard. Order matters — drop-off is
// computed against the previous step in this list.
const STEPS = [
  { key: "intro", label: "Intro" },
  { key: "profile", label: "Profile" },
  { key: "branding", label: "Branding" },
  { key: "site", label: "Site" },
  { key: "scout", label: "Scout" },
  { key: "connections", label: "Connections" },
] as const

type StepKey = (typeof STEPS)[number]["key"]

export default async function AdminWizardFunnelPage() {
  const adminId = await requireAdmin()
  if (!adminId) redirect("/admin/dashboard")

  // Pull all the counts in parallel so the page stays fast even on
  // larger user tables. Each query is narrow + indexed on the new
  // firstRun* columns.
  const [
    totalUsers,
    usersAtStepIntroExplicit,
    usersAtStepIntroImplicit,
    usersAtStepProfile,
    usersAtStepBranding,
    usersAtStepSite,
    usersAtStepScout,
    usersAtStepConnections,
    usersCompleted,
    usersSkipped,
    recentInFlight,
  ] = await Promise.all([
    db.user.count(),
    db.user.count({ where: { firstRunStep: "intro" } }),
    db.user.count({
      where: {
        firstRunStep: null,
        firstRunCompletedAt: null,
        firstRunSkippedAt: null,
      },
    }),
    db.user.count({ where: { firstRunStep: "profile" } }),
    db.user.count({ where: { firstRunStep: "branding" } }),
    db.user.count({ where: { firstRunStep: "site" } }),
    db.user.count({ where: { firstRunStep: "scout" } }),
    db.user.count({ where: { firstRunStep: "connections" } }),
    db.user.count({ where: { firstRunCompletedAt: { not: null } } }),
    db.user.count({ where: { firstRunSkippedAt: { not: null } } }),
    db.user.findMany({
      where: {
        firstRunStep: { not: null },
        firstRunCompletedAt: null,
        firstRunSkippedAt: null,
      },
      orderBy: { updatedAt: "desc" },
      take: 20,
      select: {
        id: true,
        email: true,
        firstRunStep: true,
        updatedAt: true,
      },
    }),
  ])

  // "Still at intro" includes both explicit (firstRunStep === 'intro')
  // and implicit (never touched the wizard) users. The wizard
  // auto-redirects fresh signups so they land at intro on first paint.
  const usersAtStepIntro = usersAtStepIntroExplicit + usersAtStepIntroImplicit

  const stepCounts: Record<StepKey, number> = {
    intro: usersAtStepIntro,
    profile: usersAtStepProfile,
    branding: usersAtStepBranding,
    site: usersAtStepSite,
    scout: usersAtStepScout,
    connections: usersAtStepConnections,
  }

  const inFlightTotal = STEPS.reduce((sum, s) => sum + stepCounts[s.key], 0)

  // Drop-off is "how many users we LOST between this step and the
  // previous one", expressed as a percentage of the previous step's
  // count. First step has no previous, so it stays null.
  const rows = STEPS.map((step, idx) => {
    const count = stepCounts[step.key]
    const pctOfTotal = totalUsers > 0 ? (count / totalUsers) * 100 : 0
    let dropOffPct: number | null = null
    if (idx > 0) {
      const prevCount = stepCounts[STEPS[idx - 1].key]
      if (prevCount > 0) {
        dropOffPct = ((prevCount - count) / prevCount) * 100
      }
    }
    return { ...step, count, pctOfTotal, dropOffPct }
  })

  // Width of each bar is scaled to the largest step so the visual
  // funnel is always readable, even when intro dwarfs the rest.
  const maxCount = Math.max(...rows.map((r) => r.count), 1)

  return (
    <div className="max-w-6xl mx-auto py-6 space-y-6">
      <Breadcrumbs
        items={[
          { label: "Admin", href: "/admin/dashboard" },
          { label: "Wizard Funnel" },
        ]}
      />

      <div className="flex items-start gap-3">
        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Compass className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Wizard Funnel</h1>
          <p className="text-sm text-muted-foreground">
            First-run onboarding tour completion across the user base.
          </p>
        </div>
      </div>

      {/* Summary row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <SummaryCard label="Total users" value={totalUsers} />
        <SummaryCard
          label="Completed"
          value={usersCompleted}
          accent="text-emerald-500"
        />
        <SummaryCard
          label="Skipped"
          value={usersSkipped}
          accent="text-amber-500"
        />
        <SummaryCard
          label="In-flight"
          value={inFlightTotal}
          accent="text-primary"
        />
      </div>

      {/* Funnel bars */}
      <section className="rounded-2xl border border-border bg-card p-5">
        <div className="mb-4">
          <h2 className="text-sm font-semibold text-foreground">Step funnel</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Bar width is relative to the largest step. Drop-off compares to the
            previous step.
          </p>
        </div>
        <ul className="space-y-3">
          {rows.map((row) => {
            const widthPct = (row.count / maxCount) * 100
            return (
              <li key={row.key}>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-medium text-foreground">
                    {row.label}
                  </span>
                  <span className="font-mono text-muted-foreground">
                    {row.count.toLocaleString()}{" "}
                    <span className="text-muted-foreground/60">
                      ({row.pctOfTotal.toFixed(1)}% of users)
                    </span>
                    {row.dropOffPct !== null && (
                      <span
                        className={`ml-2 ${
                          row.dropOffPct > 0
                            ? "text-amber-500"
                            : "text-emerald-500"
                        }`}
                      >
                        {row.dropOffPct > 0 ? "▼" : "▲"}{" "}
                        {Math.abs(row.dropOffPct).toFixed(1)}%
                      </span>
                    )}
                  </span>
                </div>
                <div className="h-6 w-full rounded-md bg-muted/40 overflow-hidden">
                  <div
                    className="h-full bg-primary/70 rounded-md transition-all"
                    style={{ width: `${Math.max(widthPct, row.count > 0 ? 1 : 0)}%` }}
                  />
                </div>
              </li>
            )
          })}
          {/* Terminal outcomes */}
          <li className="pt-3 mt-3 border-t border-border">
            <TerminalRow
              label="Completed"
              count={usersCompleted}
              total={totalUsers}
              tone="emerald"
            />
          </li>
          <li>
            <TerminalRow
              label="Skipped"
              count={usersSkipped}
              total={totalUsers}
              tone="amber"
            />
          </li>
        </ul>
      </section>

      {/* Recent in-flight users */}
      <section className="rounded-2xl border border-border bg-card p-5">
        <div className="mb-4">
          <h2 className="text-sm font-semibold text-foreground">
            Recent in-flight users
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Last 20 users with a wizard step set but not completed or skipped.
          </p>
        </div>
        {recentInFlight.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">
            No users currently in-flight.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {recentInFlight.map((u) => (
              <li
                key={u.id}
                className="flex items-center gap-3 py-2.5 text-sm"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-foreground font-medium truncate">
                    {u.email}
                  </p>
                </div>
                <span className="text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded border border-border bg-muted/40 text-muted-foreground flex-shrink-0">
                  {u.firstRunStep ?? "—"}
                </span>
                <span className="text-xs text-muted-foreground font-mono flex-shrink-0 w-16 text-right">
                  {timeAgo(u.updatedAt)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

function SummaryCard({
  label,
  value,
  accent,
}: {
  label: string
  value: number
  accent?: string
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">
        {label}
      </p>
      <p className={`text-2xl font-bold mt-1 ${accent ?? "text-foreground"}`}>
        {value.toLocaleString()}
      </p>
    </div>
  )
}

function TerminalRow({
  label,
  count,
  total,
  tone,
}: {
  label: string
  count: number
  total: number
  tone: "emerald" | "amber"
}) {
  const pct = total > 0 ? (count / total) * 100 : 0
  const bar = tone === "emerald" ? "bg-emerald-500/70" : "bg-amber-500/70"
  const text = tone === "emerald" ? "text-emerald-500" : "text-amber-500"
  return (
    <>
      <div className="flex items-center justify-between text-xs mb-1.5">
        <span className={`font-medium ${text}`}>{label}</span>
        <span className="font-mono text-muted-foreground">
          {count.toLocaleString()}{" "}
          <span className="text-muted-foreground/60">
            ({pct.toFixed(1)}% of users)
          </span>
        </span>
      </div>
      <div className="h-6 w-full rounded-md bg-muted/40 overflow-hidden">
        <div
          className={`h-full ${bar} rounded-md transition-all`}
          style={{ width: `${Math.max(pct, count > 0 ? 1 : 0)}%` }}
        />
      </div>
    </>
  )
}

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (seconds < 60) return "just now"
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d`
  const months = Math.floor(days / 30)
  return `${months}mo`
}
