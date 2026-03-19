"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowUpRight, Play, Phone, PhoneCall, Zap, TrendingUp, RefreshCw, Database, CheckCircle2, ChevronRight } from "lucide-react"

// ─── Outbound Demo ────────────────────────────────────────────────────────────
const OUTBOUND_STEPS = [
  { tool: "/integrations/apollo.svg", label: "Build ICP list", sub: "Clay → Apollo → 2,400 contacts", color: "#C4972A" },
  { tool: "/integrations/openai-svgrepo-com.svg", label: "AI personalization", sub: "Claude writes 1:1 copy", color: "#10A37F" },
  { tool: "/integrations/instantly.webp", label: "Multi-step sequence", sub: "Email D1 → D3 → D7 → D14", color: "#6264A7" },
  { tool: "/integrations/slack.png", label: "Reply routed to Slack", sub: "Hot lead alert fired", color: "#4A154B" },
]

function OutboundDemo() {
  const [step, setStep] = useState(0)

  useEffect(() => {
    const t = setInterval(() => setStep((s) => (s + 1) % OUTBOUND_STEPS.length), 1400)
    return () => clearInterval(t)
  }, [])

  return (
    <div className="space-y-2">
      {OUTBOUND_STEPS.map((s, i) => (
        <motion.div
          key={i}
          animate={{ opacity: i <= step ? 1 : 0.25, x: i === step ? 4 : 0 }}
          transition={{ duration: 0.3 }}
          className="flex items-center gap-2.5 rounded-lg bg-card/60 border border-border px-3 py-2"
        >
          <div
            className="h-6 w-6 rounded-md flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: `${s.color}15` }}
          >
            <Image src={s.tool} alt="" width={14} height={14} className="object-contain" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-semibold text-foreground leading-none">{s.label}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{s.sub}</p>
          </div>
          {i < step && <CheckCircle2 className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />}
          {i === step && (
            <motion.div
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ repeat: Infinity, duration: 0.8 }}
              className="h-1.5 w-1.5 rounded-full bg-primary/100 flex-shrink-0"
            />
          )}
        </motion.div>
      ))}
      <div className="mt-2 rounded-sm bg-primary/10 border border-primary/20 px-3 py-2 flex items-center gap-2">
        <TrendingUp className="h-3.5 w-3.5 text-primary" />
        <span className="text-[11px] font-semibold text-primary">47 qualified meetings booked this month</span>
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
    <div className="space-y-2">
      <div className="flex gap-1">
        {PIPELINE_STAGES.map((stage, i) => (
          <button
            key={i}
            onClick={() => setActive(i)}
            className="flex-1 rounded-md px-1 py-1.5 text-center transition-all"
            style={{
              backgroundColor: active === i ? "#C4972A" : "#141923",
              color: active === i ? "white" : "#9CA3AF",
            }}
          >
            <span className="text-[9px] font-semibold leading-none block">{stage}</span>
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
          className="rounded-sm border border-border bg-card/70 p-3"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-full bg-deep flex items-center justify-center text-[11px] font-bold text-muted-foreground">
                {stageDeal.name.charAt(0)}
              </div>
              <div>
                <p className="text-xs font-semibold text-foreground">{stageDeal.name}</p>
                <p className="text-[10px] text-muted-foreground">Stage: {PIPELINE_STAGES[stageDeal.stage]}</p>
              </div>
            </div>
            <span className="text-xs font-bold text-green-400">{stageDeal.value}</span>
          </div>
          <div className="flex gap-1">
            {PIPELINE_STAGES.map((_, i) => (
              <div key={i} className="flex-1 h-1 rounded-full" style={{ backgroundColor: i <= active ? "#C4972A" : "rgba(255,255,255,0.07)" }} />
            ))}
          </div>
        </motion.div>
      </AnimatePresence>
      <div className="grid grid-cols-3 gap-1.5">
        {[["$47.2K", "Pipeline"], ["82%", "Win Rate"], ["4 days", "Avg. Close"]].map(([val, lbl]) => (
          <div key={lbl} className="rounded-lg bg-deep border border-border px-2 py-1.5 text-center">
            <p className="text-sm font-bold text-foreground">{val}</p>
            <p className="text-[9px] text-muted-foreground">{lbl}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── AI Calling Demo ─────────────────────────────────────────────────────────
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
          <p className="text-[11px] font-semibold text-foreground">AI Voice Agent — Live Call</p>
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
    snippet: "We helped a B2B SaaS team book 47 meetings in 30 days using AI outbound — here's the exact playbook 🧵",
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
    desc: "Multi-domain email infra, AI SDR reply handling, auto-enrichment, and deliverability monitoring — all managed end-to-end.",
    outcome: "Avg. 47 qualified meetings / mo",
    icon: <Zap className="h-5 w-5" />,
    tools: ["/integrations/instantly.webp", "/integrations/apollo.svg", "/integrations/hubspot-svgrepo-com.svg"],
    Demo: OutboundDemo,
    accentColor: "#C4972A",
    tags: ["Email Sequences", "AI SDR", "Lead Enrichment"],
  },
  {
    slug: "revops-pipeline",
    name: "Steel Trap",
    desc: "CRM architecture, lead routing, attribution, conversion dashboards, and rep coaching — built for revenue teams.",
    outcome: "Full pipeline visibility in 7 days",
    icon: <TrendingUp className="h-5 w-5" />,
    tools: ["/integrations/hubspot-svgrepo-com.svg", "/integrations/salesforce.svg", "/integrations/slack.png"],
    Demo: RevOpsDemo,
    accentColor: "#2563EB",
    tags: ["CRM Build", "Attribution", "Routing"],
  },
  {
    slug: "voice-agents",
    name: "AI Calling Agents",
    desc: "Inbound and outbound AI voice agents with multi-location routing, live transcripts, and CRM sync.",
    outcome: "2.4x pickup-to-meeting rate",
    icon: <Phone className="h-5 w-5" />,
    tools: ["/integrations/openai-svgrepo-com.svg", "/integrations/hubspot-svgrepo-com.svg", "/integrations/slack.png"],
    Demo: AICallingDemo,
    accentColor: "#16A34A",
    tags: ["Voice AI", "Inbound", "Outbound"],
  },
  {
    slug: "content-production",
    name: "Content Production Pod",
    desc: "AI-powered content calendar, short-form video scripts, email copy, and LinkedIn ghostwriting — published weekly.",
    outcome: "30+ assets per month, fully managed",
    icon: <Play className="h-5 w-5" />,
    tools: ["/integrations/openai-svgrepo-com.svg", "/integrations/linkedin.svg", "/integrations/notion.svg"],
    Demo: ContentDemo,
    accentColor: "#EA580C",
    tags: ["AI Copy", "Video Scripts", "LinkedIn"],
  },
  {
    slug: "lead-reactivation",
    name: "Lead Reactivation",
    desc: "Turn dead CRM contacts into booked meetings using AI personalization and multi-channel reactivation sequences.",
    outcome: "18% of dead leads convert in 30 days",
    icon: <RefreshCw className="h-5 w-5" />,
    tools: ["/integrations/instantly.webp", "/integrations/openai-svgrepo-com.svg", "/integrations/hubspot-svgrepo-com.svg"],
    Demo: ReactivationDemo,
    accentColor: "#C4972A",
    tags: ["Reactivation", "AI Copy", "Multi-Channel"],
  },
  {
    slug: "database-reactivation",
    name: "Database Reactivation",
    desc: "Full CRM audit, deduplication, re-enrichment, and a scored outreach plan to monetize your existing contacts.",
    outcome: "Avg. $24K recovered pipeline per client",
    icon: <Database className="h-5 w-5" />,
    tools: ["/integrations/hubspot-svgrepo-com.svg", "/integrations/apollo.svg", "/integrations/openai-svgrepo-com.svg"],
    Demo: DatabaseDemo,
    accentColor: "#9333EA",
    tags: ["CRM Audit", "Enrichment", "Dedup"],
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
            Learn more
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
          <span className="text-[10px] text-muted-foreground">
            {hovered ? "Live preview" : "Hover to demo"}
          </span>
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
            Core Services
          </span>
          <h2 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            Every way we fill your pipeline
          </h2>
          <p className="mt-3 max-w-xl text-base text-muted-foreground">
            Outbound. Inbound. Reactivation. Content. Paid. All AI-powered, all fully managed. Hover any card to see it in action.
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
            href="/marketplace"
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-6 py-3 text-sm font-semibold text-foreground shadow-sm hover:border-border hover:bg-surface transition"
          >
            View all 21 services
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </motion.div>
      </div>
    </section>
  )
}
