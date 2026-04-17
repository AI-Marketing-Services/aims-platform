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

// Crimson gradient — darkest to lightest, so the biggest-volume stage reads
// as the deepest brand colour and the rest step down consistently.
const FUNNEL_COLORS = [
  "#791515",
  "#981B1B",
  "#B31B1B",
  "#C42424",
  "#DB4545",
  "#E07373",
]

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
          contentStyle={{ fontSize: 12, borderRadius: 8, background: "#FFFFFF", border: "1px solid hsl(220 13% 20%)", color: "#1A1A1A" }}
          labelStyle={{ color: "#1A1A1A" }}
          formatter={(v: number) => [v, "Deals"]}
        />
        <Bar
          dataKey="count"
          radius={[0, 4, 4, 0]}
          maxBarSize={18}
          animationBegin={200}
          animationDuration={1200}
          animationEasing="ease-out"
        >
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

// Same crimson gradient — dark at top (biggest MRR), progressively lighter.
const SERVICE_COLORS = [
  "#791515",
  "#981B1B",
  "#B31B1B",
  "#C42424",
  "#DB4545",
  "#E07373",
  "#EA9999",
  "#F4B8B8",
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
          contentStyle={{ fontSize: 12, borderRadius: 8, background: "#FFFFFF", border: "1px solid hsl(220 13% 20%)", color: "#1A1A1A" }}
          labelStyle={{ color: "#1A1A1A" }}
          formatter={(v: number) => [`$${v.toLocaleString()}/mo`, "MRR"]}
        />
        <Bar
          dataKey="mrr"
          radius={[0, 4, 4, 0]}
          maxBarSize={18}
          animationBegin={400}
          animationDuration={1400}
          animationEasing="ease-out"
        >
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
