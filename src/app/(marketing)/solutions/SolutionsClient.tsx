"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import {
  ArrowRight,
  Check,
  Sparkles,
  Zap,
  Shield,
  DollarSign,
  TrendingUp,
  Target,
  AlertTriangle,
  PhoneCall,
  CheckCircle2,
} from "lucide-react"

/* ─── Wild Ducks Demo ──────────────────────────────────────────────────── */
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

/* ─── Money Page Demo ──────────────────────────────────────────────────── */
const MOIC_CHANNELS = [
  { name: "Referral", moic: 8.4, color: "#16A34A" },
  { name: "Cold Email", moic: 5.1, color: "#2563EB" },
  { name: "Google Ads", moic: 3.2, color: "#EA580C" },
  { name: "LinkedIn", moic: 1.8, color: "#9333EA" },
]

function MoneyPageDemo() {
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

/* ─── Steel Trap Demo ──────────────────────────────────────────────────── */
const TRAP_STAGES = ["1st Contact", "Qualified", "Demo", "Proposal", "Close"]
const TRAP_TOUCHES = [1, 3, 4, 5, 7]

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
    }, 1300)
    return () => clearInterval(t)
  }, [])

  const touches = TRAP_TOUCHES[stage]
  const sevenXPct = Math.round((touches / 7) * 100)

  return (
    <div className="space-y-2">
      <div className="flex gap-0.5">
        {TRAP_STAGES.map((s, i) => (
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
      <div className="rounded-sm border border-border bg-card/70 p-2.5">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-2">
            <Shield className="h-3.5 w-3.5 text-blue-400" />
            <span className="text-[11px] font-semibold text-foreground">Apex Corp - $12.4K</span>
          </div>
          <span className="text-[10px] font-bold text-blue-400">Touch {touches}/7</span>
        </div>
        <div className="flex gap-0.5">
          {TRAP_STAGES.map((_, i) => (
            <div key={i} className="flex-1 h-1 rounded-full" style={{ backgroundColor: i <= stage ? "#2563EB" : "rgba(255,255,255,0.07)" }} />
          ))}
        </div>
      </div>
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

/* ─── Solution Data ────────────────────────────────────────────────────── */

const DEMO_MAP: Record<string, React.ComponentType> = {
  "Wild Ducks": WildDucksDemo,
  "Money Page": MoneyPageDemo,
  "Steel Trap": SteelTrapDemo,
}

const ICON_MAP: Record<string, React.ElementType> = {
  "Wild Ducks": Zap,
  "Money Page": DollarSign,
  "Steel Trap": Shield,
}

const SOLUTION_PACKAGES = [
  {
    name: "Wild Ducks",
    tagline: "Outbound pipeline, fully deployed",
    description:
      "We build and run your entire cold outbound engine - ICP targeting, multi-domain infrastructure, AI-personalized sequences, and warm lead routing. You get meetings, we handle everything else.",
    services: [
      "Cold Outbound Engine",
      "AI Voice Agents",
      "Lead Enrichment",
      "Deliverability Infrastructure",
    ],
    idealFor: "B2B service businesses, agencies, consultancies",
  },
  {
    name: "Money Page",
    tagline: "Own your search presence across every channel",
    description:
      "We engineer your SEO and AEO strategy so you rank in Google and get cited by ChatGPT, Perplexity, and every AI answer engine. Content clusters, technical optimization, and authority building.",
    services: [
      "SEO & AEO Optimization",
      "AI Content Engine",
      "LinkedIn Outbound",
      "Reputation Engine",
    ],
    idealFor: "Thought leaders, consultants, professional services",
  },
  {
    name: "Steel Trap",
    tagline: "Revenue operations that never leak",
    description:
      "We architect your entire revenue operations layer - CRM, lead routing, attribution, conversion tracking, and rep performance dashboards. Full pipeline visibility, zero manual work.",
    services: [
      "RevOps Pipeline",
      "Sales Team Enablement",
      "AI Tool Tracker",
      "Finance Automation",
    ],
    idealFor: "Growing companies with 5-50 employees",
  },
]

/* ─── Solution Card ────────────────────────────────────────────────────── */

function SolutionCard({ pkg, index }: { pkg: typeof SOLUTION_PACKAGES[number]; index: number }) {
  const [hovered, setHovered] = useState(false)
  const Demo = DEMO_MAP[pkg.name]
  const Icon = ICON_MAP[pkg.name]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="group bg-card border border-border rounded-2xl shadow-sm hover:shadow-lg hover:border-primary/20 transition-all duration-300 flex flex-col overflow-hidden"
      style={{ minHeight: 440 }}
    >
      <div className="flex flex-col flex-1 p-5">
        {/* Header */}
        <div className="flex items-center gap-3 mb-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-sm bg-deep text-primary flex-shrink-0">
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">
              {pkg.name}
            </h2>
            <p className="text-xs font-medium text-primary">{pkg.tagline}</p>
          </div>
        </div>

        {/* Demo / Description toggle */}
        <div className="flex-1 relative overflow-hidden min-h-[240px]">
          <AnimatePresence mode="wait">
            {hovered && Demo ? (
              <motion.div
                key="demo"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="absolute inset-0"
              >
                <Demo />
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
                <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                  {pkg.description}
                </p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {pkg.services.map((s) => (
                    <span
                      key={s}
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-deep text-foreground text-xs font-medium rounded-full"
                    >
                      <Check className="w-3 h-3 text-green-400" />
                      {s}
                    </span>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Ideal for: {pkg.idealFor}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* CTA */}
        <div className="mt-auto pt-3 border-t border-border">
          <Link
            href="/get-started"
            className="inline-flex items-center justify-center gap-2 w-full rounded-sm bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary/90 transition-colors"
          >
            Book a Consultation
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </motion.div>
  )
}

/* ─── Main Page ────────────────────────────────────────────────────────── */

export function SolutionsClient() {
  return (
    <div className="min-h-screen bg-deep">
      {/* Hero */}
      <section className="pt-28 pb-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary text-sm font-medium rounded-full mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            Engagement Models
          </div>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-foreground mb-4">
            AI Engagements Built For Your Business
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            We don&rsquo;t sell tools. We deploy engineers inside your business
            to build and run AI systems that drive measurable outcomes from
            day one.
          </p>
        </div>
      </section>

      {/* Solution Cards - 3 column */}
      <section className="pb-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {SOLUTION_PACKAGES.map((pkg, i) => (
              <SolutionCard key={pkg.name} pkg={pkg} index={i} />
            ))}
          </div>
          <p className="text-center text-xs text-muted-foreground mt-4">
            Hover any card to see a live demo
          </p>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="pb-20 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-card border border-border rounded-2xl p-8 text-center shadow-sm">
            <h2 className="text-xl font-bold text-foreground mb-2">
              Not sure which solution fits?
            </h2>
            <p className="text-sm text-muted-foreground mb-6">
              Take our free AI Readiness Quiz. In 2 minutes you will get a
              personalized score and a recommended solution package matched to
              your business.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/tools/ai-readiness-quiz"
                className="inline-flex items-center justify-center gap-2 rounded-sm bg-primary px-6 py-3 text-sm font-semibold text-white hover:bg-primary/90 transition-colors"
              >
                Take the Free Quiz
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/marketplace"
                className="inline-flex items-center justify-center gap-2 rounded-sm border border-border px-6 py-3 text-sm font-semibold text-foreground hover:bg-surface transition-colors"
              >
                Explore All Engagements
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
