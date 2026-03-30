"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence, type Transition } from "framer-motion"
import {
  Building2,
  Users,
  TrendingUp,
  ArrowRight,
  ChevronLeft,
  Loader2,
  CheckCircle2,
  DollarSign,
  Zap,
  Copy,
  BarChart3,
  Target,
  Clock,
  Briefcase,
} from "lucide-react"
import { cn } from "@/lib/utils"

// ─── Types ────────────────────────────────────────────────────────────────────

type Phase =
  | "intro"
  | "snapshot"
  | "departments"
  | "dept-drill"
  | "bottlenecks"
  | "cost-capacity"
  | "ai-readiness"
  | "email"
  | "submitting"
  | "results"

interface DeptEntry {
  id: string
  name: string
  headcount: number
  manualHoursPerWeek: number
  selected: boolean
  answers: string[]
}

interface AuditData {
  snapshot: {
    headcount: string
    revenue: string
    industry: string
    topGoal: string
  }
  departments: DeptEntry[]
  bottlenecks: {
    biggestHeadache: string
    highPaidWaste: string
    eliminateOne: string
    aiAgentPlacement: string
  }
  costCapacity: {
    manualHoursWeekly: number
    monthlyToolSpend: number
    extraHoursUse: string
  }
  aiReadiness: {
    currentTools: string[]
    automationAttempts: string
    resistantDept: string
  }
  scores: {
    overall: number
    costOfInefficiency: number
    aiRoiPotential: number
    byDepartment: Record<string, number>
  }
}

// ─── Config ───────────────────────────────────────────────────────────────────

const DEPARTMENTS = [
  {
    id: "sales",
    name: "Sales & Business Development",
    questions: [
      "What % of your sales team's time goes to admin, data entry, or manual follow-up scheduling?",
      "Where do leads most often fall through the cracks?",
      "What's the single biggest thing slowing down your close rate?",
    ],
  },
  {
    id: "marketing",
    name: "Marketing & Lead Generation",
    questions: [
      "How long does it take your team to produce a campaign or piece of content?",
      "What marketing task consumes the most time for the least measurable output?",
      "How are leads currently handed off to sales, and where does that process break?",
    ],
  },
  {
    id: "customer-success",
    name: "Customer Success & Retention",
    questions: [
      "What's your current churn rate, and what's the #1 reason customers leave?",
      "How much of your CS team's time is reactive support vs. proactive outreach?",
      "What does a customer onboarding look like today, and where does it slow down?",
    ],
  },
  {
    id: "operations",
    name: "Operations & Fulfillment",
    questions: [
      "How many manual steps are in your core fulfillment or delivery process?",
      "Where do errors, delays, or rework most commonly occur?",
      "What's a process that gets reinvented from scratch every time instead of following a system?",
    ],
  },
  {
    id: "finance",
    name: "Finance & Accounting",
    questions: [
      "How long does your month-end close process take?",
      "Are financial reports generated manually or automatically, and how current is the data?",
      "What financial visibility do you wish you had in real-time that you currently don't?",
    ],
  },
  {
    id: "hr",
    name: "HR & People Operations",
    questions: [
      "How long does it take from job post to first day for a new hire?",
      "What % of HR's time is spent on administrative tasks vs. strategic people work?",
      "What's the biggest people ops bottleneck limiting your ability to scale?",
    ],
  },
  {
    id: "executive",
    name: "Executive & Leadership",
    questions: [
      "How much of your week is spent on tasks only you can do vs. things that could be delegated or automated?",
      "What decision takes the longest because you're waiting on data or reports?",
      "What would you do with 10 recovered hours per week?",
    ],
  },
]

const AI_TOOLS = [
  { id: "hubspot", label: "HubSpot" },
  { id: "salesforce", label: "Salesforce" },
  { id: "pipedrive", label: "Pipedrive" },
  { id: "slack", label: "Slack" },
  { id: "teams", label: "MS Teams" },
  { id: "notion", label: "Notion" },
  { id: "clickup", label: "ClickUp" },
  { id: "asana", label: "Asana" },
  { id: "quickbooks", label: "QuickBooks" },
  { id: "xero", label: "Xero" },
  { id: "zapier", label: "Zapier" },
  { id: "make", label: "Make" },
  { id: "chatgpt", label: "ChatGPT" },
  { id: "clay", label: "Clay" },
  { id: "apollo", label: "Apollo" },
  { id: "close", label: "Close CRM" },
]

const PHASE_ORDER: Phase[] = [
  "intro",
  "snapshot",
  "departments",
  "dept-drill",
  "bottlenecks",
  "cost-capacity",
  "ai-readiness",
  "email",
  "submitting",
  "results",
]

const PROGRESS_PHASES: Phase[] = [
  "snapshot",
  "departments",
  "dept-drill",
  "bottlenecks",
  "cost-capacity",
  "ai-readiness",
]

// ─── Scoring ──────────────────────────────────────────────────────────────────

function computeScores(data: Partial<AuditData>): AuditData["scores"] {
  const depts = data.departments?.filter((d) => d.selected) ?? []
  const weeklyManualHours = data.costCapacity?.manualHoursWeekly ?? 0

  const costOfInefficiency = Math.round(weeklyManualHours * 55 * 52)
  const aiRoiPotential = Math.round(costOfInefficiency * 0.65)

  const byDepartment: Record<string, number> = {}
  for (const d of depts) {
    const deptWeeklyHours = d.headcount * 40
    const manualPct = d.manualHoursPerWeek / Math.max(deptWeeklyHours, 1)
    byDepartment[d.id] = Math.max(0, Math.round((1 - manualPct) * 100))
  }

  const deptAvg =
    depts.length > 0
      ? Object.values(byDepartment).reduce((s, v) => s + v, 0) / depts.length
      : 50
  const toolBonus = Math.min((data.aiReadiness?.currentTools?.length ?? 0) * 3, 15)
  const overall = Math.round(Math.min(100, Math.max(0, deptAvg * 0.75 + toolBonus + 10)))

  return { overall, costOfInefficiency, aiRoiPotential, byDepartment }
}

function formatDollars(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `$${Math.round(n / 1_000)}K`
  return `$${n.toLocaleString()}`
}

// ─── Animated Counter ─────────────────────────────────────────────────────────

function AnimatedCounter({ target, prefix = "" }: { target: number; prefix?: string }) {
  const [count, setCount] = useState(0)
  const rafRef = useRef<number | null>(null)
  const startRef = useRef<number | null>(null)
  const duration = 1800

  useEffect(() => {
    if (target === 0) return

    const animate = (timestamp: number) => {
      if (!startRef.current) startRef.current = timestamp
      const elapsed = timestamp - startRef.current
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setCount(Math.round(eased * target))
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate)
      }
    }

    rafRef.current = requestAnimationFrame(animate)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [target])

  return (
    <span>
      {prefix}
      {count.toLocaleString()}
    </span>
  )
}

// ─── Shared Animation Variants ────────────────────────────────────────────────

const phaseTransition: Transition = { duration: 0.3, ease: "easeOut" as const }

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
  transition: phaseTransition,
}

// ─── Progress Bar ─────────────────────────────────────────────────────────────

function ProgressBar({ phase }: { phase: Phase }) {
  const idx = PROGRESS_PHASES.indexOf(phase)
  if (idx < 0) return null
  const pct = ((idx + 1) / PROGRESS_PHASES.length) * 100

  return (
    <div className="w-full h-0.5 bg-white/10 mb-8">
      <motion.div
        className="h-full bg-[#C4972A]"
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      />
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ExecutiveOpsAuditClient() {
  const [phase, setPhase] = useState<Phase>("intro")
  const [data, setData] = useState<Partial<AuditData>>({
    departments: DEPARTMENTS.map((d) => ({
      id: d.id,
      name: d.name,
      headcount: 1,
      manualHoursPerWeek: 10,
      selected: false,
      answers: ["", "", ""],
    })),
  })
  const [currentDeptIndex, setCurrentDeptIndex] = useState(0)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [company, setCompany] = useState("")
  const [submissionId, setSubmissionId] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const selectedDepts = data.departments?.filter((d) => d.selected) ?? []

  function goTo(p: Phase) {
    setPhase(p)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  function goBack() {
    const idx = PHASE_ORDER.indexOf(phase)
    if (idx > 0) goTo(PHASE_ORDER[idx - 1])
  }

  function updateSnapshot(field: keyof AuditData["snapshot"], value: string) {
    setData((prev) => ({
      ...prev,
      snapshot: { ...((prev.snapshot ?? {}) as AuditData["snapshot"]), [field]: value },
    }))
  }

  function toggleDept(id: string) {
    setData((prev) => ({
      ...prev,
      departments: prev.departments?.map((d) =>
        d.id === id ? { ...d, selected: !d.selected } : d
      ),
    }))
  }

  function updateDeptHeadcount(id: string, headcount: number) {
    setData((prev) => ({
      ...prev,
      departments: prev.departments?.map((d) =>
        d.id === id ? { ...d, headcount } : d
      ),
    }))
  }

  function updateDeptManualHours(id: string, manualHoursPerWeek: number) {
    setData((prev) => ({
      ...prev,
      departments: prev.departments?.map((d) =>
        d.id === id ? { ...d, manualHoursPerWeek } : d
      ),
    }))
  }

  function updateDeptAnswer(id: string, qIdx: number, value: string) {
    setData((prev) => ({
      ...prev,
      departments: prev.departments?.map((d) => {
        if (d.id !== id) return d
        const answers = [...d.answers]
        answers[qIdx] = value
        return { ...d, answers }
      }),
    }))
  }

  function updateBottleneck(field: keyof AuditData["bottlenecks"], value: string) {
    setData((prev) => ({
      ...prev,
      bottlenecks: { ...((prev.bottlenecks ?? {}) as AuditData["bottlenecks"]), [field]: value },
    }))
  }

  function updateCostCapacity(field: keyof AuditData["costCapacity"], value: number | string) {
    setData((prev) => ({
      ...prev,
      costCapacity: {
        ...((prev.costCapacity ?? {}) as AuditData["costCapacity"]),
        [field]: value,
      },
    }))
  }

  function toggleTool(id: string) {
    setData((prev) => {
      const current = prev.aiReadiness?.currentTools ?? []
      const next = current.includes(id)
        ? current.filter((t) => t !== id)
        : [...current, id]
      return {
        ...prev,
        aiReadiness: { ...((prev.aiReadiness ?? {}) as AuditData["aiReadiness"]), currentTools: next },
      }
    })
  }

  function updateAiReadiness(
    field: keyof Omit<AuditData["aiReadiness"], "currentTools">,
    value: string
  ) {
    setData((prev) => ({
      ...prev,
      aiReadiness: {
        ...((prev.aiReadiness ?? {}) as AuditData["aiReadiness"]),
        [field]: value,
      },
    }))
  }

  async function handleSubmit() {
    goTo("submitting")
    const scores = computeScores(data)
    const body = {
      type: "EXECUTIVE_OPS_AUDIT",
      email,
      name,
      company,
      score: scores.overall,
      data: { ...data, scores },
    }

    try {
      const res = await fetch("/api/lead-magnets/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const json = await res.json()
      if (json.id) setSubmissionId(json.id)
      setData((prev) => ({ ...prev, scores }))
    } catch {
      setData((prev) => ({ ...prev, scores }))
    }

    setTimeout(() => goTo("results"), 3200)
  }

  function copyResultsLink() {
    if (submissionId) {
      navigator.clipboard.writeText(
        `${window.location.origin}/tools/executive-ops-audit/results/${submissionId}`
      )
    } else {
      navigator.clipboard.writeText(window.location.href)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const scores = data.scores ?? computeScores(data)

  return (
    <div className="min-h-screen bg-[#08090D] text-[#F0EBE0]">
      <div className="max-w-3xl mx-auto px-4 py-12 md:py-20">
        <AnimatePresence mode="wait">
          {/* ── INTRO ─────────────────────────────────────────────────────── */}
          {phase === "intro" && (
            <motion.div key="intro" {...fadeUp} className="text-center">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#C4972A]/40 bg-[#C4972A]/10 text-[#C4972A] text-xs font-mono uppercase tracking-widest mb-8">
                For Executives &amp; Operators
              </div>

              <h1 className="font-serif text-4xl md:text-6xl font-light text-[#F0EBE0] mb-6 leading-tight">
                Map Every AI Bottleneck{" "}
                <span className="text-[#C4972A]">in Your Business</span>
              </h1>

              <p className="text-lg text-[#F0EBE0]/70 mb-12 max-w-2xl mx-auto leading-relaxed">
                Answer questions about your departments, spend, and workflows. Get a custom
                executive scorecard showing your cost of inefficiency and exactly where AI
                automation would generate the highest ROI.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-12">
                {[
                  {
                    icon: BarChart3,
                    label: "Department-by-department bottleneck analysis",
                  },
                  {
                    icon: DollarSign,
                    label: "Estimated annual cost of your inefficiencies",
                  },
                  {
                    icon: TrendingUp,
                    label: "Projected AI ROI by business area",
                  },
                  {
                    icon: Target,
                    label: "Personalized automation roadmap",
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="flex items-start gap-3 p-4 rounded-lg bg-[#141923] border border-white/8 text-left"
                  >
                    <item.icon className="w-5 h-5 text-[#C4972A] mt-0.5 shrink-0" />
                    <span className="text-sm text-[#F0EBE0]/80">{item.label}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => goTo("snapshot")}
                className="inline-flex items-center gap-2 px-8 py-4 bg-[#C4972A] hover:bg-[#C4972A]/90 text-[#08090D] font-semibold rounded-lg transition-all duration-200 text-base group"
              >
                Start Executive Audit
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </button>

              <p className="text-xs text-[#F0EBE0]/40 mt-4">
                Takes 5–7 minutes — used by 200+ business owners and operators
              </p>
            </motion.div>
          )}

          {/* ── SNAPSHOT ──────────────────────────────────────────────────── */}
          {phase === "snapshot" && (
            <motion.div key="snapshot" {...fadeUp}>
              <ProgressBar phase={phase} />
              <StepHeader
                step="Step 1 of 6"
                label="Company Overview"
                onBack={goBack}
              />

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-[#F0EBE0]/70 mb-2">
                    How many people work in your business?
                  </label>
                  <select
                    className="w-full bg-[#141923] border border-white/10 rounded-lg px-4 py-3 text-[#F0EBE0] focus:outline-none focus:border-[#C4972A]/60 transition-colors"
                    value={data.snapshot?.headcount ?? ""}
                    onChange={(e) => updateSnapshot("headcount", e.target.value)}
                  >
                    <option value="" disabled>
                      Select headcount
                    </option>
                    {["Just me", "2–10", "11–25", "26–50", "51–100", "100–250", "250+"].map(
                      (o) => (
                        <option key={o} value={o}>
                          {o}
                        </option>
                      )
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#F0EBE0]/70 mb-2">
                    Annual revenue?
                  </label>
                  <select
                    className="w-full bg-[#141923] border border-white/10 rounded-lg px-4 py-3 text-[#F0EBE0] focus:outline-none focus:border-[#C4972A]/60 transition-colors"
                    value={data.snapshot?.revenue ?? ""}
                    onChange={(e) => updateSnapshot("revenue", e.target.value)}
                  >
                    <option value="" disabled>
                      Select revenue range
                    </option>
                    {[
                      "Under $500K",
                      "$500K–$1M",
                      "$1M–$5M",
                      "$5M–$10M",
                      "$10M–$50M",
                      "$50M+",
                    ].map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#F0EBE0]/70 mb-2">
                    What industry are you in?
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Professional Services, SaaS, E-commerce..."
                    className="w-full bg-[#141923] border border-white/10 rounded-lg px-4 py-3 text-[#F0EBE0] placeholder-[#F0EBE0]/30 focus:outline-none focus:border-[#C4972A]/60 transition-colors"
                    value={data.snapshot?.industry ?? ""}
                    onChange={(e) => updateSnapshot("industry", e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#F0EBE0]/70 mb-2">
                    What's your #1 business goal for the next 12 months?
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Be specific — e.g. 'Grow from $2M to $5M ARR without hiring more than 3 people'"
                    className="w-full bg-[#141923] border border-white/10 rounded-lg px-4 py-3 text-[#F0EBE0] placeholder-[#F0EBE0]/30 focus:outline-none focus:border-[#C4972A]/60 transition-colors resize-none"
                    value={data.snapshot?.topGoal ?? ""}
                    onChange={(e) => updateSnapshot("topGoal", e.target.value)}
                  />
                </div>
              </div>

              <ContinueButton
                onClick={() => goTo("departments")}
                disabled={!data.snapshot?.headcount || !data.snapshot?.revenue}
              />
            </motion.div>
          )}

          {/* ── DEPARTMENTS ───────────────────────────────────────────────── */}
          {phase === "departments" && (
            <motion.div key="departments" {...fadeUp}>
              <ProgressBar phase={phase} />
              <StepHeader
                step="Step 2 of 6"
                label="Select Your Departments"
                onBack={goBack}
              />
              <p className="text-[#F0EBE0]/60 mb-8 text-sm">
                Select every department that exists in your business. We'll ask targeted
                questions about each one.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                {data.departments?.map((dept) => (
                  <div
                    key={dept.id}
                    className={cn(
                      "rounded-lg border transition-all duration-200 overflow-hidden",
                      dept.selected
                        ? "border-[#C4972A]/60 bg-[#C4972A]/5"
                        : "border-white/10 bg-[#141923] hover:border-white/20"
                    )}
                  >
                    <button
                      onClick={() => toggleDept(dept.id)}
                      className="w-full flex items-center justify-between p-4 text-left"
                    >
                      <span className="text-sm font-medium text-[#F0EBE0]">{dept.name}</span>
                      <div
                        className={cn(
                          "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-200 shrink-0",
                          dept.selected
                            ? "border-[#C4972A] bg-[#C4972A]"
                            : "border-white/30"
                        )}
                      >
                        {dept.selected && (
                          <CheckCircle2 className="w-3 h-3 text-[#08090D]" />
                        )}
                      </div>
                    </button>

                    <AnimatePresence>
                      {dept.selected && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="px-4 pb-4 pt-0 space-y-4 border-t border-[#C4972A]/20">
                            <div className="pt-3">
                              <label className="block text-xs text-[#F0EBE0]/50 mb-2">
                                How many people in this department?
                              </label>
                              <input
                                type="number"
                                min={1}
                                max={500}
                                className="w-full bg-[#0E1219] border border-white/10 rounded-md px-3 py-2 text-sm text-[#F0EBE0] focus:outline-none focus:border-[#C4972A]/60 transition-colors"
                                value={dept.headcount}
                                onChange={(e) =>
                                  updateDeptHeadcount(dept.id, parseInt(e.target.value) || 1)
                                }
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-[#F0EBE0]/50 mb-2">
                                Hours/week on manual tasks:{" "}
                                <span className="text-[#C4972A] font-medium">
                                  {dept.manualHoursPerWeek}h
                                </span>
                              </label>
                              <input
                                type="range"
                                min={0}
                                max={100}
                                step={1}
                                className="w-full accent-[#C4972A]"
                                value={dept.manualHoursPerWeek}
                                onChange={(e) =>
                                  updateDeptManualHours(dept.id, parseInt(e.target.value))
                                }
                              />
                              <div className="flex justify-between text-xs text-[#F0EBE0]/30 mt-1">
                                <span>0h</span>
                                <span>100h</span>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>

              <ContinueButton
                onClick={() => {
                  setCurrentDeptIndex(0)
                  goTo("dept-drill")
                }}
                disabled={selectedDepts.length < 2}
                label={
                  selectedDepts.length < 2
                    ? "Select at least 2 departments"
                    : `Continue with ${selectedDepts.length} departments`
                }
              />
            </motion.div>
          )}

          {/* ── DEPT-DRILL ────────────────────────────────────────────────── */}
          {phase === "dept-drill" && (
            <motion.div key={`dept-drill-${currentDeptIndex}`} {...fadeUp}>
              <ProgressBar phase={phase} />

              <div className="flex items-center justify-between mb-2">
                <button
                  onClick={() => {
                    if (currentDeptIndex > 0) {
                      setCurrentDeptIndex(currentDeptIndex - 1)
                    } else {
                      goBack()
                    }
                  }}
                  className="flex items-center gap-1.5 text-[#F0EBE0]/50 hover:text-[#F0EBE0] transition-colors text-sm"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Back
                </button>
                <span className="text-xs text-[#F0EBE0]/40 font-mono">
                  Department {currentDeptIndex + 1} of {selectedDepts.length}
                </span>
              </div>

              <div className="mb-2">
                <span className="text-xs font-mono text-[#C4972A] uppercase tracking-widest">
                  Step 3 of 6 — Department Deep Dive
                </span>
              </div>

              <h2 className="text-xl font-semibold text-[#F0EBE0] mb-1">
                {selectedDepts[currentDeptIndex]?.name}
              </h2>
              <p className="text-sm text-[#F0EBE0]/50 mb-8">
                Answer honestly — these drive your department efficiency scores.
              </p>

              <div className="space-y-6">
                {DEPARTMENTS.find(
                  (d) => d.id === selectedDepts[currentDeptIndex]?.id
                )?.questions.map((q, qIdx) => (
                  <div key={qIdx}>
                    <label className="block text-sm font-medium text-[#F0EBE0]/80 mb-2">
                      {q}
                    </label>
                    <textarea
                      rows={3}
                      className="w-full bg-[#141923] border border-white/10 rounded-lg px-4 py-3 text-[#F0EBE0] placeholder-[#F0EBE0]/30 focus:outline-none focus:border-[#C4972A]/60 transition-colors resize-none text-sm"
                      placeholder="Be specific — your answers are used to build your scorecard"
                      value={selectedDepts[currentDeptIndex]?.answers[qIdx] ?? ""}
                      onChange={(e) =>
                        updateDeptAnswer(
                          selectedDepts[currentDeptIndex].id,
                          qIdx,
                          e.target.value
                        )
                      }
                    />
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-4 mt-8">
                <button
                  onClick={() => {
                    if (currentDeptIndex < selectedDepts.length - 1) {
                      setCurrentDeptIndex(currentDeptIndex + 1)
                    } else {
                      goTo("bottlenecks")
                    }
                  }}
                  className="flex items-center gap-2 px-6 py-3 bg-[#C4972A] hover:bg-[#C4972A]/90 text-[#08090D] font-semibold rounded-lg transition-all duration-200 text-sm"
                >
                  {currentDeptIndex < selectedDepts.length - 1
                    ? "Next Department"
                    : "Continue"}
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  onClick={() => {
                    if (currentDeptIndex < selectedDepts.length - 1) {
                      setCurrentDeptIndex(currentDeptIndex + 1)
                    } else {
                      goTo("bottlenecks")
                    }
                  }}
                  className="text-sm text-[#F0EBE0]/40 hover:text-[#F0EBE0]/70 transition-colors"
                >
                  Skip this department
                </button>
              </div>
            </motion.div>
          )}

          {/* ── BOTTLENECKS ───────────────────────────────────────────────── */}
          {phase === "bottlenecks" && (
            <motion.div key="bottlenecks" {...fadeUp}>
              <ProgressBar phase={phase} />
              <StepHeader
                step="Step 4 of 6"
                label="Your Biggest Pain Points"
                onBack={goBack}
              />
              <p className="text-[#F0EBE0]/60 mb-8 text-sm">
                Answer honestly. The more specific you are, the more accurate your scorecard.
              </p>

              <div className="space-y-6">
                {([
                  {
                    field: "biggestHeadache" as const,
                    label: "Describe your biggest operational headache right now.",
                    placeholder:
                      "Don't filter yourself — what keeps you up at night operationally?",
                  },
                  {
                    field: "highPaidWaste" as const,
                    label:
                      "What are your highest-paid people doing that they shouldn't be doing?",
                    placeholder:
                      "e.g. 'My VP of Sales spends 4 hours a day updating Salesforce manually'",
                  },
                  {
                    field: "eliminateOne" as const,
                    label:
                      "If you could eliminate one process from your business tomorrow, what would it be?",
                    placeholder:
                      "e.g. 'The manual weekly reporting process that takes 6 hours to compile'",
                  },
                  {
                    field: "aiAgentPlacement" as const,
                    label:
                      "If you had one AI agent working 24/7 in your business, where would you put it first?",
                    placeholder:
                      "e.g. 'Following up with leads that go cold after the first demo'",
                  },
                ] as const).map((item) => (
                  <div key={item.field}>
                    <label className="block text-sm font-medium text-[#F0EBE0]/80 mb-2">
                      {item.label}
                    </label>
                    <textarea
                      rows={3}
                      placeholder={item.placeholder}
                      className="w-full bg-[#141923] border border-white/10 rounded-lg px-4 py-3 text-[#F0EBE0] placeholder-[#F0EBE0]/30 focus:outline-none focus:border-[#C4972A]/60 transition-colors resize-none text-sm"
                      value={data.bottlenecks?.[item.field] ?? ""}
                      onChange={(e) => updateBottleneck(item.field, e.target.value)}
                    />
                  </div>
                ))}
              </div>

              <ContinueButton onClick={() => goTo("cost-capacity")} />
            </motion.div>
          )}

          {/* ── COST-CAPACITY ─────────────────────────────────────────────── */}
          {phase === "cost-capacity" && (
            <motion.div key="cost-capacity" {...fadeUp}>
              <ProgressBar phase={phase} />
              <StepHeader
                step="Step 5 of 6"
                label="Cost & Capacity"
                onBack={goBack}
              />

              <div className="space-y-8">
                <div>
                  <label className="block text-sm font-medium text-[#F0EBE0]/80 mb-1">
                    Across your entire team, roughly how many hours per week are spent on
                    manual, repetitive tasks?
                  </label>
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-2xl font-semibold text-[#C4972A]">
                      {data.costCapacity?.manualHoursWeekly ?? 0}h
                    </span>
                    <span className="text-xs text-[#F0EBE0]/40">/ week</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={500}
                    step={5}
                    className="w-full accent-[#C4972A]"
                    value={data.costCapacity?.manualHoursWeekly ?? 0}
                    onChange={(e) =>
                      updateCostCapacity("manualHoursWeekly", parseInt(e.target.value))
                    }
                  />
                  <div className="flex justify-between text-xs text-[#F0EBE0]/30 mt-1 mb-3">
                    <span>0h</span>
                    <span>500h</span>
                  </div>

                  {(data.costCapacity?.manualHoursWeekly ?? 0) > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-2 px-4 py-3 rounded-lg bg-red-950/30 border border-red-500/20"
                    >
                      <DollarSign className="w-4 h-4 text-red-400 shrink-0" />
                      <span className="text-sm text-[#F0EBE0]/80">
                        That's approximately{" "}
                        <span className="text-red-400 font-semibold">
                          {formatDollars(
                            Math.round((data.costCapacity?.manualHoursWeekly ?? 0) * 55 * 52)
                          )}
                        </span>{" "}
                        per year in labor cost
                      </span>
                    </motion.div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#F0EBE0]/80 mb-1">
                    Monthly spend on software and tools?
                  </label>
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-2xl font-semibold text-[#C4972A]">
                      {formatDollars(data.costCapacity?.monthlyToolSpend ?? 0)}
                    </span>
                    <span className="text-xs text-[#F0EBE0]/40">/ month</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={50000}
                    step={500}
                    className="w-full accent-[#C4972A]"
                    value={data.costCapacity?.monthlyToolSpend ?? 0}
                    onChange={(e) =>
                      updateCostCapacity("monthlyToolSpend", parseInt(e.target.value))
                    }
                  />
                  <div className="flex justify-between text-xs text-[#F0EBE0]/30 mt-1">
                    <span>$0</span>
                    <span>$50K</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#F0EBE0]/80 mb-2">
                    If those manual hours were freed up, what would your team do instead?
                  </label>
                  <textarea
                    rows={3}
                    placeholder="e.g. 'Focus on closing deals, building client relationships, product development...'"
                    className="w-full bg-[#141923] border border-white/10 rounded-lg px-4 py-3 text-[#F0EBE0] placeholder-[#F0EBE0]/30 focus:outline-none focus:border-[#C4972A]/60 transition-colors resize-none text-sm"
                    value={data.costCapacity?.extraHoursUse ?? ""}
                    onChange={(e) => updateCostCapacity("extraHoursUse", e.target.value)}
                  />
                </div>
              </div>

              <ContinueButton onClick={() => goTo("ai-readiness")} />
            </motion.div>
          )}

          {/* ── AI-READINESS ──────────────────────────────────────────────── */}
          {phase === "ai-readiness" && (
            <motion.div key="ai-readiness" {...fadeUp}>
              <ProgressBar phase={phase} />
              <StepHeader
                step="Step 6 of 6"
                label="Current Tech & AI Readiness"
                onBack={goBack}
              />
              <p className="text-[#F0EBE0]/60 mb-8 text-sm">
                Select every tool your team currently uses:
              </p>

              <div className="flex flex-wrap gap-2 mb-8">
                {AI_TOOLS.map((tool) => {
                  const selected = data.aiReadiness?.currentTools?.includes(tool.id) ?? false
                  return (
                    <button
                      key={tool.id}
                      onClick={() => toggleTool(tool.id)}
                      className={cn(
                        "px-3 py-1.5 rounded-full text-sm border transition-all duration-150",
                        selected
                          ? "bg-[#C4972A] border-[#C4972A] text-[#08090D] font-medium"
                          : "bg-[#141923] border-white/10 text-[#F0EBE0]/70 hover:border-white/20 hover:text-[#F0EBE0]"
                      )}
                    >
                      {tool.label}
                    </button>
                  )
                })}
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-[#F0EBE0]/80 mb-2">
                    Have you previously tried to automate or implement AI tools? What happened?
                  </label>
                  <textarea
                    rows={3}
                    placeholder="e.g. 'We tried Zapier but it broke constantly. We piloted ChatGPT for content but never made it systematic.'"
                    className="w-full bg-[#141923] border border-white/10 rounded-lg px-4 py-3 text-[#F0EBE0] placeholder-[#F0EBE0]/30 focus:outline-none focus:border-[#C4972A]/60 transition-colors resize-none text-sm"
                    value={data.aiReadiness?.automationAttempts ?? ""}
                    onChange={(e) =>
                      updateAiReadiness("automationAttempts", e.target.value)
                    }
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#F0EBE0]/80 mb-2">
                    Which department in your business is most resistant to new tools or process
                    changes?
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Sales, Finance, Operations..."
                    className="w-full bg-[#141923] border border-white/10 rounded-lg px-4 py-3 text-[#F0EBE0] placeholder-[#F0EBE0]/30 focus:outline-none focus:border-[#C4972A]/60 transition-colors text-sm"
                    value={data.aiReadiness?.resistantDept ?? ""}
                    onChange={(e) => updateAiReadiness("resistantDept", e.target.value)}
                  />
                </div>
              </div>

              <ContinueButton onClick={() => goTo("email")} />
            </motion.div>
          )}

          {/* ── EMAIL ─────────────────────────────────────────────────────── */}
          {phase === "email" && (
            <motion.div key="email" {...fadeUp} className="text-center">
              <ProgressBar phase={phase} />

              <div className="mb-2">
                <span className="text-xs font-mono text-[#C4972A] uppercase tracking-widest">
                  Your scorecard is ready
                </span>
              </div>

              <h2 className="text-3xl font-serif font-light text-[#F0EBE0] mb-4">
                Enter your details to see your full{" "}
                <span className="text-[#C4972A]">Executive Operations Audit</span>
              </h2>

              <p className="text-sm text-[#F0EBE0]/60 mb-8 max-w-lg mx-auto">
                Including your estimated annual cost of inefficiency and department-by-department
                automation roadmap.
              </p>

              {(data.costCapacity?.manualHoursWeekly ?? 0) > 0 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="inline-flex flex-col items-center px-8 py-6 rounded-xl bg-red-950/30 border border-red-500/20 mb-8"
                >
                  <span className="text-xs text-[#F0EBE0]/50 uppercase tracking-widest font-mono mb-1">
                    Estimated Annual Inefficiency Cost
                  </span>
                  <span className="text-4xl font-semibold text-red-400 tabular-nums">
                    <AnimatedCounter
                      target={Math.round(
                        (data.costCapacity?.manualHoursWeekly ?? 0) * 55 * 52
                      )}
                      prefix="$"
                    />
                  </span>
                </motion.div>
              )}

              <div className="max-w-md mx-auto space-y-4 text-left">
                <div>
                  <label className="block text-sm font-medium text-[#F0EBE0]/70 mb-2">
                    Your name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="First and last name"
                    className="w-full bg-[#141923] border border-white/10 rounded-lg px-4 py-3 text-[#F0EBE0] placeholder-[#F0EBE0]/30 focus:outline-none focus:border-[#C4972A]/60 transition-colors"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#F0EBE0]/70 mb-2">
                    Work email
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="you@company.com"
                    className="w-full bg-[#141923] border border-white/10 rounded-lg px-4 py-3 text-[#F0EBE0] placeholder-[#F0EBE0]/30 focus:outline-none focus:border-[#C4972A]/60 transition-colors"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#F0EBE0]/70 mb-2">
                    Company name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Your company"
                    className="w-full bg-[#141923] border border-white/10 rounded-lg px-4 py-3 text-[#F0EBE0] placeholder-[#F0EBE0]/30 focus:outline-none focus:border-[#C4972A]/60 transition-colors"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                  />
                </div>

                <button
                  onClick={handleSubmit}
                  disabled={!name || !email || !company}
                  className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-[#C4972A] hover:bg-[#C4972A]/90 disabled:opacity-40 disabled:cursor-not-allowed text-[#08090D] font-semibold rounded-lg transition-all duration-200"
                >
                  Generate My Scorecard
                  <ArrowRight className="w-4 h-4" />
                </button>

                <p className="text-xs text-[#F0EBE0]/30 text-center">
                  Your data is private and used only to generate your scorecard.
                </p>
              </div>

              <div className="mt-6">
                <button
                  onClick={goBack}
                  className="flex items-center gap-1.5 text-[#F0EBE0]/40 hover:text-[#F0EBE0]/70 transition-colors text-sm mx-auto"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Back
                </button>
              </div>
            </motion.div>
          )}

          {/* ── SUBMITTING ────────────────────────────────────────────────── */}
          {phase === "submitting" && (
            <motion.div key="submitting" {...fadeUp} className="text-center py-20">
              <Loader2 className="w-10 h-10 text-[#C4972A] animate-spin mx-auto mb-6" />
              <h2 className="text-2xl font-serif font-light text-[#F0EBE0] mb-8">
                Analyzing your operations...
              </h2>
              <div className="space-y-3 max-w-xs mx-auto text-left">
                {[
                  "Calculating department efficiency scores...",
                  "Estimating automation ROI by business area...",
                  "Building your personalized roadmap...",
                ].map((label, i) => (
                  <SubmittingItem key={label} label={label} delay={0.5 + i * 0.5} />
                ))}
              </div>
            </motion.div>
          )}

          {/* ── RESULTS ───────────────────────────────────────────────────── */}
          {phase === "results" && (
            <motion.div key="results" {...fadeUp} className="text-center">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#C4972A]/40 bg-[#C4972A]/10 text-[#C4972A] text-xs font-mono uppercase tracking-widest mb-6">
                Executive Ops Audit Complete
              </div>

              <h2 className="text-3xl font-serif font-light text-[#F0EBE0] mb-10">
                Here's your operations overview
              </h2>

              <div className="rounded-2xl border border-white/10 bg-[#141923] p-8 mb-6 text-left">
                {/* Overall score */}
                <div className="flex items-center justify-between mb-8 pb-8 border-b border-white/8">
                  <div>
                    <p className="text-xs font-mono text-[#F0EBE0]/50 uppercase tracking-widest mb-1">
                      Overall Efficiency Score
                    </p>
                    <p className="text-xs text-[#F0EBE0]/40">
                      Higher is better — 100 = fully optimized
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-6xl font-semibold text-[#C4972A] tabular-nums">
                      {scores.overall}
                    </span>
                    <span className="text-2xl text-[#F0EBE0]/40">/100</span>
                  </div>
                </div>

                {/* Key stats */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                  <div className="p-4 rounded-xl bg-red-950/25 border border-red-500/20">
                    <p className="text-xs font-mono text-[#F0EBE0]/50 uppercase tracking-widest mb-1">
                      Annual Cost of Inefficiency
                    </p>
                    <p className="text-2xl font-semibold text-red-400 tabular-nums">
                      {formatDollars(scores.costOfInefficiency)}
                    </p>
                    <p className="text-xs text-[#F0EBE0]/40 mt-1">
                      Based on {data.costCapacity?.manualHoursWeekly ?? 0}h/wk @ $55/hr
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-emerald-950/25 border border-emerald-500/20">
                    <p className="text-xs font-mono text-[#F0EBE0]/50 uppercase tracking-widest mb-1">
                      Projected AI ROI Potential
                    </p>
                    <p className="text-2xl font-semibold text-emerald-400 tabular-nums">
                      {formatDollars(scores.aiRoiPotential)}/yr
                    </p>
                    <p className="text-xs text-[#F0EBE0]/40 mt-1">
                      65% of inefficiency costs recoverable via AI
                    </p>
                  </div>
                </div>

                {/* Dept scores */}
                {Object.keys(scores.byDepartment).length > 0 && (
                  <div>
                    <p className="text-xs font-mono text-[#F0EBE0]/50 uppercase tracking-widest mb-4">
                      Department Efficiency
                    </p>
                    <div className="space-y-3">
                      {selectedDepts.map((dept) => {
                        const score = scores.byDepartment[dept.id] ?? 0
                        return (
                          <div key={dept.id}>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm text-[#F0EBE0]/70">{dept.name}</span>
                              <span
                                className={cn(
                                  "text-sm font-medium tabular-nums",
                                  score >= 70
                                    ? "text-emerald-400"
                                    : score >= 40
                                    ? "text-amber-400"
                                    : "text-red-400"
                                )}
                              >
                                {score}
                              </span>
                            </div>
                            <div className="h-1.5 bg-white/8 rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${score}%` }}
                                transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
                                className={cn(
                                  "h-full rounded-full",
                                  score >= 70
                                    ? "bg-emerald-500"
                                    : score >= 40
                                    ? "bg-amber-500"
                                    : "bg-red-500"
                                )}
                              />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                {submissionId && (
                  <a
                    href={`/tools/executive-ops-audit/results/${submissionId}`}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-[#C4972A] hover:bg-[#C4972A]/90 text-[#08090D] font-semibold rounded-lg transition-all duration-200 text-sm"
                  >
                    <BarChart3 className="w-4 h-4" />
                    View Full Executive Scorecard
                    <ArrowRight className="w-4 h-4" />
                  </a>
                )}

                <button
                  onClick={copyResultsLink}
                  className="inline-flex items-center gap-2 px-5 py-3 border border-white/10 hover:border-white/20 text-[#F0EBE0]/70 hover:text-[#F0EBE0] rounded-lg transition-all duration-200 text-sm"
                >
                  {copied ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copy link
                    </>
                  )}
                </button>
              </div>

              <p className="text-xs text-[#F0EBE0]/30 mt-6">
                Your full scorecard has been sent to {email}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StepHeader({
  step,
  label,
  onBack,
}: {
  step: string
  label: string
  onBack: () => void
}) {
  return (
    <div className="mb-8">
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-[#F0EBE0]/50 hover:text-[#F0EBE0] transition-colors text-sm mb-4"
      >
        <ChevronLeft className="w-4 h-4" />
        Back
      </button>
      <span className="text-xs font-mono text-[#C4972A] uppercase tracking-widest block mb-2">
        {step}
      </span>
      <h2 className="text-2xl font-semibold text-[#F0EBE0]">{label}</h2>
    </div>
  )
}

function ContinueButton({
  onClick,
  disabled = false,
  label = "Continue",
}: {
  onClick: () => void
  disabled?: boolean
  label?: string
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="mt-8 inline-flex items-center gap-2 px-6 py-3 bg-[#C4972A] hover:bg-[#C4972A]/90 disabled:opacity-40 disabled:cursor-not-allowed text-[#08090D] font-semibold rounded-lg transition-all duration-200 text-sm"
    >
      {label}
      <ArrowRight className="w-4 h-4" />
    </button>
  )
}

function SubmittingItem({ label, delay }: { label: string; delay: number }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), delay * 1000)
    return () => clearTimeout(timer)
  }, [delay])

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-2 text-sm text-[#F0EBE0]/60"
        >
          <CheckCircle2 className="w-4 h-4 text-[#C4972A] shrink-0" />
          {label}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
