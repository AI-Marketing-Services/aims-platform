import { notFound } from "next/navigation"
import { db } from "@/lib/db"
import Link from "next/link"
import type { Metadata } from "next"
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Building2,
  CreditCard,
  BarChart3,
  TrendingUp,
  Clock,
  Star,
  ShieldCheck,
  CalendarDays,
} from "lucide-react"
import { ShareButtons } from "./ShareButtons"

interface Props {
  params: Promise<{ submissionId: string }>
}

interface CreditDimensions {
  foundation: number
  creditProfile: number
  tradelines: number
  utilization: number
  maturity: number
}

interface SubmissionData {
  answers: number[]
  totalScore: number
  dimensions: CreditDimensions
}

type Tier = {
  label: string
  range: [number, number]
  colorClass: string
  bgClass: string
  borderClass: string
  badgeBg: string
  description: string
}

const TIERS: Tier[] = [
  {
    label: "Credit Builder",
    range: [0, 39],
    colorClass: "text-red-400",
    bgClass: "bg-red-900/15",
    borderClass: "border-red-800/40",
    badgeBg: "bg-red-500/15 text-red-400 border border-red-500/30",
    description:
      "Your business credit file is thin or non-existent. Lenders cannot evaluate you — which means you're invisible to capital. The good news: the foundational steps are simple and free.",
  },
  {
    label: "Developing",
    range: [40, 59],
    colorClass: "text-amber-400",
    bgClass: "bg-amber-900/15",
    borderClass: "border-amber-800/40",
    badgeBg: "bg-amber-500/15 text-amber-400 border border-amber-500/30",
    description:
      "You have the basics in place but gaps remain. A few targeted moves — adding tradelines, cleaning up utilization — can push you into the Established tier quickly.",
  },
  {
    label: "Established",
    range: [60, 79],
    colorClass: "text-blue-400",
    bgClass: "bg-blue-900/15",
    borderClass: "border-blue-800/40",
    badgeBg: "bg-blue-500/15 text-blue-400 border border-blue-500/30",
    description:
      "Your business credit profile is solid and functional. Banks and lenders can evaluate you confidently. The next step is optimization — higher limits, better terms, and mixed credit.",
  },
  {
    label: "Strong",
    range: [80, 100],
    colorClass: "text-green-400",
    bgClass: "bg-green-900/15",
    borderClass: "border-green-800/40",
    badgeBg: "bg-green-500/15 text-green-400 border border-green-500/30",
    description:
      "You're in the top tier. Your profile demonstrates creditworthiness, payment discipline, and business maturity. You can access capital at favorable terms — now it's about leveraging that.",
  },
]

function getTier(score: number): Tier {
  return TIERS.find((t) => score >= t.range[0] && score <= t.range[1]) ?? TIERS[0]
}

function getDimensionColor(pct: number): string {
  if (pct < 40) return "#ef4444"
  if (pct < 60) return "#f59e0b"
  if (pct < 80) return "#3b82f6"
  return "#22c55e"
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
}

// ─── Metadata ────────────────────────────────────────────────────────────────

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { submissionId } = await params
  const sub = await db.leadMagnetSubmission.findUnique({ where: { id: submissionId } })
  if (!sub) return { title: "Business Credit Score | AI Operator Collective" }

  const score = sub.score ?? 0
  const tier = getTier(score)
  const name = sub.name ?? "A business owner"

  return {
    title: `${name}'s Business Credit Score: ${score}/100 — ${tier.label} | AI Operator Collective`,
    description:
      "See how this business's credit profile breaks down across 5 key dimensions. Take the free quiz to get your own personalized scorecard.",
    openGraph: {
      title: `Business Credit Score: ${score}/100 — ${tier.label}`,
      description: "Breakdown across 5 key credit dimensions.",
      images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    },
  }
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default async function BusinessCreditScoreResultsPage({ params }: Props) {
  const { submissionId } = await params

  const sub = await db.leadMagnetSubmission.findUnique({ where: { id: submissionId } })

  if (!sub || sub.type !== "BUSINESS_CREDIT_SCORE") notFound()

  const score = Math.round(sub.score ?? 0)
  const tier = getTier(score)
  const rawData = sub.data as unknown as SubmissionData
  const answers = rawData.answers ?? []
  const dims = rawData.dimensions ?? {
    foundation: 0,
    creditProfile: 0,
    tradelines: 0,
    utilization: 0,
    maturity: 0,
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://aioperatorcollective.com"
  const shareUrl = `${appUrl}/tools/business-credit-score/results/${submissionId}`
  const shareText = `I just got my free Business Credit Score — ${score}/100 (${tier.label}). Get yours: ${shareUrl}`

  // ── Dimension definitions ──────────────────────────────────────────────────
  const dimensions = [
    {
      key: "foundation" as const,
      label: "Business Foundation",
      value: dims.foundation,
      icon: Building2,
      description: "How formally your business is structured and registered",
    },
    {
      key: "creditProfile" as const,
      label: "Credit Profile",
      value: dims.creditProfile,
      icon: CreditCard,
      description: "Your track record across active credit accounts",
    },
    {
      key: "tradelines" as const,
      label: "Tradeline Reporting",
      value: dims.tradelines,
      icon: BarChart3,
      description: "Active accounts building your business credit file",
    },
    {
      key: "utilization" as const,
      label: "Credit Utilization",
      value: dims.utilization,
      icon: TrendingUp,
      description: "How efficiently you're using available credit",
    },
    {
      key: "maturity" as const,
      label: "Business Maturity",
      value: dims.maturity,
      icon: Clock,
      description: "The age and scale of your business operations",
    },
  ]

  // ── What's Working ─────────────────────────────────────────────────────────
  const working: string[] = []
  if ((answers[0] ?? 0) >= 3) working.push("Strong entity structure in place")
  if ((answers[1] ?? 0) >= 3) working.push("Established business bank account")
  if ((answers[2] ?? 0) >= 3) working.push("EIN consistently used across accounts")
  if ((answers[3] ?? 0) >= 3) working.push("Multiple active credit accounts")
  if ((answers[4] ?? 0) >= 3) working.push("Strong payment history")
  if ((answers[5] ?? 0) >= 3) working.push("Active tradelines reporting to bureaus")
  if ((answers[6] ?? 0) >= 3) working.push("Healthy credit utilization rate")
  if ((answers[7] ?? 0) >= 3) working.push("Active credit monitoring in place")
  if ((answers[8] ?? 0) >= 3) working.push("Established business history")
  if ((answers[9] ?? 0) >= 3) working.push("Strong revenue base")

  // ── Areas to Improve ───────────────────────────────────────────────────────
  const improving: string[] = []
  if ((answers[0] ?? 0) <= 1) improving.push("No formal business entity — register as LLC or Corp immediately")
  else if ((answers[0] ?? 0) === 2) improving.push("Consider upgrading from LLC to S-Corp for stronger credit profile")
  if ((answers[1] ?? 0) <= 1) improving.push("No dedicated business bank account — open one this week")
  if ((answers[2] ?? 0) <= 1) improving.push("Missing EIN or not using it — apply free at IRS.gov")
  if ((answers[3] ?? 0) <= 1) improving.push("Zero business credit accounts — your file is invisible to lenders")
  if ((answers[4] ?? 0) <= 2) improving.push("Late payment history is the #1 score killer")
  if ((answers[5] ?? 0) <= 1) improving.push("No tradelines reporting — lenders can't see your credit behavior")
  if ((answers[6] ?? 0) <= 1) improving.push("High utilization or unknown — keep it under 30%")
  if ((answers[7] ?? 0) <= 1) improving.push("Never checked business credit — you may have errors hurting you")

  // ── Action Plan ────────────────────────────────────────────────────────────
  type ActionStep = { title: string; description: string }
  const ACTION_PLANS: Record<string, ActionStep[]> = {
    "Credit Builder": [
      { title: "Register your business entity", description: "Form an LLC or Corporation to establish formal separation between personal and business credit." },
      { title: "Get your EIN at IRS.gov", description: "Free, takes 10 minutes. Your EIN is the foundation of your business credit identity — never skip this step." },
      { title: "Open a dedicated business checking account", description: "Use your EIN (not SSN) and business address. Keep all business transactions in this account." },
      { title: "Apply for a business credit card using your EIN only", description: "Start with a secured business card if needed. Use it monthly and pay the full balance on time every time." },
      { title: "Set up net-30 vendor accounts", description: "Apply at Uline, Quill, and Grainger — all three report to Dun & Bradstreet. These are the fastest tradelines available." },
      { title: "Claim your D&B Paydex profile", description: "Check your DUNS number at dnb.com, verify your business info, and monitor your Paydex score monthly." },
    ],
    "Developing": [
      { title: "Dispute errors on your business credit reports", description: "Pull reports from D&B, Experian Business, and Equifax Business. Dispute any inaccuracies immediately — errors are common." },
      { title: "Add 2–3 more net-30 vendor accounts", description: "Look specifically for vendors that report to all three major bureaus (D&B, Experian Business, Equifax Business)." },
      { title: "Keep utilization below 30% across every account", description: "High utilization — even on one account — signals financial stress to lenders. Pay down balances before statement close dates." },
      { title: "Set up automatic payments", description: "Eliminate late payment risk entirely. One missed payment can drop your Paydex score significantly." },
      { title: "Apply for a small business line of credit or SBA microloan", description: "Installment loans diversify your credit mix and signal to bureaus that lenders trust your business." },
      { title: "Monitor all three business credit reports monthly", description: "Use Nav, CreditSafe, or direct bureau portals. Catch errors and fraud before they damage your score." },
    ],
    "Established": [
      { title: "Apply for higher-limit business credit cards", description: "Target Amex Business Platinum, Chase Ink, or Capital One Spark — all offer strong limits and don't report to personal bureaus." },
      { title: "Request credit limit increases on existing accounts", description: "Call your current lenders and request increases after 6–12 months of on-time payments. Higher limits lower utilization automatically." },
      { title: "Add 2+ premium net-30 accounts", description: "Uline, Quill, Home Depot Commercial, and Staples Business all report and carry credibility with lenders." },
      { title: "Add a business installment loan to improve credit mix", description: "A business auto loan, equipment financing, or SBA loan shows lenders you can manage different types of debt responsibly." },
      { title: "Set up automated monitoring alerts on all three bureaus", description: "Real-time alerts catch new inquiries, derogatory marks, or suspicious activity before they cause damage." },
      { title: "Review and optimize your Paydex score on D&B", description: "A Paydex of 80+ (paying on time) is good. 100 (paying early) is elite — and it matters to commercial lenders." },
    ],
    "Strong": [
      { title: "Apply for SBA 7(a) loan or business line of credit at prime rates", description: "Your profile now qualifies for preferred lending. Target rates near prime — don't settle for alternative lender pricing." },
      { title: "Negotiate extended net-60/net-90 terms with key vendors", description: "Strong credit gives you leverage. Extending payment terms improves cash flow without additional debt." },
      { title: "Explore premium rewards cards with no preset spending limits", description: "Amex Business Platinum, Chase Ink Preferred, and similar cards are now accessible — and the rewards compound quickly at scale." },
      { title: "Use business credit to reduce personal guarantees", description: "As your business credit strengthens, renegotiate existing agreements to remove or reduce personal guarantee requirements." },
      { title: "Build relationships with commercial lenders", description: "Introduce yourself to commercial bankers now, before you need capital. Relationships open doors that applications alone cannot." },
      { title: "Protect your score with quarterly monitoring", description: "Elite credit is easy to maintain but hard to rebuild. Quarterly reviews catch drift before it becomes a problem." },
    ],
  }

  const actionSteps = ACTION_PLANS[tier.label] ?? ACTION_PLANS["Credit Builder"]

  // ── Recommended Services ───────────────────────────────────────────────────
  type ServiceCard = { name: string; desc: string; price: string }
  const SERVICE_RECS: Record<string, ServiceCard[]> = {
    "Credit Builder": [
      { name: "Business Credit Foundation Setup", desc: "We build your complete business credit foundation — entity, EIN, bank setup, and first tradelines — done for you.", price: "from $297/mo" },
      { name: "CRM + Automation Bundle", desc: "Automated follow-up, invoice tracking, and payment reminders that keep your payment history spotless.", price: "from $97/mo" },
      { name: "AI Outbound Engine", desc: "Generate revenue faster so you have cash flow to build credit with — automated cold outbound done for you.", price: "from $297/mo" },
    ],
    "Developing": [
      { name: "Business Credit Builder Program", desc: "Systematic tradeline addition, dispute management, and score optimization across all three bureaus.", price: "from $197/mo" },
      { name: "Finance Automation", desc: "Automated P&L reporting and cash flow dashboards so you never miss a payment or lose track of utilization.", price: "from $247/mo" },
      { name: "Revenue Operations Setup", desc: "Optimize your revenue engine so your business looks as strong to lenders as it actually is.", price: "from $197/mo" },
    ],
    "Established": [
      { name: "Advanced Credit Optimization", desc: "Strategic limit increases, credit mix diversification, and bureau dispute management for top-tier profiles.", price: "from $297/mo" },
      { name: "Capital Access Strategy", desc: "We identify and connect you with the right lenders, terms, and structures for your business goals.", price: "Custom" },
      { name: "AI Tool Stack", desc: "Deploy AI tools that reduce overhead and boost financials — making your business profile even more bankable.", price: "from $197/mo" },
    ],
    "Strong": [
      { name: "Enterprise Credit Strategy", desc: "White-glove management of your business credit across all bureaus, with quarterly strategic reviews.", price: "Custom" },
      { name: "Custom AI Builds", desc: "Forward-deployed AI engineering — custom tools, automations, and systems your competitors won't have.", price: "Custom" },
      { name: "Scale Without Hiring", desc: "Replace 3–5 FTE roles with AI-powered systems. Grow revenue without growing payroll.", price: "from $497/mo" },
    ],
  }

  // Service recommendations block was removed as part of the Collective rebrand.
  // Keeping SERVICE_RECS above for reference if we bring it back.
  void SERVICE_RECS

  // ── Gauge marker position ──────────────────────────────────────────────────
  const markerLeft = `${Math.min(Math.max(score, 2), 98)}%`

  return (
    <div className="min-h-screen bg-deep">
      <div className="max-w-3xl mx-auto px-4 py-12">

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <Link
            href="/tools/business-credit-score"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to quiz
          </Link>
          <ShareButtons shareUrl={shareUrl} shareText={shareText} />
        </div>

        {/* ── Hero Score Card ─────────────────────────────────────────────── */}
        <div className={`bg-card border ${tier.borderClass} rounded-2xl p-8 sm:p-10 mb-6 shadow-lg relative overflow-hidden`}>
          {/* Subtle glow behind score */}
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2 w-72 h-72 rounded-full opacity-5 blur-3xl pointer-events-none"
            style={{ background: "#981B1B" }}
          />

          <div className="relative text-center">
            {/* Label */}
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary text-xs font-semibold rounded-full tracking-widest uppercase mb-6">
              <ShieldCheck className="w-3.5 h-3.5" />
              Business Credit Scorecard
            </div>

            {/* Score */}
            <div className="mb-1">
              <span className="text-8xl sm:text-9xl font-black text-primary leading-none tabular-nums">
                {score}
              </span>
              <span className="text-3xl font-bold text-muted-foreground">/100</span>
            </div>

            {/* Tier badge */}
            <div className={`inline-block px-4 py-1.5 rounded-full text-sm font-bold tracking-wide mb-5 ${tier.badgeBg}`}>
              {tier.label}
            </div>

            {/* Identity */}
            {(sub.name || sub.company) && (
              <p className="text-muted-foreground text-sm mb-1">
                {sub.name && <span className="font-semibold text-foreground">{sub.name}</span>}
                {sub.name && sub.company && " · "}
                {sub.company && <span>{sub.company}</span>}
              </p>
            )}

            {/* Date */}
            <div className="inline-flex items-center gap-1.5 text-xs text-muted-foreground mb-8">
              <CalendarDays className="w-3 h-3" />
              Issued {formatDate(sub.createdAt)}
            </div>

            {/* Tier description */}
            <p className="text-muted-foreground text-sm leading-relaxed max-w-xl mx-auto mb-8">
              {tier.description}
            </p>

            {/* ── Gauge Bar ─────────────────────────────────────────────── */}
            <div className="max-w-lg mx-auto">
              {/* Gradient bar with marker */}
              <div className="relative mb-2">
                <div
                  className="h-4 rounded-full w-full"
                  style={{
                    background: "linear-gradient(to right, #ef4444 0%, #f59e0b 39%, #f59e0b 40%, #3b82f6 59%, #3b82f6 60%, #22c55e 80%, #22c55e 100%)",
                  }}
                />
                {/* Marker */}
                <div
                  className="absolute -top-1 -translate-x-1/2 flex flex-col items-center"
                  style={{ left: markerLeft }}
                >
                  <div className="w-0 h-0 border-l-[6px] border-r-[6px] border-b-[8px] border-l-transparent border-r-transparent border-b-foreground" />
                  <div className="w-3 h-6 bg-foreground rounded-sm" />
                </div>
              </div>

              {/* Zone labels */}
              <div className="grid grid-cols-4 text-xs text-muted-foreground mt-1">
                <span className="text-left text-red-400">Builder</span>
                <span className="text-center text-amber-400">Developing</span>
                <span className="text-center text-blue-400">Established</span>
                <span className="text-right text-green-400">Strong</span>
              </div>
              <div className="grid grid-cols-4 text-[10px] text-muted-foreground/60 mt-0.5">
                <span className="text-left">0–39</span>
                <span className="text-center">40–59</span>
                <span className="text-center">60–79</span>
                <span className="text-right">80–100</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── 5 Dimension Breakdown ──────────────────────────────────────── */}
        <div className="bg-card border border-border rounded-2xl p-6 mb-6">
          <h2 className="font-bold text-foreground text-lg mb-1">Score Breakdown</h2>
          <p className="text-sm text-muted-foreground mb-6">
            How your business performs across 5 key credit dimensions
          </p>

          <div className="space-y-5">
            {dimensions.map((dim) => {
              const pct = Math.round(Math.min(Math.max(dim.value, 0), 100))
              const barColor = getDimensionColor(pct)
              const Icon = dim.icon
              return (
                <div key={dim.key}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      <span className="text-sm font-semibold text-foreground">{dim.label}</span>
                    </div>
                    <span className="text-sm font-bold tabular-nums" style={{ color: barColor }}>
                      {pct}%
                    </span>
                  </div>
                  <div className="h-2.5 bg-deep rounded-full overflow-hidden">
                    <div
                      className="h-2.5 rounded-full transition-all duration-700"
                      style={{ width: `${pct}%`, backgroundColor: barColor }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1.5">{dim.description}</p>
                </div>
              )
            })}
          </div>
        </div>

        {/* ── Factors Analysis ───────────────────────────────────────────── */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* What's Working */}
          <div className="bg-card border border-border rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Star className="w-4 h-4 text-green-400" />
              <h3 className="font-bold text-foreground">What&apos;s Working</h3>
            </div>
            {working.length > 0 ? (
              <ul className="space-y-2.5">
                {working.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-foreground leading-snug">{item}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground leading-relaxed">
                Complete the steps below to start building your &apos;what&apos;s working&apos; list.
              </p>
            )}
          </div>

          {/* Areas to Improve */}
          <div className="bg-card border border-border rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <XCircle className="w-4 h-4 text-red-400" />
              <h3 className="font-bold text-foreground">Areas to Improve</h3>
            </div>
            {improving.length > 0 ? (
              <ul className="space-y-2.5">
                {improving.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <XCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-foreground leading-snug">{item}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground leading-relaxed">
                No major negative factors detected. Focus on maintaining what&apos;s working.
              </p>
            )}
          </div>
        </div>

        {/* ── 90-Day Action Plan ─────────────────────────────────────────── */}
        <div className="bg-card border border-border rounded-2xl p-6 mb-6">
          <div className="flex items-center gap-2 mb-1">
            <CalendarDays className="w-4 h-4 text-primary" />
            <h2 className="font-bold text-foreground text-lg">Your 90-Day Action Plan</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-6">
            Prioritized steps to improve your {tier.label} profile over the next quarter
          </p>

          <div className="space-y-4">
            {actionSteps.map((step, i) => (
              <div key={i} className="flex items-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center">
                  <span className="text-xs font-bold text-primary">{i + 1}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">{step.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── CTA Banner ─────────────────────────────────────────────────── */}
        <div className="bg-card border border-primary/25 rounded-2xl p-8 sm:p-10 text-center mb-6 relative overflow-hidden">
          <div
            className="absolute inset-0 opacity-5 pointer-events-none"
            style={{ background: "radial-gradient(ellipse at center, #981B1B, transparent 70%)" }}
          />
          <div className="relative">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-3">
              Credit is the plumbing. Operators build on top of it.
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-6 max-w-lg mx-auto">
              The AI Operator Collective is where operators workshop the business fundamentals —
              credit, entity structure, banking, cash flow — alongside the AI moves they&apos;re
              shipping. Apply below.
            </p>
            <Link
              href="/#apply"
              className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-colors text-sm"
            >
              Apply to the Collective
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Retake link */}
        <p className="text-center text-sm text-muted-foreground">
          Want to retake the quiz?{" "}
          <Link href="/tools/business-credit-score" className="text-primary hover:underline font-medium">
            Start over
          </Link>
        </p>
      </div>
    </div>
  )
}
