import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import {
  getMrrSnapshot,
  getRevenueByMonth,
  getPlanMix,
  getAcquisitionMix,
  getTopApiCostsByUser,
  getCohortRetention,
  getRefundRate30d,
  getAtRiskMrr,
} from "@/lib/db/cfo-queries"
import CfoCharts from "./CfoCharts"

export const dynamic = "force-dynamic"
export const metadata = { title: "CFO Dashboard" }

/**
 * /admin/cfo — Single-screen revenue + cost view.
 *
 * Pulls every aggregation in parallel (Promise.allSettled — one slow
 * query never blocks the rest) and ships the rendered numbers into a
 * client component for the chart bits. Pure server-rendered numbers
 * everywhere else for fast first paint.
 *
 * Built to answer the questions Adam asks every Monday:
 *   - What's our MRR / ARR right now?
 *   - How is each acquisition channel performing (CAC, ROAS, LTV)?
 *   - Which plans / addons are pulling weight?
 *   - Who's burning the most API spend?
 *   - How fast are we churning?
 *   - What's at risk (dunning)?
 */
export default async function CfoDashboardPage() {
  const { userId, sessionClaims } = await auth()
  if (!userId) redirect("/sign-in")
  const role = (sessionClaims?.metadata as { role?: string })?.role
  if (!role || !["ADMIN", "SUPER_ADMIN"].includes(role)) {
    redirect("/portal/dashboard")
  }

  const [
    mrrRes,
    revRes,
    planMixRes,
    acqRes,
    apiCostRes,
    cohortRes,
    refundRes,
    atRiskRes,
  ] = await Promise.allSettled([
    getMrrSnapshot(),
    getRevenueByMonth(12),
    getPlanMix(),
    getAcquisitionMix(),
    getTopApiCostsByUser(15),
    getCohortRetention(6),
    getRefundRate30d(),
    getAtRiskMrr(),
  ])

  const mrr = mrrRes.status === "fulfilled" ? mrrRes.value : null
  const revenue = revRes.status === "fulfilled" ? revRes.value : []
  const planMix = planMixRes.status === "fulfilled" ? planMixRes.value : []
  const acq = acqRes.status === "fulfilled" ? acqRes.value : []
  const apiCosts = apiCostRes.status === "fulfilled" ? apiCostRes.value : []
  const cohorts = cohortRes.status === "fulfilled" ? cohortRes.value : []
  const refund = refundRes.status === "fulfilled" ? refundRes.value : null
  const atRisk = atRiskRes.status === "fulfilled" ? atRiskRes.value : null

  const totalApiCost = apiCosts.reduce((s, r) => s + r.totalCostUsd, 0)

  return (
    <div className="space-y-8 max-w-[1400px]">
      <header className="flex flex-wrap items-end justify-between gap-4 pb-4 border-b border-border">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            CFO Dashboard
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            MRR, churn, acquisition cost, refund rate, and gross margin — Monday-morning view.
          </p>
        </div>
        <div className="text-xs text-muted-foreground">
          Updated {new Date().toLocaleString()} · revenue history is reconstructed from
          PurchaseInvoice rows
        </div>
      </header>

      {/* Top-line KPI strip */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi
          label="MRR"
          value={fmtUsd(mrr?.currentMrrUsd ?? 0)}
          sub={`ARR ${fmtUsd(mrr?.arrUsd ?? 0)}`}
          tone="primary"
        />
        <Kpi
          label="Active subs"
          value={String(mrr?.activeSubscriptionCount ?? 0)}
          sub="recurring purchases"
        />
        <Kpi
          label="Net new MRR (30d)"
          value={fmtUsd(mrr?.netNewMrr30dUsd ?? 0)}
          sub={`Churn ${fmtUsd(mrr?.churnedMrr30dUsd ?? 0)}`}
          tone={
            (mrr?.netNewMrr30dUsd ?? 0) >= (mrr?.churnedMrr30dUsd ?? 0)
              ? "positive"
              : "negative"
          }
        />
        <Kpi
          label="At-risk MRR"
          value={fmtUsd(atRisk?.atRiskMrrUsd ?? 0)}
          sub={`${atRisk?.subCount ?? 0} subs in dunning`}
          tone={(atRisk?.subCount ?? 0) > 0 ? "warning" : undefined}
        />
      </section>

      {/* Refund rate strip */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi
          label="Refund rate (30d)"
          value={fmtPct((refund?.rate ?? 0) * 100)}
          sub={`${fmtUsd((refund?.refundedCents ?? 0) / 100)} on ${fmtUsd((refund?.paidCents ?? 0) / 100)}`}
          tone={(refund?.rate ?? 0) > 0.05 ? "warning" : undefined}
        />
        <Kpi
          label="Top API spend (15 users)"
          value={fmtUsd(totalApiCost)}
          sub="trailing all-time"
        />
        <Kpi
          label="12-mo total revenue"
          value={fmtUsd(revenue.reduce((s, r) => s + r.revenueUsd, 0))}
          sub={`Net ${fmtUsd(revenue.reduce((s, r) => s + r.netUsd, 0))}`}
        />
        <Kpi
          label="Active cohorts"
          value={String(cohorts.length)}
          sub="signup months tracked"
        />
      </section>

      {/* Charts (client-only because recharts) */}
      <CfoCharts revenue={revenue} planMix={planMix} />

      {/* Acquisition table */}
      <section className="space-y-3">
        <div className="flex items-baseline justify-between">
          <h2 className="text-lg font-semibold">Acquisition channels</h2>
          <a
            href="/admin/campaigns"
            className="text-xs text-primary hover:underline"
          >
            Per-campaign view →
          </a>
        </div>
        <div className="rounded-md border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-muted-foreground text-xs uppercase tracking-wide">
              <tr>
                <th className="text-left px-3 py-2">Channel</th>
                <th className="text-right px-3 py-2">Signups</th>
                <th className="text-right px-3 py-2">Paid</th>
                <th className="text-right px-3 py-2">Conv %</th>
                <th className="text-right px-3 py-2">LTV</th>
                <th className="text-right px-3 py-2">CAC</th>
                <th className="text-right px-3 py-2">ROAS</th>
              </tr>
            </thead>
            <tbody>
              {acq.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-3 py-6 text-center text-muted-foreground text-xs">
                    No signups yet. Once users start signing up, channel breakdown lands here.
                  </td>
                </tr>
              ) : (
                acq.map((row) => (
                  <tr key={row.signupSource} className="border-t border-border">
                    <td className="px-3 py-2 font-medium">{row.signupSource}</td>
                    <td className="px-3 py-2 text-right">{row.signups}</td>
                    <td className="px-3 py-2 text-right">{row.paidUsers}</td>
                    <td className="px-3 py-2 text-right">{fmtPct(row.conversionRate * 100)}</td>
                    <td className="px-3 py-2 text-right">{fmtUsd(row.lifetimeRevenueUsd)}</td>
                    <td className="px-3 py-2 text-right">
                      {row.cacUsd != null ? fmtUsd(row.cacUsd) : "—"}
                    </td>
                    <td className="px-3 py-2 text-right">
                      {row.roas != null ? `${row.roas.toFixed(2)}x` : "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-muted-foreground">
          CAC + ROAS require <code className="text-[10px]">CampaignSpend</code> rows entered at{" "}
          <a href="/admin/campaigns" className="text-primary hover:underline">
            /admin/campaigns
          </a>
          .
        </p>
      </section>

      {/* Plan mix */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Plan mix</h2>
        <div className="rounded-md border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-muted-foreground text-xs uppercase tracking-wide">
              <tr>
                <th className="text-left px-3 py-2">Plan</th>
                <th className="text-right px-3 py-2">Users</th>
                <th className="text-right px-3 py-2">MRR</th>
              </tr>
            </thead>
            <tbody>
              {planMix.map((p) => (
                <tr key={p.planSlug} className="border-t border-border">
                  <td className="px-3 py-2 font-medium">{p.planSlug}</td>
                  <td className="px-3 py-2 text-right">{p.userCount}</td>
                  <td className="px-3 py-2 text-right">{fmtUsd(p.mrrUsd)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Top API cost users */}
      <section className="space-y-3">
        <div className="flex items-baseline justify-between">
          <h2 className="text-lg font-semibold">Top API cost (per user)</h2>
          <a href="/admin/api-costs" className="text-xs text-primary hover:underline">
            Provider breakdown →
          </a>
        </div>
        <div className="rounded-md border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-muted-foreground text-xs uppercase tracking-wide">
              <tr>
                <th className="text-left px-3 py-2">User</th>
                <th className="text-right px-3 py-2">Calls</th>
                <th className="text-right px-3 py-2">Total cost</th>
              </tr>
            </thead>
            <tbody>
              {apiCosts.length === 0 ? (
                <tr>
                  <td
                    colSpan={3}
                    className="px-3 py-6 text-center text-muted-foreground text-xs"
                  >
                    No instrumented API calls yet.
                  </td>
                </tr>
              ) : (
                apiCosts.map((row) => (
                  <tr key={row.userId} className="border-t border-border">
                    <td className="px-3 py-2 font-medium">{row.email}</td>
                    <td className="px-3 py-2 text-right">{row.callCount}</td>
                    <td className="px-3 py-2 text-right">{fmtUsd(row.totalCostUsd)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Cohort retention */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Cohort retention</h2>
        <div className="rounded-md border border-border overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-muted-foreground text-xs uppercase tracking-wide">
              <tr>
                <th className="text-left px-3 py-2">Cohort</th>
                <th className="text-right px-3 py-2">Signups</th>
                {Array.from({ length: 6 }, (_, i) => (
                  <th key={i} className="text-right px-3 py-2">
                    M+{i}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cohorts.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-3 py-6 text-center text-muted-foreground text-xs"
                  >
                    Cohort data appears once users with `signupAt` start churning.
                  </td>
                </tr>
              ) : (
                cohorts.map((c) => (
                  <tr key={c.cohortMonth} className="border-t border-border">
                    <td className="px-3 py-2 font-medium">{c.cohortMonth}</td>
                    <td className="px-3 py-2 text-right">{c.signups}</td>
                    {c.retention.map((r, i) => (
                      <td
                        key={i}
                        className="px-3 py-2 text-right tabular-nums"
                        style={{
                          backgroundColor: `rgba(196, 151, 42, ${Math.min(0.4, r * 0.4)})`,
                        }}
                      >
                        {fmtPct(r * 100)}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
//  PRESENTATION
// ─────────────────────────────────────────────────────────────

function Kpi({
  label,
  value,
  sub,
  tone,
}: {
  label: string
  value: string
  sub?: string
  tone?: "primary" | "positive" | "negative" | "warning"
}) {
  const toneClass =
    tone === "primary"
      ? "border-primary/40 bg-primary/5"
      : tone === "positive"
        ? "border-emerald-500/40 bg-emerald-500/5"
        : tone === "negative"
          ? "border-red-500/40 bg-red-500/5"
          : tone === "warning"
            ? "border-amber-500/40 bg-amber-500/5"
            : "border-border bg-card"
  return (
    <div className={`rounded-md border p-4 ${toneClass}`}>
      <div className="text-xs text-muted-foreground uppercase tracking-wide">{label}</div>
      <div className="text-2xl font-bold mt-1 tabular-nums">{value}</div>
      {sub ? <div className="text-xs text-muted-foreground mt-1">{sub}</div> : null}
    </div>
  )
}

function fmtUsd(n: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n)
}

function fmtPct(n: number): string {
  return `${n.toFixed(1)}%`
}
