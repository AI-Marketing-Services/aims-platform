"use client"

import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import {
  CheckCircle2, TrendingUp, PhoneCall, RefreshCw, Database,
  LayoutDashboard, BarChart2, Search, GripVertical,
} from "lucide-react"

// ─── Outbound Demo ────────────────────────────────────────────────────────────
const OUTBOUND_STEPS = [
  { tool: "/integrations/google-drive-svgrepo-com.svg", label: "Scrape ICP list", sub: "Clay → 2,400 contacts", color: "#4285F4" },
  { tool: "/integrations/openai-svgrepo-com.svg", label: "AI personalization", sub: "GPT-4 writes 1:1 copy", color: "#10A37F" },
  { tool: "/integrations/icons8-microsoft-teams.svg", label: "Multi-step sequence", sub: "Email D1 → D3 → D7 → D14", color: "#6264A7" },
  { tool: "/integrations/slack.png", label: "Reply routed to Slack", sub: "Hot lead alert fired", color: "#4A154B" },
]

function OutboundDemo() {
  const [step, setStep] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setStep((s) => (s + 1) % OUTBOUND_STEPS.length), 1400)
    return () => clearInterval(t)
  }, [])
  return (
    <div className="space-y-3">
      {OUTBOUND_STEPS.map((s, i) => (
        <motion.div
          key={i}
          animate={{ opacity: i <= step ? 1 : 0.25, x: i === step ? 4 : 0 }}
          transition={{ duration: 0.3 }}
          className="flex items-center gap-3 rounded-xl bg-white border border-gray-100 px-4 py-3"
        >
          <div className="h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${s.color}15` }}>
            <Image src={s.tool} alt="" width={18} height={18} className="object-contain" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-800 leading-none">{s.label}</p>
            <p className="text-xs text-gray-400 mt-0.5">{s.sub}</p>
          </div>
          {i < step && <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />}
          {i === step && (
            <motion.div
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ repeat: Infinity, duration: 0.8 }}
              className="h-2 w-2 rounded-full bg-red-500 flex-shrink-0"
            />
          )}
        </motion.div>
      ))}
      <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 flex items-center gap-2 mt-2">
        <TrendingUp className="h-4 w-4 text-red-600" />
        <span className="text-sm font-semibold text-red-700">47 qualified meetings booked this month</span>
      </div>
    </div>
  )
}

// ─── RevOps Demo ──────────────────────────────────────────────────────────────
const PIPELINE_STAGES = ["New Lead", "Qualified", "Demo", "Proposal", "Closed"]
const PIPELINE_DEALS = [
  { name: "Apex Corp", value: "$8,400", stage: 0 },
  { name: "Vertex Inc", value: "$5,200", stage: 1 },
  { name: "Prism LLC", value: "$12,000", stage: 2 },
  { name: "Orbit Co", value: "$3,800", stage: 3 },
  { name: "Nexus AI", value: "$9,100", stage: 4 },
]

function RevOpsDemo() {
  const [active, setActive] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setActive((s) => (s + 1) % PIPELINE_STAGES.length), 1200)
    return () => clearInterval(t)
  }, [])
  const stageDeal = PIPELINE_DEALS[active]
  return (
    <div className="space-y-3">
      <div className="flex gap-1">
        {PIPELINE_STAGES.map((stage, i) => (
          <button
            key={i}
            onClick={() => setActive(i)}
            className="flex-1 rounded-lg px-1 py-2 text-center transition-all"
            style={{ backgroundColor: active === i ? "#DC2626" : "#F3F4F6", color: active === i ? "white" : "#6B7280" }}
          >
            <span className="text-[10px] font-semibold leading-none block">{stage}</span>
          </button>
        ))}
      </div>
      <AnimatePresence mode="wait">
        <motion.div
          key={active}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.25 }}
          className="rounded-xl border border-gray-100 bg-white p-4"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center text-sm font-bold text-gray-600">
                {stageDeal.name.charAt(0)}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800">{stageDeal.name}</p>
                <p className="text-xs text-gray-400">Stage: {PIPELINE_STAGES[stageDeal.stage]}</p>
              </div>
            </div>
            <span className="text-sm font-bold text-green-600">{stageDeal.value}</span>
          </div>
          <div className="flex gap-1">
            {PIPELINE_STAGES.map((_, i) => (
              <div key={i} className="flex-1 h-1.5 rounded-full" style={{ backgroundColor: i <= active ? "#DC2626" : "#E5E7EB" }} />
            ))}
          </div>
        </motion.div>
      </AnimatePresence>
      <div className="grid grid-cols-3 gap-2">
        {[["$47.2K", "Pipeline"], ["82%", "Win Rate"], ["4 days", "Avg. Close"]].map(([val, lbl]) => (
          <div key={lbl} className="rounded-xl bg-gray-50 border border-gray-100 px-3 py-2.5 text-center">
            <p className="text-base font-bold text-gray-800">{val}</p>
            <p className="text-xs text-gray-400">{lbl}</p>
          </div>
        ))}
      </div>
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
          className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center"
        >
          <PhoneCall className="h-4 w-4 text-green-600" />
        </motion.div>
        <div>
          <p className="text-sm font-semibold text-gray-800">AI Voice Agent — Ford Dealership</p>
          <p className="text-xs text-gray-400">Recall follow-up · 247 calls/day handled</p>
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
          <button onClick={restart} className="ml-auto text-xs font-medium text-gray-400 hover:text-gray-600 flex items-center gap-1">
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
                backgroundColor: line.role === "agent" ? "#EFF6FF" : "#F0FDF4",
                color: line.role === "agent" ? "#1D4ED8" : "#166534",
              }}
            >
              {line.text}
            </div>
          </motion.div>
        ))}
      </div>
      {shown >= VOICE_TRANSCRIPT.length && (
        <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl bg-green-50 border border-green-100 px-4 py-3 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
          <span className="text-xs font-semibold text-green-700">Appointment booked · CRM updated · Confirmation SMS sent</span>
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
        <div className="rounded-xl border border-gray-100 bg-gray-50 overflow-hidden">
          <div className="h-2.5 w-full bg-[#DC2626] flex items-center gap-1 px-2">
            {[1,2,3].map(d => <div key={d} className="h-1.5 w-1.5 rounded-full bg-white/50" />)}
          </div>
          <div className="p-3 space-y-2">
            <div className="h-4 w-1/2 rounded bg-gray-200" />
            <div className="h-3 w-3/4 rounded bg-gray-200" />
            <div className="h-3 w-2/3 rounded bg-gray-200" />
            <div className="mt-3 h-7 w-28 rounded-lg bg-[#DC2626]" />
          </div>
        </div>
        <p className="text-xs text-gray-500 text-center">GHL-powered site — live in 3 days</p>
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
          <div key={d.name} className="flex items-center gap-3 rounded-xl bg-white border border-gray-100 px-3 py-2.5">
            <div className="h-7 w-7 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-600">{d.name[0]}</div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-gray-800">{d.name}</p>
              <p className="text-xs text-gray-400">{d.stage}</p>
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
            <div className={`max-w-[78%] rounded-xl px-3 py-2 text-xs leading-snug ${m.role === "bot" ? "bg-blue-50 text-blue-800" : "bg-[#DC2626] text-white"}`}>
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
            <div key={l} className="rounded-xl bg-gray-50 border border-gray-100 px-2 py-2.5 text-center">
              <p className="text-sm font-bold text-gray-800">{v}</p>
              <p className="text-[10px] text-gray-400">{l}</p>
            </div>
          ))}
        </div>
        <div className="flex items-end gap-1 h-16">
          {[30, 45, 28, 60, 52, 70, 65].map((h, i) => (
            <div key={i} className="flex-1 rounded-t bg-[#DC2626] opacity-70" style={{ height: `${h}%` }} />
          ))}
        </div>
        <p className="text-xs text-gray-400 text-center">Leads captured last 7 days</p>
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
            style={{ backgroundColor: tab === i ? "#DC2626" : "#F3F4F6", color: tab === i ? "white" : "#6B7280" }}
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
        <span className="text-sm font-semibold text-gray-700">P&L Automation</span>
        <div className="ml-auto flex gap-1">
          <button
            onClick={() => setShowAfter(false)}
            className={`text-[11px] font-semibold px-2 py-0.5 rounded-full transition ${!showAfter ? "bg-red-100 text-red-700" : "text-gray-400"}`}
          >
            Raw
          </button>
          <button
            onClick={() => setShowAfter(true)}
            className={`text-[11px] font-semibold px-2 py-0.5 rounded-full transition ${showAfter ? "bg-green-100 text-green-700" : "text-gray-400"}`}
          >
            AIMS Clean
          </button>
        </div>
      </div>
      <div className="rounded-xl border border-gray-100 bg-white overflow-hidden">
        <div className="grid grid-cols-2 border-b border-gray-100 bg-gray-50 px-3 py-1.5 text-[10px] font-semibold text-gray-500 uppercase tracking-wide">
          <span>Line Item</span>
          <span className="text-right">{showAfter ? "Cleaned" : "Your data"}</span>
        </div>
        <AnimatePresence mode="wait">
          <motion.div key={showAfter ? "after" : "before"} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
            {PL_ROWS.map((row) => (
              <div key={row.label} className="grid grid-cols-2 px-3 py-2 border-b border-gray-50 last:border-0">
                <span className="text-xs text-gray-600 font-medium">{row.label}</span>
                <span className={`text-xs text-right font-semibold ${showAfter ? (row.changed ? "text-green-700" : "text-gray-700") : "text-red-500"}`}>
                  {showAfter ? row.after : row.before}
                </span>
              </div>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>
      {showAfter && (
        <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl bg-green-50 border border-green-100 px-3 py-2.5 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
          <span className="text-xs font-semibold text-green-700">Clean P&L ready — auto-synced from QuickBooks</span>
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
        <span className="text-sm font-semibold text-gray-700">Audience Intelligence Search</span>
      </div>
      <div className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 flex items-center gap-2">
        <Search className="h-3.5 w-3.5 text-gray-300 flex-shrink-0" />
        <span className="text-sm text-gray-700 flex-1">
          {typed}
          <motion.span animate={{ opacity: [1, 0, 1] }} transition={{ repeat: Infinity, duration: 0.6 }} className="inline-block w-0.5 h-3.5 bg-gray-500 ml-0.5 align-middle" />
        </span>
      </div>
      <AnimatePresence>
        {showResults && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-1.5">
            {AUDIENCE_RESULTS.slice(0, 3).map((r) => (
              <div key={r.label} className="flex items-center gap-3 rounded-xl bg-gray-50 border border-gray-100 px-3 py-2.5">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-700 leading-tight">{r.label}</p>
                  <p className="text-[10px] text-gray-400">{r.count} matched</p>
                </div>
                <div className="flex-shrink-0 text-right">
                  <div className="text-xs font-bold text-[#DC2626]">{r.score}%</div>
                  <div className="text-[10px] text-gray-400">match</div>
                </div>
              </div>
            ))}
            <div className="rounded-xl bg-blue-50 border border-blue-100 px-3 py-2 text-center">
              <span className="text-xs font-semibold text-blue-700">9,044 total contacts identified · Export to CRM</span>
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
      <div className="flex items-center gap-2 text-sm text-gray-500 font-medium">
        <Image src="/integrations/openai-svgrepo-com.svg" alt="AI" width={16} height={16} />
        AI Content Generator
        <motion.div animate={{ opacity: [1,0,1] }} transition={{ repeat: Infinity, duration: 0.9 }} className="h-2 w-2 rounded-full bg-green-500 ml-auto" />
      </div>
      <div className="min-h-[64px] rounded-xl border border-gray-100 bg-white p-4">
        <p className="text-base font-semibold text-gray-800 leading-snug">
          {typed}
          <motion.span animate={{ opacity: [1,0,1] }} transition={{ repeat: Infinity, duration: 0.5 }} className="inline-block w-0.5 h-4 bg-gray-700 ml-0.5 align-middle" />
        </p>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {[["4.8/5", "Hook Score"], ["94%", "Open Rate"], ["2.1x", "CTR Lift"]].map(([val, lbl]) => (
          <div key={lbl} className="rounded-xl bg-gray-50 border border-gray-100 px-3 py-2.5 text-center">
            <p className="text-base font-bold text-gray-800">{val}</p>
            <p className="text-xs text-gray-400">{lbl}</p>
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
        <RefreshCw className="h-4 w-4 text-red-500" />
        <span className="text-sm font-semibold text-gray-700">Dead CRM contacts scanned</span>
      </div>
      <div className="rounded-xl border border-gray-100 bg-white p-4">
        <div className="flex items-end gap-2">
          <span className="text-3xl font-extrabold text-gray-900 tabular-nums">{count.toLocaleString()}</span>
          <span className="text-sm text-gray-400 mb-1">/ 2,783 contacts</span>
        </div>
        <div className="mt-2 h-2 rounded-full bg-gray-100 overflow-hidden">
          <motion.div
            animate={{ width: `${(count / 2783) * 100}%` }}
            transition={{ duration: 0.05 }}
            className="h-full bg-gradient-to-r from-red-500 to-red-400 rounded-full"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-xl bg-green-50 border border-green-100 p-3">
          <p className="text-2xl font-extrabold text-green-700 tabular-nums">{replied}</p>
          <p className="text-xs text-green-600 font-medium">Replied positively</p>
        </div>
        <div className="rounded-xl bg-red-50 border border-red-100 p-3">
          <p className="text-2xl font-extrabold text-red-700">{pct}%</p>
          <p className="text-xs text-red-600 font-medium">Reactivation rate</p>
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
        <span className="text-sm font-semibold text-gray-700">CRM Health Scanner</span>
        {scanning
          ? <motion.div animate={{ opacity: [1,0,1] }} transition={{ repeat: Infinity, duration: 0.7 }} className="ml-auto text-xs text-orange-500 font-medium">Scanning…</motion.div>
          : <span className="ml-auto text-xs text-green-600 font-semibold">Complete</span>
        }
      </div>
      <div className="rounded-xl border border-gray-100 bg-white p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-gray-500">Analyzing 8,430 records</span>
          <span className="text-xs font-bold text-gray-700">{progress}%</span>
        </div>
        <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
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
              <div key={f.label} className="flex items-center gap-3 rounded-xl bg-gray-50 border border-gray-100 px-3 py-2.5">
                <div className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: f.color }} />
                <span className="text-xs text-gray-600 flex-1">{f.label}</span>
                <span className="text-xs font-bold text-gray-800">{f.count}</span>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Slug → Demo Map ──────────────────────────────────────────────────────────
const DEMO_MAP: Record<string, React.ComponentType> = {
  "cold-outbound": OutboundDemo,
  "revops-pipeline": RevOpsDemo,
  "voice-agents": AICallingDemo,
  "content-production": ContentDemo,
  "lead-reactivation": ReactivationDemo,
  "database-reactivation": DatabaseDemo,
  "website-crm-chatbot": WebsiteCRMDemo,
  "finance-automation": FinanceDemo,
  "audience-targeting": AudienceDemo,
}

export function ServiceDemoSection({ slug }: { slug: string }) {
  const Demo = DEMO_MAP[slug]
  if (!Demo) return null

  return (
    <section className="py-20 bg-[#F5F5F5]">
      <div className="container mx-auto max-w-4xl px-4">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">See It In Action</h2>
        <p className="text-gray-500 mb-8">Live interactive preview — this is what we build for you.</p>
        <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm max-w-lg mx-auto">
          <Demo />
        </div>
      </div>
    </section>
  )
}
