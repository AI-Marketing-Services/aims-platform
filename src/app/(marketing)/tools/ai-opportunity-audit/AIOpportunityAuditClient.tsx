"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
  Globe,
  CheckCircle2,
  Loader2,
  ArrowRight,
  Sparkles,
  Building2,
  Users,
  AlertTriangle,
  Cpu,
  Lock,
} from "lucide-react"
import { cn } from "@/lib/utils"

// ─── Types ────────────────────────────────────────────────────────────────

type Phase =
  | "intro"
  | "industry"
  | "size"
  | "bottleneck"
  | "adoption"
  | "url"
  | "scanning"
  | "email"
  | "submitting"

type CompanySize = "1-5" | "6-25" | "26-100" | "100+"
type CurrentAdoption = "none" | "dabbling" | "partial" | "scaled"

interface OpportunityReport {
  companyName: string
  domain: string
  opportunityScore: number
  opportunities: Array<{ rank: number; title: string }>
}

// ─── Static config ────────────────────────────────────────────────────────

const INDUSTRIES = [
  "SaaS / Software",
  "Professional Services",
  "E-commerce / DTC",
  "Manufacturing",
  "Healthcare",
  "Real Estate",
  "Financial Services",
  "Marketing Agency",
  "Other",
]

const SIZE_OPTIONS: Array<{ value: CompanySize; label: string; sub: string }> = [
  { value: "1-5", label: "1–5", sub: "Founder + small team" },
  { value: "6-25", label: "6–25", sub: "Early stage" },
  { value: "26-100", label: "26–100", sub: "Scaling" },
  { value: "100+", label: "100+", sub: "Established" },
]

const BOTTLENECKS = [
  "Sales & lead generation",
  "Customer support",
  "Operations & fulfillment",
  "Marketing & content",
  "Data & reporting",
  "Hiring & onboarding",
  "Something else",
]

const ADOPTION_OPTIONS: Array<{ value: CurrentAdoption; label: string; sub: string }> = [
  { value: "none", label: "None yet", sub: "Haven't started experimenting" },
  { value: "dabbling", label: "Dabbling", sub: "ChatGPT individually, no team rollout" },
  { value: "partial", label: "Partial", sub: "1–2 tools in production" },
  { value: "scaled", label: "Scaled", sub: "AI deeply integrated across workflows" },
]

const SCANNING_STEPS = [
  { label: "Scraping homepage and key pages", duration: 3000 },
  { label: "Extracting brand identity and logo", duration: 1800 },
  { label: "Analyzing your business model", duration: 2500 },
  { label: "Cross-referencing your industry", duration: 2200 },
  { label: "Mapping AI opportunities to your bottleneck", duration: 3500 },
  { label: "Selecting the best-fit tools for your stack", duration: 2800 },
  { label: "Generating your personalized report", duration: 2400 },
]

// ─── Component ────────────────────────────────────────────────────────────

export default function AIOpportunityAuditClient() {
  const router = useRouter()
  const [phase, setPhase] = useState<Phase>("intro")

  // Quiz answers
  const [industry, setIndustry] = useState("")
  const [companySize, setCompanySize] = useState<CompanySize | "">("")
  const [bottleneck, setBottleneck] = useState("")
  const [adoption, setAdoption] = useState<CurrentAdoption | "">("")
  const [url, setUrl] = useState("")
  const [email, setEmail] = useState("")
  const [name, setName] = useState("")

  // Async report state
  const reportPromiseRef = useRef<Promise<OpportunityReport | null> | null>(null)
  const [report, setReport] = useState<OpportunityReport | null>(null)
  const [scanError, setScanError] = useState<string | null>(null)
  const [currentStepIdx, setCurrentStepIdx] = useState(0)
  const [completedSteps, setCompletedSteps] = useState<number[]>([])
  const [submitError, setSubmitError] = useState<string | null>(null)
  const stepTimerRef = useRef<NodeJS.Timeout | null>(null)

  // ── Step navigation helpers ─────────────────────────────────────────────
  function advanceFrom(current: Phase) {
    const order: Phase[] = ["intro", "industry", "size", "bottleneck", "adoption", "url", "scanning", "email"]
    const idx = order.indexOf(current)
    if (idx >= 0 && idx < order.length - 1) {
      setPhase(order[idx + 1])
    }
  }

  function progress(): number {
    const map: Record<Phase, number> = {
      intro: 0,
      industry: 14,
      size: 28,
      bottleneck: 42,
      adoption: 56,
      url: 70,
      scanning: 85,
      email: 95,
      submitting: 100,
    }
    return map[phase] ?? 0
  }

  // ── Kick off the audit when entering scanning phase ─────────────────────
  function startAudit() {
    setScanError(null)
    setReport(null)
    setCurrentStepIdx(0)
    setCompletedSteps([])

    reportPromiseRef.current = fetch("/api/ai/opportunity-audit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url,
        industry,
        companySize,
        bottleneck,
        currentAdoption: adoption,
      }),
    })
      .then(async (res) => {
        // Only try to parse JSON if the server actually sent JSON — otherwise show
        // the HTTP status so we don't leak raw HTML "<!DOCTYPE..." errors to users.
        const contentType = res.headers.get("content-type") ?? ""
        const isJson = contentType.includes("application/json")

        if (!res.ok) {
          if (isJson) {
            const data = await res.json().catch(() => ({}))
            throw new Error(data?.error ?? `Server returned ${res.status}`)
          }
          throw new Error(
            `We couldn't reach the audit service (status ${res.status}). Please try again in a moment.`
          )
        }

        if (!isJson) {
          throw new Error(
            "We got an unexpected response from the audit service. Please try again."
          )
        }

        const data = await res.json()
        if (!data?.report) {
          throw new Error("The audit service returned an empty report. Please try again.")
        }
        return data.report as OpportunityReport
      })
      .catch((err) => {
        const msg = err instanceof Error ? err.message : "Failed to generate report"
        setScanError(msg)
        return null
      })

    setPhase("scanning")
  }

  // ── Run the scanning animation while the API call resolves in parallel ─
  useEffect(() => {
    if (phase !== "scanning") return

    let stepIdx = 0
    function runStep() {
      if (stepIdx >= SCANNING_STEPS.length) {
        // Wait for the API call to resolve before moving to email gate
        reportPromiseRef.current?.then((result) => {
          if (result) {
            setReport(result)
            setTimeout(() => setPhase("email"), 400)
          }
          // If result is null, scanError is already set and rendered inline below.
        })
        return
      }
      setCurrentStepIdx(stepIdx)
      const duration = SCANNING_STEPS[stepIdx].duration
      stepTimerRef.current = setTimeout(() => {
        setCompletedSteps((prev) => [...prev, stepIdx])
        stepIdx++
        runStep()
      }, duration)
    }

    runStep()
    return () => {
      if (stepTimerRef.current) clearTimeout(stepTimerRef.current)
    }
  }, [phase])

  // ── Email gate submission → persist + redirect to results page ──────────
  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim() || !report) return

    setSubmitError(null)
    setPhase("submitting")

    try {
      const res = await fetch("/api/lead-magnets/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "BUSINESS_AI_AUDIT",
          email: email.trim().toLowerCase(),
          name: name.trim() || undefined,
          company: report.companyName,
          score: report.opportunityScore,
          source: "ai-opportunity-audit",
          data: {
            url,
            domain: report.domain,
            industry,
            companySize,
            bottleneck,
            currentAdoption: adoption,
          },
          results: { report },
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data?.error ?? "Submission failed")
      }

      const data = await res.json()
      router.push(`/tools/ai-opportunity-audit/results/${data.id}`)
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong"
      setSubmitError(msg)
      setPhase("email")
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-deep">
      {/* Header */}
      <div className="border-b border-border bg-card sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
          <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="font-semibold text-foreground">AI Opportunity Audit</span>
          <span className="ml-auto text-xs text-muted-foreground bg-deep px-2.5 py-1 rounded-full font-mono uppercase tracking-wider">
            Free · ~90s
          </span>
        </div>
        {phase !== "intro" && phase !== "submitting" && (
          <div className="h-1 bg-deep">
            <motion.div
              className="h-1 bg-primary"
              initial={{ width: 0 }}
              animate={{ width: `${progress()}%` }}
              transition={{ duration: 0.4 }}
            />
          </div>
        )}
      </div>

      <div className="max-w-2xl mx-auto px-4 py-12">
        <AnimatePresence mode="wait">
          {/* INTRO */}
          {phase === "intro" && (
            <motion.div
              key="intro"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              className="text-center"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary text-xs font-mono uppercase tracking-wider rounded-full mb-6">
                <Sparkles className="w-3.5 h-3.5" />
                Personalized for your business
              </div>
              <h1 className="font-serif text-4xl sm:text-5xl text-foreground mb-5 leading-tight">
                The exact AI plays{" "}
                <span className="block text-primary italic">your business should run.</span>
              </h1>
              <p className="text-lg text-muted-foreground mb-10 max-w-xl mx-auto">
                Answer 4 quick questions and drop your URL. We&apos;ll scan your site,
                analyze your industry, and deliver a personalized report with the highest-ROI
                AI opportunities and the exact tools to deploy them. No calls. No fluff.
              </p>

              <button
                onClick={() => setPhase("industry")}
                className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-white font-semibold rounded-md hover:bg-primary/90 transition-colors shadow-[0_0_40px_rgba(196,151,42,0.25)]"
              >
                Start My Audit <ArrowRight className="w-5 h-5" />
              </button>

              <div className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-3 text-left">
                {[
                  { icon: Globe, label: "Multi-page scan" },
                  { icon: Building2, label: "Brand-aware" },
                  { icon: Cpu, label: "5+ opportunities" },
                  { icon: Lock, label: "No spam ever" },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="bg-card border border-border rounded-md p-3 flex items-center gap-2"
                  >
                    <item.icon className="w-4 h-4 text-primary flex-shrink-0" />
                    <span className="text-xs font-medium text-foreground">{item.label}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* INDUSTRY */}
          {phase === "industry" && (
            <QuizQuestion
              key="industry"
              kicker="Question 1 of 4"
              title="What industry are you in?"
              subtitle="Helps us frame the report against companies like yours."
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {INDUSTRIES.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => {
                      setIndustry(opt)
                      advanceFrom("industry")
                    }}
                    className={cn(
                      "text-left px-4 py-3.5 rounded-md border transition-all",
                      industry === opt
                        ? "border-primary bg-primary/10 text-foreground"
                        : "border-border bg-card text-foreground hover:border-primary/40"
                    )}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </QuizQuestion>
          )}

          {/* SIZE */}
          {phase === "size" && (
            <QuizQuestion
              key="size"
              kicker="Question 2 of 4"
              title="How big is your team?"
              subtitle="The right AI moves look very different at 5 people vs 50."
            >
              <div className="grid grid-cols-2 gap-3">
                {SIZE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => {
                      setCompanySize(opt.value)
                      advanceFrom("size")
                    }}
                    className={cn(
                      "text-left p-5 rounded-md border transition-all",
                      companySize === opt.value
                        ? "border-primary bg-primary/10"
                        : "border-border bg-card hover:border-primary/40"
                    )}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Users className="w-4 h-4 text-primary" />
                      <span className="text-base font-bold text-foreground">{opt.label}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{opt.sub}</p>
                  </button>
                ))}
              </div>
            </QuizQuestion>
          )}

          {/* BOTTLENECK */}
          {phase === "bottleneck" && (
            <QuizQuestion
              key="bottleneck"
              kicker="Question 3 of 4"
              title="Where's your biggest bottleneck right now?"
              subtitle="The thing that's eating the most hours, not the most exciting moonshot."
            >
              <div className="space-y-2">
                {BOTTLENECKS.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => {
                      setBottleneck(opt)
                      advanceFrom("bottleneck")
                    }}
                    className={cn(
                      "w-full text-left px-4 py-3.5 rounded-md border transition-all flex items-center justify-between",
                      bottleneck === opt
                        ? "border-primary bg-primary/10 text-foreground"
                        : "border-border bg-card text-foreground hover:border-primary/40"
                    )}
                  >
                    <span>{opt}</span>
                    <ArrowRight className="w-4 h-4 text-muted-foreground" />
                  </button>
                ))}
              </div>
            </QuizQuestion>
          )}

          {/* ADOPTION */}
          {phase === "adoption" && (
            <QuizQuestion
              key="adoption"
              kicker="Question 4 of 4"
              title="Where are you with AI today?"
              subtitle="Be honest — we calibrate the report based on your actual starting point."
            >
              <div className="space-y-2">
                {ADOPTION_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => {
                      setAdoption(opt.value)
                      advanceFrom("adoption")
                    }}
                    className={cn(
                      "w-full text-left px-4 py-4 rounded-md border transition-all",
                      adoption === opt.value
                        ? "border-primary bg-primary/10"
                        : "border-border bg-card hover:border-primary/40"
                    )}
                  >
                    <div className="text-base font-semibold text-foreground">{opt.label}</div>
                    <p className="text-xs text-muted-foreground mt-0.5">{opt.sub}</p>
                  </button>
                ))}
              </div>
            </QuizQuestion>
          )}

          {/* URL */}
          {phase === "url" && (
            <motion.div
              key="url"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              className="text-center"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary text-xs font-mono uppercase tracking-wider rounded-full mb-6">
                Almost done
              </div>
              <h2 className="font-serif text-3xl sm:text-4xl text-foreground mb-3">
                What&apos;s your website?
              </h2>
              <p className="text-muted-foreground mb-8">
                We&apos;ll scrape your homepage and key pages to make the report specific to you.
              </p>

              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  if (url.trim()) startAudit()
                }}
                className="bg-card border border-border rounded-md p-6"
              >
                <div className="flex gap-3">
                  <div className="flex-1 relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="text"
                      required
                      autoFocus
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      placeholder="yourcompany.com"
                      className="w-full pl-10 pr-4 py-3.5 bg-card border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-foreground font-medium placeholder:text-muted-foreground/50"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-6 py-3.5 bg-primary text-white font-semibold rounded-md hover:bg-primary/90 transition-colors whitespace-nowrap inline-flex items-center gap-2"
                  >
                    Generate Report <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
                <p className="mt-3 text-xs text-muted-foreground">
                  We don&apos;t store your URL beyond this report.
                </p>
              </form>
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
                <h2 className="font-serif text-3xl text-foreground mb-2">
                  Building your report
                </h2>
                <p className="text-muted-foreground text-sm">
                  Scanning <span className="text-foreground font-semibold">{url}</span> and
                  cross-referencing your industry
                </p>
              </div>

              {scanError ? (
                <div className="bg-card border border-primary/30 rounded-md p-6 text-center">
                  <AlertTriangle className="w-8 h-8 text-primary mx-auto mb-3" />
                  <p className="font-semibold text-foreground mb-2">We couldn&apos;t generate your report</p>
                  <p className="text-sm text-muted-foreground mb-5">{scanError}</p>
                  <button
                    onClick={() => setPhase("url")}
                    className="px-5 py-2.5 bg-primary text-white font-semibold rounded-md text-sm hover:bg-primary/90"
                  >
                    Try a different URL
                  </button>
                </div>
              ) : (
                <div className="bg-card border border-border rounded-md overflow-hidden">
                  {SCANNING_STEPS.map((step, i) => {
                    const isDone = completedSteps.includes(i)
                    const isActive = currentStepIdx === i && !isDone
                    return (
                      <div
                        key={i}
                        className={cn(
                          "flex items-center gap-4 px-5 py-4 border-b border-border last:border-0",
                          isActive && "bg-primary/5"
                        )}
                      >
                        <div className="w-6 h-6 flex items-center justify-center">
                          {isDone && <CheckCircle2 className="w-5 h-5 text-green-500" />}
                          {isActive && <Loader2 className="w-5 h-5 text-primary animate-spin" />}
                          {!isDone && !isActive && (
                            <div className="w-2 h-2 rounded-full bg-muted-foreground/40" />
                          )}
                        </div>
                        <div
                          className={cn(
                            "text-sm font-medium",
                            isDone
                              ? "text-muted-foreground line-through"
                              : isActive
                              ? "text-foreground"
                              : "text-muted-foreground"
                          )}
                        >
                          {step.label}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </motion.div>
          )}

          {/* EMAIL GATE */}
          {phase === "email" && report && (
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
              <h2 className="font-serif text-3xl text-foreground mb-3">
                Your report is ready.
              </h2>
              <p className="text-muted-foreground mb-2">
                We found{" "}
                <span className="font-bold text-primary">
                  {report.opportunities.length} high-impact AI opportunities
                </span>{" "}
                for {report.companyName}.
              </p>
              <p className="text-muted-foreground mb-8 text-sm">
                Drop your details and we&apos;ll unlock the full breakdown.
              </p>

              <form
                onSubmit={handleEmailSubmit}
                className="bg-card border border-border rounded-md p-6 text-left space-y-3"
              >
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name (optional)"
                  className="w-full px-4 py-3 bg-card border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-foreground placeholder:text-muted-foreground/50"
                />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  className="w-full px-4 py-3 bg-card border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-foreground placeholder:text-muted-foreground/50"
                />
                <button
                  type="submit"
                  className="w-full py-3.5 bg-primary text-white font-semibold rounded-md hover:bg-primary/90 transition-colors inline-flex items-center justify-center gap-2"
                >
                  Unlock the Full Report <ArrowRight className="w-4 h-4" />
                </button>
                {submitError && (
                  <p className="text-xs text-primary text-center">{submitError}</p>
                )}
                <p className="text-xs text-center text-muted-foreground">
                  We&apos;ll email you a copy. Unsubscribe anytime.
                </p>
              </form>
            </motion.div>
          )}

          {/* SUBMITTING */}
          {phase === "submitting" && (
            <motion.div
              key="submitting"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20"
            >
              <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Saving your report and redirecting…</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

// ─── Quiz question wrapper ────────────────────────────────────────────────

function QuizQuestion({
  kicker,
  title,
  subtitle,
  children,
}: {
  kicker: string
  title: string
  subtitle?: string
  children: React.ReactNode
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
    >
      <div className="text-center mb-8">
        <p className="text-xs font-mono uppercase tracking-wider text-primary mb-3">{kicker}</p>
        <h2 className="font-serif text-3xl sm:text-4xl text-foreground mb-3 leading-tight">
          {title}
        </h2>
        {subtitle && <p className="text-muted-foreground text-sm">{subtitle}</p>}
      </div>
      {children}
    </motion.div>
  )
}
