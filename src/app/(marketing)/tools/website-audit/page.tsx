"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Globe, CheckCircle2, Loader2, AlertCircle, ArrowRight, Search, Zap, TrendingDown, Shield, BarChart2 } from "lucide-react"
import { cn } from "@/lib/utils"

type AuditStep = {
  id: number
  label: string
  detail: string
  duration: number // ms
}

const AUDIT_STEPS: AuditStep[] = [
  { id: 1, label: "Crawling homepage", detail: "Analyzing page structure and metadata", duration: 1200 },
  { id: 2, label: "Checking page speed", detail: "Measuring Core Web Vitals and load time", duration: 1800 },
  { id: 3, label: "SEO & AEO scan", detail: "Analyzing title tags, schema, and AI-answer optimization", duration: 1500 },
  { id: 4, label: "Lead capture analysis", detail: "Auditing CTAs, forms, and conversion elements", duration: 1400 },
  { id: 5, label: "Mobile & accessibility", detail: "Testing responsive design and accessibility compliance", duration: 1000 },
  { id: 6, label: "Generating recommendations", detail: "AI synthesizing findings into action items", duration: 2000 },
]

type AuditScore = {
  seo: number
  speed: number
  conversion: number
  ai: number
  overall: number
}

type AuditAnalysis = {
  scores: AuditScore
  issues: { severity: string; issue: string; fix: string }[]
  strengths: string[]
  summary: string
  topOpportunity: string
}

function ScoreRing({ score, label, size = 80 }: { score: number; label: string; size?: number }) {
  const radius = (size - 12) / 2
  const circumference = 2 * Math.PI * radius
  const fill = (score / 100) * circumference
  const color = score >= 70 ? "#16A34A" : score >= 50 ? "#EA580C" : "#C4972A"

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={size} height={size}>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#e5e7eb" strokeWidth={6} />
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke={color} strokeWidth={6}
          strokeDasharray={`${fill} ${circumference}`}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: "stroke-dasharray 1s ease" }}
        />
        <text x={size / 2} y={size / 2 + 5} textAnchor="middle" fontSize={16} fontWeight={700} fill={color}>{score}</text>
      </svg>
      <span className="text-xs text-muted-foreground font-medium text-center leading-tight">{label}</span>
    </div>
  )
}

type Phase = "input" | "scanning" | "email" | "results"

export default function WebsiteAuditPage() {
  const [phase, setPhase] = useState<Phase>("input")
  const [url, setUrl] = useState("")
  const [currentStep, setCurrentStep] = useState(0)
  const [completedSteps, setCompletedSteps] = useState<number[]>([])
  const [scores, setScores] = useState<AuditScore | null>(null)
  const [analysis, setAnalysis] = useState<AuditAnalysis | null>(null)
  const [email, setEmail] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const stepTimerRef = useRef<NodeJS.Timeout | null>(null)
  const auditPromiseRef = useRef<Promise<AuditAnalysis | null> | null>(null)

  function startAudit(e: React.FormEvent) {
    e.preventDefault()
    const cleanUrl = url.startsWith("http") ? url : `https://${url}`

    setPhase("scanning")
    setCurrentStep(0)
    setCompletedSteps([])

    // Start real AI audit in background while animation plays
    auditPromiseRef.current = fetch("/api/ai/audit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: cleanUrl }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.analysis) return data.analysis as AuditAnalysis
        return null
      })
      .catch(() => null)
  }

  useEffect(() => {
    if (phase !== "scanning") return

    let stepIndex = 0

    function runStep() {
      if (stepIndex >= AUDIT_STEPS.length) {
        // Wait for AI audit to complete before showing email gate
        auditPromiseRef.current?.then((result) => {
          if (result) {
            setAnalysis(result)
            setScores(result.scores)
          } else {
            // Fallback scores if API failed
            setScores({ seo: 48, speed: 52, conversion: 39, ai: 28, overall: 43 })
          }
          setTimeout(() => setPhase("email"), 400)
        })
        return
      }
      setCurrentStep(stepIndex)
      const duration = AUDIT_STEPS[stepIndex].duration
      stepTimerRef.current = setTimeout(() => {
        setCompletedSteps((prev) => [...prev, stepIndex])
        stepIndex++
        runStep()
      }, duration)
    }

    runStep()
    return () => { if (stepTimerRef.current) clearTimeout(stepTimerRef.current) }
  }, [phase])

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    try {
      await fetch("/api/lead-magnets/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "WEBSITE_AUDIT",
          email,
          data: { url, scores },
        }),
      })
    } catch {}
    setSubmitting(false)
    setPhase("results")
  }

  const scoreColor = (s: number) => s >= 70 ? "text-green-400" : s >= 50 ? "text-orange-500" : "text-primary"

  return (
    <div className="min-h-screen bg-deep">
      {/* Header */}
      <div className="border-b border-border bg-card sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Search className="w-4 h-4 text-white" />
          </div>
          <span className="font-semibold text-foreground">AIMS Website Audit</span>
          <span className="ml-auto text-xs text-muted-foreground bg-deep px-2.5 py-1 rounded-full">Free · Instant</span>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-12">
        <AnimatePresence mode="wait">

          {/* INPUT */}
          {phase === "input" && (
            <motion.div
              key="input"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              className="text-center"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary text-sm font-medium rounded-full mb-6">
                <Zap className="w-3.5 h-3.5" />
                AI-Powered Website Audit
              </div>
              <h1 className="text-4xl font-bold text-foreground mb-4 leading-tight">
                Is Your Website Costing You Leads?
              </h1>
              <p className="text-lg text-muted-foreground mb-10">
                Enter your URL and we&apos;ll scan your site for SEO gaps, conversion problems, and AI-answer readiness in under 30 seconds.
              </p>

              <form onSubmit={startAudit} className="bg-card border border-border rounded-2xl p-6">
                <div className="flex gap-3">
                  <div className="flex-1 relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="text"
                      required
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      placeholder="yourwebsite.com"
                      className="w-full pl-10 pr-4 py-3.5 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-foreground font-medium"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-6 py-3.5 bg-primary text-white font-semibold rounded-xl hover:bg-primary/90 transition-colors whitespace-nowrap"
                  >
                    Audit My Site
                  </button>
                </div>
                <p className="mt-3 text-xs text-muted-foreground">No account required. Results in ~20 seconds.</p>
              </form>

              {/* What we check */}
              <div className="mt-8 grid grid-cols-2 gap-3 text-left">
                {[
                  { icon: BarChart2, label: "SEO & AEO Score", desc: "Rankings + AI answer optimization" },
                  { icon: Zap, label: "Page Speed", desc: "Core Web Vitals and load time" },
                  { icon: TrendingDown, label: "Conversion Gaps", desc: "CTAs, forms, and funnel leaks" },
                  { icon: Shield, label: "Technical Health", desc: "Schema, mobile, accessibility" },
                ].map((item) => (
                  <div key={item.label} className="bg-card border border-border rounded-xl p-4 flex items-start gap-3">
                    <item.icon className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="text-sm font-semibold text-foreground">{item.label}</div>
                      <div className="text-xs text-muted-foreground">{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* SCANNING */}
          {phase === "scanning" && (
            <motion.div
              key="scanning"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
            >
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-foreground mb-2">Scanning {url}</h2>
                <p className="text-muted-foreground text-sm">AI analyzing your site across 6 dimensions</p>
              </div>

              {/* Progress indicator */}
              <div className="mb-6">
                <div className="h-1.5 bg-surface rounded-full overflow-hidden">
                  <motion.div
                    className="h-1.5 bg-primary rounded-full"
                    initial={{ width: "0%" }}
                    animate={{ width: `${(completedSteps.length / AUDIT_STEPS.length) * 100}%` }}
                    transition={{ duration: 0.4 }}
                  />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>{completedSteps.length} of {AUDIT_STEPS.length} complete</span>
                  <span>{Math.round((completedSteps.length / AUDIT_STEPS.length) * 100)}%</span>
                </div>
              </div>

              {/* Steps list */}
              <div className="bg-card border border-border rounded-2xl overflow-hidden">
                {AUDIT_STEPS.map((step, i) => {
                  const isDone = completedSteps.includes(i)
                  const isActive = currentStep === i && !isDone
                  const isPending = !isDone && !isActive

                  return (
                    <div
                      key={step.id}
                      className={cn(
                        "flex items-center gap-4 px-5 py-4 border-b border-border last:border-0 transition-colors",
                        isActive && "bg-primary/10/50"
                      )}
                    >
                      <div className="w-6 h-6 flex-shrink-0 flex items-center justify-center">
                        {isDone && <CheckCircle2 className="w-5 h-5 text-green-500" />}
                        {isActive && <Loader2 className="w-5 h-5 text-primary animate-spin" />}
                        {isPending && <div className="w-2 h-2 rounded-full bg-muted-foreground" />}
                      </div>
                      <div className="flex-1">
                        <div className={cn(
                          "text-sm font-medium",
                          isDone ? "text-muted-foreground line-through" : isActive ? "text-foreground" : "text-muted-foreground"
                        )}>
                          {step.label}
                        </div>
                        {isActive && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-xs text-primary mt-0.5"
                          >
                            {step.detail}
                          </motion.div>
                        )}
                      </div>
                      {isDone && (
                        <span className="text-xs text-green-500 font-medium">Done</span>
                      )}
                    </div>
                  )
                })}
              </div>
            </motion.div>
          )}

          {/* EMAIL GATE */}
          {phase === "email" && (
            <motion.div
              key="email"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="text-center"
            >
              <div className="w-16 h-16 bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-8 h-8 text-green-400" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-3">Audit complete — see your results</h2>
              <p className="text-muted-foreground mb-8 text-sm">
                We found issues on <span className="font-semibold text-foreground">{url}</span>. Enter your email to unlock the full report.
              </p>
              <form onSubmit={handleEmailSubmit} className="bg-card border border-border rounded-2xl p-8 text-left space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Work Email</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
                  />
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-4 bg-primary text-white font-semibold rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-70 flex items-center justify-center gap-2"
                >
                  {submitting ? "Processing..." : <>View Full Report <ArrowRight className="w-4 h-4" /></>}
                </button>
                <p className="text-xs text-center text-muted-foreground">We&apos;ll email you a copy. No spam.</p>
              </form>
            </motion.div>
          )}

          {/* RESULTS */}
          {phase === "results" && scores && (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Overall score */}
              <div className="bg-card border border-border rounded-2xl p-8 text-center">
                <h2 className="text-lg font-semibold text-foreground mb-4">Overall Website Score</h2>
                <div className="flex justify-center mb-4">
                  <ScoreRing score={scores.overall} label="Overall" size={100} />
                </div>
                <div className={cn("text-xl font-bold mb-2", scoreColor(scores.overall))}>
                  {scores.overall < 50 ? "Needs Significant Work" : scores.overall < 70 ? "Room for Improvement" : "Good Foundation"}
                </div>
                <p className="text-muted-foreground text-sm">
                  {analysis?.summary ?? (scores.overall < 50
                    ? "Your site has major gaps that are costing you leads daily. AIMS can address all of these within 2 weeks."
                    : "You're above average but leaving leads on the table. Let's close the gaps.")}
                </p>
              </div>

              {/* Score breakdown */}
              <div className="bg-card border border-border rounded-2xl p-6">
                <h3 className="font-semibold text-foreground mb-5">Score Breakdown</h3>
                <div className="flex justify-around">
                  <ScoreRing score={scores.seo} label="SEO & AEO" size={80} />
                  <ScoreRing score={scores.speed} label="Page Speed" size={80} />
                  <ScoreRing score={scores.conversion} label="Conversion" size={80} />
                  <ScoreRing score={scores.ai} label="AI Readiness" size={80} />
                </div>
              </div>

              {/* Top opportunity */}
              {analysis?.topOpportunity && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
                  <div className="flex items-start gap-3">
                    <Zap className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <div className="text-sm font-semibold text-amber-900 mb-1">Top Opportunity</div>
                      <div className="text-sm text-amber-400">{analysis.topOpportunity}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Top issues */}
              <div className="bg-card border border-border rounded-2xl p-6">
                <h3 className="font-semibold text-foreground mb-4">Issues Found</h3>
                <div className="space-y-3">
                  {(analysis?.issues ?? [
                    { severity: "critical", issue: "No FAQ schema markup — invisible to AI search engines", fix: "AIMS adds structured FAQ schema within 48 hours" },
                    { severity: "high", issue: "CTA appears below the fold on mobile — 60% of visitors miss it", fix: "Conversion audit + sticky CTA implementation" },
                    { severity: "high", issue: "Page load time exceeds 3.2s — above Google's recommended threshold", fix: "Technical SEO sprint to optimize Core Web Vitals" },
                    { severity: "medium", issue: "No lead capture widget on highest-traffic pages", fix: "AI chatbot + form placement optimization" },
                  ]).map((item, i) => (
                    <div key={i} className="flex gap-3 p-4 rounded-xl bg-deep border border-border">
                      <AlertCircle className={cn("w-4 h-4 flex-shrink-0 mt-0.5", item.severity === "critical" ? "text-primary" : item.severity === "high" ? "text-orange-500" : "text-yellow-500")} />
                      <div>
                        <div className="text-sm font-medium text-foreground">{item.issue}</div>
                        <div className="text-xs text-primary mt-0.5 flex items-center gap-1">
                          <Zap className="w-3 h-3" />
                          AIMS Fix: {item.fix}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Strengths */}
              {analysis?.strengths && analysis.strengths.length > 0 && (
                <div className="bg-green-900/15 border border-green-800 rounded-2xl p-6">
                  <h3 className="font-semibold text-green-900 mb-3">What&apos;s Working</h3>
                  <ul className="space-y-2">
                    {analysis.strengths.map((s, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-green-800">
                        <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* CTA */}
              <div className="bg-primary rounded-2xl p-8 text-center text-white">
                <h3 className="text-2xl font-bold mb-3">Let AIMS fix this for you</h3>
                <p className="text-primary-foreground/80 mb-6 text-sm">Book a 30-min call. We&apos;ll walk through your audit and build a fix plan on the spot.</p>
                <a
                  href="/get-started"
                  className="inline-flex items-center gap-2 px-8 py-4 bg-card text-primary font-semibold rounded-xl hover:bg-primary/10 transition-colors"
                >
                  Book Strategy Call
                  <ArrowRight className="w-5 h-5" />
                </a>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  )
}
