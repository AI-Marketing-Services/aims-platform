"use client"

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts"
import { Cpu, Clock, DollarSign, TrendingUp, Inbox } from "lucide-react"
import { motion } from "framer-motion"
import { cn, formatCurrency } from "@/lib/utils"
import type { CapacityMetrics } from "@/lib/ops-excellence/types"

interface CapacityChartProps {
  metrics: CapacityMetrics
}

const CHART_THEME = {
  grid: "rgba(255,255,255,0.05)",
  text: "#8B8B9E",
  tooltip: { bg: "#F5F5F5", border: "#2A3040", text: "#1A1A1A" },
}

function HealthDot({ score }: { score: number | null }) {
  if (score === null) {
    return <span className="inline-block h-2.5 w-2.5 rounded-full bg-muted-foreground/30" />
  }
  const color = score > 80 ? "bg-emerald-400" : score >= 50 ? "bg-yellow-400" : "bg-red-400"
  return <span className={cn("inline-block h-2.5 w-2.5 rounded-full", color)} />
}

interface ChartTooltipPayloadEntry {
  name: string
  value: number
  color: string
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: ChartTooltipPayloadEntry[]
  label?: string
}) {
  if (!active || !payload || payload.length === 0) return null

  return (
    <div
      className="rounded-lg px-3 py-2 text-xs shadow-lg border"
      style={{
        backgroundColor: CHART_THEME.tooltip.bg,
        borderColor: CHART_THEME.tooltip.border,
        color: CHART_THEME.tooltip.text,
      }}
    >
      <p className="font-medium mb-1">{label}</p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center gap-2">
          <span
            className="inline-block h-2 w-2 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-muted-foreground">{entry.name}:</span>
          <span className="font-mono font-medium">
            {entry.name === "Dollar Value"
              ? formatCurrency(entry.value)
              : `${entry.value}h`}
          </span>
        </div>
      ))}
    </div>
  )
}

export default function CapacityChart({ metrics }: CapacityChartProps) {
  const hasAutomations = metrics.automations.length > 0
  const showChart = metrics.automations.length >= 3

  const chartData = metrics.automations.map((a) => ({
    name: a.processName.length > 20 ? `${a.processName.slice(0, 20)}...` : a.processName,
    fullName: a.processName,
    hoursFreed: a.hoursFreedPerMonth ?? 0,
    dollarValue: a.dollarValueFreed ?? 0,
  }))

  const statCards = [
    {
      label: "Automations",
      value: String(metrics.totalAutomations),
      icon: Cpu,
      color: "text-emerald-400",
      bg: "bg-emerald-900/20",
    },
    {
      label: "Hours Freed / mo",
      value: `${metrics.totalHoursFreedPerMonth.toFixed(1)}h`,
      icon: Clock,
      color: "text-blue-400",
      bg: "bg-blue-900/20",
    },
    {
      label: "Value Freed / mo",
      value: formatCurrency(metrics.totalDollarValuePerMonth),
      icon: DollarSign,
      color: "text-[#981B1B]",
      bg: "bg-primary/10",
    },
    {
      label: "Conversion Rate",
      value: `${metrics.conversionRate.toFixed(0)}%`,
      icon: TrendingUp,
      color: "text-purple-400",
      bg: "bg-purple-900/20",
    },
  ]

  return (
    <motion.div
      className="rounded-2xl border border-border bg-card overflow-hidden"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Header */}
      <div className="px-6 py-4 border-b border-border">
        <h3 className="text-lg font-semibold text-foreground">
          Capacity ROI
        </h3>
        <p className="text-sm text-muted-foreground mt-0.5">
          Time and dollars freed through deployed automations
        </p>
      </div>

      {/* Summary stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-y lg:divide-y-0 divide-border">
        {statCards.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-surface rounded-xl p-4 m-3">
            <div className="flex items-center gap-2 mb-2">
              <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center", bg)}>
                <Icon className={cn("h-3.5 w-3.5", color)} />
              </div>
              <p className="text-xs text-muted-foreground">{label}</p>
            </div>
            <p className="text-xl font-bold font-mono text-foreground">{value}</p>
          </div>
        ))}
      </div>

      {hasAutomations ? (
        <>
          {/* Chart (only render if 3+ automations) */}
          {showChart && (
            <div className="px-6 py-4 border-t border-border">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} barGap={4}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke={CHART_THEME.grid}
                      vertical={false}
                    />
                    <XAxis
                      dataKey="name"
                      tick={{ fill: CHART_THEME.text, fontSize: 11 }}
                      axisLine={{ stroke: CHART_THEME.grid }}
                      tickLine={false}
                    />
                    <YAxis
                      yAxisId="hours"
                      tick={{ fill: CHART_THEME.text, fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                      width={40}
                    />
                    <YAxis
                      yAxisId="dollars"
                      orientation="right"
                      tick={{ fill: CHART_THEME.text, fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`}
                      width={50}
                    />
                    <Tooltip
                      content={<CustomTooltip />}
                      cursor={{ fill: "rgba(255,255,255,0.03)" }}
                    />
                    <Bar
                      yAxisId="hours"
                      dataKey="hoursFreed"
                      name="Hours Freed"
                      fill="#34D399"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={40}
                    />
                    <Bar
                      yAxisId="dollars"
                      dataKey="dollarValue"
                      name="Dollar Value"
                      fill="#981B1B"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={40}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Automation table */}
          <div className="border-t border-border">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-xs text-muted-foreground">
                    <th className="px-6 py-3 text-left font-medium">Process</th>
                    <th className="px-4 py-3 text-left font-medium">Department</th>
                    <th className="px-4 py-3 text-right font-medium">Hours / mo</th>
                    <th className="px-4 py-3 text-right font-medium">Value / mo</th>
                    <th className="px-4 py-3 text-center font-medium">Health</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {metrics.automations.map((a, idx) => (
                    <tr
                      key={a.id}
                      className={cn(
                        "transition-colors hover:bg-surface/50",
                        idx % 2 === 1 && "bg-surface/20"
                      )}
                    >
                      <td className="px-6 py-3 font-medium text-foreground">
                        {a.processName}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {a.department}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-foreground">
                        {a.hoursFreedPerMonth !== null
                          ? `${a.hoursFreedPerMonth.toFixed(1)}h`
                          : "--"}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-foreground">
                        {a.dollarValueFreed !== null
                          ? formatCurrency(a.dollarValueFreed)
                          : "--"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <HealthDot score={a.healthScore} />
                          {a.healthScore !== null && (
                            <span className="font-mono text-xs text-muted-foreground">
                              {a.healthScore}
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <div className="px-6 py-16 text-center border-t border-border">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-deep mx-auto mb-3">
            <Inbox className="h-5 w-5 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium text-muted-foreground">
            Automations will appear here once deployed during Phase 2
          </p>
        </div>
      )}
    </motion.div>
  )
}
