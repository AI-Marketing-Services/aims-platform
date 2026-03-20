"use client"

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts"
import { AlertTriangle, CheckCircle, DollarSign, TrendingDown, TrendingUp } from "lucide-react"

interface ProviderData {
  provider: string
  cost: number
  calls: number
}

interface ServiceArmData {
  serviceArm: string | null
  cost: number
  calls: number
}

interface ClientRow {
  clientName: string
  service: string
  revenue: number
  apiCost: number
  profit: number
  margin: number
}

interface AnomalyAlert {
  provider: string
  pct: number
}

interface Props {
  costs30: {
    total: number
    byProvider: ProviderData[]
    byServiceArm: ServiceArmData[]
  }
  trendPct: number | null
  clientRows: ClientRow[]
  anomalies: AnomalyAlert[]
  hasAnyData: boolean
}

function EmptyChart({ message }: { message: string }) {
  return (
    <div className="h-48 flex items-center justify-center">
      <p className="text-sm text-muted-foreground text-center max-w-xs">{message}</p>
    </div>
  )
}

const RED = "#C4972A"

export default function ApiCostsClient({
  costs30,
  trendPct,
  clientRows,
  anomalies,
  hasAnyData,
}: Props) {
  const providerChartData = costs30.byProvider
    .sort((a, b) => b.cost - a.cost)
    .map((p) => ({
      name: p.provider.charAt(0).toUpperCase() + p.provider.slice(1).toLowerCase(),
      cost: parseFloat(p.cost.toFixed(4)),
    }))

  const serviceArmChartData = costs30.byServiceArm
    .sort((a, b) => b.cost - a.cost)
    .map((s) => ({
      name: s.serviceArm
        ? s.serviceArm.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())
        : "Unattributed",
      cost: parseFloat(s.cost.toFixed(4)),
    }))

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">API Cost Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">AI provider spend tracking - last 30 days</p>
      </div>

      {/* Total spend hero card */}
      <div className="rounded-xl border border-border bg-card p-7">
        <p className="text-xs text-muted-foreground mb-2">Total Spend This Month</p>
        {hasAnyData ? (
          <div className="flex items-end gap-4 flex-wrap">
            <span className="text-4xl font-mono font-bold text-foreground">
              ${costs30.total.toFixed(2)}
            </span>
            {trendPct !== null && (
              <div className={`flex items-center gap-1.5 mb-1 ${trendPct > 0 ? "text-primary" : "text-green-400"}`}>
                {trendPct > 0 ? (
                  <TrendingUp className="w-4 h-4" />
                ) : (
                  <TrendingDown className="w-4 h-4" />
                )}
                <span className="text-sm font-medium">
                  {trendPct > 0 ? "up" : "down"} {Math.abs(trendPct)}% from last month
                </span>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-3 py-3">
            <DollarSign className="w-8 h-8 text-muted-foreground/40" />
            <p className="text-lg text-muted-foreground">No cost data yet</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Cost by provider */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-sm font-semibold text-foreground mb-5">Cost by Provider (30d)</h2>
          {providerChartData.length === 0 ? (
            <EmptyChart message="No cost data yet. API costs will appear as services process requests." />
          ) : (
            <ResponsiveContainer width="100%" height={Math.max(providerChartData.length * 44, 120)}>
              <BarChart
                data={providerChartData}
                layout="vertical"
                margin={{ top: 0, right: 16, bottom: 0, left: 0 }}
              >
                <XAxis type="number" tick={{ fontSize: 11, fill: "#6B7280" }} tickFormatter={(v) => `$${v}`} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: "#D1D5DB" }} width={80} />
                <Tooltip
                  formatter={(value: number) => [`$${value.toFixed(4)}`, "Cost"]}
                  contentStyle={{ background: "#ffffff", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 12 }}
                  labelStyle={{ color: "#111827" }}
                />
                <Bar dataKey="cost" radius={[0, 4, 4, 0]} fill={RED}>
                  {providerChartData.map((_, i) => (
                    <Cell key={i} fill={RED} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Cost by service arm */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-sm font-semibold text-foreground mb-5">Cost by Service Arm (30d)</h2>
          {serviceArmChartData.length === 0 ? (
            <EmptyChart message="No cost data yet. API costs will appear as services process requests." />
          ) : (
            <ResponsiveContainer width="100%" height={Math.max(serviceArmChartData.length * 44, 120)}>
              <BarChart
                data={serviceArmChartData}
                layout="vertical"
                margin={{ top: 0, right: 16, bottom: 0, left: 0 }}
              >
                <XAxis type="number" tick={{ fontSize: 11, fill: "#6B7280" }} tickFormatter={(v) => `$${v}`} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: "#D1D5DB" }} width={100} />
                <Tooltip
                  formatter={(value: number) => [`$${value.toFixed(4)}`, "Cost"]}
                  contentStyle={{ background: "#ffffff", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 12 }}
                  labelStyle={{ color: "#111827" }}
                />
                <Bar dataKey="cost" radius={[0, 4, 4, 0]} fill={RED}>
                  {serviceArmChartData.map((_, i) => (
                    <Cell key={i} fill={RED} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Cost per client table */}
      <div className="rounded-xl border border-border bg-card p-6">
        <h2 className="text-sm font-semibold text-foreground mb-5">Cost per Client (30d)</h2>
        {clientRows.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">No per-client cost data yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left text-xs text-muted-foreground font-medium pb-3 pr-4">Client</th>
                  <th className="text-left text-xs text-muted-foreground font-medium pb-3 pr-4">Service</th>
                  <th className="text-right text-xs text-muted-foreground font-medium pb-3 pr-4">Revenue/mo</th>
                  <th className="text-right text-xs text-muted-foreground font-medium pb-3 pr-4">API Cost/mo</th>
                  <th className="text-right text-xs text-muted-foreground font-medium pb-3 pr-4">Profit</th>
                  <th className="text-right text-xs text-muted-foreground font-medium pb-3">Margin</th>
                </tr>
              </thead>
              <tbody>
                {clientRows.map((row, i) => {
                  const isLosing = row.apiCost > row.revenue
                  return (
                    <tr
                      key={i}
                      className={`border-b border-border/50 last:border-0 ${isLosing ? "bg-primary/10" : ""}`}
                    >
                      <td className="py-3 pr-4 font-medium text-foreground">{row.clientName}</td>
                      <td className="py-3 pr-4 text-muted-foreground">{row.service}</td>
                      <td className="py-3 pr-4 text-right font-mono text-foreground">${row.revenue.toFixed(2)}</td>
                      <td className="py-3 pr-4 text-right font-mono text-foreground">${row.apiCost.toFixed(2)}</td>
                      <td className={`py-3 pr-4 text-right font-mono ${row.profit < 0 ? "text-primary" : "text-green-400"}`}>
                        ${row.profit.toFixed(2)}
                      </td>
                      <td className={`py-3 text-right font-mono font-semibold ${row.margin < 0 ? "text-primary" : row.margin < 20 ? "text-yellow-400" : "text-green-400"}`}>
                        {row.margin}%
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Alerts */}
      <div className="rounded-xl border border-border bg-card p-6">
        <h2 className="text-sm font-semibold text-foreground mb-4">Cost Anomaly Alerts</h2>
        {costs30.byProvider.length === 0 ? (
          <p className="text-sm text-muted-foreground">Cost monitoring will activate once API calls are logged.</p>
        ) : anomalies.length > 0 ? (
          <div className="space-y-3">
            {anomalies.map((a) => (
              <div
                key={a.provider}
                className="flex items-center gap-3 rounded-lg border border-primary/30 bg-primary/100/10 px-4 py-3"
              >
                <AlertTriangle className="w-4 h-4 text-primary flex-shrink-0" />
                <p className="text-sm text-red-400">
                  <span className="font-semibold">{a.provider}</span> costs up{" "}
                  <span className="font-mono font-bold">{a.pct}%</span> this week
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center gap-3 rounded-lg border border-green-500/20 bg-green-400/5 px-4 py-3">
            <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
            <p className="text-sm text-green-300">No cost anomalies detected</p>
          </div>
        )}
      </div>
    </div>
  )
}
