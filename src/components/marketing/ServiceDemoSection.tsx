"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import {
  CheckCircle2, TrendingUp, PhoneCall, RefreshCw, Database,
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

// ─── AI Calling Demo ──────────────────────────────────────────────────────────
const TRANSCRIPT = [
  { role: "agent", text: "Hey, is this Sarah from Apex Corp?" },
  { role: "lead", text: "Yes, this is her." },
  { role: "agent", text: "I'm calling about your growth targets this quarter — do you have 2 minutes?" },
  { role: "lead", text: "Sure, what's this about?" },
  { role: "agent", text: "We help B2B teams book 40+ meetings/mo with AI outbound. Want to see a quick demo?" },
  { role: "lead", text: "Actually yeah, send me a link." },
]

function AICallingDemo() {
  const [shown, setShown] = useState(1)
  useEffect(() => {
    if (shown >= TRANSCRIPT.length) return
    const t = setTimeout(() => setShown((s) => s + 1), 900)
    return () => clearTimeout(t)
  }, [shown])
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 mb-2">
        <motion.div
          animate={{ scale: [1, 1.15, 1] }}
          transition={{ repeat: Infinity, duration: 1.2 }}
          className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center"
        >
          <PhoneCall className="h-4 w-4 text-green-600" />
        </motion.div>
        <div>
          <p className="text-sm font-semibold text-gray-800">AI Voice Agent — Live Call</p>
          <p className="text-xs text-gray-400">Bland.ai · Twilio · CRM sync</p>
        </div>
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
      </div>
      <div className="space-y-1.5">
        {TRANSCRIPT.slice(0, shown).map((line, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: line.role === "agent" ? -8 : 8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            className={`flex ${line.role === "lead" ? "justify-end" : "justify-start"}`}
          >
            <div
              className="max-w-[80%] rounded-xl px-3 py-2 text-xs leading-snug"
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
