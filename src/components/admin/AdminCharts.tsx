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

const FUNNEL_COLORS = ["#E8C46A", "#F87171", "#EF4444", "#C4972A", "#A17D22"]

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

const SERVICE_COLORS = [
  "#C4972A",
  "#A17D22",
  "#8B6914",
  "#EF4444",
  "#F87171",
  "#E8C46A",
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
