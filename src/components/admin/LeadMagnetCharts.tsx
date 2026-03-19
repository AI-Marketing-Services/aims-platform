"use client"

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  Cell,
} from "recharts"

const TYPE_SHORT: Record<string, string> = {
  AI_READINESS_QUIZ: "AI Quiz",
  ROI_CALCULATOR: "ROI Calc",
  WEBSITE_AUDIT: "Web Audit",
  SEGMENT_EXPLORER: "Segment",
  STACK_CONFIGURATOR: "Stack",
}

const TYPE_COLOR: Record<string, string> = {
  AI_READINESS_QUIZ: "#3B82F6",
  ROI_CALCULATOR: "#22C55E",
  WEBSITE_AUDIT: "#A855F7",
  SEGMENT_EXPLORER: "#F97316",
  STACK_CONFIGURATOR: "#EAB308",
}

export interface SubmissionsByTypeEntry {
  type: string
  count: number
}

export interface SubmissionOverTimeEntry {
  date: string
  count: number
}

export function SubmissionsByTypeChart({
  data,
}: {
  data: SubmissionsByTypeEntry[]
}) {
  const chartData = data.map((d) => ({
    name: TYPE_SHORT[d.type] ?? d.type,
    count: d.count,
    fill: TYPE_COLOR[d.type] ?? "#C4972A",
  }))

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart
        data={chartData}
        margin={{ top: 4, right: 16, left: 0, bottom: 0 }}
      >
        <XAxis
          dataKey="name"
          tick={{ fontSize: 11, fill: "hsl(220 9% 46%)" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          allowDecimals={false}
          tick={{ fontSize: 11, fill: "hsl(220 9% 46%)" }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          contentStyle={{
            fontSize: 12,
            borderRadius: 8,
            background: "#ffffff",
            border: "1px solid #e5e7eb",
            color: "#111827",
          }}
          formatter={(v: number) => [v, "Submissions"]}
        />
        <Bar dataKey="count" radius={[4, 4, 0, 0]}>
          {chartData.map((entry, i) => (
            <Cell key={i} fill={entry.fill} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

export function SubmissionsOverTimeChart({
  data,
}: {
  data: SubmissionOverTimeEntry[]
}) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart
        data={data}
        margin={{ top: 4, right: 16, left: 0, bottom: 0 }}
      >
        <defs>
          <linearGradient id="submissionGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#C4972A" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#C4972A" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="rgba(255,255,255,0.05)"
          vertical={false}
        />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 10, fill: "hsl(220 9% 46%)" }}
          axisLine={false}
          tickLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          allowDecimals={false}
          tick={{ fontSize: 10, fill: "hsl(220 9% 46%)" }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          contentStyle={{
            fontSize: 12,
            borderRadius: 8,
            background: "#ffffff",
            border: "1px solid #e5e7eb",
            color: "#111827",
          }}
          formatter={(v: number) => [v, "Submissions"]}
        />
        <Area
          type="monotone"
          dataKey="count"
          stroke="#C4972A"
          strokeWidth={2}
          fill="url(#submissionGradient)"
          dot={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}

export function VendorComparisonChart({
  data,
}: {
  data: { vendor: string; current: number; replacement: number }[]
}) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart
        data={data}
        margin={{ top: 4, right: 16, left: 0, bottom: 0 }}
      >
        <XAxis
          dataKey="vendor"
          tick={{ fontSize: 10, fill: "hsl(220 9% 46%)" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 10, fill: "hsl(220 9% 46%)" }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v: number) => `$${v}`}
        />
        <Tooltip
          contentStyle={{
            fontSize: 12,
            borderRadius: 8,
            background: "#ffffff",
            border: "1px solid #e5e7eb",
            color: "#111827",
          }}
          formatter={(v: number, name: string) => [
            `$${v.toLocaleString()}/mo`,
            name === "current" ? "Current Cost" : "After Replacement",
          ]}
        />
        <Bar dataKey="current" fill="#C4972A" radius={[4, 4, 0, 0]} maxBarSize={24} name="current" />
        <Bar dataKey="replacement" fill="#22C55E" radius={[4, 4, 0, 0]} maxBarSize={24} name="replacement" />
      </BarChart>
    </ResponsiveContainer>
  )
}
