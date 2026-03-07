"use client"

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

const DATA = [
  { month: "Apr", mrr: 4200 },
  { month: "May", mrr: 5100 },
  { month: "Jun", mrr: 5800 },
  { month: "Jul", mrr: 6400 },
  { month: "Aug", mrr: 7200 },
  { month: "Sep", mrr: 7900 },
  { month: "Oct", mrr: 8600 },
  { month: "Nov", mrr: 9400 },
  { month: "Dec", mrr: 10100 },
  { month: "Jan", mrr: 10900 },
  { month: "Feb", mrr: 11600 },
  { month: "Mar", mrr: 12450 },
]

export function RevenueChart() {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={DATA} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="mrrGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#DC2626" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#DC2626" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
        <XAxis dataKey="month" tick={{ fill: "#6B7280", fontSize: 12 }} axisLine={false} tickLine={false} />
        <YAxis
          tick={{ fill: "#6B7280", fontSize: 12 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `$${(v / 1000).toFixed(0)}K`}
        />
        <Tooltip
          contentStyle={{ backgroundColor: "#151821", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px" }}
          labelStyle={{ color: "#9CA3AF", fontSize: 12 }}
          itemStyle={{ color: "#DC2626", fontWeight: 600 }}
          formatter={(v: number) => [`$${v.toLocaleString()}`, "MRR"]}
        />
        <Area
          type="monotone"
          dataKey="mrr"
          stroke="#DC2626"
          strokeWidth={2}
          fill="url(#mrrGrad)"
          dot={false}
          activeDot={{ r: 4, fill: "#DC2626" }}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
