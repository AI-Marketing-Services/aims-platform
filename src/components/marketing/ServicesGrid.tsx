"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowUpRight, Play, Phone, PhoneCall, Zap, TrendingUp, RefreshCw, Database, CheckCircle2, ChevronRight, Shield, AlertTriangle, Target, DollarSign, Rocket } from "lucide-react"

// ─── Wild Ducks Demo ──────────────────────────────────────────────────────────
const WD_GRID_DEPTS = [
  { label: "Sales", sinks: [{ task: "Lead qualification", hrs: 12 }, { task: "CRM entry", hrs: 8 }] },
  { label: "Marketing", sinks: [{ task: "Content repurposing", hrs: 10 }, { task: "Reporting", hrs: 7 }] },
  { label: "Ops", sinks: [{ task: "Vendor follow-ups", hrs: 14 }, { task: "Invoice recon", hrs: 9 }] },
  { label: "Finance", sinks: [{ task: "Expense sorting", hrs: 11 }, { task: "P&L assembly", hrs: 8 }] },
]

function WildDucksDemo() {
  const [tab, setTab] = useState(0)
  const [scanProgress, setScanProgress] = useState(0)

  useEffect(() => {
    setScanProgress(0)
    const t = setInterval(() => {
      setScanProgress((p) => {
        if (p >= 100) { clearInterval(t); return 100 }
        return p + 3
      })
    }, 35)
    return () => clearInterval(t)
  }, [tab])

  const dept = WD_GRID_DEPTS[tab]
  const totalHrs = dept.sinks.reduce((a, s) => a + s.hrs, 0)

  return (
    <div className="space-y-2">
      <div className="flex gap-1">
        {WD_GRID_DEPTS.map((d, i) => (
          <button
            key={d.label}
            onClick={() => setTab(i)}
            className="flex-1 rounded-md px-1 py-1.5 text-center transition-all text-[10px] font-semibold"
            style={{ backgroundColor: tab === i ? "#C4972A" : "#141923", color: tab === i ? "white" : "#9CA3AF" }}
          >
            {d.label}
          </button>
        ))}
      </div>
      <AnimatePresence mode="wait">
        <motion.div key={tab} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.2 }}>
          <div className="rounded-sm border border-border bg-card/70 p-2.5 mb-1.5">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[9px] text-muted-foreground uppercase tracking-wide font-semibold">AI Opportunity Score</span>
              <span className="text-[9px] font-bold text-foreground">{scanProgress}%</span>
            </div>
            <div className="h-1 rounded-full bg-deep overflow-hidden">
              <motion.div animate={{ width: `${scanProgress}%` }} transition={{ duration: 0.05 }} className="h-full bg-gradient-to-r from-primary to-[#E8C46A] rounded-full" />
            </div>
          </div>
          {dept.sinks.map((sink) => (
            <div key={sink.task} className="flex items-center gap-2 rounded-lg bg-deep border border-border px-2.5 py-1.5 mb-1">
              <p className="text-[10px] font-medium text-foreground flex-1">{sink.task}</p>
              <span className="text-[10px] font-bold text-red-400">{sink.hrs}h/wk</span>
            </div>
          ))}
          <div className="rounded-sm bg-red-950/20 border border-red-800/40 px-2.5 py-1.5 mt-1.5">
            <span className="text-[10px] font-semibold text-red-400">{totalHrs}h/wk wasted in {dept.label}</span>
          </div>
        </motion.div>
      </AnimatePresence>
      <div className="mt-1 rounded-sm bg-primary/10 border border-primary/20 px-3 py-2 flex items-center gap-2">
        <TrendingUp className="h-3.5 w-3.5 text-primary" />
        <span className="text-[11px] font-semibold text-primary">40% avg. efficiency gain in 90 days</span>
      </div>
    </div>
  )
}

// ─── Steel Trap Demo ─────────────────────────────────────────────────────────
const TRAP_STAGES_GRID = ["1st Contact", "Qualified", "Demo", "Proposal", "Close"]
const TRAP_TOUCHES_GRID = [1, 3, 4, 5, 7]

function SteelTrapDemo() {
  const [stage, setStage] = useState(0)
  const [showLoss, setShowLoss] = useState(false)

  useEffect(() => {
    const t = setInterval(() => {
      setStage((s) => {
        if (s < TRAP_STAGES_GRID.length - 1) return s + 1
        setShowLoss(true)
        return s
      })
    }, 1300)
    return () => clearInterval(t)
  }, [])

  const touches = TRAP_TOUCHES_GRID[stage]
  const sevenXPct = Math.round((touches / 7) * 100)

  return (
    <div className="space-y-2">
      {/* Stage bar */}
      <div className="flex gap-0.5">
        {TRAP_STAGES_GRID.map((s, i) => (
          <motion.div
            key={i}
            animate={{ backgroundColor: i <= stage ? "#2563EB" : "#141923", color: i <= stage ? "#fff" : "#6B7280" }}
            transition={{ duration: 0.3 }}
            className="flex-1 rounded-md px-0.5 py-1.5 text-center"
          >
            <span className="text-[9px] font-semibold leading-none block">{s}</span>
          </motion.div>
        ))}
      </div>

      {/* Lead card */}
      <div className="rounded-sm border border-border bg-card/70 p-2.5">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-2">
            <Shield className="h-3.5 w-3.5 text-blue-400" />
            <span className="text-[11px] font-semibold text-foreground">Apex Corp - $12.4K</span>
          </div>
          <span className="text-[10px] font-bold text-blue-400">Touch {touches}/7</span>
        </div>
        <div className="flex gap-0.5">
          {TRAP_STAGES_GRID.map((_, i) => (
            <div key={i} className="flex-1 h-1 rounded-full" style={{ backgroundColor: i <= stage ? "#2563EB" : "rgba(255,255,255,0.07)" }} />
          ))}
        </div>
      </div>

      {/* 7x Rule + Forecast */}
      <div className="grid grid-cols-2 gap-1.5">
        <div className="rounded-lg bg-deep border border-border px-2 py-1.5">
          <div className="flex items-center gap-1 mb-1">
            <Target className="h-2.5 w-2.5 text-blue-400" />
            <span className="text-[9px] font-semibold text-muted-foreground">7x Rule</span>
          </div>
          <div className="h-1 rounded-full bg-card overflow-hidden">
            <motion.div animate={{ width: `${sevenXPct}%` }} className="h-full rounded-full" style={{ backgroundColor: sevenXPct >= 100 ? "#16A34A" : "#C4972A" }} />
          </div>
        </div>
        <div className="rounded-lg bg-deep border border-border px-2 py-1.5 text-center">
          <p className="text-sm font-bold text-foreground">87%</p>
          <p className="text-[9px] text-muted-foreground">Forecast Acc.</p>
        </div>
      </div>

      {/* AI Loss Pattern */}
      <AnimatePresence>
        {showLoss && (
          <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="rounded-sm bg-orange-950/20 border border-orange-800/40 px-2.5 py-2">
            <div className="flex items-center gap-1 mb-1">
              <AlertTriangle className="h-2.5 w-2.5 text-orange-400" />
              <span className="text-[9px] font-semibold text-orange-400">AI Loss Pattern</span>
            </div>
            <p className="text-[10px] text-foreground leading-snug">67% cite &quot;pricing&quot; - recommend messaging review</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── AI Calling Demo ─────────────────────────────────────────────────────────
const TRANSCRIPT = [
  { role: "agent", text: "Hey, is this Sarah from Apex Corp?" },
  { role: "lead", text: "Yes, this is her." },
  { role: "agent", text: "I'm calling about your growth targets this quarter - do you have 2 minutes?" },
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
    <div className="space-y-1.5">
      <div className="flex items-center gap-2 mb-2">
        <motion.div
          animate={{ scale: [1, 1.15, 1] }}
          transition={{ repeat: Infinity, duration: 1.2 }}
          className="h-6 w-6 rounded-full bg-green-950/30 flex items-center justify-center"
        >
          <PhoneCall className="h-3 w-3 text-green-400" />
        </motion.div>
        <div>
          <p className="text-[11px] font-semibold text-foreground">AI Voice Agent - Live Call</p>
          <p className="text-[10px] text-muted-foreground">Bland.ai · Twilio · CRM sync</p>
        </div>
        <div className="ml-auto flex gap-0.5">
          {[1,2,3,4,5].map((b) => (
            <motion.div
              key={b}
              animate={{ scaleY: [0.4, 1, 0.4] }}
              transition={{ repeat: Infinity, duration: 0.6, delay: b * 0.1 }}
              className="w-0.5 h-4 bg-green-400 rounded-full origin-bottom"
            />
          ))}
        </div>
      </div>
      <div className="space-y-1 max-h-[160px] overflow-hidden">
        {TRANSCRIPT.slice(0, shown).map((line, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: line.role === "agent" ? -8 : 8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            className={`flex ${line.role === "lead" ? "justify-end" : "justify-start"}`}
          >
            <div
              className="max-w-[80%] rounded-xl px-2.5 py-1.5 text-[10px] leading-snug"
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
    </div>
  )
}

// ─── Content Demo ─────────────────────────────────────────────────────────────
const CONTENT_POSTS = [
  {
    platform: "LinkedIn",
    logo: "/integrations/linkedin.svg",
    color: "#0A66C2",
    bg: "rgba(59,130,246,0.08)",
    snippet: "We helped a B2B SaaS team book 47 meetings in 30 days using AI outbound - here's the exact playbook 🧵",
    stat: "3.2K impressions",
  },
  {
    platform: "Instagram",
    logo: "/integrations/icons8-instagram.svg",
    color: "#E1306C",
    bg: "rgba(225,48,108,0.08)",
    snippet: "Your SDR team doesn't have to burn out chasing cold leads. Here's what AI-powered outbound actually looks like 👇",
    stat: "1.8K reach",
  },
  {
    platform: "TikTok",
    logo: "/integrations/tiktok.svg",
    color: "#010101",
    bg: "rgba(255,255,255,0.04)",
    snippet: "POV: You wake up to 12 new qualified meetings while your AI SDR worked overnight 🤖",
    stat: "22K views",
  },
  {
    platform: "X (Twitter)",
    logo: null,
    color: "#000000",
    bg: "rgba(255,255,255,0.04)",
    snippet: "Cold email isn't dead. Bad cold email is. Here's what an AI-personalized sequence actually looks like →",
    stat: "941 impressions",
  },
  {
    platform: "Email",
    logo: "/integrations/gmail.svg",
    color: "#EA4335",
    bg: "rgba(234,67,53,0.08)",
    snippet: "Subject: The 3-step framework we used to 3x pipeline for [Company Name]",
    stat: "68% open rate",
  },
]

function ContentDemo() {
  const [active, setActive] = useState(0)
  const [published, setPublished] = useState<number[]>([])

  useEffect(() => {
    setPublished([])
    setActive(0)
    let i = 0
    const t = setInterval(() => {
      setPublished((p) => [...p, i])
      i++
      if (i < CONTENT_POSTS.length) setActive(i)
      else clearInterval(t)
    }, 700)
    return () => clearInterval(t)
  }, [])

  const post = CONTENT_POSTS[active]

  return (
    <div className="space-y-2">
      {/* Platform pills */}
      <div className="flex gap-1.5 flex-wrap">
        {CONTENT_POSTS.map((p, i) => (
          <button
            key={p.platform}
            onClick={() => setActive(i)}
            className="flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-semibold transition-all border"
            style={{
              backgroundColor: active === i ? p.color : "#141923",
              color: active === i ? "white" : "#9CA3AF",
              borderColor: active === i ? p.color : "rgba(255,255,255,0.07)",
            }}
          >
            {p.logo
              ? <Image src={p.logo} alt={p.platform} width={11} height={11} className="object-contain" />
              : <span className="font-black text-[9px]">𝕏</span>
            }
            {p.platform.split(" ")[0]}
            {published.includes(i) && <CheckCircle2 className="h-2.5 w-2.5 ml-0.5" />}
          </button>
        ))}
      </div>

      {/* Active post preview */}
      <AnimatePresence mode="wait">
        <motion.div
          key={active}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.2 }}
          className="rounded-sm border border-border p-3"
          style={{ backgroundColor: post.bg }}
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="h-7 w-7 rounded-lg bg-card border border-border flex items-center justify-center flex-shrink-0">
              {post.logo
                ? <Image src={post.logo} alt={post.platform} width={15} height={15} className="object-contain" />
                : <span className="text-[11px] font-black text-foreground">𝕏</span>
              }
            </div>
            <span className="text-[11px] font-semibold text-foreground">{post.platform}</span>
            {published.includes(active) && (
              <span className="ml-auto text-[10px] font-semibold text-green-400 flex items-center gap-0.5">
                <CheckCircle2 className="h-3 w-3" /> Published
              </span>
            )}
          </div>
          <p className="text-[11px] text-foreground leading-snug line-clamp-2">{post.snippet}</p>
          <p className="text-[10px] font-semibold mt-1.5" style={{ color: post.color }}>{post.stat}</p>
        </motion.div>
      </AnimatePresence>

      <div className="rounded-lg bg-deep border border-border px-3 py-2 flex items-center justify-between">
        <span className="text-[10px] text-muted-foreground">This month</span>
        <span className="text-[11px] font-bold text-foreground">30+ assets published</span>
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
    setCount(0)
    setReplied(0)
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
    <div className="space-y-2">
      <div className="flex items-center gap-2 mb-1">
        <RefreshCw className="h-3.5 w-3.5 text-primary" />
        <span className="text-[11px] font-semibold text-foreground">Dead CRM contacts scanned</span>
      </div>
      <div className="rounded-sm border border-border bg-card/70 p-3">
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
      <div className="grid grid-cols-2 gap-1.5">
        <div className="rounded-lg bg-green-950/30 border border-green-800 p-2.5">
          <p className="text-xl font-extrabold text-green-400 tabular-nums">{replied}</p>
          <p className="text-[10px] text-green-500 font-medium">Replied positively</p>
        </div>
        <div className="rounded-sm bg-primary/10 border border-primary/20 p-2.5">
          <p className="text-xl font-extrabold text-primary">{pct}%</p>
          <p className="text-[10px] text-primary font-medium">Reactivation rate</p>
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
    setProgress(0)
    setScanning(true)
    const t = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) { clearInterval(t); setScanning(false); return 100 }
        return p + 2
      })
    }, 40)
    return () => clearInterval(t)
  }, [])

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 mb-1">
        <Database className="h-3.5 w-3.5 text-blue-500" />
        <span className="text-[11px] font-semibold text-foreground">CRM Health Scanner</span>
        {scanning
          ? <motion.div animate={{ opacity: [1,0,1] }} transition={{ repeat: Infinity, duration: 0.7 }} className="ml-auto text-[10px] text-orange-500 font-medium">Scanning…</motion.div>
          : <span className="ml-auto text-[10px] text-green-400 font-semibold">Complete</span>
        }
      </div>
      <div className="rounded-sm border border-border bg-card/70 p-2.5">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] text-muted-foreground">Analyzing 8,430 records</span>
          <span className="text-[10px] font-bold text-foreground">{progress}%</span>
        </div>
        <div className="h-1.5 rounded-full bg-deep overflow-hidden">
          <motion.div
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.05 }}
            className="h-full bg-blue-500 rounded-full"
          />
        </div>
      </div>
      <AnimatePresence>
        {!scanning && (
          <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="space-y-1">
            {DB_FIELDS.map((f) => (
              <div key={f.label} className="flex items-center gap-2 rounded-lg bg-deep border border-border px-2.5 py-1.5">
                <div className="h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: f.color }} />
                <span className="text-[10px] text-muted-foreground flex-1">{f.label}</span>
                <span className="text-[10px] font-bold text-foreground">{f.count}</span>
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

function MoneyPageGridDemo() {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 mb-1">
        <DollarSign className="h-3.5 w-3.5 text-primary" />
        <span className="text-[11px] font-semibold text-foreground">MOIC by Channel</span>
      </div>
      {MOIC_CHANNELS.map((ch, i) => (
        <div key={ch.name} className="flex items-center gap-2 rounded-lg bg-card/60 border border-border px-2.5 py-1.5">
          <span className="text-[10px] text-muted-foreground w-14 flex-shrink-0">{ch.name}</span>
          <div className="flex-1 h-3 bg-deep rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(ch.moic / 10) * 100}%` }}
              transition={{ duration: 0.8, delay: i * 0.12, ease: "easeOut" }}
              className="h-full rounded-full"
              style={{ backgroundColor: ch.color }}
            />
          </div>
          <span className="text-[10px] font-bold text-foreground w-8 text-right tabular-nums">{ch.moic}x</span>
        </div>
      ))}
      <div className="mt-2 rounded-sm bg-primary/10 border border-primary/20 px-3 py-2 flex items-center gap-2">
        <TrendingUp className="h-3.5 w-3.5 text-primary" />
        <span className="text-[11px] font-semibold text-primary">$127 C.O.M. - 18% below avg.</span>
      </div>
    </div>
  )
}

// ─── Service Card ─────────────────────────────────────────────────────────────
interface ServiceCard {
  slug: string
  name: string
  desc: string
  outcome: string
  icon: React.ReactNode
  tools: string[]
  Demo: React.ComponentType
  accentColor: string
  tags: string[]
}

const SERVICES: ServiceCard[] = [
  {
    slug: "cold-outbound",
    name: "Wild Ducks",
    desc: "Forward-deployed engineers that embed in your org, find AI opportunities, and deploy production solutions.",
    outcome: "40% operational efficiency gain in 90 days",
    icon: <Zap className="h-5 w-5" />,
    tools: ["/integrations/openai-svgrepo-com.svg", "/integrations/notion.svg", "/integrations/slack.png"],
    Demo: WildDucksDemo,
    accentColor: "#C4972A",
    tags: ["Time Intelligence", "Dept Discovery", "Opportunity Map", "AI Deployment"],
  },
  {
    slug: "revops-pipeline",
    name: "Steel Trap",
    desc: "Closed-loop sales data architecture tracking every lead, touch, and loss reason with deterministic fidelity.",
    outcome: "Zero-leak pipeline with BTC closing integration",
    icon: <Shield className="h-5 w-5" />,
    tools: ["/integrations/hubspot-svgrepo-com.svg", "/integrations/slack.png", "/integrations/openai-svgrepo-com.svg"],
    Demo: SteelTrapDemo,
    accentColor: "#2563EB",
    tags: ["Lead Lifecycle", "Loss Patterns", "7x Rule"],
  },
  {
    slug: "seo-aeo",
    name: "Money Page",
    desc: "Revenue intelligence that shows which channels multiply your investment and which quietly destroy it.",
    outcome: "Complete financial visibility into marketing ROI",
    icon: <DollarSign className="h-5 w-5" />,
    tools: ["/integrations/openai-svgrepo-com.svg", "/integrations/hubspot-svgrepo-com.svg", "/integrations/slack.png"],
    Demo: MoneyPageGridDemo,
    accentColor: "#C4972A",
    tags: ["C.O.M.", "MOIC", "AI Recovery", "Elasticity"],
  },
]

function ServiceCard({ service, index }: { service: ServiceCard; index: number }) {
  const [hovered, setHovered] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: index * 0.07 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="group relative flex flex-col rounded-2xl border border-border bg-card overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer"
      style={{ minHeight: 420 }}
    >
      <div className="flex flex-col flex-1 p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-sm bg-deep text-muted-foreground flex-shrink-0">
            {service.icon}
          </div>
          <div className="flex items-center gap-1.5">
            {service.tools.map((t, i) => (
              <div key={i} className="h-6 w-6 rounded-md bg-deep border border-border flex items-center justify-center">
                <Image src={t} alt="" width={13} height={13} className="object-contain" />
              </div>
            ))}
          </div>
        </div>

        <h3 className="text-sm font-bold text-foreground mb-1.5 group-hover:text-primary transition-colors">
          {service.name}
        </h3>

        {/* Demo / description toggle */}
        <div className="flex-1 relative overflow-hidden min-h-[220px]">
          <AnimatePresence mode="wait">
            {hovered ? (
              <motion.div
                key="demo"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="absolute inset-0"
              >
                <service.Demo />
              </motion.div>
            ) : (
              <motion.div
                key="desc"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="absolute inset-0"
              >
                <p className="text-xs text-muted-foreground leading-relaxed">{service.desc}</p>
                <div className="mt-3 rounded-lg bg-deep border border-border px-3 py-2">
                  <p className="text-[10px] text-muted-foreground mb-0.5">Client outcome</p>
                  <p className="text-xs font-bold text-foreground">{service.outcome}</p>
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {service.tags.map((tag) => (
                    <span key={tag} className="rounded-md bg-deep px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                      {tag}
                    </span>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer CTA */}
        <div className="mt-auto pt-3 border-t border-border flex items-center justify-between">
          <Link
            href={`/services/${service.slug}`}
            className="flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-primary transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            Explore Engagement
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
          <Link
            href={`/get-started?engagement=${service.slug}`}
            className="text-[10px] font-semibold text-primary hover:text-primary/80 transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            Book a Call
          </Link>
        </div>
      </div>
    </motion.div>
  )
}

// ─── Main Export ──────────────────────────────────────────────────────────────
export function ServicesGrid() {
  return (
    <section className="py-24 bg-deep">
      <div className="mx-auto max-w-6xl px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-14"
        >
          <span className="inline-block rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary mb-4">
            Core Engagements
          </span>
          <h2 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            Three flagship engagements
          </h2>
          <p className="mt-3 max-w-xl text-base text-muted-foreground">
            Forward-deployed engineers embedded in your operations. Each engagement is custom-scoped. Hover any card to see it in action.
          </p>
        </motion.div>

        {/* Grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SERVICES.map((service, i) => (
            <ServiceCard key={service.slug} service={service} index={i} />
          ))}
        </div>

        {/* View all */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="mt-10 text-center"
        >
          <Link
            href="/get-started"
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-6 py-3 text-sm font-semibold text-foreground shadow-sm hover:border-border hover:bg-surface transition"
          >
            Book a Consultation
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </motion.div>
      </div>
    </section>
  )
}
