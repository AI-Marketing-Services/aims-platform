"use client"

import Link from "next/link"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import { useState } from "react"
import {
  LayoutDashboard, Users, Megaphone, MessageSquare, GitBranch,
  BarChart2, Settings, TrendingUp, Bell, Search, ChevronDown, X,
  CreditCard, ArrowRight,
} from "lucide-react"

// ─── Data ────────────────────────────────────────────────────────────────────

const RECENT_LEADS = [
  { initials: "SC", color: "#DC2626", name: "Sarah Chen", company: "Acme Corp", status: "hot" },
  { initials: "MW", color: "#991B1B", name: "Marcus Webb", company: "TechFlow Inc", status: "warm" },
  { initials: "DR", color: "#7F1D1D", name: "Diana Ross", company: "Velocity Partners", status: "warm" },
  { initials: "JL", color: "#b91c1c", name: "James Liu", company: "Growth Labs", status: "new" },
]

const HOT_DEALS = [
  { company: "Acme Corp", value: "$120K", status: "Closing" },
  { company: "Growth Labs", value: "$450K", status: "Closing" },
  { company: "TechFlow Inc", value: "$85K", status: "Proposal" },
]

const REVENUE_SOURCES = [
  { label: "LinkedIn", value: "$1.2M", pct: 100 },
  { label: "Email", value: "$950K", pct: 79 },
  { label: "Partner", value: "$450K", pct: 38 },
]

const NOTIFICATIONS = [
  { icon: Users, text: "New high-value lead", time: "4 hours ago", unread: true },
  { icon: Megaphone, text: "Campaign 'Alpha' started", time: "3 hours ago", unread: true },
  { icon: Bell, text: "Meeting booked: Acme Corp", time: "3 hours ago", unread: false },
  { icon: CreditCard, text: "Invoice paid: $12,000", time: "Yesterday", unread: false },
]

const CAMPAIGNS = [
  { name: "Alpha Outbound", status: "live", leads: 124, meetings: 14 },
  { name: "Re-engagement Q1", status: "live", leads: 89, meetings: 8 },
  { name: "AI Voice Follow-up", status: "paused", leads: 56, meetings: 5 },
]

const PIPELINE_STAGES = [
  { label: "New Lead", count: 142, pct: 100 },
  { label: "Qualified", count: 89, pct: 63 },
  { label: "Demo Booked", count: 54, pct: 38 },
  { label: "Proposal", count: 31, pct: 22 },
  { label: "Closed Won", count: 18, pct: 13 },
]

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: "Dashboard", id: "dashboard" },
  { icon: Users, label: "Leads", id: "leads" },
  { icon: Megaphone, label: "Campaigns", id: "campaigns" },
  { icon: GitBranch, label: "Pipeline", id: "pipeline" },
  { icon: Bell, label: "Notifications", id: "notifications" },
  { icon: BarChart2, label: "Reports", id: "reports" },
  { icon: Settings, label: "Settings", id: "settings" },
]

// ─── Sub-components ───────────────────────────────────────────────────────────

function DonutChart({ pct, value }: { pct: number; value: string }) {
  const r = 30
  const circ = 2 * Math.PI * r
  const dash = (pct / 100) * circ
  return (
    <div className="relative flex items-center justify-center w-[72px] h-[72px]">
      <svg width="72" height="72" viewBox="0 0 72 72" className="-rotate-90">
        <circle cx="36" cy="36" r={r} fill="none" stroke="#f3f4f6" strokeWidth="8" />
        <motion.circle
          cx="36" cy="36" r={r} fill="none" stroke="#DC2626" strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`}
          initial={{ strokeDasharray: `0 ${circ}` }}
          animate={{ strokeDasharray: `${dash} ${circ}` }}
          transition={{ duration: 1.2, delay: 0.8, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute flex flex-col items-center leading-none">
        <span className="text-[11px] font-bold text-gray-800">{value}</span>
        <span className="text-[9px] text-gray-400 mt-0.5">{pct}%</span>
      </div>
    </div>
  )
}

function DashboardView() {
  const [showBreakdown, setShowBreakdown] = useState(false)
  return (
    <div className="flex-1 min-w-0 bg-gray-50/40">
      {/* Metric row */}
      <div className="grid grid-cols-4 border-b border-gray-100">
        <div className="bg-white px-4 py-3 border-r border-gray-100">
          <p className="text-[9px] font-semibold uppercase tracking-wide text-gray-400">New Leads</p>
          <motion.p className="mt-0.5 text-xl font-extrabold text-gray-900" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>847</motion.p>
          <p className="flex items-center gap-1 text-[9px] text-green-600 font-medium mt-0.5"><TrendingUp className="h-2 w-2" /> 23% vs last week</p>
          <p className="mt-1.5 text-[9px] text-[#DC2626] cursor-pointer hover:underline">Revenues report →</p>
        </div>
        <div className="bg-white px-4 py-3 border-r border-gray-100">
          <p className="text-[9px] font-semibold uppercase tracking-wide text-gray-400">Total Revenue</p>
          <p className="mt-0.5 text-xl font-extrabold text-gray-900">$4.5M</p>
          <p className="flex items-center gap-1 text-[9px] text-green-600 font-medium mt-0.5"><TrendingUp className="h-2 w-2" /> 32% vs last year</p>
          <p className="mt-1.5 text-[9px] text-[#DC2626] cursor-pointer hover:underline">All deals →</p>
        </div>
        <div className="bg-white px-4 py-3 border-r border-gray-100 flex flex-col items-center justify-center">
          <p className="w-full text-[9px] font-semibold uppercase tracking-wide text-gray-400 mb-1">Pipeline Value</p>
          <DonutChart pct={78} value="$312K" />
        </div>
        <div className="bg-white px-4 py-3">
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-[9px] font-semibold uppercase tracking-wide text-gray-400">Notifications</p>
            <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[#DC2626] text-[7px] font-bold text-white">6</span>
          </div>
          <div className="space-y-1.5">
            {NOTIFICATIONS.slice(0,3).map((n) => (
              <div key={n.text} className="flex items-start gap-1.5">
                <n.icon className="h-2.5 w-2.5 text-[#DC2626] mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-[9px] font-medium text-gray-700 leading-tight">{n.text}</p>
                  <p className="text-[8px] text-gray-400">{n.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Middle row */}
      <div className="grid grid-cols-2 border-b border-gray-100">
        {/* Recent Leads */}
        <div className="bg-white px-4 py-3 border-r border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[11px] font-semibold text-gray-700">Recent Leads</p>
            <span className="text-[9px] text-gray-400 border border-gray-200 rounded px-1 py-0.5 flex items-center gap-0.5">Sort by Newest <ChevronDown className="h-2 w-2" /></span>
          </div>
          <div className="space-y-2">
            {RECENT_LEADS.map((lead) => (
              <motion.div
                key={lead.name}
                className="flex items-center gap-2 cursor-pointer rounded-lg px-2 py-1 hover:bg-red-50 transition-colors"
                whileHover={{ x: 2 }}
              >
                <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-[9px] font-bold text-white" style={{ background: lead.color }}>
                  {lead.initials}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-semibold text-gray-800 leading-none truncate">{lead.name}</p>
                  <p className="text-[9px] text-gray-400">{lead.company}</p>
                </div>
                <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-medium ${lead.status === "hot" ? "bg-red-100 text-red-600" : lead.status === "warm" ? "bg-orange-100 text-orange-600" : "bg-gray-100 text-gray-500"}`}>
                  {lead.status}
                </span>
              </motion.div>
            ))}
          </div>
          <p className="mt-2 text-[9px] text-[#DC2626] cursor-pointer hover:underline">All customers →</p>
        </div>

        {/* Revenue Forecast */}
        <div className="relative bg-white px-4 py-3">
          <div className="flex items-center justify-between mb-1">
            <div>
              <p className="text-[11px] font-semibold text-gray-700">Revenue Forecast</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="flex items-center gap-1 text-[8px] text-gray-400"><span className="inline-block h-1.5 w-3 rounded-full bg-[#DC2626]" /> Closed Won</span>
                <span className="flex items-center gap-1 text-[8px] text-gray-400"><span className="inline-block w-3 border-t border-dashed border-gray-400" /> Projected</span>
              </div>
            </div>
            <span className="text-[9px] text-gray-400 border border-gray-200 rounded px-1 py-0.5 flex items-center gap-0.5">Last 6 months <ChevronDown className="h-2 w-2" /></span>
          </div>
          <svg viewBox="0 0 260 70" className="w-full" preserveAspectRatio="none">
            <defs>
              <linearGradient id="rg" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#DC2626" stopOpacity="0.18" />
                <stop offset="100%" stopColor="#DC2626" stopOpacity="0.01" />
              </linearGradient>
            </defs>
            <motion.path d="M0,62 C40,52 80,34 120,29 C160,24 200,32 235,22 L260,17 L260,70 L0,70 Z" fill="url(#rg)" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 }} />
            <motion.path d="M0,62 C40,52 80,34 120,29 C160,24 200,32 235,22 L260,17" fill="none" stroke="#DC2626" strokeWidth="1.5" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.9, duration: 1.2 }} />
            <motion.path d="M200,32 C220,24 240,15 260,10" fill="none" stroke="#9CA3AF" strokeWidth="1" strokeDasharray="3 3" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 1.6, duration: 0.6 }} />
            {["Q2","Q3","Q4","Q1-25","Q2-25"].map((l, i) => (
              <text key={l} x={i * 55 + 8} y="69" fontSize="6.5" fill="#9CA3AF">{l}</text>
            ))}
          </svg>
          <button
            onClick={() => setShowBreakdown(!showBreakdown)}
            className="mt-0.5 text-[9px] text-[#DC2626] hover:underline"
          >
            {showBreakdown ? "Hide breakdown" : "View revenue breakdown →"}
          </button>
          <AnimatePresence>
            {showBreakdown && (
              <motion.div
                initial={{ opacity: 0, scale: 0.92, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.92, y: 8 }}
                transition={{ duration: 0.18 }}
                className="absolute left-4 bottom-10 z-20 w-48 rounded-xl border border-gray-200 bg-white shadow-xl p-3"
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] font-semibold text-gray-700">Revenue Breakdown</p>
                  <button onClick={() => setShowBreakdown(false)}><X className="h-3 w-3 text-gray-400" /></button>
                </div>
                {[["#DC2626","Closed Won","$1.2M"],["#991B1B","Email","$950K"],["#FCA5A5","LinkedIn","$950K"],["#F87171","Partner","$450K"]].map(([c,l,v]) => (
                  <div key={l} className="flex items-center gap-1.5 mb-1">
                    <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ background: c }} />
                    <span className="text-[9px] text-gray-500 flex-1">{l}</span>
                    <span className="text-[9px] font-semibold text-gray-700">{v}</span>
                  </div>
                ))}
                <div className="mt-2 pt-2 border-t border-gray-100">
                  <div className="flex justify-between text-[8px] text-gray-400 mb-1">
                    <span>Company</span><span>Value</span><span>Status</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[9px] font-medium text-gray-700">Acme Corp</span>
                    <span className="text-[9px] text-gray-700">$120K</span>
                    <span className="text-[9px] font-semibold text-[#DC2626]">Closing</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-3">
        <div className="bg-white px-4 py-3 border-r border-gray-100">
          <p className="text-[9px] font-semibold uppercase tracking-wide text-gray-400">Active Campaigns</p>
          <p className="mt-0.5 text-2xl font-extrabold text-gray-900">12</p>
        </div>
        <div className="bg-white px-4 py-3 border-r border-gray-100">
          <p className="text-[10px] font-semibold text-gray-700 mb-2">Revenue by Source</p>
          <div className="space-y-1.5">
            {REVENUE_SOURCES.map((s, i) => (
              <div key={s.label} className="flex items-center gap-2">
                <span className="w-11 shrink-0 rounded text-center text-[8px] font-semibold bg-[#DC2626] text-white px-1 py-0.5">{s.label}</span>
                <div className="flex-1 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                  <motion.div className="h-full rounded-full bg-[#DC2626]" initial={{ width: 0 }} animate={{ width: `${s.pct}%` }} transition={{ duration: 0.8, delay: 1 + i * 0.1 }} />
                </div>
                <span className="w-9 shrink-0 text-right text-[9px] font-semibold text-gray-700">{s.value}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white px-4 py-3">
          <p className="text-[10px] font-semibold text-gray-700 mb-1.5">Hot Deals</p>
          <div className="flex justify-between text-[8px] text-gray-400 mb-1"><span>Company</span><span>Value</span><span>Status</span></div>
          {HOT_DEALS.map((d) => (
            <motion.div key={d.company} className="flex items-center justify-between py-0.5 cursor-pointer rounded hover:bg-red-50 px-1 transition-colors" whileHover={{ x: 1 }}>
              <span className="text-[10px] font-medium text-gray-700">{d.company}</span>
              <span className="text-[10px] font-bold text-gray-800">{d.value}</span>
              <span className="text-[9px] font-semibold text-[#DC2626]">· {d.status}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}

function LeadsView() {
  const [selected, setSelected] = useState<string | null>(null)
  return (
    <div className="flex-1 bg-white p-4">
      <p className="text-[11px] font-semibold text-gray-700 mb-3">All Leads</p>
      <div className="space-y-1">
        {RECENT_LEADS.concat([
          { initials: "KP", color: "#6B21A8", name: "Kevin Park", company: "CloudBase", status: "new" },
          { initials: "AL", color: "#0369A1", name: "Amy Lin", company: "FinStack", status: "warm" },
        ]).map((lead) => (
          <motion.div
            key={lead.name}
            onClick={() => setSelected(selected === lead.name ? null : lead.name)}
            className={`flex items-center gap-3 rounded-xl px-3 py-2 cursor-pointer transition-all ${selected === lead.name ? "bg-red-50 border border-red-200" : "hover:bg-gray-50 border border-transparent"}`}
            whileHover={{ x: 2 }}
          >
            <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white" style={{ background: lead.color }}>
              {lead.initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-semibold text-gray-800">{lead.name}</p>
              <p className="text-[10px] text-gray-400">{lead.company}</p>
            </div>
            <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-medium ${lead.status === "hot" ? "bg-red-100 text-red-600" : lead.status === "warm" ? "bg-orange-100 text-orange-600" : "bg-gray-100 text-gray-500"}`}>
              {lead.status}
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

function CampaignsView() {
  const [active, setActive] = useState("Alpha Outbound")
  return (
    <div className="flex-1 bg-white p-4">
      <p className="text-[11px] font-semibold text-gray-700 mb-3">Active Campaigns</p>
      <div className="space-y-2">
        {CAMPAIGNS.map((c) => (
          <motion.div
            key={c.name}
            onClick={() => setActive(c.name)}
            className={`rounded-xl border px-3 py-2.5 cursor-pointer transition-all ${active === c.name ? "border-[#DC2626] bg-red-50" : "border-gray-100 hover:border-gray-200"}`}
            whileHover={{ scale: 1.01 }}
          >
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-[11px] font-semibold text-gray-800">{c.name}</p>
              <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-semibold ${c.status === "live" ? "bg-green-100 text-green-600" : "bg-yellow-100 text-yellow-600"}`}>
                {c.status}
              </span>
            </div>
            <div className="flex gap-4">
              <div><p className="text-[9px] text-gray-400">Leads</p><p className="text-[12px] font-bold text-gray-800">{c.leads}</p></div>
              <div><p className="text-[9px] text-gray-400">Meetings</p><p className="text-[12px] font-bold text-[#DC2626]">{c.meetings}</p></div>
              <div className="flex-1">
                <p className="text-[9px] text-gray-400 mb-1">Conv. rate</p>
                <div className="h-1.5 rounded-full bg-gray-100">
                  <motion.div className="h-full rounded-full bg-[#DC2626]" initial={{ width: 0 }} animate={{ width: `${Math.round(c.meetings / c.leads * 100)}%` }} transition={{ duration: 0.8 }} />
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

function PipelineView() {
  return (
    <div className="flex-1 bg-white p-4">
      <p className="text-[11px] font-semibold text-gray-700 mb-3">Pipeline Stages</p>
      <div className="space-y-2.5">
        {PIPELINE_STAGES.map((s, i) => (
          <div key={s.label} className="flex items-center gap-3">
            <span className="w-20 shrink-0 text-[10px] text-gray-500">{s.label}</span>
            <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-[#DC2626]"
                initial={{ width: 0 }}
                animate={{ width: `${s.pct}%` }}
                transition={{ duration: 0.8, delay: 0.4 + i * 0.1 }}
                style={{ opacity: 1 - i * 0.15 }}
              />
            </div>
            <span className="w-8 shrink-0 text-right text-[10px] font-bold text-gray-700">{s.count}</span>
          </div>
        ))}
      </div>
      <div className="mt-4 rounded-xl bg-gray-50 px-4 py-3 flex items-center justify-between">
        <span className="text-[10px] text-gray-500">Total Pipeline Value</span>
        <span className="text-sm font-bold text-gray-900">$284,000</span>
      </div>
    </div>
  )
}

function NotificationsView() {
  const [read, setRead] = useState<string[]>([])
  return (
    <div className="flex-1 bg-white p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[11px] font-semibold text-gray-700">Notifications</p>
        <button onClick={() => setRead(NOTIFICATIONS.map(n => n.text))} className="text-[9px] text-[#DC2626] hover:underline">Mark all read</button>
      </div>
      <div className="space-y-2">
        {NOTIFICATIONS.map((n) => (
          <motion.div
            key={n.text}
            onClick={() => setRead(r => [...r, n.text])}
            className={`flex items-start gap-2.5 rounded-xl px-3 py-2.5 cursor-pointer transition-colors ${!read.includes(n.text) && n.unread ? "bg-red-50 border border-red-100" : "hover:bg-gray-50 border border-transparent"}`}
            whileHover={{ x: 2 }}
          >
            {!read.includes(n.text) && n.unread && <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-[#DC2626] flex-shrink-0" />}
            <n.icon className="h-3.5 w-3.5 text-[#DC2626] mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-[10px] font-medium text-gray-700">{n.text}</p>
              <p className="text-[9px] text-gray-400">{n.time}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

function ReportsView() {
  return (
    <div className="flex-1 bg-white p-4">
      <p className="text-[11px] font-semibold text-gray-700 mb-3">Revenue Report</p>
      <svg viewBox="0 0 280 90" className="w-full mb-3" preserveAspectRatio="none">
        <defs>
          <linearGradient id="rg2" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#DC2626" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#DC2626" stopOpacity="0" />
          </linearGradient>
        </defs>
        <motion.path d="M0,75 C30,65 60,50 90,42 C120,34 150,38 180,28 C210,20 240,15 280,10 L280,90 L0,90 Z" fill="url(#rg2)" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} />
        <motion.path d="M0,75 C30,65 60,50 90,42 C120,34 150,38 180,28 C210,20 240,15 280,10" fill="none" stroke="#DC2626" strokeWidth="2" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.4, duration: 1.2 }} />
        {["Jan","Feb","Mar","Apr","May","Jun"].map((m, i) => (
          <text key={m} x={i * 50 + 10} y="89" fontSize="7" fill="#9CA3AF">{m}</text>
        ))}
      </svg>
      <div className="grid grid-cols-3 gap-2">
        {[["MRR","$12,450","↑ 8%"],["Deals Closed","23","↑ 3"],["Avg Deal","$541","↑ 12%"]].map(([l,v,d]) => (
          <div key={l} className="rounded-lg bg-gray-50 px-3 py-2 text-center">
            <p className="text-[9px] text-gray-400">{l}</p>
            <p className="text-[13px] font-bold text-gray-800">{v}</p>
            <p className="text-[9px] text-green-600 font-medium">{d}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function SettingsView() {
  const [notifications, setNotifications] = useState(true)
  const [digest, setDigest] = useState(true)
  return (
    <div className="flex-1 bg-white p-4">
      <p className="text-[11px] font-semibold text-gray-700 mb-3">Settings</p>
      <div className="space-y-3">
        {[
          { label: "Email Notifications", sub: "Get alerts for new leads", state: notifications, set: setNotifications },
          { label: "Daily Digest", sub: "Morning summary at 8am", state: digest, set: setDigest },
        ].map((item) => (
          <div key={item.label} className="flex items-center justify-between rounded-xl border border-gray-100 px-3 py-2.5">
            <div>
              <p className="text-[10px] font-semibold text-gray-700">{item.label}</p>
              <p className="text-[9px] text-gray-400">{item.sub}</p>
            </div>
            <button
              onClick={() => item.set(!item.state)}
              className={`relative h-4 w-7 rounded-full transition-colors ${item.state ? "bg-[#DC2626]" : "bg-gray-200"}`}
            >
              <motion.div
                className="absolute top-0.5 h-3 w-3 rounded-full bg-white shadow"
                animate={{ left: item.state ? "calc(100% - 14px)" : "2px" }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            </button>
          </div>
        ))}
        <div className="rounded-xl border border-gray-100 px-3 py-2.5">
          <p className="text-[10px] font-semibold text-gray-700 mb-1.5">Team Members</p>
          <div className="flex -space-x-2">
            {["#DC2626","#991B1B","#7F1D1D","#b91c1c"].map((c, i) => (
              <div key={i} className="h-6 w-6 rounded-full border-2 border-white flex items-center justify-center text-[8px] font-bold text-white" style={{ background: c }}>
                {["A","B","C","D"][i]}
              </div>
            ))}
            <div className="h-6 w-6 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center text-[8px] text-gray-400">+3</div>
          </div>
        </div>
      </div>
    </div>
  )
}

const VIEW_MAP: Record<string, React.FC> = {
  dashboard: DashboardView,
  leads: LeadsView,
  campaigns: CampaignsView,
  pipeline: PipelineView,
  notifications: NotificationsView,
  reports: ReportsView,
  settings: SettingsView,
}

// ─── Floating logo animation ──────────────────────────────────────────────────

const FLOAT_LOGOS = [
  { src: "/integrations/hubspot-svgrepo-com.svg", label: "HubSpot", style: { top: "9%", left: "5%" }, delay: 0 },
  { src: "/integrations/notion.svg", label: "Notion", style: { top: "9%", right: "5%" }, delay: 0.1 },
  { src: "/integrations/instantly.webp", label: "Instantly", style: { top: "52%", left: "4%" }, delay: 0.2 },
  { src: "/integrations/slack.png", label: "Slack", style: { top: "52%", right: "4%" }, delay: 0.3 },
]

// ─── Hero ─────────────────────────────────────────────────────────────────────

export function Hero() {
  const [activeView, setActiveView] = useState("dashboard")
  const ActiveView = VIEW_MAP[activeView] || DashboardView

  return (
    <section className="relative overflow-hidden bg-[#F5F5F5] pt-24 pb-16 md:pt-32 md:pb-24">

      {/* Floating tool logos — fixed to section corners */}
      {FLOAT_LOGOS.map((logo) => (
        <motion.div
          key={logo.label}
          className="absolute z-10 hidden lg:flex h-[72px] w-[72px] items-center justify-center rounded-2xl bg-white shadow-lg shadow-gray-200/60 border border-gray-100"
          style={logo.style as React.CSSProperties}
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{
            opacity: 1,
            scale: 1,
            y: [0, -8, 0],
          }}
          transition={{
            opacity: { delay: logo.delay + 0.4, duration: 0.4 },
            scale: { delay: logo.delay + 0.4, duration: 0.4 },
            y: { delay: logo.delay + 1, duration: 3 + logo.delay, repeat: Infinity, ease: "easeInOut" },
          }}
        >
          <Image src={logo.src} alt={logo.label} width={42} height={42} className="object-contain" />
        </motion.div>
      ))}

      <div className="mx-auto max-w-5xl px-4">
        <div className="flex flex-col items-center text-center">

          {/* Trust badge */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mb-7">
            <span className="inline-flex items-center gap-2.5 rounded-full border border-red-200 bg-white px-4 py-1.5 text-sm font-medium text-gray-700 shadow-sm">
              <span className="flex -space-x-1.5">
                {["#DC2626","#991B1B","#7F1D1D"].map((c, i) => (
                  <span key={i} className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-white text-[8px] font-bold text-white" style={{ background: c }}>{["A","B","C"][i]}</span>
                ))}
              </span>
              Trusted by 1M+ users
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, delay: 0.1 }}
            className="max-w-3xl text-[2.75rem] font-extrabold leading-[1.1] tracking-tight text-gray-900 sm:text-5xl md:text-[3.6rem]"
          >
            Your &quot;Always On&quot;<br />
            <span style={{ WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundImage:"linear-gradient(135deg,#DC2626 0%,#7F1D1D 100%)", backgroundClip:"text" }}>
              AI-Powered Lead
            </span>
            <br />Generation Partner
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}
            className="mx-auto mt-5 max-w-xl text-lg text-gray-500 leading-relaxed"
          >
            We build and run outbound campaigns, AI calling systems, and lead reactivation programs that fill your pipeline.{" "}
            <strong className="text-gray-700">More qualified meetings. Less wasted ad spend.</strong>
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-8 flex flex-col items-center gap-2 sm:flex-row"
          >
            <Link href="/get-started" className="inline-flex items-center gap-2 bg-[#DC2626] px-8 py-3.5 text-xs font-bold uppercase tracking-widest text-white shadow-md shadow-red-200 transition hover:bg-[#B91C1C] hover:shadow-lg">
              Book a Strategy Call
              <ArrowRight className="h-4 w-4" />
            </Link>
          </motion.div>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="mt-3 flex items-center gap-1.5 text-xs text-gray-400">
            <CreditCard className="h-3.5 w-3.5" /> No credit card required
          </motion.p>

          {/* Interactive Dashboard */}
          <motion.div
            initial={{ opacity: 0, y: 56 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.45 }}
            className="mt-14 w-full max-w-4xl"
          >
            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl shadow-gray-300/40">
              <div className="flex" style={{ height: "360px" }}>

                {/* Sidebar */}
                <div className="w-40 flex-shrink-0 border-r border-gray-100 bg-white flex flex-col">
                  <div className="flex items-center gap-2 px-3 py-3.5 border-b border-gray-100">
                    <Image src="/logo.png" alt="AIMS" width={22} height={22} className="object-contain" />
                    <span className="text-sm font-bold text-gray-800">AIMS</span>
                  </div>
                  <div className="px-2.5 py-2">
                    <div className="flex items-center gap-1.5 rounded-lg bg-gray-50 px-2 py-1.5">
                      <Search className="h-3 w-3 text-gray-400" />
                      <span className="text-[10px] text-gray-400">Search</span>
                    </div>
                  </div>
                  <nav className="flex-1 px-2 space-y-0.5 overflow-hidden">
                    {NAV_ITEMS.map((item) => (
                      <motion.button
                        key={item.id}
                        onClick={() => setActiveView(item.id)}
                        className={`w-full flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-[11px] font-medium transition-colors cursor-pointer ${
                          activeView === item.id ? "bg-red-50 text-[#DC2626]" : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                        }`}
                        whileHover={{ x: 2 }}
                        whileTap={{ scale: 0.97 }}
                      >
                        <item.icon className="h-3 w-3 flex-shrink-0" />
                        {item.label}
                      </motion.button>
                    ))}
                  </nav>
                  <div className="border-t border-gray-100 px-3 py-2.5">
                    <div className="flex items-center gap-1.5">
                      <div className="h-6 w-6 rounded-full bg-[#DC2626] flex items-center justify-center text-[9px] font-bold text-white">GX</div>
                      <div>
                        <p className="text-[10px] font-semibold text-gray-700 leading-none">Gustavo Xavier</p>
                        <p className="text-[9px] text-gray-400">ADMIN</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Content panel */}
                <div className="flex-1 min-w-0 overflow-hidden">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeView}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ duration: 0.2 }}
                      className="h-full"
                    >
                      <ActiveView />
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>
            </div>

            {/* Hint */}
            <p className="mt-3 text-xs text-gray-400 text-center">
              Click the sidebar tabs to explore ↑
            </p>
          </motion.div>

          {/* "Trusted by" label — LogoTicker picks up below */}
          <motion.p
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}
            className="mt-14 text-sm font-semibold text-gray-400 uppercase tracking-widest"
          >
            Trusted by sales teams at
          </motion.p>
        </div>
      </div>
    </section>
  )
}
