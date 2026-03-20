import { notFound } from "next/navigation"
import { db } from "@/lib/db"
import { ArrowRight, Zap, TrendingUp, AlertTriangle, CheckCircle, XCircle } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { ShareButtons } from "./ShareButtons"

interface Props {
  params: Promise<{ submissionId: string }>
}

interface AuditIssue {
  severity: "critical" | "high" | "medium"
  issue: string
  fix: string
}

interface AuditScores {
  seo: number
  speed: number
  conversion: number
  ai: number
  overall: number
}

interface AuditAnalysis {
  scores: AuditScores
  issues: AuditIssue[]
  strengths: string[]
  summary: string
  topOpportunity: string
}

function ScoreRing({ score, label, color }: { score: number; label: string; color: string }) {
  const scoreColor =
    score >= 70 ? "text-green-400" : score >= 50 ? "text-yellow-400" : "text-primary"
  return (
    <div className="text-center">
      <div className={cn("text-3xl font-black mb-0.5", scoreColor)}>{score}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  )
}

const SEVERITY_CONFIG = {
  critical: { color: "text-primary bg-primary/10 border-primary/30", icon: XCircle, label: "Critical" },
  high: { color: "text-orange-400 bg-orange-900/15 border-orange-800", icon: AlertTriangle, label: "High" },
  medium: { color: "text-yellow-400 bg-yellow-900/15 border-yellow-800", icon: AlertTriangle, label: "Medium" },
}

export async function generateMetadata({ params }: Props) {
  const { submissionId } = await params
  const sub = await db.leadMagnetSubmission.findUnique({ where: { id: submissionId } })
  if (!sub) return { title: "Website Audit Results - AIMS" }
  const score = sub.score ?? 0
  const data = sub.data as Record<string, unknown>
  return {
    title: `Website Audit: ${data?.domain ?? "Site"} scored ${score}/100 | AIMS`,
    description: "See what's holding this website back from converting - and run a free audit on yours.",
  }
}

export default async function WebsiteAuditResultsPage({ params }: Props) {
  const { submissionId } = await params
  const submission = await db.leadMagnetSubmission.findUnique({
    where: { id: submissionId },
  })

  if (!submission || submission.type !== "WEBSITE_AUDIT") notFound()

  const data = (submission.data ?? {}) as Record<string, unknown>
  const results = (submission.results ?? {}) as Record<string, unknown>

  const analysis = (results.analysis ?? data.analysis ?? null) as AuditAnalysis | null
  const domain = (data.domain ?? results.domain ?? "the audited site") as string
  const overallScore = submission.score ?? analysis?.scores?.overall ?? 0

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://aimseos.com"
  const shareUrl = `${appUrl}/tools/website-audit/results/${submissionId}`
  const shareText = `${domain} scored ${overallScore}/100 on the AIMS Website Audit. See what's holding your site back:`

  const scoreColor =
    overallScore >= 70 ? "text-green-400" : overallScore >= 50 ? "text-yellow-400" : "text-primary"

  return (
    <div className="min-h-screen bg-deep">
      <div className="max-w-2xl mx-auto px-4 py-12">

        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary text-sm font-medium rounded-full mb-4">
            <Zap className="w-3.5 h-3.5" />
            Website Audit Results
          </div>
          <p className="text-muted-foreground text-sm">
            Audit for <span className="font-medium text-foreground">{domain}</span>
            {submission.name && <> · requested by {submission.name}</>}
          </p>
        </div>

        {/* Overall score */}
        <div className="bg-card border border-border rounded-2xl p-8 text-center shadow-sm mb-6">
          <div className={cn("text-7xl font-black mb-1", scoreColor)}>{overallScore}</div>
          <div className="text-muted-foreground text-sm mb-4">Overall Marketing Health Score</div>
          <div className="max-w-xs mx-auto mb-4">
            <div className="h-3 bg-deep rounded-full overflow-hidden">
              <div
                className={cn("h-3 rounded-full", overallScore >= 70 ? "bg-green-400" : overallScore >= 50 ? "bg-yellow-500" : "bg-primary/100")}
                style={{ width: `${overallScore}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>Poor</span>
              <span>Excellent</span>
            </div>
          </div>
          {analysis?.summary && (
            <p className="text-muted-foreground text-sm leading-relaxed">{analysis.summary}</p>
          )}
        </div>

        {/* Score breakdown */}
        {analysis?.scores && (
          <div className="bg-card border border-border rounded-2xl p-6 mb-6 shadow-sm">
            <h3 className="font-semibold text-foreground mb-5">Score Breakdown</h3>
            <div className="grid grid-cols-4 gap-4">
              <ScoreRing score={analysis.scores.seo} label="SEO" color="" />
              <ScoreRing score={analysis.scores.speed} label="Speed" color="" />
              <ScoreRing score={analysis.scores.conversion} label="Conversion" color="" />
              <ScoreRing score={analysis.scores.ai} label="AI Visibility" color="" />
            </div>
          </div>
        )}

        {/* Issues */}
        {analysis?.issues && analysis.issues.length > 0 && (
          <div className="bg-card border border-border rounded-2xl p-6 mb-6 shadow-sm">
            <h3 className="font-semibold text-foreground mb-4">Issues Found</h3>
            <div className="space-y-3">
              {analysis.issues.map((issue, i) => {
                const config = SEVERITY_CONFIG[issue.severity] ?? SEVERITY_CONFIG.medium
                return (
                  <div key={i} className={cn("rounded-xl border p-4", config.color)}>
                    <div className="flex items-start gap-3">
                      <config.icon className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-semibold uppercase tracking-wide opacity-70">{config.label}</span>
                        </div>
                        <p className="font-medium text-sm mb-1">{issue.issue}</p>
                        <p className="text-sm opacity-75">Fix: {issue.fix}</p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Strengths */}
        {analysis?.strengths && analysis.strengths.length > 0 && (
          <div className="bg-card border border-border rounded-2xl p-6 mb-6 shadow-sm">
            <h3 className="font-semibold text-foreground mb-4">What&apos;s Working</h3>
            <div className="space-y-2">
              {analysis.strengths.map((s, i) => (
                <div key={i} className="flex items-start gap-3 text-sm text-muted-foreground">
                  <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                  {s}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Top opportunity */}
        {analysis?.topOpportunity && (
          <div className="bg-amber-900/15 border border-amber-800 rounded-2xl p-6 mb-6">
            <div className="flex items-start gap-3">
              <TrendingUp className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-amber-300 mb-1">Top Opportunity</h3>
                <p className="text-amber-400 text-sm">{analysis.topOpportunity}</p>
              </div>
            </div>
          </div>
        )}

        {/* Recommended Services */}
        {analysis?.scores && (
          <div className="bg-card border border-border rounded-2xl p-6 mb-6 shadow-sm">
            <h3 className="font-semibold text-foreground mb-1">Services That Fix These Issues</h3>
            <p className="text-sm text-muted-foreground mb-4">Based on your scores, these AIMS services will have the highest impact.</p>
            <div className="space-y-3">
              {analysis.scores.seo < 60 && (
                <div className="border border-border rounded-xl p-4 hover:border-border transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h4 className="font-semibold text-foreground text-sm">SEO / AEO Strategy</h4>
                      <p className="text-xs text-muted-foreground mt-1">Your SEO score of {analysis.scores.seo} means you are invisible in search. We fix your technical SEO, build authority content, and optimize for AI answer engines so you rank and get cited.</p>
                      <p className="text-xs text-muted-foreground mt-2">from $197/mo</p>
                    </div>
                    <Link href="/marketplace" className="flex-shrink-0 inline-flex items-center gap-1 px-3 py-1.5 bg-primary text-white text-xs font-semibold rounded-lg hover:bg-primary/90 transition-colors">
                      Learn More <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              )}
              {analysis.scores.speed < 60 && (
                <div className="border border-border rounded-xl p-4 hover:border-border transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h4 className="font-semibold text-foreground text-sm">Website + CRM + Chatbot</h4>
                      <p className="text-xs text-muted-foreground mt-1">A speed score of {analysis.scores.speed} is costing you visitors and rankings. We rebuild your site for sub-2-second load times with built-in lead capture and AI chatbot.</p>
                      <p className="text-xs text-muted-foreground mt-2">from $97/mo</p>
                    </div>
                    <Link href="/marketplace" className="flex-shrink-0 inline-flex items-center gap-1 px-3 py-1.5 bg-primary text-white text-xs font-semibold rounded-lg hover:bg-primary/90 transition-colors">
                      Learn More <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              )}
              {analysis.scores.conversion < 60 && (
                <div className="border border-border rounded-xl p-4 hover:border-border transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h4 className="font-semibold text-foreground text-sm">Inbound Orchestration + Lead Reactivation</h4>
                      <p className="text-xs text-muted-foreground mt-1">A conversion score of {analysis.scores.conversion} means visitors leave without taking action. We build multi-step funnels and reactivate your dormant leads with automated sequences.</p>
                      <p className="text-xs text-muted-foreground mt-2">from $147/mo</p>
                    </div>
                    <Link href="/marketplace" className="flex-shrink-0 inline-flex items-center gap-1 px-3 py-1.5 bg-primary text-white text-xs font-semibold rounded-lg hover:bg-primary/90 transition-colors">
                      Learn More <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              )}
              {analysis.scores.ai < 60 && (
                <div className="border border-border rounded-xl p-4 hover:border-border transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h4 className="font-semibold text-foreground text-sm">AI Content Engine</h4>
                      <p className="text-xs text-muted-foreground mt-1">An AI visibility score of {analysis.scores.ai} means AI assistants never mention your business. We produce and distribute AI-optimized content so you get cited in ChatGPT, Perplexity, and Google AI Overviews.</p>
                      <p className="text-xs text-muted-foreground mt-2">from $247/mo</p>
                    </div>
                    <Link href="/marketplace" className="flex-shrink-0 inline-flex items-center gap-1 px-3 py-1.5 bg-primary text-white text-xs font-semibold rounded-lg hover:bg-primary/90 transition-colors">
                      Learn More <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Share */}
        <div className="bg-card border border-border rounded-2xl p-6 mb-6 shadow-sm">
          <h3 className="font-semibold text-foreground mb-1">Share this audit</h3>
          <p className="text-sm text-muted-foreground mb-4">Show your team or share with a colleague.</p>
          <ShareButtons shareUrl={shareUrl} shareText={shareText} />
        </div>

        {/* CTA */}
        <div className="bg-card border border-primary/20 rounded-2xl p-8 text-center mb-6">
          <h3 className="text-2xl font-bold text-foreground mb-3">Ready to fix these issues?</h3>
          <p className="text-muted-foreground mb-6">
            Book a free strategy call. We&apos;ll walk through your audit results and show you exactly how AIMS can resolve every issue - with a clear timeline and fixed price.
          </p>
          <Link
            href="/get-started"
            className="inline-flex items-center gap-2 px-8 py-4 bg-card text-primary font-semibold rounded-xl hover:bg-primary/10 transition-colors"
          >
            Fix My Site
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>

        <p className="text-center text-sm text-muted-foreground">
          Want to audit a different site?{" "}
          <Link href="/tools/website-audit" className="text-primary hover:underline font-medium">
            Run a new audit
          </Link>
        </p>
      </div>
    </div>
  )
}
