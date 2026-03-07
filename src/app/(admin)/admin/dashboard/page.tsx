"use client"

import Link from "next/link"
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { ArrowRight, ArrowUpRight, TrendingUp, Users, DollarSign, Activity, Zap, AlertTriangle } from "lucide-react"
import { LiveActivityFeed } from "@/components/admin/LiveActivityFeed"
import { NotificationBell } from "@/components/shared/NotificationBell"
import { useEffect, useState } from "react"

// --- Static demo data (replaced with real DB queries once live) ---

const STATS = [
  { label: "New Leads", value: "847", change: "+12%", icon: Users, sub: "this month" },
  { label: "Total Revenue", value: "$4.5M", change: "+18%", icon: DollarSign, sub: "lifetime" },
  { label: "Active Clients", value: "34", change: "+3", icon: Activity, sub: "this month" },
  { label: "Open Deals", value: "18", change: "+5", icon: TrendingUp, sub: "in pipeline" },
]

const REVENUE_FORECAST = [
  { month: "Oct", revenue: 38000, forecast: 36000 },
  { month: "Nov", revenue: 41000, forecast: 40000 },
  { month: "Dec", revenue: 39000, forecast: 42000 },
  { month: "Jan", revenue: 47000, forecast: 45000 },
  { month: "Feb", revenue: 52000, forecast: 50000 },
  { month: "Mar", revenue: 61000, forecast: 58000 },
]

const REVENUE_BY_SOURCE = [
  { source: "Cold Outbound", value: 42 },
  { source: "Referrals", value: 28 },
  { source: "Inbound / SEO", value: 15 },
  { source: "LinkedIn", value: 10 },
  { source: "Paid Ads", value: 5 },
]

const PIPELINE_DONUT = [
  { name: "Qualified", value: 35, color: "#DC2626" },
  { name: "Demo Booked", value: 25, color: "#B91C1C" },
  { name: "Proposal Sent", value: 20, color: "#991B1B" },
  { name: "Negotiation", value: 12, color: "#7F1D1D" },
  { name: "New Lead", value: 8, color: "#FCA5A5" },
]

const RECENT_LEADS = [
  { name: "Marcus T.", company: "Vendingpreneurs Inc.", stage: "Demo Booked", value: 2970, status: "hot" },
  { name: "Sarah K.", company: "AutoMax Dealerships", stage: "Proposal Sent", value: 1200, status: "warm" },
  { name: "David R.", company: "Southwest Healthcare", stage: "Negotiation", value: 4500, status: "hot" },
  { name: "Ivan P.", company: "TechForce Staffing", stage: "Qualified", value: 800, status: "warm" },
  { name: "Alicia M.", company: "FreshRoute Logistics", stage: "New Lead", value: 600, status: "new" },
]

const HOT_DEALS = [
  { company: "Southwest Healthcare", mrr: 4500, stage: "Negotiation", days: 3, owner: "Adam" },
  { company: "Vendingpreneurs Inc.", mrr: 2970, stage: "Demo Booked", days: 1, owner: "Adam" },
  { company: "AutoMax Dealerships", mrr: 1200, stage: "Proposal Sent", days: 7, owner: "Marco" },
]

const FUNNEL_STEPS = [
  { label: "Site Visitors", value: "4,820", pct: 100 },
  { label: "Lead Magnets", value: "284", pct: 59 },
  { label: "Chatbot Leads", value: "127", pct: 27 },
  { label: "Strategy Calls", value: "48", pct: 10 },
  { label: "Clients", value: "11", pct: 2 },
]

const STATUS_DOT: Record<string, string> = {
  hot: "bg-[#DC2626]",
  warm: "bg-[#F87171]",
  new: "bg-gray-400",
}

function initials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase()
}

const AVATAR_COLORS = [
  "bg-red-100 text-red-700",
  "bg-rose-100 text-rose-700",
  "bg-pink-100 text-pink-700",
  "bg-orange-100 text-orange-700",
  "bg-amber-100 text-amber-700",
]

const MRR_CURRENT = 12450
const MRR_TARGET = 100000
const MRR_PCT = Math.round((MRR_CURRENT / MRR_TARGET) * 100)

function AnimatedMRR() {
  const [displayed, setDisplayed] = useState(0)

  useEffect(() => {
    const duration = 1200
    const steps = 40
    const increment = MRR_CURRENT / steps
    let current = 0
    const timer = setInterval(() => {
      current += increment
      if (current >= MRR_CURRENT) {
        setDisplayed(MRR_CURRENT)
        clearInterval(timer)
      } else {
        setDisplayed(Math.round(current))
      }
    }, duration / steps)
    return () => clearInterval(timer)
  }, [])

  return (
    <span className="text-5xl font-black font-mono text-foreground tabular-nums">
      ${displayed.toLocaleString()}
    </span>
  )
}

export default function AdminDashboard() {
  return (
    <div className="space-y-5 p-0">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Dashboard</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">AIMS operational overview</p>
        </div>
        <div className="flex items-center gap-3">
          <NotificationBell variant="light" />
          <Link
            href="/admin/crm"
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition"
          >
            View CRM <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      {/* MRR Hero */}
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Monthly Recurring Revenue</p>
            <AnimatedMRR />
            <div className="flex items-center gap-2 mt-2">
              <span className="rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-semibold text-[#DC2626]">+18% MoM</span>
              <span className="text-xs text-muted-foreground">Target: $100,000/mo</span>
            </div>
          </div>
          <div className="sm:w-64">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
              <span>${MRR_CURRENT.toLocaleString()} / $100k</span>
              <span className="font-semibold text-foreground">{MRR_PCT}%</span>
            </div>
            <div className="h-2.5 w-full rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-[#DC2626] transition-all duration-1000"
                style={{ width: `${MRR_PCT}%` }}
              />
            </div>
            <p className="mt-1.5 text-[11px] text-muted-foreground">
              ${(MRR_TARGET - MRR_CURRENT).toLocaleString()} to target · {Math.round((MRR_TARGET - MRR_CURRENT) / 1000)}k gap
            </p>
          </div>
        </div>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {STATS.map(({ label, value, change, icon: Icon, sub }) => (
          <div key={label} className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50">
                <Icon className="h-4 w-4 text-[#DC2626]" />
              </div>
            </div>
            <p className="text-2xl font-black font-mono text-foreground">{value}</p>
            <div className="mt-2 flex items-center gap-1.5">
              <span className="rounded-full bg-red-50 px-1.5 py-0.5 text-[10px] font-semibold text-[#DC2626]">{change}</span>
              <span className="text-[11px] text-muted-foreground">{sub}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Revenue Forecast */}
        <div className="lg:col-span-2 rounded-xl border border-border bg-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-foreground">Revenue Forecast</h2>
              <p className="text-xs text-muted-foreground">Actual vs. projected</p>
            </div>
            <span className="flex items-center gap-1 text-xs font-semibold text-[#DC2626]">
              <TrendingUp className="h-3.5 w-3.5" /> +18% MoM
            </span>
          </div>
          <ResponsiveContainer width="100%" height={190}>
            <AreaChart data={REVENUE_FORECAST} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#DC2626" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#DC2626" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 13% 91%)" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "hsl(220 9% 46%)" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "hsl(220 9% 46%)" }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} formatter={(v: number) => [`$${v.toLocaleString()}`, ""]} />
              <Area type="monotone" dataKey="forecast" stroke="#B91C1C" strokeWidth={1.5} strokeDasharray="4 3" fill="none" name="Forecast" />
              <Area type="monotone" dataKey="revenue" stroke="#DC2626" strokeWidth={2} fill="url(#revGrad)" name="Revenue" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Pipeline Donut */}
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="mb-3">
            <h2 className="text-sm font-semibold text-foreground">Pipeline Value</h2>
            <p className="text-xs text-muted-foreground">By deal stage</p>
          </div>
          <div className="flex justify-center">
            <ResponsiveContainer width={150} height={150}>
              <PieChart>
                <Pie data={PIPELINE_DONUT} cx="50%" cy="50%" innerRadius={45} outerRadius={68} paddingAngle={2} dataKey="value">
                  {PIPELINE_DONUT.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 11, borderRadius: 6 }} formatter={(v: number) => [`${v}%`, ""]} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <ul className="space-y-1.5">
            {PIPELINE_DONUT.map((item) => (
              <li key={item.name} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
                  {item.name}
                </span>
                <span className="font-semibold text-foreground">{item.value}%</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Conversion Funnel + Activity Feed */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Conversion Funnel */}
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="text-sm font-semibold text-foreground mb-4">Conversion Funnel</h2>
          <div className="space-y-2">
            {FUNNEL_STEPS.map((step, i) => (
              <div key={step.label}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-muted-foreground">{step.label}</span>
                  <span className="font-semibold text-foreground tabular-nums">{step.value}</span>
                </div>
                <div className="h-5 w-full rounded bg-muted overflow-hidden">
                  <div
                    className="h-full rounded flex items-center justify-end pr-2"
                    style={{
                      width: `${step.pct}%`,
                      backgroundColor: i === 0 ? "#FCA5A5" : i === 1 ? "#F87171" : i === 2 ? "#EF4444" : i === 3 ? "#DC2626" : "#991B1B",
                    }}
                  >
                    <span className="text-[9px] font-semibold text-white">{step.pct}%</span>
                  </div>
                </div>
                {i < FUNNEL_STEPS.length - 1 && (
                  <div className="flex justify-end pr-1 mt-0.5">
                    <span className="text-[9px] text-muted-foreground/50">
                      {Math.round((FUNNEL_STEPS[i + 1].pct / step.pct) * 100)}% convert
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-lg bg-muted px-3 py-2.5">
            <p className="text-[11px] text-muted-foreground">
              <span className="font-semibold text-foreground">2.3%</span> overall visitor → client rate
            </p>
          </div>
        </div>

        {/* Live Activity Feed */}
        <div className="lg:col-span-2">
          <LiveActivityFeed />
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Recent Leads */}
        <div className="lg:col-span-2 rounded-xl border border-border bg-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">Recent Leads</h2>
            <Link href="/admin/crm" className="flex items-center gap-1 text-xs font-medium text-[#DC2626] hover:underline">
              View all <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="space-y-3">
            {RECENT_LEADS.map((lead, i) => (
              <div key={lead.name} className="flex items-center gap-3">
                <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${AVATAR_COLORS[i % AVATAR_COLORS.length]}`}>
                  {initials(lead.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-medium text-foreground truncate">{lead.name}</span>
                    <span className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${STATUS_DOT[lead.status]}`} />
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{lead.company}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs font-semibold text-foreground font-mono">${lead.value.toLocaleString()}</p>
                  <p className="text-[10px] text-muted-foreground">{lead.stage}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Revenue by Source */}
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="mb-4">
            <h2 className="text-sm font-semibold text-foreground">Revenue by Source</h2>
          </div>
          <ResponsiveContainer width="100%" height={170}>
            <BarChart data={REVENUE_BY_SOURCE} layout="vertical" margin={{ top: 0, right: 8, left: 0, bottom: 0 }}>
              <XAxis type="number" tick={{ fontSize: 10, fill: "hsl(220 9% 46%)" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
              <YAxis type="category" dataKey="source" tick={{ fontSize: 10, fill: "hsl(220 9% 46%)" }} axisLine={false} tickLine={false} width={80} />
              <Tooltip contentStyle={{ fontSize: 11, borderRadius: 6 }} formatter={(v: number) => [`${v}%`, "Share"]} />
              <Bar dataKey="value" fill="#DC2626" radius={[0, 4, 4, 0]} maxBarSize={14} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Hot Deals */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-foreground">Hot Deals</h2>
            <AlertTriangle className="h-3.5 w-3.5 text-[#DC2626]" />
          </div>
          <Link href="/admin/crm" className="flex items-center gap-1 text-xs font-medium text-[#DC2626] hover:underline">
            Full pipeline <ArrowUpRight className="h-3 w-3" />
          </Link>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="px-5 py-2.5 text-left text-xs font-semibold text-muted-foreground">Company</th>
              <th className="px-5 py-2.5 text-left text-xs font-semibold text-muted-foreground">Stage</th>
              <th className="px-5 py-2.5 text-left text-xs font-semibold text-muted-foreground">MRR</th>
              <th className="px-5 py-2.5 text-left text-xs font-semibold text-muted-foreground">Days Open</th>
              <th className="px-5 py-2.5 text-left text-xs font-semibold text-muted-foreground">Owner</th>
            </tr>
          </thead>
          <tbody>
            {HOT_DEALS.map((deal) => (
              <tr key={deal.company} className="border-b border-border last:border-0 hover:bg-muted/20 transition">
                <td className="px-5 py-3.5 font-medium text-foreground">{deal.company}</td>
                <td className="px-5 py-3.5">
                  <span className="rounded-md bg-red-50 px-2 py-0.5 text-xs font-medium text-[#DC2626]">{deal.stage}</span>
                </td>
                <td className="px-5 py-3.5 font-mono text-sm font-semibold">${deal.mrr.toLocaleString()}</td>
                <td className="px-5 py-3.5 text-muted-foreground text-sm">{deal.days}d</td>
                <td className="px-5 py-3.5 text-muted-foreground">{deal.owner}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Simulate Purchase (Admin tool) */}
      <div className="rounded-xl border border-dashed border-border bg-muted/20 p-4">
        <div className="flex items-center gap-2 mb-1">
          <Zap className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Dev Tools</span>
        </div>
        <p className="text-xs text-muted-foreground">
          Test full onboarding flow:{" "}
          <Link href="/admin/simulate" className="text-[#DC2626] hover:underline">
            Simulate a client purchase →
          </Link>
        </p>
      </div>
    </div>
  )
}
