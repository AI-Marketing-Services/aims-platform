import { notFound } from "next/navigation"
import { db } from "@/lib/db"
import Link from "next/link"
import type { Metadata } from "next"
import {
  ArrowRight,
  AlertTriangle,
  TrendingUp,
  Building2,
  Users,
  Clock,
  DollarSign,
  Zap,
  Target,
  BarChart3,
  Layers,
  CheckCircle2,
  CalendarDays,
  ChevronRight,
  FileText,
  Cpu,
} from "lucide-react"
import { ShareButtons } from "./ShareButtons"

// ─── Types ────────────────────────────────────────────────────────────────────

interface StoredData {
  snapshot: {
    headcount: string
    revenue: string
    industry: string
    topGoal: string
  }
  departments: Array<{
    id: string
    name: string
    headcount: number
    manualHoursPerWeek: number
    selected: boolean
    answers: string[]
  }>
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

interface Props {
  params: Promise<{ submissionId: string }>
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
}

function getScoreColor(score: number): string {
  if (score < 40) return "#ef4444"
  if (score < 60) return "#f59e0b"
  if (score < 80) return "#3b82f6"
  return "#22c55e"
}

function getScoreColorClass(score: number): string {
  if (score < 40) return "text-red-400"
  if (score < 60) return "text-amber-400"
  if (score < 80) return "text-blue-400"
  return "text-green-400"
}

function getTierBadge(score: number): { label: string; className: string } {
  if (score < 40) return { label: "OPTIMIZATION TARGET", className: "bg-red-500/15 text-red-400 border border-red-500/30" }
  if (score < 70) return { label: "GROWTH READY", className: "bg-amber-500/15 text-amber-400 border border-amber-500/30" }
  return { label: "HIGH PERFORMER", className: "bg-green-500/15 text-green-400 border border-green-500/30" }
}

const DEPT_RECOMMENDATIONS: Record<string, string> = {
  sales: "AI outbound sequences, lead scoring, and CRM auto-update would reclaim 60-70% of your reps' non-selling time.",
  marketing: "AI content generation, campaign automation, and lead routing can cut campaign production time by 4-5x.",
  "customer-success": "Proactive AI health score monitoring and automated check-in sequences can reduce churn by 20-35%.",
  operations: "AI-powered workflow automation and process documentation can eliminate 80% of your manual fulfillment steps.",
  finance: "Automated close processes and real-time AI dashboards can reduce month-end from days to hours.",
  hr: "AI-assisted recruiting, onboarding automation, and HR workflows can 3x your HR team's strategic capacity.",
  executive: "Executive AI assistants, automated reporting, and delegation systems can recover 10-15 hours of your week.",
}

// ─── Metadata ─────────────────────────────────────────────────────────────────

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { submissionId } = await params
  const sub = await db.leadMagnetSubmission.findUnique({ where: { id: submissionId } })
  if (!sub) return { title: "Executive Ops Audit — AIMS" }

  const score = Math.round(sub.score ?? 0)
  const name = sub.name ?? "Executive"

  return {
    title: `${name} Ops Audit — ${score}/100 Efficiency Score | AIMS`,
    description:
      "See the full executive operations audit including department scores, cost of inefficiency analysis, and AI automation roadmap.",
  }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function ExecutiveOpsAuditResultsPage({ params }: Props) {
  const { submissionId } = await params

  const sub = await db.leadMagnetSubmission.findUnique({ where: { id: submissionId } })

  if (!sub) notFound()

  const score = Math.round(sub.score ?? 0)
  const data = sub.data as unknown as StoredData

  const snapshot = data?.snapshot
  const departments = (data?.departments ?? []).filter((d) => d.selected)
  const bottlenecks = data?.bottlenecks
  const costCapacity = data?.costCapacity
  const aiReadiness = data?.aiReadiness
  const scores = data?.scores

  // Cost calculations
  const manualHoursWeekly = costCapacity?.manualHoursWeekly ?? 0
  const monthlyToolSpend = costCapacity?.monthlyToolSpend ?? 0
  const annualLaborCost = Math.round(manualHoursWeekly * 52 * 55)
  const annualToolSpend = monthlyToolSpend * 12
  const laborSavingsLow = Math.round(annualLaborCost * 0.6)
  const laborSavingsHigh = Math.round(annualLaborCost * 0.75)
  const toolSavingsLow = Math.round(annualToolSpend * 0.2)
  const toolSavingsHigh = Math.round(annualToolSpend * 0.3)
  const totalOpportunityLow = laborSavingsLow + toolSavingsLow
  const totalOpportunityHigh = laborSavingsHigh + toolSavingsHigh

  const costOfInefficiency = scores?.costOfInefficiency ?? annualLaborCost
  const aiRoiPotential = scores?.aiRoiPotential ?? totalOpportunityLow

  const tier = getTierBadge(score)
  const scoreColor = getScoreColor(score)
  const scoreColorClass = getScoreColorClass(score)

  // Sort selected depts by score (lowest first = highest priority)
  const deptsByPriority = [...departments].sort((a, b) => {
    const aScore = scores?.byDepartment?.[a.id] ?? 50
    const bScore = scores?.byDepartment?.[b.id] ?? 50
    return aScore - bScore
  })

  const currentTools = aiReadiness?.currentTools ?? []
  const toolCount = currentTools.length
  let toolReadinessLabel: string
  if (toolCount <= 3) toolReadinessLabel = "Early-stage tech stack — significant consolidation and automation opportunity."
  else if (toolCount <= 8) toolReadinessLabel = "Growing stack — integration gaps are likely creating data silos."
  else toolReadinessLabel = "Complex stack — consolidation and orchestration would reduce friction significantly."

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://aimseos.com"
  const shareUrl = `${appUrl}/tools/executive-ops-audit/results/${submissionId}`

  // ── Service recommendations by score tier ─────────────────────────────────
  type ServiceCard = { name: string; desc: string; price: string }
  const servicesLow: ServiceCard[] = [
    { name: "Cold Outbound Engine", desc: "AI-powered outbound system that fills your pipeline on autopilot — sequences, personalization, and follow-up handled for you.", price: "from $297/mo" },
    { name: "Operations Automation", desc: "Eliminate your highest-cost manual workflows. We map, automate, and monitor your core ops processes end-to-end.", price: "from $397/mo" },
    { name: "CRM Build + Automation", desc: "Full CRM setup with automated deal stages, follow-up sequences, and activity logging — no manual data entry.", price: "from $247/mo" },
  ]
  const servicesMid: ServiceCard[] = [
    { name: "AI Workflow Automation", desc: "Target your 3 highest-friction workflows and replace them with AI-powered systems in 30–60 days.", price: "from $297/mo" },
    { name: "Revenue Operations Setup", desc: "Connect your sales, marketing, and CS data into one unified view with automated handoffs and reporting.", price: "from $247/mo" },
    { name: "Finance + Reporting Automation", desc: "Automated P&L dashboards, cash flow alerts, and month-end close acceleration.", price: "from $197/mo" },
  ]
  const servicesHigh: ServiceCard[] = [
    { name: "Custom AI Agent Build", desc: "Bespoke AI agents designed around your specific workflows — built, deployed, and maintained by AIMS.", price: "Custom" },
    { name: "Executive Intelligence Dashboard", desc: "Automated weekly briefings, KPI tracking, and alert systems so you have full visibility without manual compilation.", price: "from $297/mo" },
    { name: "Advanced Integration Suite", desc: "Deep integrations across your tech stack — eliminate silos, unify data, and automate cross-system workflows.", price: "from $397/mo" },
  ]

  const services = score < 40 ? servicesLow : score < 70 ? servicesMid : servicesHigh

  return (
    <div className="min-h-screen bg-deep print:bg-white">
      <div className="max-w-5xl mx-auto px-4 py-12 print:py-6">

        {/* ── Header Nav ──────────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10 print:hidden">
          <Link
            href="/tools/executive-ops-audit"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <FileText className="w-4 h-4" />
            Retake Audit
          </Link>
          <ShareButtons shareUrl={shareUrl} costOfInefficiency={costOfInefficiency} />
        </div>

        {/* ══════════════════════════════════════════════════════════════════════
            SECTION 1 — Executive Summary Banner
        ══════════════════════════════════════════════════════════════════════ */}
        <div className="bg-card border border-border border-l-4 border-l-[#C4972A] rounded-2xl p-8 mb-6 relative overflow-hidden shadow-lg">
          <div
            className="absolute top-0 right-0 w-96 h-96 opacity-[0.03] blur-3xl pointer-events-none"
            style={{ background: "radial-gradient(circle, #C4972A, transparent 70%)" }}
          />
          <div className="relative">
            {/* Label row */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <span className="text-xs font-bold tracking-[0.2em] text-primary uppercase">
                Executive Operations Audit
              </span>
              <div className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                <CalendarDays className="w-3.5 h-3.5" />
                Issued {formatDate(sub.createdAt)}
              </div>
            </div>

            {/* Company / name */}
            <div className="mb-6">
              {(sub.company || sub.name) && (
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground leading-tight">
                  {sub.company ?? sub.name}
                  {sub.company && sub.name && (
                    <span className="text-muted-foreground font-normal text-lg"> — {sub.name}</span>
                  )}
                </h1>
              )}
              {!sub.company && !sub.name && (
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Executive Operations Audit</h1>
              )}
            </div>

            {/* 3 headline stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              {/* Overall score */}
              <div className="bg-deep/60 border border-border rounded-xl p-5">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-2">Overall Efficiency Score</p>
                <div className="flex items-end gap-1">
                  <span className={`text-5xl font-black tabular-nums leading-none ${scoreColorClass}`}>{score}</span>
                  <span className="text-xl text-muted-foreground font-bold mb-1">/100</span>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {score < 40 ? "Significant optimization potential" : score < 70 ? "Strong automation ROI available" : "Well-optimized — ready to scale"}
                </p>
              </div>

              {/* Cost of inefficiency */}
              <div className="bg-red-950/20 border border-red-900/30 rounded-xl p-5">
                <p className="text-xs text-red-400/80 font-medium uppercase tracking-wider mb-2">Annual Cost of Inefficiency</p>
                <div className="flex items-end gap-1">
                  <span className="text-4xl font-black text-red-400 tabular-nums leading-none">
                    ${costOfInefficiency.toLocaleString()}
                  </span>
                </div>
                <p className="text-xs text-red-400/60 mt-2">Estimated labor friction cost</p>
              </div>

              {/* AI ROI potential */}
              <div className="bg-green-950/20 border border-green-900/30 rounded-xl p-5">
                <p className="text-xs text-green-400/80 font-medium uppercase tracking-wider mb-2">AI ROI Potential</p>
                <div className="flex items-end gap-1">
                  <span className="text-4xl font-black text-green-400 tabular-nums leading-none">
                    ${aiRoiPotential.toLocaleString()}
                  </span>
                  <span className="text-sm text-green-400/70 font-semibold mb-1">/yr</span>
                </div>
                <p className="text-xs text-green-400/60 mt-2">Projected savings from automation</p>
              </div>
            </div>

            {/* Tier badge */}
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold tracking-wide ${tier.className}`}>
              <Target className="w-3.5 h-3.5" />
              {tier.label}
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════════════
            SECTION 2 — Company Profile
        ══════════════════════════════════════════════════════════════════════ */}
        {snapshot && (
          <div className="bg-card border border-border rounded-2xl p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Building2 className="w-4 h-4 text-primary" />
              <h2 className="font-bold text-foreground">Company Profile</h2>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
              {snapshot.revenue && (
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Annual Revenue</p>
                  <p className="text-sm font-semibold text-foreground">{snapshot.revenue}</p>
                </div>
              )}
              {snapshot.headcount && (
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Headcount</p>
                  <p className="text-sm font-semibold text-foreground">{snapshot.headcount} employees</p>
                </div>
              )}
              {snapshot.industry && (
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Industry</p>
                  <p className="text-sm font-semibold text-foreground">{snapshot.industry}</p>
                </div>
              )}
              {sub.email && (
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Contact</p>
                  <p className="text-sm font-semibold text-foreground truncate">{sub.email}</p>
                </div>
              )}
            </div>

            {snapshot.topGoal && (
              <div className="border-l-2 border-primary/50 bg-primary/5 rounded-r-xl pl-4 pr-4 py-3">
                <p className="text-xs text-primary uppercase tracking-wider mb-1 font-semibold">Stated Top Goal</p>
                <p className="text-sm text-foreground italic leading-relaxed">
                  &ldquo;{snapshot.topGoal}&rdquo;
                </p>
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            SECTION 3 — Department Efficiency Breakdown
        ══════════════════════════════════════════════════════════════════════ */}
        {departments.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-1">
              <BarChart3 className="w-4 h-4 text-primary" />
              <h2 className="font-bold text-foreground text-lg">Department Efficiency Breakdown</h2>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Scores indicate operational efficiency — lower scores represent the highest automation ROI
            </p>

            <div className="grid md:grid-cols-2 gap-4">
              {departments.map((dept) => {
                const deptScore = scores?.byDepartment?.[dept.id] ?? 50
                const barColor = getScoreColor(deptScore)
                const approxHours = dept.headcount * (dept.manualHoursPerWeek ?? 0)
                const rec = DEPT_RECOMMENDATIONS[dept.id]
                const priorityLabel =
                  deptScore < 40
                    ? "High priority"
                    : deptScore < 70
                    ? "Medium priority"
                    : "Well-optimized"
                const priorityColor =
                  deptScore < 40
                    ? "text-red-400"
                    : deptScore < 70
                    ? "text-amber-400"
                    : "text-green-400"

                return (
                  <div key={dept.id} className="bg-card border border-border rounded-2xl p-6 hover:border-primary/30 transition-colors">
                    {/* Dept header */}
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="font-bold text-foreground">{dept.name}</h3>
                        {dept.headcount > 0 && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                            <Users className="w-3 h-3" />
                            {dept.headcount} people
                          </p>
                        )}
                      </div>
                      <span className="text-2xl font-black tabular-nums" style={{ color: barColor }}>
                        {deptScore}%
                      </span>
                    </div>

                    {/* Score bar */}
                    <div className="h-2 bg-deep rounded-full overflow-hidden mb-1">
                      <div
                        className="h-2 rounded-full transition-all duration-700"
                        style={{ width: `${deptScore}%`, backgroundColor: barColor }}
                      />
                    </div>
                    <p className={`text-xs font-semibold mb-3 ${priorityColor}`}>{priorityLabel}</p>

                    {/* Manual hours estimate */}
                    {approxHours > 0 && (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-3">
                        <Clock className="w-3 h-3" />
                        Approx. {approxHours} hrs/week in manual work
                      </div>
                    )}

                    {/* Dept answers */}
                    {dept.answers && dept.answers.filter(Boolean).length > 0 && (
                      <div className="space-y-1 mb-3">
                        {dept.answers.filter(Boolean).map((answer, i) => (
                          <p key={i} className="text-xs text-muted-foreground italic leading-relaxed pl-3 border-l border-border">
                            &ldquo;{answer}&rdquo;
                          </p>
                        ))}
                      </div>
                    )}

                    {/* AI Recommendation */}
                    {rec && (
                      <div className="bg-primary/5 border border-primary/15 rounded-lg p-3 mt-3">
                        <p className="text-xs text-primary font-semibold mb-1 uppercase tracking-wide">
                          {deptScore < 40
                            ? "High priority — significant automation opportunity"
                            : deptScore < 70
                            ? "Medium priority — targeted automation would yield strong returns"
                            : "Well-optimized — focus on maintaining and incrementally improving"}
                        </p>
                        <p className="text-xs text-foreground/80 leading-relaxed">{rec}</p>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            SECTION 4 — Pain Point Analysis
        ══════════════════════════════════════════════════════════════════════ */}
        {bottlenecks && (
          <div className="bg-card border border-border rounded-2xl p-6 mb-6">
            <div className="flex items-center gap-2 mb-5">
              <AlertTriangle className="w-4 h-4 text-primary" />
              <h2 className="font-bold text-foreground text-lg">Pain Point Analysis</h2>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Left: their answers */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Your Responses</h3>

                {bottlenecks.biggestHeadache && (
                  <div className="bg-deep/50 border border-border rounded-xl p-4">
                    <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wide mb-2">
                      Primary Operational Constraint
                    </p>
                    <p className="text-sm text-foreground leading-relaxed">{bottlenecks.biggestHeadache}</p>
                  </div>
                )}

                {bottlenecks.highPaidWaste && (
                  <div className="bg-deep/50 border border-border rounded-xl p-4">
                    <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wide mb-2">
                      Highest-Cost Inefficiency
                    </p>
                    <p className="text-sm text-foreground leading-relaxed">{bottlenecks.highPaidWaste}</p>
                  </div>
                )}

                {bottlenecks.eliminateOne && (
                  <div className="bg-deep/50 border border-border rounded-xl p-4">
                    <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wide mb-2">
                      Process to Eliminate
                    </p>
                    <p className="text-sm text-foreground leading-relaxed">{bottlenecks.eliminateOne}</p>
                  </div>
                )}

                {bottlenecks.aiAgentPlacement && (
                  <div className="bg-deep/50 border border-border rounded-xl p-4">
                    <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wide mb-2">
                      Ideal First AI Deployment
                    </p>
                    <p className="text-sm text-foreground leading-relaxed">{bottlenecks.aiAgentPlacement}</p>
                  </div>
                )}
              </div>

              {/* Right: AIMS assessments */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-primary uppercase tracking-wider">AIMS Assessment</h3>

                {bottlenecks.biggestHeadache && (
                  <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
                    <div className="flex items-start gap-2">
                      <Target className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs text-primary font-semibold mb-1">Primary Constraint</p>
                        <p className="text-xs text-foreground/80 leading-relaxed">
                          Operational bottlenecks at this level typically represent $50K–$200K in annual friction. Our Operations Automation engagement targets exactly this type of constraint.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {bottlenecks.highPaidWaste && (
                  <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
                    <div className="flex items-start gap-2">
                      <DollarSign className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs text-primary font-semibold mb-1">High-Paid Waste</p>
                        <p className="text-xs text-foreground/80 leading-relaxed">
                          When senior talent is executing junior-level tasks, you&apos;re burning 3–5x the cost per hour. AI delegation systems can reclaim this immediately.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {bottlenecks.eliminateOne && (
                  <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
                    <div className="flex items-start gap-2">
                      <Zap className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs text-primary font-semibold mb-1">Process Elimination</p>
                        <p className="text-xs text-foreground/80 leading-relaxed">
                          Process elimination is often faster than process improvement. AIMS can automate, eliminate, or systematically replace this in 30–60 days.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {bottlenecks.aiAgentPlacement && (
                  <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
                    <div className="flex items-start gap-2">
                      <Cpu className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs text-primary font-semibold mb-1">First AI Deployment</p>
                        <p className="text-xs text-foreground/80 leading-relaxed">
                          This is a strong instinct. AI agents in this role typically generate 3–8x ROI within 90 days. This would be our first recommendation.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            SECTION 5 — Cost of Inefficiency Breakdown
        ══════════════════════════════════════════════════════════════════════ */}
        {(manualHoursWeekly > 0 || monthlyToolSpend > 0) && (
          <div className="bg-card border border-border rounded-2xl p-6 mb-6">
            <div className="flex items-center gap-2 mb-5">
              <DollarSign className="w-4 h-4 text-primary" />
              <h2 className="font-bold text-foreground text-lg">Cost of Inefficiency Breakdown</h2>
            </div>

            <div className="space-y-5">
              {/* Labor cost */}
              {manualHoursWeekly > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <p className="text-sm font-semibold text-foreground">
                      Weekly manual hours: {manualHoursWeekly} hours across your team
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3 ml-6">
                    Annualized at $55/hr average fully-loaded cost
                  </p>

                  {/* Calculation display */}
                  <div className="bg-red-950/20 border border-red-900/30 rounded-xl p-5 mb-3">
                    <p className="text-sm text-red-400/70 mb-1 font-mono text-center">
                      {manualHoursWeekly} hrs/wk &times; 52 weeks &times; $55/hr
                    </p>
                    <p className="text-2xl font-black text-red-400 text-center tabular-nums">
                      = ${annualLaborCost.toLocaleString()}/yr
                    </p>
                  </div>

                  <div className="bg-green-950/20 border border-green-900/30 rounded-xl p-4">
                    <p className="text-xs text-green-400/70 mb-1">AI automation typically eliminates 60–75% of this</p>
                    <p className="text-sm font-bold text-green-400">
                      Projected savings: ${laborSavingsLow.toLocaleString()} – ${laborSavingsHigh.toLocaleString()}/yr
                    </p>
                  </div>
                </div>
              )}

              {/* Tool spend */}
              {monthlyToolSpend > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Layers className="w-4 h-4 text-muted-foreground" />
                    <p className="text-sm font-semibold text-foreground">
                      Monthly tool spend: ${monthlyToolSpend.toLocaleString()}/mo (${annualToolSpend.toLocaleString()}/yr)
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground ml-6 mb-2">
                    AIMS audit typically identifies 20–30% in tool consolidation savings
                  </p>
                  {(toolSavingsLow > 0) && (
                    <div className="bg-amber-950/20 border border-amber-900/30 rounded-xl p-4 ml-6">
                      <p className="text-sm font-bold text-amber-400">
                        Consolidation opportunity: ${toolSavingsLow.toLocaleString()} – ${toolSavingsHigh.toLocaleString()}/yr
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Total opportunity line */}
              {totalOpportunityLow > 0 && (
                <div className="border-t border-border pt-4">
                  <div className="bg-primary/10 border border-primary/30 rounded-xl p-5">
                    <p className="text-xs text-primary/70 uppercase tracking-wider mb-1 font-semibold">Total Optimization Opportunity</p>
                    <p className="text-2xl font-black text-primary tabular-nums">
                      ${totalOpportunityLow.toLocaleString()} – ${totalOpportunityHigh.toLocaleString()} per year
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            SECTION 6 — AI Readiness Analysis
        ══════════════════════════════════════════════════════════════════════ */}
        {aiReadiness && (
          <div className="bg-card border border-border rounded-2xl p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Cpu className="w-4 h-4 text-primary" />
              <h2 className="font-bold text-foreground text-lg">AI Readiness Analysis</h2>
            </div>

            {/* Current tool stack */}
            {currentTools.length > 0 && (
              <div className="mb-4">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2 font-medium">Current Tool Stack</p>
                <div className="flex flex-wrap gap-2 mb-3">
                  {currentTools.map((tool: string) => (
                    <span key={tool} className="px-3 py-1 bg-deep border border-border rounded-full text-xs text-foreground font-medium">
                      {tool}
                    </span>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground">{toolReadinessLabel}</p>
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-4 mt-4">
              {aiReadiness.automationAttempts && (
                <div className="bg-deep/50 border border-border rounded-xl p-4">
                  <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wide mb-2">
                    Automation History
                  </p>
                  <p className="text-sm text-foreground leading-relaxed">{aiReadiness.automationAttempts}</p>
                </div>
              )}
              {aiReadiness.resistantDept && (
                <div className="bg-deep/50 border border-border rounded-xl p-4">
                  <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wide mb-2">
                    Most Resistant Department
                  </p>
                  <p className="text-sm text-foreground leading-relaxed">{aiReadiness.resistantDept}</p>
                </div>
              )}
            </div>

            <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 mt-4">
              <p className="text-sm text-foreground/80 leading-relaxed">
                {toolCount <= 3
                  ? "Your tech stack has significant room for expansion. Before adding tools, we recommend mapping your workflows — many gaps can be filled with a single integrated platform rather than point solutions."
                  : toolCount <= 8
                  ? "Your stack shows healthy growth, but disconnected tools create invisible overhead. Integrating your existing tools before adding new ones is the highest-leverage first move."
                  : "Complex stacks often hide $30K–$80K in annual tool redundancy. A consolidation audit would identify overlap, eliminate waste, and simplify your team's daily operations."}
              </p>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            SECTION 7 — Prioritized Automation Roadmap
        ══════════════════════════════════════════════════════════════════════ */}
        <div className="bg-card border border-border rounded-2xl p-6 mb-6">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-primary" />
            <h2 className="font-bold text-foreground text-lg">Prioritized Automation Roadmap</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-6">
            Departments ranked by automation urgency — lowest efficiency scores get highest priority
          </p>

          <div className="space-y-5">
            {deptsByPriority.slice(0, 3).map((dept, i) => {
              const deptScore = scores?.byDepartment?.[dept.id] ?? 50
              const priorityLevel = deptScore < 40 ? "Critical Priority" : deptScore < 70 ? "High Priority" : "Optimization"
              const priorityColor = deptScore < 40 ? "text-red-400" : deptScore < 70 ? "text-amber-400" : "text-blue-400"
              const estRoiLow = Math.max(2000, Math.round((dept.headcount * (dept.manualHoursPerWeek ?? 8) * 55 * 0.6) / 12 / 100) * 100)
              const estRoiHigh = Math.max(4000, Math.round((dept.headcount * (dept.manualHoursPerWeek ?? 8) * 55 * 0.75) / 12 / 100) * 100)

              return (
                <div key={dept.id} className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-9 h-9 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center">
                    <span className="text-sm font-black text-primary">{i + 1}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <p className="text-sm font-bold text-foreground">{dept.name}</p>
                      <span className={`text-xs font-semibold ${priorityColor}`}>— {priorityLevel}</span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed mb-2">
                      {DEPT_RECOMMENDATIONS[dept.id] ?? "Targeted automation would meaningfully reduce manual overhead and free your team for strategic work."}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-deep border border-border rounded-full text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" /> 2–4 weeks
                      </span>
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-950/30 border border-green-900/30 rounded-full text-xs text-green-400">
                        <TrendingUp className="w-3 h-3" /> ${estRoiLow.toLocaleString()}–${estRoiHigh.toLocaleString()}/mo
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}

            {/* Step 4: Tech stack integration */}
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-9 h-9 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center">
                <span className="text-sm font-black text-primary">{Math.min(deptsByPriority.length, 3) + 1}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-foreground mb-1">Integrate and automate your core tech stack</p>
                <p className="text-xs text-muted-foreground leading-relaxed mb-2">
                  Connect your existing tools, eliminate duplicate data entry, and build automated workflows between systems. This compounds the value of every automation above.
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-deep border border-border rounded-full text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" /> 3–4 weeks
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-950/30 border border-green-900/30 rounded-full text-xs text-green-400">
                    <TrendingUp className="w-3 h-3" /> $3,000–$8,000/mo
                  </span>
                </div>
              </div>
            </div>

            {/* Step 5: Executive dashboard */}
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-9 h-9 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center">
                <span className="text-sm font-black text-primary">{Math.min(deptsByPriority.length, 3) + 2}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-foreground mb-1">Deploy executive reporting dashboard</p>
                <p className="text-xs text-muted-foreground leading-relaxed mb-2">
                  Automated weekly briefings, KPI tracking, and alert systems so you have real-time visibility without manual compilation.
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-deep border border-border rounded-full text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" /> 2 weeks
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════════════
            SECTION 8 — AIMS Engagement Recommendations
        ══════════════════════════════════════════════════════════════════════ */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle2 className="w-4 h-4 text-primary" />
            <h2 className="font-bold text-foreground text-lg">Recommended AIMS Engagements</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Services matched to your{" "}
            <span className={scoreColorClass}>
              {score < 40 ? "Optimization Target" : score < 70 ? "Growth Ready" : "High Performer"}
            </span>{" "}
            profile
          </p>

          <div className="grid md:grid-cols-3 gap-4">
            {services.map((svc) => (
              <div
                key={svc.name}
                className="bg-card border border-border rounded-xl p-5 flex flex-col hover:border-primary/40 transition-colors"
              >
                <h4 className="font-bold text-foreground text-sm mb-2 leading-snug">{svc.name}</h4>
                <p className="text-xs text-muted-foreground leading-relaxed flex-1 mb-3">{svc.desc}</p>
                <div className="text-sm font-bold text-primary mb-3">{svc.price}</div>
                <Link
                  href="/marketplace"
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-primary/10 text-primary text-xs font-bold rounded-lg hover:bg-primary/20 transition-colors"
                >
                  Learn more <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════════════
            SECTION 9 — CTA Banner
        ══════════════════════════════════════════════════════════════════════ */}
        <div className="bg-card border border-primary/25 rounded-2xl p-8 sm:p-12 text-center relative overflow-hidden">
          <div
            className="absolute inset-0 opacity-[0.06] pointer-events-none"
            style={{ background: "radial-gradient(ellipse at center, #C4972A, transparent 65%)" }}
          />
          <div className="relative">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary text-xs font-bold rounded-full tracking-widest uppercase mb-5">
              <Target className="w-3 h-3" />
              Next Step
            </div>
            <h2 className="text-2xl sm:text-4xl font-bold text-foreground mb-4 leading-tight">
              Ready to Act on This Audit?
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-8 max-w-2xl mx-auto">
              Book a free 45-minute Executive Strategy Session. We&apos;ll walk through your scorecard live,
              validate our assumptions with your actual data, and give you a 90-day roadmap you can execute
              with or without AIMS.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/get-started"
                className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-colors text-sm shadow-lg"
              >
                Book Executive Strategy Session
                <ArrowRight className="w-4 h-4" />
              </Link>
              <div className="print:hidden">
                <ShareButtons shareUrl={shareUrl} costOfInefficiency={costOfInefficiency} />
              </div>
            </div>
          </div>
        </div>

        {/* Footer note */}
        <p className="text-center text-xs text-muted-foreground mt-8 print:hidden">
          Audit completed {formatDate(sub.createdAt)}. Results are estimates based on industry benchmarks.
        </p>
      </div>
    </div>
  )
}
