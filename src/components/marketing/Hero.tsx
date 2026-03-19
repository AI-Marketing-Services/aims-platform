"use client"

import Link from "next/link"
import Image from "next/image"
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform, useInView } from "framer-motion"
import { useState, useRef, useEffect, type ReactNode } from "react"
import {
  LayoutDashboard, Users, Megaphone, GitBranch,
  BarChart2, Settings, TrendingUp, Bell, Search, ChevronDown, X,
  CreditCard, ArrowRight, Phone, Mail, Plus, Pause, Play, Filter,
  CheckCircle2, AlertCircle, DollarSign,
} from "lucide-react"

// ─── Data ────────────────────────────────────────────────────────────────────

type LeadStatus = "hot" | "warm" | "new"

interface Lead {
  initials: string
  color: string
  name: string
  company: string
  status: LeadStatus
  score: number
  email: string
  phone: string
  lastContacted: string
  notes: string
}

const RECENT_LEADS: Lead[] = [
  { initials: "SC", color: "#C4972A", name: "Sarah Chen", company: "Acme Corp", status: "hot", score: 92, email: "sarah@acmecorp.com", phone: "+1 555-0101", lastContacted: "2h ago", notes: "Follow up on Q2 budget — interested in AI Sales Engine" },
  { initials: "MW", color: "#8B6914", name: "Marcus Webb", company: "TechFlow Inc", status: "warm", score: 74, email: "marcus@techflow.io", phone: "+1 555-0102", lastContacted: "1d ago", notes: "Requested demo for outbound automation stack" },
  { initials: "DR", color: "#7F1D1D", name: "Diana Ross", company: "Velocity Partners", status: "warm", score: 68, email: "diana@velocityp.com", phone: "+1 555-0103", lastContacted: "2d ago", notes: "Evaluating competitors — send case studies" },
  { initials: "JL", color: "#A17D22", name: "James Liu", company: "Growth Labs", status: "new", score: 61, email: "james@growthlabs.co", phone: "+1 555-0104", lastContacted: "3d ago", notes: "Inbound from LinkedIn ad — schedule intro call" },
  { initials: "KP", color: "#6B21A8", name: "Kevin Park", company: "CloudBase", status: "new", score: 55, email: "kevin@cloudbase.io", phone: "+1 555-0105", lastContacted: "4d ago", notes: "Referred by Acme Corp — high intent signal" },
  { initials: "AL", color: "#0369A1", name: "Amy Lin", company: "FinStack", status: "warm", score: 71, email: "amy@finstack.com", phone: "+1 555-0106", lastContacted: "1d ago", notes: "Interested in fractional SDR + AI calling bundle" },
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

interface Notification {
  icon: React.ElementType
  text: string
  time: string
  unread: boolean
  action: string
  type: "lead" | "campaign" | "meeting" | "billing" | "system"
}

const NOTIFICATIONS: Notification[] = [
  { icon: Users, text: "New high-value lead: Sarah Chen", time: "4 hours ago", unread: true, action: "View →", type: "lead" },
  { icon: Megaphone, text: "Campaign 'Alpha' started", time: "3 hours ago", unread: true, action: "View →", type: "campaign" },
  { icon: Bell, text: "Meeting booked: Acme Corp", time: "3 hours ago", unread: false, action: "Reply →", type: "meeting" },
  { icon: CreditCard, text: "Invoice paid: $12,000", time: "Yesterday", unread: false, action: "Dismiss", type: "billing" },
  { icon: AlertCircle, text: "Lead score alert: Kevin Park hit 55", time: "2 days ago", unread: false, action: "View →", type: "system" },
]

interface Campaign {
  name: string
  status: "live" | "paused"
  leads: number
  meetings: number
  emailsSent: number
  openRate: number
  isAB?: boolean
}

const CAMPAIGNS: Campaign[] = [
  { name: "Alpha Outbound", status: "live", leads: 124, meetings: 14, emailsSent: 1840, openRate: 48, isAB: true },
  { name: "Re-engagement Q1", status: "live", leads: 89, meetings: 8, emailsSent: 1420, openRate: 41 },
  { name: "AI Voice Follow-up", status: "paused", leads: 56, meetings: 5, emailsSent: 1561, openRate: 38 },
]

interface KanbanDeal {
  company: string
  value: string
  days: number
}

interface KanbanColumn {
  label: string
  deals: KanbanDeal[]
}

const KANBAN_COLUMNS: KanbanColumn[] = [
  {
    label: "New Lead",
    deals: [
      { company: "CloudBase", value: "$42K", days: 2 },
      { company: "FinStack", value: "$67K", days: 4 },
      { company: "PivotIO", value: "$31K", days: 1 },
    ],
  },
  {
    label: "Demo Booked",
    deals: [
      { company: "TechFlow Inc", value: "$85K", days: 7 },
      { company: "Velocity Ptrs", value: "$110K", days: 5 },
    ],
  },
  {
    label: "Closing",
    deals: [
      { company: "Acme Corp", value: "$120K", days: 14 },
      { company: "Growth Labs", value: "$450K", days: 11 },
    ],
  },
]

const TEAM_ACTIVITY = [
  { initials: "SC", text: "SC booked meeting with Acme Corp", time: "2h ago" },
  { initials: "MW", text: "MW replied to TechFlow proposal", time: "4h ago" },
  { initials: "DR", text: "DR added 12 leads from LinkedIn", time: "6h ago" },
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

// ─── Animation helpers ────────────────────────────────────────────────────────

function AnimNum({ value, prefix = "", suffix = "", delay = 0.6, format }: { value: number; prefix?: string; suffix?: string; delay?: number; format?: (v: number) => string }) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true })
  const mv = useMotionValue(0)
  const sp = useSpring(mv, { duration: 1800, bounce: 0 })
  const display = useTransform(sp, (v) => {
    const rounded = Math.round(v)
    if (format) return format(rounded)
    return `${prefix}${rounded.toLocaleString()}${suffix}`
  })
  useEffect(() => { if (isInView) setTimeout(() => mv.set(value), delay * 1000) }, [isInView, value, mv, delay])
  return <motion.span ref={ref}>{display}</motion.span>
}

function StaggerIn({ children, className, delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      animate="visible"
      variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.08, delayChildren: delay } } }}
    >
      {children}
    </motion.div>
  )
}

function PopUp({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      className={className}
      variants={{
        hidden: { opacity: 0, y: 16, scale: 0.92 },
        visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
      }}
    >
      {children}
    </motion.div>
  )
}

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
          cx="36" cy="36" r={r} fill="none" stroke="#C4972A" strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`}
          initial={{ strokeDasharray: `0 ${circ}` }}
          animate={{ strokeDasharray: `${dash} ${circ}` }}
          transition={{ duration: 1.2, delay: 0.8, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute flex flex-col items-center leading-none">
        <span className="text-[11px] font-bold text-foreground">{value}</span>
        <span className="text-[9px] text-muted-foreground mt-0.5">{pct}%</span>
      </div>
    </div>
  )
}

function DashboardView() {
  const [showBreakdown, setShowBreakdown] = useState(false)
  return (
    <div className="flex-1 min-w-0 bg-deep/40 overflow-hidden">
      {/* Metric row — 5 cols on desktop, 2 on mobile */}
      <div className="grid grid-cols-2 sm:grid-cols-5 border-b border-border">
        <div className="bg-card px-3 py-3 border-r border-border">
          <p className="text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">New Leads</p>
          <p className="mt-0.5 text-xl font-extrabold text-foreground"><AnimNum value={847} delay={0.5} /></p>
          <motion.p className="flex items-center gap-1 text-[9px] text-green-400 font-medium mt-0.5" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }}><TrendingUp className="h-2 w-2" /> 23% vs last week</motion.p>
          <p className="mt-1.5 text-[9px] text-primary cursor-pointer hover:underline">Revenue report →</p>
        </div>
        <div className="bg-card px-3 py-3 border-r border-border">
          <p className="text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">Total Revenue</p>
          <p className="mt-0.5 text-xl font-extrabold text-foreground"><AnimNum value={45} delay={0.6} format={(v) => `$${(v / 10).toFixed(1)}M`} /></p>
          <motion.p className="flex items-center gap-1 text-[9px] text-green-400 font-medium mt-0.5" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.3 }}><TrendingUp className="h-2 w-2" /> 32% vs last year</motion.p>
          <p className="mt-1.5 text-[9px] text-primary cursor-pointer hover:underline">All deals →</p>
        </div>
        <div className="bg-card px-3 py-3 border-r border-border flex flex-col items-center justify-center">
          <p className="w-full text-[9px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">Pipeline Value</p>
          <DonutChart pct={78} value="$312K" />
        </div>
        <div className="bg-card px-3 py-3 border-r border-border">
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">Notifications</p>
            <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-primary text-[7px] font-bold text-white">6</span>
          </div>
          <div className="space-y-1.5">
            {NOTIFICATIONS.slice(0, 3).map((n) => (
              <div key={n.text} className="flex items-start gap-1.5">
                <n.icon className="h-2.5 w-2.5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-[9px] font-medium text-foreground leading-tight truncate max-w-[80px]">{n.text}</p>
                  <p className="text-[8px] text-muted-foreground">{n.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-card px-3 py-3">
          <p className="text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">Win Rate</p>
          <p className="mt-0.5 text-xl font-extrabold text-foreground"><AnimNum value={68} suffix="%" delay={0.7} /></p>
          <motion.p className="flex items-center gap-1 text-[9px] text-green-400 font-medium mt-0.5" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.4 }}><TrendingUp className="h-2 w-2" /> +5pts this quarter</motion.p>
          <p className="mt-1.5 text-[9px] text-primary cursor-pointer hover:underline">View by rep →</p>
        </div>
      </div>

      {/* Quick Actions bar */}
      <div className="flex items-center gap-2 bg-deep px-4 py-1.5 border-b border-border">
        {["Add Lead", "New Campaign", "Schedule Call"].map((label) => (
          <button
            key={label}
            className="text-[9px] px-2 py-1 rounded-lg border border-border text-muted-foreground hover:border-primary hover:text-primary transition-colors flex items-center gap-1"
          >
            <Plus className="h-2.5 w-2.5" />
            {label}
          </button>
        ))}
      </div>

      {/* Middle row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 border-b border-border">
        {/* Recent Leads */}
        <div className="bg-card px-4 py-3 border-r border-border">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[11px] font-semibold text-foreground">Recent Leads</p>
            <span className="text-[9px] text-muted-foreground border border-border rounded px-1 py-0.5 flex items-center gap-0.5">Sort by Newest <ChevronDown className="h-2 w-2" /></span>
          </div>
          <StaggerIn className="space-y-2" delay={0.9}>
            {RECENT_LEADS.slice(0, 4).map((lead) => (
              <PopUp key={lead.name}>
                <motion.div
                  className="flex items-center gap-2 cursor-pointer rounded-lg px-2 py-1 hover:bg-primary/10 transition-colors"
                  whileHover={{ x: 2 }}
                >
                  <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-[9px] font-bold text-white" style={{ background: lead.color }}>
                    {lead.initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-semibold text-foreground leading-none truncate">{lead.name}</p>
                    <p className="text-[9px] text-muted-foreground">{lead.company}</p>
                  </div>
                  <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-medium ${lead.status === "hot" ? "bg-primary/15 text-primary" : lead.status === "warm" ? "bg-orange-900/20 text-orange-400" : "bg-deep text-muted-foreground"}`}>
                    {lead.status}
                  </span>
                </motion.div>
              </PopUp>
            ))}
          </StaggerIn>
          <p className="mt-2 text-[9px] text-primary cursor-pointer hover:underline">All customers →</p>
        </div>

        {/* Revenue Forecast */}
        <div className="relative bg-card px-4 py-3">
          <div className="flex items-center justify-between mb-1">
            <div>
              <p className="text-[11px] font-semibold text-foreground">Revenue Forecast</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="flex items-center gap-1 text-[8px] text-muted-foreground"><span className="inline-block h-1.5 w-3 rounded-full bg-primary" /> Closed Won</span>
              </div>
            </div>
            <span className="text-[9px] text-muted-foreground border border-border rounded px-1 py-0.5 flex items-center gap-0.5">Last 6 months <ChevronDown className="h-2 w-2" /></span>
          </div>
          <svg viewBox="0 0 260 70" className="w-full" preserveAspectRatio="none">
            <defs>
              <linearGradient id="rg" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#C4972A" stopOpacity="0.18" />
                <stop offset="100%" stopColor="#C4972A" stopOpacity="0.01" />
              </linearGradient>
            </defs>
            <motion.path d="M0,62 C40,52 80,34 120,29 C160,24 200,32 235,22 L260,17 L260,70 L0,70 Z" fill="url(#rg)" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 }} />
            <motion.path d="M0,62 C40,52 80,34 120,29 C160,24 200,32 235,22 L260,17" fill="none" stroke="#C4972A" strokeWidth="1.5" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.9, duration: 1.2 }} />
            {["Q2", "Q3", "Q4", "Q1-25", "Q2-25"].map((l, i) => (
              <text key={l} x={i * 55 + 8} y="69" fontSize="6.5" fill="#9CA3AF">{l}</text>
            ))}
          </svg>
          <button onClick={() => setShowBreakdown(!showBreakdown)} className="mt-0.5 text-[9px] text-primary hover:underline">
            {showBreakdown ? "Hide breakdown" : "View revenue breakdown →"}
          </button>
          <AnimatePresence>
            {showBreakdown && (
              <motion.div
                initial={{ opacity: 0, scale: 0.92, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.92, y: 8 }}
                transition={{ duration: 0.18 }}
                className="absolute left-4 bottom-10 z-20 w-48 rounded-xl border border-border bg-card shadow-xl p-3"
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] font-semibold text-foreground">Revenue Breakdown</p>
                  <button onClick={() => setShowBreakdown(false)}><X className="h-3 w-3 text-muted-foreground" /></button>
                </div>
                {[["#C4972A", "Closed Won", "$1.2M"], ["#8B6914", "Email", "$950K"], ["#E8C46A", "LinkedIn", "$950K"], ["#F87171", "Partner", "$450K"]].map(([c, l, v]) => (
                  <div key={l} className="flex items-center gap-1.5 mb-1">
                    <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ background: c }} />
                    <span className="text-[9px] text-muted-foreground flex-1">{l}</span>
                    <span className="text-[9px] font-semibold text-foreground">{v}</span>
                  </div>
                ))}
                <div className="mt-2 pt-2 border-t border-border">
                  <div className="flex justify-between text-[8px] text-muted-foreground mb-1">
                    <span>Company</span><span>Value</span><span>Status</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[9px] font-medium text-foreground">Acme Corp</span>
                    <span className="text-[9px] text-foreground">$120K</span>
                    <span className="text-[9px] font-semibold text-primary">Closing</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 sm:grid-cols-3">
        <div className="bg-card px-4 py-3 border-r border-border">
          <p className="text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">Active Campaigns</p>
          <p className="mt-0.5 text-2xl font-extrabold text-foreground"><AnimNum value={12} delay={0.8} /></p>
          <div className="mt-2 space-y-1">
            <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wide">Team Activity</p>
            <StaggerIn delay={1.2}>
              {TEAM_ACTIVITY.map((a) => (
                <PopUp key={a.initials + a.time}>
                  <div className="flex items-start gap-1.5">
                    <span className="text-[8px] font-bold text-white bg-primary rounded-full h-4 w-4 flex items-center justify-center flex-shrink-0">{a.initials[0]}</span>
                    <p className="text-[8px] text-muted-foreground leading-tight">
                      <span className="font-semibold text-foreground">{a.text.split(" ")[0]}</span>
                      {" " + a.text.slice(a.text.indexOf(" ") + 1)}
                      {" "}<span className="text-muted-foreground">· {a.time}</span>
                    </p>
                  </div>
                </PopUp>
              ))}
            </StaggerIn>
          </div>
        </div>
        <div className="bg-card px-4 py-3 border-r border-border">
          <p className="text-[10px] font-semibold text-foreground mb-2">Revenue by Source</p>
          <div className="space-y-1.5">
            {REVENUE_SOURCES.map((s, i) => (
              <div key={s.label} className="flex items-center gap-2">
                <span className="w-11 shrink-0 rounded text-center text-[8px] font-semibold bg-primary text-white px-1 py-0.5">{s.label}</span>
                <div className="flex-1 h-1.5 rounded-full bg-deep overflow-hidden">
                  <motion.div className="h-full rounded-full bg-primary" initial={{ width: 0 }} animate={{ width: `${s.pct}%` }} transition={{ duration: 0.8, delay: 1 + i * 0.1 }} />
                </div>
                <span className="w-9 shrink-0 text-right text-[9px] font-semibold text-foreground">{s.value}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-card px-4 py-3">
          <p className="text-[10px] font-semibold text-foreground mb-1.5">Hot Deals</p>
          <div className="flex justify-between text-[8px] text-muted-foreground mb-1"><span>Company</span><span>Value</span><span>Status</span></div>
          <StaggerIn delay={1.1}>
            {HOT_DEALS.map((d) => (
              <PopUp key={d.company}>
                <motion.div className="flex items-center justify-between py-0.5 cursor-pointer rounded hover:bg-primary/10 px-1 transition-colors" whileHover={{ x: 1 }}>
                  <span className="text-[10px] font-medium text-foreground">{d.company}</span>
                  <span className="text-[10px] font-bold text-foreground">{d.value}</span>
                  <span className="text-[9px] font-semibold text-primary">· {d.status}</span>
                </motion.div>
              </PopUp>
            ))}
          </StaggerIn>
        </div>
      </div>
    </div>
  )
}

type LeadFilter = "all" | "hot" | "warm" | "new"

function LeadsView() {
  const [selected, setSelected] = useState<string | null>(null)
  const [filter, setFilter] = useState<LeadFilter>("all")

  const filterCounts: Record<LeadFilter, number> = {
    all: RECENT_LEADS.length,
    hot: RECENT_LEADS.filter((l) => l.status === "hot").length,
    warm: RECENT_LEADS.filter((l) => l.status === "warm").length,
    new: RECENT_LEADS.filter((l) => l.status === "new").length,
  }

  const filtered = filter === "all" ? RECENT_LEADS : RECENT_LEADS.filter((l) => l.status === filter)

  const filterLabels: { key: LeadFilter; label: string }[] = [
    { key: "all", label: `All (${filterCounts.all})` },
    { key: "hot", label: `Hot (${filterCounts.hot})` },
    { key: "warm", label: `Warm (${filterCounts.warm})` },
    { key: "new", label: `New (${filterCounts.new})` },
  ]

  return (
    <div className="flex-1 bg-card p-4 overflow-hidden">
      <div className="flex items-center justify-between mb-2">
        <p className="text-[11px] font-semibold text-foreground">All Leads</p>
        <button className="flex items-center gap-1 text-[9px] px-2 py-1 rounded-lg bg-primary text-white font-semibold hover:bg-primary/80 transition-colors">
          <Plus className="h-2.5 w-2.5" />
          Add Lead +
        </button>
      </div>

      {/* Filter pills */}
      <div className="flex items-center gap-1 mb-2.5">
        <Filter className="h-2.5 w-2.5 text-muted-foreground flex-shrink-0" />
        {filterLabels.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`text-[8px] px-2 py-0.5 rounded-full border font-medium transition-colors ${filter === key ? "bg-primary border-primary text-white" : "border-border text-muted-foreground hover:border-primary hover:text-primary"}`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="space-y-1">
        {filtered.map((lead) => (
          <div key={lead.name}>
            <motion.div
              onClick={() => setSelected(selected === lead.name ? null : lead.name)}
              className={`flex items-center gap-3 rounded-xl px-3 py-2 cursor-pointer transition-all ${selected === lead.name ? "bg-primary/10 border border-primary/30" : "hover:bg-surface border border-transparent"}`}
              whileHover={{ x: 2 }}
            >
              <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white" style={{ background: lead.color }}>
                {lead.initials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-semibold text-foreground leading-none">{lead.name}</p>
                <p className="text-[9px] text-muted-foreground leading-tight">{lead.company}</p>
                <p className="text-[8px] text-muted-foreground leading-none">{lead.email} · {lead.phone}</p>
              </div>
              <div className="flex flex-col items-end gap-0.5">
                <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-medium ${lead.status === "hot" ? "bg-primary/15 text-primary" : lead.status === "warm" ? "bg-orange-900/20 text-orange-400" : "bg-deep text-muted-foreground"}`}>
                  {lead.status}
                </span>
                <span className={`text-[9px] font-bold rounded px-1 py-0 ${lead.score >= 80 ? "text-green-400 bg-green-900/15" : lead.score >= 60 ? "text-orange-400 bg-orange-50" : "text-muted-foreground bg-deep"}`}>
                  {lead.score}
                </span>
                <span className="text-[8px] text-muted-foreground">{lead.lastContacted}</span>
              </div>
            </motion.div>

            <AnimatePresence>
              {selected === lead.name && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="mx-3 mb-1 overflow-hidden"
                >
                  <div className="rounded-b-xl border border-t-0 border-primary/30 bg-primary/10 px-3 py-2">
                    <div className="flex gap-2 mb-2">
                      <button className="flex items-center gap-1 text-[8px] px-2 py-1 rounded border border-primary text-primary font-semibold hover:bg-primary/15 transition-colors">
                        <Mail className="h-2.5 w-2.5" /> Send Email
                      </button>
                      <button className="flex items-center gap-1 text-[8px] px-2 py-1 rounded border border-primary text-primary font-semibold hover:bg-primary/15 transition-colors">
                        <Phone className="h-2.5 w-2.5" /> Call Now
                      </button>
                    </div>
                    <div className="mb-2">
                      <div className="flex items-center justify-between mb-0.5">
                        <p className="text-[8px] text-muted-foreground">Lead Score</p>
                        <p className="text-[8px] font-bold text-foreground">{lead.score}/100</p>
                      </div>
                      <div className="h-1.5 rounded-full bg-surface overflow-hidden">
                        <motion.div
                          className="h-full rounded-full bg-primary"
                          initial={{ width: 0 }}
                          animate={{ width: `${lead.score}%` }}
                          transition={{ duration: 0.6, ease: "easeOut" }}
                        />
                      </div>
                    </div>
                    <p className="text-[8px] text-muted-foreground italic mb-1.5">&ldquo;{lead.notes}&rdquo;</p>
                    <p className="text-[8px] text-primary cursor-pointer hover:underline font-medium">View Full Profile →</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </div>
  )
}

function CampaignsView() {
  const [active, setActive] = useState("Alpha Outbound")
  const [paused, setPaused] = useState<string[]>(["AI Voice Follow-up"])

  const campaignStats = [
    { label: "Sent", value: "4,821" },
    { label: "Opens", value: "2,140 · 44%" },
    { label: "Clicks", value: "891 · 18%" },
    { label: "Replies", value: "203 · 4%" },
  ]

  return (
    <div className="flex-1 bg-card p-4 overflow-hidden">
      <div className="flex items-center justify-between mb-2">
        <p className="text-[11px] font-semibold text-foreground">Active Campaigns</p>
        <button className="flex items-center gap-1 text-[9px] px-2 py-1 rounded-lg bg-primary text-white font-semibold hover:bg-primary/80 transition-colors">
          <Plus className="h-2.5 w-2.5" />
          New Campaign +
        </button>
      </div>

      {/* Aggregate stats row */}
      <div className="grid grid-cols-4 gap-1.5 mb-3">
        {campaignStats.map((s) => (
          <div key={s.label} className="rounded-lg bg-deep px-2 py-1.5 text-center">
            <p className="text-[8px] text-muted-foreground">{s.label}</p>
            <p className="text-[11px] font-bold text-foreground">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="space-y-2">
        {CAMPAIGNS.map((c) => {
          const isPaused = paused.includes(c.name)
          return (
            <motion.div
              key={c.name}
              onClick={() => setActive(c.name)}
              className={`rounded-xl border px-3 py-2.5 cursor-pointer transition-all ${active === c.name ? "border-primary bg-primary/10" : "border-border hover:border-border"}`}
              whileHover={{ scale: 1.01 }}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5">
                  <p className="text-[11px] font-semibold text-foreground">{c.name}</p>
                  {c.isAB && (
                    <span className="text-[7px] px-1 py-0.5 rounded-full bg-deep text-muted-foreground font-semibold border border-border">A/B Test</span>
                  )}
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-semibold ${isPaused ? "bg-yellow-900/20 text-yellow-400" : "bg-green-900/20 text-green-400"}`}>
                    {isPaused ? "paused" : "live"}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setPaused((prev) => isPaused ? prev.filter((n) => n !== c.name) : [...prev, c.name])
                    }}
                    className="flex items-center justify-center h-5 w-5 rounded border border-border text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                  >
                    {isPaused ? <Play className="h-2.5 w-2.5" /> : <Pause className="h-2.5 w-2.5" />}
                  </button>
                </div>
              </div>
              <div className="flex gap-4">
                <div><p className="text-[9px] text-muted-foreground">Leads</p><p className="text-[12px] font-bold text-foreground">{c.leads}</p></div>
                <div><p className="text-[9px] text-muted-foreground">Meetings</p><p className="text-[12px] font-bold text-primary">{c.meetings}</p></div>
                <div><p className="text-[9px] text-muted-foreground">Emails Sent</p><p className="text-[12px] font-bold text-foreground">{c.emailsSent.toLocaleString()}</p></div>
                <div><p className="text-[9px] text-muted-foreground">Open Rate</p><p className="text-[12px] font-bold text-foreground">{c.openRate}%</p></div>
                <div className="flex-1">
                  <p className="text-[9px] text-muted-foreground mb-1">Conv. rate</p>
                  <div className="h-1.5 rounded-full bg-deep">
                    <motion.div className="h-full rounded-full bg-primary" initial={{ width: 0 }} animate={{ width: `${Math.round(c.meetings / c.leads * 100)}%` }} transition={{ duration: 0.8 }} />
                  </div>
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}

function PipelineView() {
  return (
    <div className="flex-1 bg-card p-4 overflow-hidden">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[11px] font-semibold text-foreground">Pipeline Board</p>
        <button className="flex items-center gap-1 text-[9px] px-2 py-1 rounded-lg bg-primary text-white font-semibold hover:bg-primary/80 transition-colors">
          <Plus className="h-2.5 w-2.5" />
          Add Deal +
        </button>
      </div>

      {/* Kanban mini board — 3 columns */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        {KANBAN_COLUMNS.map((col, ci) => (
          <div key={col.label} className="rounded-xl bg-deep border border-border p-2">
            <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">{col.label}</p>
            {col.deals.map((deal, di) => (
              <motion.div
                key={deal.company}
                className="rounded-lg border border-border bg-card px-2 py-1.5 mb-1.5 cursor-pointer hover:border-primary/30 transition-colors"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + ci * 0.1 + di * 0.05 }}
                whileHover={{ scale: 1.02 }}
              >
                <p className="text-[9px] font-semibold text-foreground leading-none truncate">{deal.company}</p>
                <div className="flex items-center justify-between mt-0.5">
                  <span className="text-[8px] font-bold text-primary">{deal.value}</span>
                  <span className="text-[7px] text-muted-foreground">{deal.days}d</span>
                </div>
              </motion.div>
            ))}
          </div>
        ))}
      </div>

      <div className="rounded-xl bg-deep px-4 py-3 flex items-center justify-between">
        <span className="text-[10px] text-muted-foreground">Total Pipeline Value</span>
        <span className="text-sm font-bold text-foreground">$905,000</span>
      </div>
    </div>
  )
}

type NotifFilter = "all" | "unread" | "leads" | "system"

function NotificationsView() {
  const [read, setRead] = useState<string[]>([])
  const [notifFilter, setNotifFilter] = useState<NotifFilter>("all")

  const unreadCount = NOTIFICATIONS.filter((n) => n.unread && !read.includes(n.text)).length

  const notifFilterLabels: { key: NotifFilter; label: string }[] = [
    { key: "all", label: "All" },
    { key: "unread", label: `Unread (${unreadCount})` },
    { key: "leads", label: "Leads" },
    { key: "system", label: "System" },
  ]

  const filteredNotifs = NOTIFICATIONS.filter((n) => {
    if (notifFilter === "unread") return n.unread && !read.includes(n.text)
    if (notifFilter === "leads") return n.type === "lead"
    if (notifFilter === "system") return n.type === "system" || n.type === "billing"
    return true
  })

  return (
    <div className="flex-1 bg-card p-4 overflow-hidden">
      <div className="flex items-center justify-between mb-2">
        <p className="text-[11px] font-semibold text-foreground">Notifications</p>
        <button onClick={() => setRead(NOTIFICATIONS.map((n) => n.text))} className="text-[9px] text-primary hover:underline">Mark all read</button>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-1 mb-2.5">
        {notifFilterLabels.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setNotifFilter(key)}
            className={`text-[8px] px-2 py-0.5 rounded-full border font-medium transition-colors ${notifFilter === key ? "bg-primary border-primary text-white" : "border-border text-muted-foreground hover:border-primary hover:text-primary"}`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        <AnimatePresence>
          {filteredNotifs.map((n) => (
            <motion.div
              key={n.text}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.2 }}
              onClick={() => setRead((r) => [...r, n.text])}
              className={`flex items-start gap-2.5 rounded-xl px-3 py-2.5 cursor-pointer transition-colors ${!read.includes(n.text) && n.unread ? "bg-primary/10 border border-primary/20" : "hover:bg-surface border border-transparent"}`}
              whileHover={{ x: 2 }}
            >
              {!read.includes(n.text) && n.unread && <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />}
              {n.type === "billing" ? (
                <CheckCircle2 className="h-3.5 w-3.5 text-green-500 mt-0.5 flex-shrink-0" />
              ) : (
                <n.icon className="h-3.5 w-3.5 text-primary mt-0.5 flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-medium text-foreground">{n.text}</p>
                <p className="text-[9px] text-muted-foreground">{n.time}</p>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); setRead((r) => [...r, n.text]) }}
                className="text-[8px] px-1.5 py-0.5 rounded border border-border text-muted-foreground hover:border-primary hover:text-primary transition-colors flex-shrink-0"
              >
                {n.action}
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}

const LEAD_SOURCES = [
  { label: "LinkedIn", pct: 44 },
  { label: "Cold Email", pct: 28 },
  { label: "Partner", pct: 18 },
  { label: "Paid", pct: 10 },
]

const HEATMAP_DAYS = [
  { day: "M", pct: 60 },
  { day: "T", pct: 85 },
  { day: "W", pct: 90 },
  { day: "T", pct: 75 },
  { day: "F", pct: 45 },
  { day: "S", pct: 20 },
  { day: "S", pct: 15 },
]

function ReportsView() {
  const topStats = [
    { label: "MRR", value: "$12,450", delta: "↑ 8%", positive: true },
    { label: "Deals Closed", value: "23", delta: "↑ 3", positive: true },
    { label: "Avg Deal", value: "$541", delta: "↑ 12%", positive: true },
    { label: "CAC", value: "$142", delta: "↓ 18%", positive: true },
  ]

  const funnelSteps: { label: string; count: number; pct?: string }[] = [
    { label: "Leads", count: 847 },
    { label: "Qualified", count: 312, pct: "37%" },
    { label: "Demo", count: 89, pct: "29%" },
    { label: "Closed", count: 23, pct: "26%" },
  ]

  return (
    <div className="flex-1 bg-card p-4 overflow-hidden">
      <p className="text-[11px] font-semibold text-foreground mb-2">Analytics Dashboard</p>

      {/* Top stats row — 4 cards */}
      <div className="grid grid-cols-4 gap-1.5 mb-3">
        {topStats.map((s) => (
          <div key={s.label} className="rounded-lg bg-deep px-2 py-1.5 text-center">
            <p className="text-[8px] text-muted-foreground">{s.label}</p>
            <p className="text-[12px] font-bold text-foreground">{s.value}</p>
            <p className={`text-[8px] font-medium ${s.positive ? "text-green-400" : "text-primary"}`}>{s.delta}</p>
          </div>
        ))}
      </div>

      {/* Main chart area: MRR (60%) + Lead Sources (40%) */}
      <div className="grid grid-cols-5 gap-2 mb-2">
        {/* MRR Growth area chart */}
        <div className="col-span-3 rounded-xl border border-border p-2">
          <p className="text-[9px] font-semibold text-muted-foreground mb-1">MRR Growth</p>
          <div className="flex gap-1">
            <div className="flex flex-col justify-between pr-1 text-right">
              <span className="text-[7px] text-muted-foreground">$15K</span>
              <span className="text-[7px] text-muted-foreground">$10K</span>
              <span className="text-[7px] text-muted-foreground">$5K</span>
            </div>
            <svg viewBox="0 0 280 90" className="flex-1 h-[90px]" preserveAspectRatio="none">
              <defs>
                <linearGradient id="rg2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#C4972A" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#C4972A" stopOpacity="0" />
                </linearGradient>
              </defs>
              <line x1="0" y1="30" x2="280" y2="30" stroke="rgba(255,255,255,0.07)" strokeWidth="0.5" strokeDasharray="4 4" />
              <line x1="0" y1="60" x2="280" y2="60" stroke="rgba(255,255,255,0.07)" strokeWidth="0.5" strokeDasharray="4 4" />
              <motion.path
                d="M0,75 C30,65 60,50 90,42 C120,34 150,38 180,28 C210,20 240,15 280,10 L280,90 L0,90 Z"
                fill="url(#rg2)"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              />
              <motion.path
                d="M0,75 C30,65 60,50 90,42 C120,34 150,38 180,28 C210,20 240,15 280,10"
                fill="none"
                stroke="#C4972A"
                strokeWidth="2"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ delay: 0.4, duration: 1.2 }}
              />
              {["Jan", "Feb", "Mar", "Apr", "May", "Jun"].map((m, i) => (
                <text key={m} x={i * 50 + 10} y="89" fontSize="7" fill="#9CA3AF">{m}</text>
              ))}
            </svg>
          </div>
        </div>

        {/* Lead Sources horizontal bar chart */}
        <div className="col-span-2 rounded-xl border border-border p-2">
          <p className="text-[9px] font-semibold text-muted-foreground mb-1.5">Lead Sources</p>
          <div className="space-y-1.5">
            {LEAD_SOURCES.map((s, i) => (
              <div key={s.label} className="flex items-center gap-1.5">
                <span className="text-[8px] text-muted-foreground w-14 flex-shrink-0">{s.label}</span>
                <div className="flex-1 h-2 rounded-full bg-deep overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-primary"
                    initial={{ width: 0 }}
                    animate={{ width: `${s.pct}%` }}
                    transition={{ duration: 0.7, delay: 0.4 + i * 0.1 }}
                    style={{ opacity: 1 - i * 0.15 }}
                  />
                </div>
                <span className="text-[8px] font-semibold text-muted-foreground w-6 text-right">{s.pct}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Conversion funnel */}
      <div className="rounded-xl border border-border px-3 py-2 mb-2">
        <p className="text-[9px] font-semibold text-muted-foreground mb-1.5">Conversion Funnel</p>
        <div className="flex items-center gap-1 flex-wrap">
          {funnelSteps.map((step, i) => (
            <div key={step.label} className="flex items-center gap-1">
              <motion.div
                className="flex flex-col items-center rounded-full bg-primary/10 border border-primary/30 px-2 py-1"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 + i * 0.1 }}
              >
                <span className="text-[9px] font-bold text-foreground">{step.count}</span>
                <span className="text-[7px] text-muted-foreground">{step.label}</span>
              </motion.div>
              {step.pct && (
                <div className="flex flex-col items-center">
                  <span className="text-[7px] text-muted-foreground">{step.pct}</span>
                  <ArrowRight className="h-2.5 w-2.5 text-muted-foreground" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Activity heatmap */}
      <div className="rounded-xl border border-border px-3 py-2">
        <p className="text-[9px] font-semibold text-muted-foreground mb-1.5">Response Rate by Day</p>
        <div className="flex items-end gap-2">
          {HEATMAP_DAYS.map((d, i) => (
            <div key={`${d.day}-${i}`} className="flex flex-col items-center gap-0.5">
              <motion.div
                className="h-5 w-5 rounded-full"
                style={{ background: `rgba(220, 38, 38, ${d.pct / 100})` }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 + i * 0.07 }}
              />
              <span className="text-[7px] text-muted-foreground">{d.day}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function SettingsView() {
  const [notifications, setNotifications] = useState(true)
  const [digest, setDigest] = useState(true)
  const [leadScoring, setLeadScoring] = useState(true)
  const [weeklySummary, setWeeklySummary] = useState(false)

  const toggleItems = [
    { label: "Email Notifications", sub: "Get alerts for new leads", state: notifications, set: setNotifications },
    { label: "Daily Digest", sub: "Morning summary at 8am", state: digest, set: setDigest },
    { label: "Lead Scoring Alerts", sub: "Alert when score crosses threshold", state: leadScoring, set: setLeadScoring },
    { label: "Weekly AI Summary", sub: "AI-generated weekly report", state: weeklySummary, set: setWeeklySummary },
  ]

  const integrations = [
    { name: "HubSpot", connected: true },
    { name: "Slack", connected: true },
    { name: "Gmail", connected: true },
    { name: "Salesforce", connected: false },
  ]

  return (
    <div className="flex-1 bg-card p-4 overflow-hidden">
      <p className="text-[11px] font-semibold text-foreground mb-3">Settings</p>

      {/* Profile section */}
      <div className="rounded-xl border border-border px-3 py-2.5 mb-3 flex items-center gap-2.5">
        <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0">SA</div>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-semibold text-foreground leading-none">Sam Altman</p>
          <p className="text-[9px] text-muted-foreground">sam@openai.com</p>
        </div>
        <span className="text-[7px] px-1.5 py-0.5 rounded-full bg-primary text-white font-bold tracking-wide">ADMIN</span>
      </div>

      <div className="space-y-2 mb-3">
        {toggleItems.map((item) => (
          <div key={item.label} className="flex items-center justify-between rounded-xl border border-border px-3 py-2">
            <div>
              <p className="text-[10px] font-semibold text-foreground">{item.label}</p>
              <p className="text-[9px] text-muted-foreground">{item.sub}</p>
            </div>
            <button
              onClick={() => item.set(!item.state)}
              className={`relative h-4 w-7 rounded-full transition-colors ${item.state ? "bg-primary" : "bg-surface"}`}
            >
              <motion.div
                className="absolute top-0.5 h-3 w-3 rounded-full bg-card shadow"
                animate={{ left: item.state ? "calc(100% - 14px)" : "2px" }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            </button>
          </div>
        ))}
      </div>

      {/* Integrations */}
      <div className="rounded-xl border border-border px-3 py-2.5 mb-3">
        <p className="text-[10px] font-semibold text-foreground mb-2">Integrations</p>
        <div className="flex flex-wrap gap-1.5">
          {integrations.map((intg) => (
            <div key={intg.name} className="flex items-center gap-1 rounded-full border border-border px-2 py-0.5">
              <span className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${intg.connected ? "bg-green-500" : "bg-red-400"}`} />
              <span className="text-[9px] text-muted-foreground font-medium">{intg.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Team Members */}
      <div className="rounded-xl border border-border px-3 py-2.5 mb-3">
        <p className="text-[10px] font-semibold text-foreground mb-1.5">Team Members</p>
        <div className="flex -space-x-2">
          {["#C4972A", "#8B6914", "#7F1D1D", "#A17D22"].map((c, i) => (
            <div key={i} className="h-6 w-6 rounded-full border-2 border-white flex items-center justify-center text-[8px] font-bold text-white" style={{ background: c }}>
              {["A", "B", "C", "D"][i]}
            </div>
          ))}
          <div className="h-6 w-6 rounded-full border-2 border-white bg-deep flex items-center justify-center text-[8px] text-muted-foreground">+3</div>
        </div>
      </div>

      {/* Billing */}
      <div className="rounded-xl border border-border px-3 py-2.5 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-semibold text-foreground">Billing</p>
          <p className="text-[9px] text-muted-foreground">Pro Plan · $297/mo</p>
        </div>
        <button className="text-[9px] text-primary font-semibold hover:underline flex items-center gap-0.5">
          Upgrade → <DollarSign className="h-2.5 w-2.5" />
        </button>
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
  { src: "/integrations/hubspot-svgrepo-com.svg", label: "HubSpot", style: { top: "10%", left: "4%" }, delay: 0 },
  { src: "/integrations/notion.svg", label: "Notion", style: { top: "10%", right: "4%" }, delay: 0.1 },
  { src: "/integrations/instantly.webp", label: "Instantly", style: { top: "38%", left: "3%" }, delay: 0.2 },
  { src: "/integrations/slack.png", label: "Slack", style: { top: "38%", right: "3%" }, delay: 0.3 },
]

// ─── Hero ─────────────────────────────────────────────────────────────────────

export function Hero() {
  const [activeView, setActiveView] = useState("dashboard")
  const ActiveView = VIEW_MAP[activeView] ?? DashboardView

  return (
    <section className="relative overflow-hidden bg-deep pt-24 pb-16 md:pt-32 md:pb-24">

      {/* Floating tool logos */}
      {FLOAT_LOGOS.map((logo) => (
        <motion.div
          key={logo.label}
          className="absolute z-10 hidden lg:flex h-[72px] w-[72px] items-center justify-center rounded-2xl bg-card shadow-lg shadow-gray-200/60 border border-border"
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
            <span className="inline-flex items-center gap-2.5 rounded-full border border-primary/30 bg-card px-4 py-1.5 text-sm font-medium text-foreground shadow-sm">
              <span className="flex -space-x-1.5">
                {["#C4972A", "#8B6914", "#7F1D1D"].map((c, i) => (
                  <span key={i} className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-white text-[8px] font-bold text-white" style={{ background: c }}>{["A", "B", "C"][i]}</span>
                ))}
              </span>
              Trusted by 1M+ users
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, delay: 0.1 }}
            className="max-w-3xl text-[2.75rem] font-extrabold leading-[1.1] tracking-tight text-foreground sm:text-5xl md:text-[3.6rem]"
          >
            Your Pipeline Is a<br />
            Bandwidth Problem.<br />We Fix That.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}
            className="mx-auto mt-5 max-w-xl text-lg text-muted-foreground leading-relaxed"
          >
            AI-powered outbound, voice agents, and reactivation systems -- fully managed so your team can close, not chase.{" "}
            <strong className="text-foreground">More meetings. Zero overhead.</strong>
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-8 flex flex-col items-center gap-2 sm:flex-row"
          >
            <Link href="/get-started" className="inline-flex items-center gap-2 bg-primary px-8 py-3.5 text-xs font-bold uppercase tracking-widest text-white shadow-md shadow-primary/20 transition hover:bg-primary/80 hover:shadow-lg">
              Book a Strategy Call
              <ArrowRight className="h-4 w-4" />
            </Link>
          </motion.div>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
            <CreditCard className="h-3.5 w-3.5" /> No credit card required
          </motion.p>

          {/* Interactive Dashboard */}
          <motion.div
            initial={{ opacity: 0, y: 56 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.45 }}
            className="mt-14 w-full max-w-5xl"
          >
            <div className="overflow-hidden rounded-2xl border border-primary/30 bg-card h-auto sm:h-[560px] shadow-[0_8px_60px_-12px_rgba(196,151,42,0.25),0_0_0_1px_rgba(196,151,42,0.08)] hover:shadow-[0_12px_70px_-10px_rgba(196,151,42,0.35),0_0_0_1px_rgba(196,151,42,0.15)] transition-shadow duration-500">
              <div className="flex flex-col sm:flex-row h-auto sm:h-[560px]">

                {/* DESKTOP SIDEBAR — hidden on mobile */}
                <div className="hidden sm:flex w-40 flex-shrink-0 border-r border-border bg-card flex-col">
                  <div className="flex items-center gap-2 px-3 py-3.5 border-b border-border">
                    <Image src="/logo.png" alt="AIMS" width={22} height={22} className="object-contain" />
                    <span className="text-sm font-bold text-foreground">AIMS</span>
                  </div>
                  <div className="px-2.5 py-2">
                    <div className="flex items-center gap-1.5 rounded-lg bg-deep px-2 py-1.5">
                      <Search className="h-3 w-3 text-muted-foreground" />
                      <span className="text-[10px] text-muted-foreground">Search</span>
                    </div>
                  </div>
                  <nav className="flex-1 px-2 space-y-0.5 overflow-hidden">
                    {NAV_ITEMS.map((item, i) => (
                      <motion.button
                        key={item.id}
                        onClick={() => setActiveView(item.id)}
                        className={`w-full flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-[11px] font-medium transition-colors cursor-pointer ${activeView === item.id ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-surface hover:text-foreground"}`}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.35, delay: 0.6 + i * 0.06, ease: [0.22, 1, 0.36, 1] }}
                        whileHover={{ x: 2 }}
                        whileTap={{ scale: 0.97 }}
                      >
                        <item.icon className="h-3 w-3 flex-shrink-0" />
                        {item.label}
                      </motion.button>
                    ))}
                  </nav>
                  <div className="border-t border-border px-3 py-2.5">
                    <div className="flex items-center gap-1.5">
                      <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center text-[9px] font-bold text-white">SA</div>
                      <div>
                        <p className="text-[10px] font-semibold text-foreground leading-none">Sam Altman</p>
                        <p className="text-[9px] text-muted-foreground">ADMIN</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* MOBILE TAB BAR — visible only on mobile */}
                <div className="sm:hidden flex items-center border-b border-border bg-card overflow-x-auto scrollbar-hide shrink-0">
                  <div className="flex items-center gap-0.5 px-2 py-1.5 min-w-max">
                    <div className="flex items-center gap-1 px-2 py-1 mr-2 border-r border-border">
                      <Image src="/logo.png" alt="AIMS" width={16} height={16} className="object-contain" />
                      <span className="text-xs font-bold text-foreground">AIMS</span>
                    </div>
                    {NAV_ITEMS.map((item) => (
                      <motion.button
                        key={item.id}
                        onClick={() => setActiveView(item.id)}
                        className={`flex items-center gap-1 rounded-lg px-2 py-1.5 text-[11px] font-medium transition-colors whitespace-nowrap cursor-pointer ${activeView === item.id ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-surface"}`}
                        whileTap={{ scale: 0.95 }}
                      >
                        <item.icon className="h-3 w-3 flex-shrink-0" />
                        <span>{item.label}</span>
                      </motion.button>
                    ))}
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
            <p className="mt-3 text-xs text-muted-foreground text-center">
              Click the sidebar tabs to explore ↑
            </p>
          </motion.div>

          {/* "Trusted by" label */}
          <motion.p
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}
            className="mt-14 text-sm font-semibold text-muted-foreground uppercase tracking-widest"
          >
            Trusted by sales teams at
          </motion.p>
        </div>
      </div>
    </section>
  )
}
