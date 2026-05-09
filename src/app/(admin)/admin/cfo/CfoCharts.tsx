"use client"

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

interface RevMonth {
  month: string
  revenueUsd: number
  refundsUsd: number
  netUsd: number
  payingUsers: number
}

interface PlanRow {
  planSlug: string
  userCount: number
  mrrUsd: number
}

const COLORS = ["#C4972A", "#8B6F2A", "#6B4F1F", "#4F3915", "#3D2A0F"]

export default function CfoCharts({
  revenue,
  planMix,
}: {
  revenue: RevMonth[]
  planMix: PlanRow[]
}) {
  return (
    <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="lg:col-span-2 rounded-md border border-border bg-card p-4">
        <h3 className="text-sm font-semibold mb-3">Revenue (12 months)</h3>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart
            data={revenue}
            margin={{ top: 8, right: 8, left: -12, bottom: 0 }}
          >
            <defs>
              <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#C4972A" stopOpacity={0.5} />
                <stop offset="95%" stopColor="#C4972A" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#23272f" />
            <XAxis dataKey="month" stroke="#9b9b9b" fontSize={10} />
            <YAxis stroke="#9b9b9b" fontSize={10} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
            <Tooltip
              formatter={(v: number) => `$${v.toLocaleString()}`}
              contentStyle={{ background: "#141923", border: "1px solid #2a2f38" }}
            />
            <Area
              type="monotone"
              dataKey="revenueUsd"
              stroke="#C4972A"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#revFill)"
              name="Revenue"
            />
            <Line
              type="monotone"
              dataKey="netUsd"
              stroke="#10b981"
              strokeWidth={1.5}
              dot={false}
              name="Net of refunds"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="rounded-md border border-border bg-card p-4">
        <h3 className="text-sm font-semibold mb-3">MRR by plan</h3>
        <ResponsiveContainer width="100%" height={280}>
          <PieChart>
            <Pie
              data={planMix.filter((p) => p.mrrUsd > 0)}
              dataKey="mrrUsd"
              nameKey="planSlug"
              outerRadius={90}
              label={(entry: { planSlug?: string }) => entry.planSlug ?? ""}
              labelLine={false}
            >
              {planMix.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(v: number) => `$${v.toLocaleString()}`}
              contentStyle={{ background: "#141923", border: "1px solid #2a2f38" }}
            />
            <Legend wrapperStyle={{ fontSize: 11 }} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="lg:col-span-3 rounded-md border border-border bg-card p-4">
        <h3 className="text-sm font-semibold mb-3">Paying users (month)</h3>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart
            data={revenue}
            margin={{ top: 8, right: 8, left: -12, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#23272f" />
            <XAxis dataKey="month" stroke="#9b9b9b" fontSize={10} />
            <YAxis stroke="#9b9b9b" fontSize={10} />
            <Tooltip contentStyle={{ background: "#141923", border: "1px solid #2a2f38" }} />
            <Bar dataKey="payingUsers" fill="#C4972A" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  )
}
