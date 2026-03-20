import { notFound } from "next/navigation"
import { db } from "@/lib/db"
import { DollarSign, TrendingUp, Clock, ArrowRight, Zap } from "lucide-react"
import Link from "next/link"
import { ShareButtons } from "./ShareButtons"

interface Props {
  params: Promise<{ submissionId: string }>
}

export async function generateMetadata({ params }: Props) {
  const { submissionId } = await params
  const sub = await db.leadMagnetSubmission.findUnique({ where: { id: submissionId } })
  if (!sub) return { title: "ROI Calculator Results — AIMS" }
  const data = sub.data as Record<string, unknown>
  const calcResults = (data?.results ?? {}) as Record<string, unknown>
  const savings = (calcResults?.additionalRevenue ?? 0) as number
  return {
    title: `${sub.name ?? "Someone"} could add $${savings > 0 ? savings.toLocaleString() : "—"}/mo with AI | AIMS`,
    description: "See how much time and money AI automation could save this business — and calculate your own ROI.",
  }
}

export default async function ROIResultsPage({ params }: Props) {
  const { submissionId } = await params
  const submission = await db.leadMagnetSubmission.findUnique({
    where: { id: submissionId },
  })

  if (!submission || submission.type !== "ROI_CALCULATOR") notFound()

  const data = (submission.data ?? {}) as Record<string, unknown>
  // Calculator stores: data: { inputs: {...}, results: {...} }
  const calcResults = ((data.results ?? submission.results ?? {}) as Record<string, unknown>)

  const monthlySavings = (calcResults.additionalRevenue ?? calcResults.monthlySavings ?? 0) as number
  const annualSavings = monthlySavings * 12
  const hoursReclaimed = (calcResults.hoursReclaimed ?? 0) as number
  const rawRoi = (calcResults.roi ?? 0) as number
  const roiMultiple = rawRoi > 0 ? Math.round(rawRoi / 100 * 10) / 10 : 3

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://aimseos.com"
  const shareUrl = `${appUrl}/tools/roi-calculator/results/${submissionId}`
  const shareText = `I could save $${monthlySavings.toLocaleString()}/mo with AI automation. Calculate your business ROI:`

  return (
    <div className="min-h-screen bg-deep">
      <div className="max-w-2xl mx-auto px-4 py-12">

        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary text-sm font-medium rounded-full mb-4">
            <Zap className="w-3.5 h-3.5" />
            AI ROI Calculator Results
          </div>
          {submission.name && (
            <p className="text-muted-foreground text-sm">
              Results for <span className="font-medium text-foreground">{submission.name}</span>
              {submission.company && <> · {submission.company}</>}
            </p>
          )}
        </div>

        {/* Key metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          {[
            {
              icon: DollarSign,
              label: "Monthly Savings",
              value: `$${monthlySavings.toLocaleString()}`,
              color: "text-green-400",
              bg: "bg-green-900/15",
            },
            {
              icon: TrendingUp,
              label: "Annual Impact",
              value: `$${annualSavings.toLocaleString()}`,
              color: "text-blue-400",
              bg: "bg-blue-900/15",
            },
            {
              icon: Clock,
              label: "Hours Reclaimed/mo",
              value: hoursReclaimed > 0 ? `${hoursReclaimed}h` : "—",
              color: "text-purple-400",
              bg: "bg-purple-900/15",
            },
          ].map((metric) => (
            <div key={metric.label} className="bg-card border border-border rounded-2xl p-6 text-center shadow-sm">
              <div className={`w-10 h-10 ${metric.bg} rounded-full flex items-center justify-center mx-auto mb-3`}>
                <metric.icon className={`w-5 h-5 ${metric.color}`} />
              </div>
              <div className={`text-3xl font-black ${metric.color} mb-1`}>{metric.value}</div>
              <div className="text-sm text-muted-foreground">{metric.label}</div>
            </div>
          ))}
        </div>

        {/* ROI summary card */}
        <div className="bg-card border border-border rounded-2xl p-8 mb-6 shadow-sm">
          <h2 className="text-xl font-bold text-foreground mb-4">Your AI ROI Summary</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-3 border-b border-border">
              <span className="text-muted-foreground">Estimated monthly savings</span>
              <span className="font-semibold text-foreground">${monthlySavings.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-border">
              <span className="text-muted-foreground">12-month cumulative impact</span>
              <span className="font-semibold text-green-400">${annualSavings.toLocaleString()}</span>
            </div>
            {roiMultiple > 0 && (
              <div className="flex justify-between items-center py-3 border-b border-border">
                <span className="text-muted-foreground">Estimated ROI multiple</span>
                <span className="font-semibold text-foreground">{roiMultiple}x</span>
              </div>
            )}
            {hoursReclaimed > 0 && (
              <div className="flex justify-between items-center py-3">
                <span className="text-muted-foreground">Time reclaimed per month</span>
                <span className="font-semibold text-foreground">{hoursReclaimed} hours</span>
              </div>
            )}
          </div>
        </div>

        {/* What AIMS delivers */}
        <div className="bg-card border border-border rounded-2xl p-6 mb-6 shadow-sm">
          <h3 className="font-semibold text-foreground mb-4">How AIMS Generates This ROI</h3>
          <div className="space-y-3">
            {[
              "AI-powered lead gen running 24/7 while your team focuses on closing",
              "Automated follow-up sequences that never let a lead go cold",
              "CRM pipelines that surface the right deals at the right time",
              "Operations automations that eliminate hours of repetitive admin work",
            ].map((item) => (
              <div key={item} className="flex items-start gap-3 text-sm text-muted-foreground">
                <div className="w-5 h-5 rounded-full bg-green-900/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <TrendingUp className="w-3 h-3 text-green-400" />
                </div>
                {item}
              </div>
            ))}
          </div>
        </div>

        {/* Start Saving — Recommended Services */}
        <div className="bg-card border border-border rounded-2xl p-6 mb-6 shadow-sm">
          <h3 className="font-semibold text-foreground mb-1">Start Saving — Recommended Services</h3>
          <p className="text-sm text-muted-foreground mb-4">These AIMS services deliver the fastest path to capturing your ${monthlySavings.toLocaleString()}/mo in savings.</p>
          <div className="space-y-3">
            <div className="border border-border rounded-xl p-4 hover:border-border transition-colors">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h4 className="font-semibold text-foreground text-sm">Cold Outbound Engine</h4>
                  <p className="text-xs text-muted-foreground mt-1">Automated outbound sends thousands of personalized emails monthly, filling your pipeline without adding headcount.</p>
                  <p className="text-xs text-muted-foreground mt-2">from $297/mo</p>
                </div>
                <Link href="/marketplace" className="flex-shrink-0 inline-flex items-center gap-1 px-3 py-1.5 bg-primary text-white text-xs font-semibold rounded-lg hover:bg-primary/90 transition-colors">
                  View <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
            <div className="border border-border rounded-xl p-4 hover:border-border transition-colors">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h4 className="font-semibold text-foreground text-sm">RevOps Pipeline Automation</h4>
                  <p className="text-xs text-muted-foreground mt-1">Systemize your sales process — automated follow-ups, deal routing, and pipeline dashboards that close revenue faster.</p>
                  <p className="text-xs text-muted-foreground mt-2">from $197/mo</p>
                </div>
                <Link href="/marketplace" className="flex-shrink-0 inline-flex items-center gap-1 px-3 py-1.5 bg-primary text-white text-xs font-semibold rounded-lg hover:bg-primary/90 transition-colors">
                  View <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
            {hoursReclaimed > 20 && (
              <div className="border border-border rounded-xl p-4 hover:border-border transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h4 className="font-semibold text-foreground text-sm">AI Voice Agents</h4>
                    <p className="text-xs text-muted-foreground mt-1">Reclaim {hoursReclaimed}+ hours per month — AI answers calls, qualifies leads, and books meetings without human intervention.</p>
                    <p className="text-xs text-muted-foreground mt-2">Custom pricing</p>
                  </div>
                  <Link href="/marketplace" className="flex-shrink-0 inline-flex items-center gap-1 px-3 py-1.5 bg-primary text-white text-xs font-semibold rounded-lg hover:bg-primary/90 transition-colors">
                    View <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            )}
          </div>
          <div className="mt-4 text-center">
            <Link href="/solutions" className="text-sm text-primary hover:underline font-medium">
              View all solution packages
            </Link>
          </div>
        </div>

        {/* Share */}
        <div className="bg-card border border-border rounded-2xl p-6 mb-6 shadow-sm">
          <h3 className="font-semibold text-foreground mb-1">Share your results</h3>
          <p className="text-sm text-muted-foreground mb-4">Let your network see what AI could do for them too.</p>
          <ShareButtons shareUrl={shareUrl} shareText={shareText} />
        </div>

        {/* CTA */}
        <div className="bg-primary rounded-2xl p-8 text-center text-white mb-6">
          <h3 className="text-2xl font-bold mb-3">Ready to capture this ROI?</h3>
          <p className="text-muted-foreground mb-6">
            Book a free strategy call and we&apos;ll show you exactly which AIMS solutions generate the fastest return for your business.
          </p>
          <Link
            href="/get-started"
            className="inline-flex items-center gap-2 px-8 py-4 bg-card text-primary font-semibold rounded-xl hover:bg-primary/10 transition-colors"
          >
            Book Strategy Call
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>

        <p className="text-center text-sm text-muted-foreground">
          Want to recalculate?{" "}
          <Link href="/tools/roi-calculator" className="text-primary hover:underline font-medium">
            Run the calculator again
          </Link>
        </p>
      </div>
    </div>
  )
}
