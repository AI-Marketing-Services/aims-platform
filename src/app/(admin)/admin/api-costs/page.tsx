import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { getApiCostSummary } from "@/lib/db/queries"
import { Activity, DollarSign, Cpu, TrendingDown } from "lucide-react"

export const metadata = { title: "API Costs" }

function CostBar({ label, cost, total }: { label: string; cost: number; total: number }) {
  const pct = total > 0 ? Math.round((cost / total) * 100) : 0
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground capitalize">{label.replace(/_/g, " ").toLowerCase()}</span>
        <span className="text-foreground font-mono">${cost.toFixed(4)}</span>
      </div>
      <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
        <div
          className="h-full rounded-full bg-[#DC2626] transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

export default async function AdminApiCostsPage() {
  const { userId, sessionClaims } = await auth()
  if (!userId) redirect("/sign-in")
  const role = (sessionClaims?.metadata as { role?: string })?.role
  if (!role || !["ADMIN", "SUPER_ADMIN"].includes(role)) redirect("/portal/dashboard")

  const [costs30, costs7] = await Promise.all([
    getApiCostSummary(30),
    getApiCostSummary(7),
  ])

  const topProvider = costs30.byProvider.sort((a, b) => b.cost - a.cost)[0]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">API Cost Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">AI provider spend tracking — last 30 days</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          {
            label: "30-Day Total",
            value: `$${costs30.total.toFixed(2)}`,
            sub: "all providers",
            icon: DollarSign,
          },
          {
            label: "7-Day Total",
            value: `$${costs7.total.toFixed(2)}`,
            sub: "last week",
            icon: TrendingDown,
          },
          {
            label: "Total Calls",
            value: costs30.byProvider.reduce((s, p) => s + p.calls, 0).toLocaleString(),
            sub: "API requests",
            icon: Activity,
          },
          {
            label: "Top Provider",
            value: topProvider?.provider ?? "—",
            sub: topProvider ? `$${topProvider.cost.toFixed(2)}` : "no data",
            icon: Cpu,
          },
        ].map(({ label, value, sub, icon: Icon }) => (
          <div key={label} className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-muted-foreground">{label}</p>
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-muted">
                <Icon className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
            </div>
            <p className="text-xl font-bold text-foreground font-mono">{value}</p>
            <p className="text-xs text-muted-foreground mt-1">{sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* By Provider */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-sm font-semibold text-foreground mb-5">By Provider (30d)</h2>
          {costs30.byProvider.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No API calls logged yet</p>
          ) : (
            <div className="space-y-4">
              {costs30.byProvider
                .sort((a, b) => b.cost - a.cost)
                .map((p) => (
                  <div key={p.provider} className="space-y-2">
                    <CostBar label={p.provider} cost={p.cost} total={costs30.total} />
                    <p className="text-[11px] text-muted-foreground pl-0.5">{p.calls.toLocaleString()} calls</p>
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* By Service Arm */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-sm font-semibold text-foreground mb-5">By Service Arm (30d)</h2>
          {costs30.byServiceArm.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No service arm attribution yet</p>
          ) : (
            <div className="space-y-4">
              {costs30.byServiceArm
                .sort((a, b) => b.cost - a.cost)
                .map((s) => (
                  <div key={s.serviceArm} className="space-y-2">
                    <CostBar label={s.serviceArm ?? "Unattributed"} cost={s.cost} total={costs30.total} />
                    <p className="text-[11px] text-muted-foreground pl-0.5">{s.calls.toLocaleString()} calls</p>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>

      {/* Daily trend placeholder */}
      <div className="rounded-xl border border-border bg-card p-6">
        <h2 className="text-sm font-semibold text-foreground mb-3">Daily Spend Trend</h2>
        <div className="h-32 flex items-center justify-center">
          <p className="text-sm text-muted-foreground">Daily trend chart — connect analytics provider</p>
        </div>
      </div>
    </div>
  )
}
