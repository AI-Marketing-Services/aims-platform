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

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PipelineFunnelEntry {
  stage: string
  count: number
}

export interface RevenueByServiceEntry {
  name: string
  mrr: number
}

// ─── Pipeline Funnel Chart ─────────────────────────────────────────────────────

const FUNNEL_COLORS = ["#FCA5A5", "#F87171", "#EF4444", "#DC2626", "#B91C1C"]

export function PipelineFunnelChart({ data }: { data: PipelineFunnelEntry[] }) {
  return (
    <ResponsiveContainer width="100%" height={210}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 0, right: 16, left: 0, bottom: 0 }}
      >
        <XAxis
          type="number"
          allowDecimals={false}
          tick={{ fontSize: 11, fill: "hsl(220 9% 46%)" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          type="category"
          dataKey="stage"
          width={110}
          tick={{ fontSize: 11, fill: "hsl(220 9% 46%)" }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          contentStyle={{ fontSize: 12, borderRadius: 8 }}
          formatter={(v: number) => [v, "Deals"]}
        />
        <Bar dataKey="count" radius={[0, 4, 4, 0]} maxBarSize={18}>
          {data.map((_, i) => (
            <Cell
              key={i}
              fill={FUNNEL_COLORS[Math.min(i, FUNNEL_COLORS.length - 1)]}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

// ─── Revenue by Service Arm Chart ─────────────────────────────────────────────

const SERVICE_COLORS = [
  "#DC2626",
  "#B91C1C",
  "#991B1B",
  "#EF4444",
  "#F87171",
  "#FCA5A5",
]

export function RevenueByServiceChart({
  data,
}: {
  data: RevenueByServiceEntry[]
}) {
  return (
    <ResponsiveContainer width="100%" height={210}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 0, right: 16, left: 0, bottom: 0 }}
      >
        <XAxis
          type="number"
          tick={{ fontSize: 11, fill: "hsl(220 9% 46%)" }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`}
        />
        <YAxis
          type="category"
          dataKey="name"
          width={120}
          tick={{ fontSize: 11, fill: "hsl(220 9% 46%)" }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          contentStyle={{ fontSize: 12, borderRadius: 8 }}
          formatter={(v: number) => [`$${v.toLocaleString()}/mo`, "MRR"]}
        />
        <Bar dataKey="mrr" radius={[0, 4, 4, 0]} maxBarSize={18}>
          {data.map((_, i) => (
            <Cell
              key={i}
              fill={SERVICE_COLORS[Math.min(i, SERVICE_COLORS.length - 1)]}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
