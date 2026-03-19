"use client"

import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import {
  CheckCircle2, TrendingUp, PhoneCall, RefreshCw, Database,
  LayoutDashboard, BarChart2, Search, GripVertical, DollarSign,
  Shield, AlertTriangle, Target, Rocket,
} from "lucide-react"

// ─── Wild Ducks Demo ──────────────────────────────────────────────────────────
const WD_DEPARTMENTS = [
  { label: "Sales", sinks: [{ task: "Manual lead qualification", hrs: 12 }, { task: "CRM data entry", hrs: 8 }, { task: "Proposal formatting", hrs: 6 }] },
  { label: "Marketing", sinks: [{ task: "Content repurposing", hrs: 10 }, { task: "Campaign reporting", hrs: 7 }, { task: "Social scheduling", hrs: 5 }] },
  { label: "Ops", sinks: [{ task: "Vendor follow-ups", hrs: 14 }, { task: "Invoice reconciliation", hrs: 9 }, { task: "Status update meetings", hrs: 6 }] },
  { label: "Finance", sinks: [{ task: "Expense categorization", hrs: 11 }, { task: "P&L assembly", hrs: 8 }, { task: "Renewal tracking", hrs: 4 }] },
]

const WD_OPPORTUNITY_MAP = [
  { name: "AI Lead Scoring", impact: 94, dept: "Sales", effort: "Low" },
  { name: "Auto-Invoice Pipeline", impact: 89, dept: "Ops", effort: "Med" },
  { name: "Content Repurpose Agent", impact: 85, dept: "Marketing", effort: "Low" },
  { name: "Expense Auto-Categorizer", impact: 82, dept: "Finance", effort: "Low" },
  { name: "EOS Meeting Automator", impact: 78, dept: "Ops", effort: "Med" },
]

function WildDucksDemo() {
  const [tab, setTab] = useState(0)
  const [phase, setPhase] = useState<"scan" | "map" | "deploy">("scan")
  const [scanProgress, setScanProgress] = useState(0)
  const [deployed, setDeployed] = useState(false)

  useEffect(() => {
    setScanProgress(0)
    const t = setInterval(() => {
      setScanProgress((p) => {
        if (p >= 100) { clearInterval(t); return 100 }
        return p + 2
      })
    }, 35)
    return () => clearInterval(t)
  }, [tab])

  const dept = WD_DEPARTMENTS[tab]
  const totalHrs = dept.sinks.reduce((a, s) => a + s.hrs, 0)

  return (
    <div className="space-y-3">
      {/* Department tabs */}
      <div className="flex gap-1">
        {WD_DEPARTMENTS.map((d, i) => (
          <button
            key={d.label}
            onClick={() => { setTab(i); setPhase("scan"); setDeployed(false) }}
            className="flex-1 rounded-lg px-1 py-2 text-center transition-all text-[11px] font-semibold"
            style={{ backgroundColor: tab === i ? "#C4972A" : "#141923", color: tab === i ? "white" : "#9CA3AF" }}
          >
            {d.label}
          </button>
        ))}
      </div>

      {/* Scan phase — time sinks + opportunity score */}
      {phase === "scan" && (
        <AnimatePresence mode="wait">
          <motion.div key={tab} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.25 }}>
            <div className="rounded-sm border border-border bg-card p-3 mb-2">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] text-muted-foreground uppercase tracking-wide font-semibold">AI Opportunity Score</span>
                <span className="text-[10px] font-bold text-foreground">{scanProgress}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-deep overflow-hidden">
                <motion.div animate={{ width: `${scanProgress}%` }} transition={{ duration: 0.05 }} className="h-full bg-gradient-to-r from-primary to-[#E8C46A] rounded-full" />
              </div>
            </div>
            <div className="space-y-1.5">
              {dept.sinks.map((sink) => (
                <div key={sink.task} className="flex items-center gap-3 rounded-sm bg-deep border border-border px-3 py-2.5">
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-medium text-foreground">{sink.task}</p>
                  </div>
                  <span className="text-[11px] font-bold text-red-400">{sink.hrs}h/wk</span>
                </div>
              ))}
            </div>
            <div className="rounded-xl bg-red-950/20 border border-red-800/40 px-3 py-2.5 flex items-center gap-2 mt-2">
              <span className="text-[11px] font-semibold text-red-400">{totalHrs}h/wk wasted in {dept.label}</span>
            </div>
            <button
              onClick={() => setPhase("map")}
              className="mt-2 w-full rounded-lg bg-surface border border-border px-3 py-2 text-[11px] font-semibold text-muted-foreground hover:text-primary transition-colors text-center"
            >
              View Opportunity Map
            </button>
          </motion.div>
        </AnimatePresence>
      )}

      {/* Map phase — prioritized findings */}
      {phase === "map" && (
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="space-y-1.5">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-semibold mb-1">Top 5 Findings — Ranked by Impact</p>
          {WD_OPPORTUNITY_MAP.map((opp, i) => (
            <div key={opp.name} className="flex items-center gap-2 rounded-sm bg-deep border border-border px-3 py-2">
              <span className="text-[10px] font-bold text-primary w-4">{i + 1}</span>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-semibold text-foreground leading-tight">{opp.name}</p>
                <p className="text-[10px] text-muted-foreground">{opp.dept} · {opp.effort} effort</p>
              </div>
              <div className="flex-shrink-0 text-right">
                <div className="text-[11px] font-bold text-primary">{opp.impact}</div>
                <div className="text-[9px] text-muted-foreground">score</div>
              </div>
            </div>
          ))}
          <button
            onClick={() => { setPhase("deploy"); setDeployed(false); setTimeout(() => setDeployed(true), 1800) }}
            className="mt-2 w-full flex items-center justify-center gap-2 rounded-lg bg-primary text-white px-3 py-2.5 text-[11px] font-semibold hover:bg-primary/90 transition-colors"
          >
            <Rocket className="h-3.5 w-3.5" /> Deploy Solutions
          </button>
        </motion.div>
      )}

      {/* Deploy phase — solutions installing */}
      {phase === "deploy" && (
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="space-y-2">
          {["EOS Agent", "Process Automator", "Spend Challenger", "AI Copilot", "Report Generator"].map((sol, i) => (
            <motion.div
              key={sol}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.3, duration: 0.3 }}
              className="flex items-center gap-3 rounded-sm bg-card border border-border px-3 py-2.5"
            >
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-semibold text-foreground">{sol}</p>
              </div>
              {deployed ? (
                <CheckCircle2 className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />
              ) : (
                <motion.div animate={{ opacity: [1, 0.3, 1] }} transition={{ repeat: Infinity, duration: 0.8 }} className="h-2 w-2 rounded-full bg-primary flex-shrink-0" />
              )}
            </motion.div>
          ))}
          {deployed && (
            <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl bg-green-950/20 border border-green-800/40 px-3 py-2.5 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-400 flex-shrink-0" />
              <span className="text-[11px] font-semibold text-green-400">All solutions deployed — 40% efficiency gain in 90 days</span>
            </motion.div>
          )}
        </motion.div>
      )}
    </div>
  )
}

// ─── Steel Trap Demo ─────────────────────────────────────────────────────────
const TRAP_STAGES = ["First Contact", "Qualified", "Demo", "Proposal", "Close"]
const TRAP_TIMESTAMPS = ["Mar 3 9:14a", "Mar 5 2:31p", "Mar 9 11:00a", "Mar 12 3:45p", "Mar 15 10:22a"]
const TRAP_TOUCHES = [1, 3, 4, 5, 7]
const LOSS_REASONS = [
  { reason: "Pricing objection", pct: 67, reco: "Recommend messaging review — value prop not landing" },
  { reason: "No decision-maker access", pct: 18, reco: "Route to BTC closer for multi-thread strategy" },
  { reason: "Went dark after demo", pct: 11, reco: "Enforce 7x rule — avg. only 3.2 touches before cold" },
]

function SteelTrapDemo() {
  const [stage, setStage] = useState(0)
  const [showLoss, setShowLoss] = useState(false)
  useEffect(() => {
    const t = setInterval(() => {
      setStage((s) => {
        if (s < TRAP_STAGES.length - 1) return s + 1
        setShowLoss(true)
        return s
      })
    }, 1400)
    return () => clearInterval(t)
  }, [])

  const touchCount = TRAP_TOUCHES[stage]
  const sevenXPct = Math.round((touchCount / 7) * 100)

  return (
    <div className="space-y-3">
      {/* Pipeline stage bar */}
      <div className="flex gap-1">
        {TRAP_STAGES.map((s, i) => (
          <motion.div
            key={i}
            animate={{ backgroundColor: i <= stage ? "#2563EB" : "#141923", color: i <= stage ? "#fff" : "#6B7280" }}
            transition={{ duration: 0.3 }}
            className="flex-1 rounded-lg px-1 py-2 text-center"
          >
            <span className="text-[10px] font-semibold leading-none block">{s}</span>
          </motion.div>
        ))}
      </div>

      {/* Animated lead card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={stage}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          className="rounded-sm border border-border bg-card p-4"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-blue-950/40 flex items-center justify-center">
                <Shield className="h-4 w-4 text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Apex Corp — $12,400</p>
                <p className="text-xs text-muted-foreground">{TRAP_TIMESTAMPS[stage]}</p>
              </div>
            </div>
            <span className="text-xs font-bold text-blue-400">Touch {touchCount}/7</span>
          </div>
          <div className="flex gap-1">
            {TRAP_STAGES.map((_, i) => (
              <div key={i} className="flex-1 h-1.5 rounded-full" style={{ backgroundColor: i <= stage ? "#2563EB" : "rgba(255,255,255,0.07)" }} />
            ))}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* 7x Rule + Forecast gauge */}
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-sm bg-deep border border-border px-3 py-2.5">
          <div className="flex items-center gap-1.5 mb-1">
            <Target className="h-3 w-3 text-blue-400" />
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">7x Rule</span>
          </div>
          <div className="h-1.5 rounded-full bg-card overflow-hidden">
            <motion.div
              animate={{ width: `${sevenXPct}%` }}
              transition={{ duration: 0.4 }}
              className="h-full rounded-full"
              style={{ backgroundColor: sevenXPct >= 100 ? "#16A34A" : sevenXPct >= 57 ? "#C4972A" : "#EF4444" }}
            />
          </div>
          <p className="text-[10px] text-muted-foreground mt-1">{touchCount}/7 contacts made</p>
        </div>
        <div className="rounded-sm bg-deep border border-border px-3 py-2.5 text-center">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">90-Day Forecast</p>
          <p className="text-lg font-extrabold text-foreground">87%</p>
          <p className="text-[10px] text-green-400 font-medium">Accuracy</p>
        </div>
      </div>

      {/* AI Loss Reason Panel */}
      <AnimatePresence>
        {showLoss && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-1.5">
            <div className="flex items-center gap-1.5 mb-1">
              <AlertTriangle className="h-3 w-3 text-orange-400" />
              <span className="text-[10px] font-semibold text-orange-400 uppercase tracking-wide">AI Loss Pattern Detection</span>
            </div>
            {LOSS_REASONS.map((l) => (
              <div key={l.reason} className="rounded-sm bg-card border border-border px-3 py-2">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-xs font-semibold text-foreground">{l.reason}</span>
                  <span className="text-xs font-bold text-orange-400">{l.pct}%</span>
                </div>
                <p className="text-[10px] text-muted-foreground leading-snug">{l.reco}</p>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── AI Calling Demo (Ford dealership recall scenario) ────────────────────────
const VOICE_TRANSCRIPT = [
  { role: "agent", text: "Hi, this is AIMS AI calling for River City Ford. Is this Mike?" },
  { role: "lead", text: "Yeah, that's me." },
  { role: "agent", text: "Great! We're following up on the recall notice for your 2021 Explorer. We have a service bay available this Thursday at 10am — does that work?" },
  { role: "lead", text: "Thursday at 10 works actually." },
  { role: "agent", text: "Perfect, I've got you down. We'll send a confirmation and reminder the morning of. Anything else I can help with?" },
  { role: "lead", text: "No that's it, thanks." },
  { role: "agent", text: "You're all set. See you Thursday, Mike! Have a great day." },
]

function AICallingDemo() {
  const [shown, setShown] = useState(0)
  const [playing, setPlaying] = useState(true)
  useEffect(() => {
    if (!playing) return
    if (shown >= VOICE_TRANSCRIPT.length) return
    const t = setTimeout(() => setShown((s) => s + 1), 1100)
    return () => clearTimeout(t)
  }, [shown, playing])

  function restart() { setShown(0); setPlaying(true) }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 mb-2">
        <motion.div
          animate={playing && shown < VOICE_TRANSCRIPT.length ? { scale: [1, 1.15, 1] } : {}}
          transition={{ repeat: Infinity, duration: 1.2 }}
          className="h-8 w-8 rounded-full bg-green-950/30 flex items-center justify-center"
        >
          <PhoneCall className="h-4 w-4 text-green-400" />
        </motion.div>
        <div>
          <p className="text-sm font-semibold text-foreground">AI Voice Agent — Ford Dealership</p>
          <p className="text-xs text-muted-foreground">Recall follow-up · 247 calls/day handled</p>
        </div>
        {playing && shown < VOICE_TRANSCRIPT.length && (
          <div className="ml-auto flex gap-0.5">
            {[1,2,3,4,5].map((b) => (
              <motion.div
                key={b}
                animate={{ scaleY: [0.4, 1, 0.4] }}
                transition={{ repeat: Infinity, duration: 0.6, delay: b * 0.1 }}
                className="w-0.5 h-5 bg-green-400 rounded-full origin-bottom"
              />
            ))}
          </div>
        )}
        {shown >= VOICE_TRANSCRIPT.length && (
          <button onClick={restart} className="ml-auto text-xs font-medium text-muted-foreground hover:text-muted-foreground flex items-center gap-1">
            <RefreshCw className="h-3 w-3" /> Replay
          </button>
        )}
      </div>
      <div className="space-y-1.5 min-h-[160px]">
        {VOICE_TRANSCRIPT.slice(0, shown).map((line, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: line.role === "agent" ? -8 : 8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            className={`flex ${line.role === "lead" ? "justify-end" : "justify-start"}`}
          >
            <div
              className="max-w-[82%] rounded-xl px-3 py-2 text-xs leading-snug"
              style={{
                backgroundColor: line.role === "agent" ? "rgba(59,130,246,0.15)" : "rgba(34,197,94,0.15)",
                color: line.role === "agent" ? "#93C5FD" : "#86EFAC",
              }}
            >
              {line.text}
            </div>
          </motion.div>
        ))}
      </div>
      {shown >= VOICE_TRANSCRIPT.length && (
        <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl bg-green-950/30 border border-green-800 px-4 py-3 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-green-400 flex-shrink-0" />
          <span className="text-xs font-semibold text-green-400">Appointment booked · CRM updated · Confirmation SMS sent</span>
        </motion.div>
      )}
    </div>
  )
}

// ─── Website + CRM + Chatbot Demo ────────────────────────────────────────────
const CRM_TABS = [
  {
    label: "Website",
    content: () => (
      <div className="space-y-3">
        <div className="rounded-sm border border-border bg-deep overflow-hidden">
          <div className="h-2.5 w-full bg-primary flex items-center gap-1 px-2">
            {[1,2,3].map(d => <div key={d} className="h-1.5 w-1.5 rounded-full bg-card/50" />)}
          </div>
          <div className="p-3 space-y-2">
            <div className="h-4 w-1/2 rounded bg-surface" />
            <div className="h-3 w-3/4 rounded bg-surface" />
            <div className="h-3 w-2/3 rounded bg-surface" />
            <div className="mt-3 h-7 w-28 rounded-sm bg-primary" />
          </div>
        </div>
        <p className="text-xs text-muted-foreground text-center">GHL-powered site — live in 3 days</p>
      </div>
    ),
  },
  {
    label: "Pipeline",
    content: () => (
      <div className="space-y-2">
        {[
          { name: "Apex Corp", stage: "Qualified", val: "$8,400", color: "#16A34A" },
          { name: "Vertex Inc", stage: "Demo Booked", val: "$5,200", color: "#2563EB" },
          { name: "Prism LLC", stage: "Proposal", val: "$12,000", color: "#EA580C" },
        ].map((d) => (
          <div key={d.name} className="flex items-center gap-3 rounded-sm bg-card border border-border px-3 py-2.5">
            <div className="h-7 w-7 rounded-full bg-deep flex items-center justify-center text-xs font-bold text-muted-foreground">{d.name[0]}</div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-foreground">{d.name}</p>
              <p className="text-xs text-muted-foreground">{d.stage}</p>
            </div>
            <span className="text-xs font-bold" style={{ color: d.color }}>{d.val}</span>
          </div>
        ))}
      </div>
    ),
  },
  {
    label: "Chatbot",
    content: () => (
      <div className="space-y-2">
        {[
          { role: "bot", text: "Hi! What brings you to our site today?" },
          { role: "user", text: "Looking for pricing on the growth plan." },
          { role: "bot", text: "Great choice! Growth is $197/mo. Want me to book a 15-min call?" },
          { role: "user", text: "Sure, Thursday works." },
        ].map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[78%] rounded-xl px-3 py-2 text-xs leading-snug ${m.role === "bot" ? "bg-blue-950/30 text-blue-300" : "bg-primary text-white"}`}>
              {m.text}
            </div>
          </div>
        ))}
      </div>
    ),
  },
  {
    label: "Analytics",
    content: () => (
      <div className="space-y-3">
        <div className="grid grid-cols-3 gap-2">
          {[["1,240", "Visitors"], ["68", "Leads"], ["5.5%", "CVR"]].map(([v, l]) => (
            <div key={l} className="rounded-sm bg-deep border border-border px-2 py-2.5 text-center">
              <p className="text-sm font-bold text-foreground">{v}</p>
              <p className="text-[10px] text-muted-foreground">{l}</p>
            </div>
          ))}
        </div>
        <div className="flex items-end gap-1 h-16">
          {[30, 45, 28, 60, 52, 70, 65].map((h, i) => (
            <div key={i} className="flex-1 rounded-t bg-primary opacity-70" style={{ height: `${h}%` }} />
          ))}
        </div>
        <p className="text-xs text-muted-foreground text-center">Leads captured last 7 days</p>
      </div>
    ),
  },
]

function WebsiteCRMDemo() {
  const [tab, setTab] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setTab((s) => (s + 1) % CRM_TABS.length), 3200)
    return () => clearInterval(t)
  }, [])
  const TabContent = CRM_TABS[tab].content
  return (
    <div className="space-y-4">
      <div className="flex gap-1">
        {CRM_TABS.map((t, i) => (
          <button
            key={i}
            onClick={() => setTab(i)}
            className="flex-1 rounded-lg px-1 py-2 text-center transition-all text-[11px] font-semibold"
            style={{ backgroundColor: tab === i ? "#C4972A" : "#141923", color: tab === i ? "white" : "#9CA3AF" }}
          >
            {t.label}
          </button>
        ))}
      </div>
      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.25 }}
        >
          <TabContent />
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

// ─── Finance / P&L Before–After Demo ─────────────────────────────────────────
const PL_ROWS = [
  { label: "Revenue", before: "$87,342", after: "$87,342", changed: false },
  { label: "COGS", before: "manually keyed", after: "$31,420 (36%)", changed: true },
  { label: "Gross Profit", before: "???", after: "$55,922", changed: true },
  { label: "Payroll", before: "3 spreadsheets", after: "$22,100", changed: true },
  { label: "SaaS / Tools", before: "unknown", after: "$4,810", changed: true },
  { label: "Net Profit", before: "???", after: "$28,012 (32%)", changed: true },
]

function FinanceDemo() {
  const [showAfter, setShowAfter] = useState(false)
  useEffect(() => {
    const t = setInterval(() => setShowAfter((s) => !s), 2400)
    return () => clearInterval(t)
  }, [])
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-1">
        <BarChart2 className="h-4 w-4 text-purple-600" />
        <span className="text-sm font-semibold text-foreground">P&L Automation</span>
        <div className="ml-auto flex gap-1">
          <button
            onClick={() => setShowAfter(false)}
            className={`text-[11px] font-semibold px-2 py-0.5 rounded-full transition ${!showAfter ? "bg-primary/15 text-primary" : "text-muted-foreground"}`}
          >
            Raw
          </button>
          <button
            onClick={() => setShowAfter(true)}
            className={`text-[11px] font-semibold px-2 py-0.5 rounded-full transition ${showAfter ? "bg-green-950/30 text-green-400" : "text-muted-foreground"}`}
          >
            AIMS Clean
          </button>
        </div>
      </div>
      <div className="rounded-sm border border-border bg-card overflow-hidden">
        <div className="grid grid-cols-2 border-b border-border bg-deep px-3 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
          <span>Line Item</span>
          <span className="text-right">{showAfter ? "Cleaned" : "Your data"}</span>
        </div>
        <AnimatePresence mode="wait">
          <motion.div key={showAfter ? "after" : "before"} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
            {PL_ROWS.map((row) => (
              <div key={row.label} className="grid grid-cols-2 px-3 py-2 border-b border-border/50 last:border-0">
                <span className="text-xs text-muted-foreground font-medium">{row.label}</span>
                <span className={`text-xs text-right font-semibold ${showAfter ? (row.changed ? "text-green-400" : "text-foreground") : "text-primary"}`}>
                  {showAfter ? row.after : row.before}
                </span>
              </div>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>
      {showAfter && (
        <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl bg-green-900/15 border border-green-800 px-3 py-2.5 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-green-400 flex-shrink-0" />
          <span className="text-xs font-semibold text-green-400">Clean P&L ready — auto-synced from QuickBooks</span>
        </motion.div>
      )}
    </div>
  )
}

// ─── Audience Targeting Demo ──────────────────────────────────────────────────
const AUDIENCE_RESULTS = [
  { label: "Plumbers in Dallas, TX (3-10 staff)", count: "2,847", score: 94 },
  { label: "HVAC owners, owned 5+ yrs, no website", count: "1,203", score: 91 },
  { label: "Auto dealers, <$5M rev, Google Ads buyer", count: "4,102", score: 88 },
  { label: "Dentists w/ 200+ contacts, no CRM", count: "892", score: 85 },
]
const QUERIES = [
  "Small business owners without AI tools",
  "Local service businesses in Texas",
  "B2B SaaS with 10-50 employees",
]

function AudienceDemo() {
  const [qIdx, setQIdx] = useState(0)
  const [typed, setTyped] = useState("")
  const [showResults, setShowResults] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    setTyped("")
    setShowResults(false)
    const target = QUERIES[qIdx]
    let i = 0
    const interval = setInterval(() => {
      if (i < target.length) {
        setTyped(target.slice(0, i + 1))
        i++
      } else {
        clearInterval(interval)
        timerRef.current = setTimeout(() => {
          setShowResults(true)
          timerRef.current = setTimeout(() => {
            setQIdx((s) => (s + 1) % QUERIES.length)
          }, 2200)
        }, 400)
      }
    }, 35)
    return () => { clearInterval(interval); if (timerRef.current) clearTimeout(timerRef.current) }
  }, [qIdx])

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-1">
        <Search className="h-4 w-4 text-blue-500" />
        <span className="text-sm font-semibold text-foreground">Audience Intelligence Search</span>
      </div>
      <div className="rounded-sm border border-border bg-card px-3 py-2.5 flex items-center gap-2">
        <Search className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
        <span className="text-sm text-foreground flex-1">
          {typed}
          <motion.span animate={{ opacity: [1, 0, 1] }} transition={{ repeat: Infinity, duration: 0.6 }} className="inline-block w-0.5 h-3.5 bg-deep0 ml-0.5 align-middle" />
        </span>
      </div>
      <AnimatePresence>
        {showResults && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-1.5">
            {AUDIENCE_RESULTS.slice(0, 3).map((r) => (
              <div key={r.label} className="flex items-center gap-3 rounded-sm bg-deep border border-border px-3 py-2.5">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground leading-tight">{r.label}</p>
                  <p className="text-[10px] text-muted-foreground">{r.count} matched</p>
                </div>
                <div className="flex-shrink-0 text-right">
                  <div className="text-xs font-bold text-primary">{r.score}%</div>
                  <div className="text-[10px] text-muted-foreground">match</div>
                </div>
              </div>
            ))}
            <div className="rounded-xl bg-blue-950/30 border border-blue-800 px-3 py-2 text-center">
              <span className="text-xs font-semibold text-blue-400">9,044 total contacts identified · Export to CRM</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Content Demo ─────────────────────────────────────────────────────────────
const CONTENT_VARIANTS = [
  "\"We doubled Apex Corp's pipeline in 30 days.\"",
  "\"The AI SDR that never sleeps — 47 meetings/mo.\"",
  "\"Your competitors are already using AIMS.\"",
  "\"From 0 to 200 qualified leads in 6 weeks.\"",
]

function ContentDemo() {
  const [idx, setIdx] = useState(0)
  const [typed, setTyped] = useState("")
  useEffect(() => {
    setTyped("")
    const target = CONTENT_VARIANTS[idx]
    let i = 0
    const t = setInterval(() => {
      if (i < target.length) { setTyped(target.slice(0, i + 1)); i++ }
      else { clearInterval(t); setTimeout(() => setIdx((s) => (s + 1) % CONTENT_VARIANTS.length), 1200) }
    }, 28)
    return () => clearInterval(t)
  }, [idx])
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium">
        <Image src="/integrations/openai-svgrepo-com.svg" alt="AI" width={16} height={16} />
        AI Content Generator
        <motion.div animate={{ opacity: [1,0,1] }} transition={{ repeat: Infinity, duration: 0.9 }} className="h-2 w-2 rounded-full bg-green-400 ml-auto" />
      </div>
      <div className="min-h-[64px] rounded-sm border border-border bg-card p-4">
        <p className="text-base font-semibold text-foreground leading-snug">
          {typed}
          <motion.span animate={{ opacity: [1,0,1] }} transition={{ repeat: Infinity, duration: 0.5 }} className="inline-block w-0.5 h-4 bg-foreground ml-0.5 align-middle" />
        </p>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {[["4.8/5", "Hook Score"], ["94%", "Open Rate"], ["2.1x", "CTR Lift"]].map(([val, lbl]) => (
          <div key={lbl} className="rounded-sm bg-deep border border-border px-3 py-2.5 text-center">
            <p className="text-base font-bold text-foreground">{val}</p>
            <p className="text-xs text-muted-foreground">{lbl}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Reactivation Demo ────────────────────────────────────────────────────────
function ReactivationDemo() {
  const [count, setCount] = useState(0)
  const [replied, setReplied] = useState(0)
  const TARGET = 652
  const REPLY_TARGET = 117
  useEffect(() => {
    setCount(0); setReplied(0)
    let frame = 0
    const t = setInterval(() => {
      frame++
      const progress = Math.min(frame / 60, 1)
      const ease = 1 - Math.pow(1 - progress, 3)
      setCount(Math.floor(ease * TARGET))
      setReplied(Math.floor(ease * REPLY_TARGET))
      if (progress >= 1) clearInterval(t)
    }, 30)
    return () => clearInterval(t)
  }, [])
  const pct = Math.round((REPLY_TARGET / 2783) * 100)
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-1">
        <RefreshCw className="h-4 w-4 text-primary" />
        <span className="text-sm font-semibold text-foreground">Dead CRM contacts scanned</span>
      </div>
      <div className="rounded-sm border border-border bg-card p-4">
        <div className="flex items-end gap-2">
          <span className="text-3xl font-extrabold text-foreground tabular-nums">{count.toLocaleString()}</span>
          <span className="text-sm text-muted-foreground mb-1">/ 2,783 contacts</span>
        </div>
        <div className="mt-2 h-2 rounded-full bg-deep overflow-hidden">
          <motion.div
            animate={{ width: `${(count / 2783) * 100}%` }}
            transition={{ duration: 0.05 }}
            className="h-full bg-gradient-to-r from-primary to-[#E8C46A] rounded-full"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-xl bg-green-900/15 border border-green-800 p-3">
          <p className="text-2xl font-extrabold text-green-400 tabular-nums">{replied}</p>
          <p className="text-xs text-green-400 font-medium">Replied positively</p>
        </div>
        <div className="rounded-xl bg-primary/10 border border-primary/20 p-3">
          <p className="text-2xl font-extrabold text-primary">{pct}%</p>
          <p className="text-xs text-primary font-medium">Reactivation rate</p>
        </div>
      </div>
    </div>
  )
}

// ─── Database Demo ────────────────────────────────────────────────────────────
const DB_FIELDS = [
  { label: "Bounced emails", count: 341, color: "#EF4444" },
  { label: "Duplicate records", count: 89, color: "#F97316" },
  { label: "Missing phone #s", count: 512, color: "#EAB308" },
  { label: "No job title", count: 203, color: "#3B82F6" },
]

function DatabaseDemo() {
  const [scanning, setScanning] = useState(true)
  const [progress, setProgress] = useState(0)
  useEffect(() => {
    setProgress(0); setScanning(true)
    const t = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) { clearInterval(t); setScanning(false); return 100 }
        return p + 2
      })
    }, 40)
    return () => clearInterval(t)
  }, [])
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-1">
        <Database className="h-4 w-4 text-blue-500" />
        <span className="text-sm font-semibold text-foreground">CRM Health Scanner</span>
        {scanning
          ? <motion.div animate={{ opacity: [1,0,1] }} transition={{ repeat: Infinity, duration: 0.7 }} className="ml-auto text-xs text-orange-500 font-medium">Scanning…</motion.div>
          : <span className="ml-auto text-xs text-green-400 font-semibold">Complete</span>
        }
      </div>
      <div className="rounded-sm border border-border bg-card p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-muted-foreground">Analyzing 8,430 records</span>
          <span className="text-xs font-bold text-foreground">{progress}%</span>
        </div>
        <div className="h-2 rounded-full bg-deep overflow-hidden">
          <motion.div
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.05 }}
            className="h-full bg-blue-500 rounded-full"
          />
        </div>
      </div>
      <AnimatePresence>
        {!scanning && (
          <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="space-y-1.5">
            {DB_FIELDS.map((f) => (
              <div key={f.label} className="flex items-center gap-3 rounded-sm bg-deep border border-border px-3 py-2.5">
                <div className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: f.color }} />
                <span className="text-xs text-muted-foreground flex-1">{f.label}</span>
                <span className="text-xs font-bold text-foreground">{f.count}</span>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Money Page Demo ─────────────────────────────────────────────────────────
const MOIC_CHANNELS = [
  { name: "Referral", moic: 8.4, color: "#16A34A" },
  { name: "Cold Email", moic: 5.1, color: "#2563EB" },
  { name: "Google Ads", moic: 3.2, color: "#EA580C" },
  { name: "LinkedIn", moic: 1.8, color: "#9333EA" },
]

const MONEY_TABS = ["C.O.M.", "MOIC", "Recovery"] as const

function MoneyPageDemo() {
  const [tab, setTab] = useState(0)
  const [comValue, setComValue] = useState(0)
  const [hoursFreed, setHoursFreed] = useState(0)
  const [spendCut, setSpendCut] = useState(0)
  const [revRecovered, setRevRecovered] = useState(0)

  useEffect(() => {
    const t = setInterval(() => setTab((s) => (s + 1) % MONEY_TABS.length), 3600)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    setComValue(0); setHoursFreed(0); setSpendCut(0); setRevRecovered(0)
    let frame = 0
    const t = setInterval(() => {
      frame++
      const progress = Math.min(frame / 50, 1)
      const ease = 1 - Math.pow(1 - progress, 3)
      if (tab === 0) setComValue(Math.floor(ease * 127))
      if (tab === 2) {
        setHoursFreed(Math.floor(ease * 340))
        setSpendCut(Math.floor(ease * 18400))
        setRevRecovered(Math.floor(ease * 142000))
      }
      if (progress >= 1) clearInterval(t)
    }, 25)
    return () => clearInterval(t)
  }, [tab])

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-1">
        <DollarSign className="h-4 w-4 text-primary" />
        <span className="text-sm font-semibold text-foreground">Money Page</span>
        <span className="ml-auto text-[10px] text-muted-foreground">Q1 2026</span>
      </div>
      <div className="flex gap-1">
        {MONEY_TABS.map((t, i) => (
          <button
            key={t}
            onClick={() => setTab(i)}
            className="flex-1 rounded-lg px-1 py-2 text-center transition-all text-[11px] font-semibold"
            style={{ backgroundColor: tab === i ? "#C4972A" : "#141923", color: tab === i ? "white" : "#9CA3AF" }}
          >
            {t}
          </button>
        ))}
      </div>
      <AnimatePresence mode="wait">
        {tab === 0 && (
          <motion.div key="com" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.25 }} className="space-y-2">
            <div className="rounded-sm border border-border bg-card p-4">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">Cost of Media (SG&A / Net New Leads)</p>
              <div className="flex items-end gap-2">
                <span className="text-3xl font-extrabold text-foreground tabular-nums">${comValue}</span>
                <span className="text-sm text-muted-foreground mb-1">per lead</span>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2 text-center">
                <div className="rounded-lg bg-deep border border-border px-2 py-1.5">
                  <p className="text-xs font-bold text-foreground">$84,200</p>
                  <p className="text-[10px] text-muted-foreground">Total SG&A</p>
                </div>
                <div className="rounded-lg bg-deep border border-border px-2 py-1.5">
                  <p className="text-xs font-bold text-foreground">663</p>
                  <p className="text-[10px] text-muted-foreground">Net New Leads</p>
                </div>
              </div>
            </div>
            <div className="rounded-xl bg-primary/10 border border-primary/20 px-3 py-2 flex items-center gap-2">
              <TrendingUp className="h-3.5 w-3.5 text-primary" />
              <span className="text-[11px] font-semibold text-primary">18% lower C.O.M. than industry avg.</span>
            </div>
          </motion.div>
        )}
        {tab === 1 && (
          <motion.div key="moic" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.25 }} className="space-y-2">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">MOIC by Channel — Return on Invested Capital</p>
            {MOIC_CHANNELS.map((ch, i) => (
              <div key={ch.name} className="flex items-center gap-2 rounded-sm bg-card border border-border px-3 py-2">
                <span className="text-[11px] text-muted-foreground w-16 flex-shrink-0">{ch.name}</span>
                <div className="flex-1 h-4 bg-deep rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(ch.moic / 10) * 100}%` }}
                    transition={{ duration: 0.8, delay: i * 0.12, ease: "easeOut" }}
                    className="h-full rounded-full"
                    style={{ backgroundColor: ch.color }}
                  />
                </div>
                <span className="text-xs font-bold text-foreground w-10 text-right tabular-nums">{ch.moic}x</span>
              </div>
            ))}
            <div className="rounded-xl bg-green-900/15 border border-green-800 px-3 py-2 text-center">
              <span className="text-[11px] font-semibold text-green-400">Referral + Cold Email = 78% of closed revenue</span>
            </div>
          </motion.div>
        )}
        {tab === 2 && (
          <motion.div key="recovery" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.25 }} className="space-y-2">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">AI Recovery Metric — This Quarter</p>
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-xl bg-blue-950/30 border border-blue-800 p-2.5 text-center">
                <p className="text-lg font-extrabold text-blue-400 tabular-nums">{hoursFreed}</p>
                <p className="text-[10px] text-blue-400 font-medium">Hours freed</p>
              </div>
              <div className="rounded-xl bg-green-900/15 border border-green-800 p-2.5 text-center">
                <p className="text-lg font-extrabold text-green-400 tabular-nums">${(spendCut / 1000).toFixed(1)}K</p>
                <p className="text-[10px] text-green-400 font-medium">Spend cut</p>
              </div>
              <div className="rounded-xl bg-primary/10 border border-primary/20 p-2.5 text-center">
                <p className="text-lg font-extrabold text-primary tabular-nums">${(revRecovered / 1000).toFixed(0)}K</p>
                <p className="text-[10px] text-primary font-medium">Recovered</p>
              </div>
            </div>
            <div className="rounded-sm border border-border bg-card p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-muted-foreground">AI Impact Score</span>
                <span className="text-xs font-bold text-foreground">92 / 100</span>
              </div>
              <div className="h-2 rounded-full bg-deep overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: "92%" }} transition={{ duration: 1, ease: "easeOut" }} className="h-full bg-gradient-to-r from-primary to-[#E8C46A] rounded-full" />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Slug → Demo Map ──────────────────────────────────────────────────────────
const DEMO_MAP: Record<string, React.ComponentType> = {
  "cold-outbound": WildDucksDemo,
  "revops-pipeline": SteelTrapDemo,
  "voice-agents": AICallingDemo,
  "content-production": ContentDemo,
  "lead-reactivation": ReactivationDemo,
  "database-reactivation": DatabaseDemo,
  "website-crm-chatbot": WebsiteCRMDemo,
  "finance-automation": FinanceDemo,
  "audience-targeting": AudienceDemo,
  "seo-aeo": MoneyPageDemo,
}

// Bare widget — rendered inline inside the hero column
export function ServiceDemoWidget({ slug }: { slug: string }) {
  const Demo = DEMO_MAP[slug]
  if (!Demo) return null
  return (
    <div className="bg-card rounded-2xl border border-border p-6 shadow-md">
      <Demo />
    </div>
  )
}

// Legacy standalone section — kept for slugs that don't have an inline hero demo
export function ServiceDemoSection({ slug }: { slug: string }) {
  const Demo = DEMO_MAP[slug]
  if (!Demo) return null

  return (
    <section className="py-20 bg-deep">
      <div className="container mx-auto max-w-4xl px-4">
        <h2 className="text-2xl font-bold text-foreground mb-2">See It In Action</h2>
        <p className="text-muted-foreground mb-8">Live interactive preview — this is what we build for you.</p>
        <div className="bg-card rounded-2xl border border-border p-8 shadow-sm max-w-lg mx-auto">
          <Demo />
        </div>
      </div>
    </section>
  )
}
