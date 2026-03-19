"use client"

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts"

interface MrrPoint {
  month: string
  mrr: number
}

interface ServicePoint {
  slug: string
  name: string
  revenue: number
}

interface ChannelPoint {
  name: string
  value: number
}

interface Props {
  mrrOverTime: MrrPoint[]
  revenueByService: ServicePoint[]
  revenueByChannel: ChannelPoint[]
}

const PIE_COLORS = ["#C4972A", "#EF4444", "#F87171", "#E8C46A", "#FECACA", "rgba(196,151,42,0.15)"]

const tooltipStyle = {
  backgroundColor: "#ffffff",
  border: "1px solid #e5e7eb",
  borderRadius: "8px",
}
const labelStyle = { color: "#111827", fontSize: 12 }

export function RevenueCharts({ mrrOverTime, revenueByService, revenueByChannel }: Props) {
  const hasEnoughMrrData = mrrOverTime.length >= 3

  return (
    <div className="space-y-6">
      {/* ── MRR Over Time ──────────────────────────────────────────────────── */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h3 className="font-semibold text-foreground mb-1">MRR Over Time</h3>
        <p className="text-xs text-muted-foreground mb-5">Cumulative MRR from active subscriptions by signup month</p>

        {!hasEnoughMrrData ? (
          <div className="flex items-center justify-center h-48 text-muted-foreground text-sm border border-dashed border-border rounded-lg">
            More data needed for trend (need 3+ months)
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={mrrOverTime} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="mrrGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#7F1D1D" stopOpacity={0.6} />
                  <stop offset="95%" stopColor="#C4972A" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
              <XAxis
                dataKey="month"
                tick={{ fill: "#6B7280", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "#6B7280", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}K`}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                labelStyle={labelStyle}
                itemStyle={{ color: "#C4972A", fontWeight: 600 }}
                formatter={(v: number) => [`$${v.toLocaleString()}`, "MRR"]}
              />
              <Area
                type="monotone"
                dataKey="mrr"
                stroke="#C4972A"
                strokeWidth={2}
                fill="url(#mrrGrad)"
                dot={false}
                activeDot={{ r: 4, fill: "#C4972A" }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* ── Revenue by Service + Channel ──────────────────────────────────── */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Revenue by Service Arm */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="font-semibold text-foreground mb-1">Revenue by Service Arm</h3>
          <p className="text-xs text-muted-foreground mb-5">Active subscription MRR per service</p>

          {revenueByService.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-muted-foreground text-sm border border-dashed border-border rounded-lg">
              No active subscriptions yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                data={revenueByService}
                layout="vertical"
                margin={{ top: 0, right: 10, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" horizontal={false} />
                <XAxis
                  type="number"
                  tick={{ fill: "#6B7280", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}K`}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fill: "#9CA3AF", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  width={120}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  labelStyle={labelStyle}
                  itemStyle={{ color: "#C4972A", fontWeight: 600 }}
                  formatter={(v: number) => [`$${v.toLocaleString()}`, "MRR"]}
                />
                <Bar dataKey="revenue" fill="#C4972A" radius={[0, 4, 4, 0]} maxBarSize={24} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Revenue by Source Channel */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="font-semibold text-foreground mb-1">Active Clients by Channel</h3>
          <p className="text-xs text-muted-foreground mb-5">Source breakdown of ACTIVE_CLIENT deals</p>

          {revenueByChannel.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-muted-foreground text-sm border border-dashed border-border rounded-lg">
              No active client deals yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={revenueByChannel}
                  cx="50%"
                  cy="45%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {revenueByChannel.map((_entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={PIE_COLORS[index % PIE_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={tooltipStyle}
                  labelStyle={labelStyle}
                  formatter={(v: number, name: string) => [v, name]}
                />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: 11, color: "#9CA3AF" }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  )
}
