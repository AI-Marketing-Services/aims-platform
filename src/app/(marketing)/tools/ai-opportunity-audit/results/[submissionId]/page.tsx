import { notFound } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import {
  ArrowRight,
  Sparkles,
  Target,
  Zap,
  TrendingUp,
  Wrench,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Clock,
  ChevronRight,
} from "lucide-react"
import { db } from "@/lib/db"
import type { OpportunityReport } from "@/lib/ai/opportunity-audit"
import { cn } from "@/lib/utils"

interface Props {
  params: Promise<{ submissionId: string }>
}

export async function generateMetadata({ params }: Props) {
  const { submissionId } = await params
  const sub = await db.leadMagnetSubmission.findUnique({ where: { id: submissionId } })
  if (!sub || sub.type !== "BUSINESS_AI_AUDIT") {
    return { title: "AI Opportunity Audit | AI Operator Collective" }
  }
  const results = (sub.results ?? {}) as Record<string, unknown>
  const report = (results.report ?? null) as OpportunityReport | null
  if (!report) return { title: "AI Opportunity Audit | AI Operator Collective" }
  return {
    title: `${report.companyName} — AI Opportunity Report`,
    description: report.executiveSummary?.slice(0, 160) ?? "Personalized AI integration report.",
  }
}

const APPLY_URL = "https://aioperatorcollective.com/#apply"

export default async function AIOpportunityAuditResultsPage({ params }: Props) {
  const { submissionId } = await params
  const submission = await db.leadMagnetSubmission.findUnique({
    where: { id: submissionId },
  })

  if (!submission || submission.type !== "BUSINESS_AI_AUDIT") notFound()

  const results = (submission.results ?? {}) as Record<string, unknown>
  const report = (results.report ?? null) as OpportunityReport | null

  if (!report) notFound()

  return (
    <div className="min-h-screen bg-deep">
      {/* Premium top bar with company brand */}
      <div className="border-b border-border bg-card">
        <div className="max-w-5xl mx-auto px-4 py-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-primary rounded-md flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                AI Opportunity Audit
              </p>
              <p className="text-sm font-semibold text-foreground">AI Operator Collective</p>
            </div>
          </div>
          <Link
            href={APPLY_URL}
            className="hidden sm:inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-md hover:bg-primary/90 transition-colors"
          >
            Apply to the Collective <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Report header — feels like a real consultant deliverable */}
      <section className="border-b border-border bg-gradient-to-b from-card to-deep">
        <div className="max-w-5xl mx-auto px-4 py-12 sm:py-16">
          <div className="flex items-start gap-5 sm:gap-7">
            <CompanyLogo
              logoUrl={report.logoUrl}
              faviconUrl={report.faviconUrl}
              companyName={report.companyName}
            />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-mono uppercase tracking-wider text-primary mb-2">
                Personalized AI Opportunity Report
              </p>
              <h1 className="font-serif text-3xl sm:text-5xl text-foreground leading-tight mb-2">
                {report.companyName}
              </h1>
              {report.companyTagline && (
                <p className="text-muted-foreground text-sm sm:text-base mb-3 line-clamp-2">
                  {report.companyTagline}
                </p>
              )}
              <div className="flex flex-wrap gap-2 text-xs">
                <Badge>{report.businessType}</Badge>
                <Badge>{report.domain}</Badge>
                <Badge>
                  Generated {new Date(report.scrapedAt).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </Badge>
              </div>
            </div>
          </div>

          {/* Opportunity score banner */}
          <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <ScoreCard
              score={report.opportunityScore}
              label="Opportunity Score"
              hint={report.opportunityScoreReason}
            />
            <StatCard
              icon={Target}
              label="Opportunities Found"
              value={String(report.opportunities.length)}
              hint="Ranked by ROI"
            />
            <StatCard
              icon={Wrench}
              label="Tools Recommended"
              value={String(
                report.opportunities.reduce((acc, o) => acc + (o.tools?.length ?? 0), 0)
              )}
              hint="Curated to your stack"
            />
          </div>
        </div>
      </section>

      {/* Executive summary */}
      <section className="max-w-5xl mx-auto px-4 py-12">
        <div className="bg-card border border-border rounded-md p-7 sm:p-9">
          <p className="text-xs font-mono uppercase tracking-wider text-primary mb-3">
            Executive Summary
          </p>
          <p className="text-base sm:text-lg text-foreground leading-relaxed">
            {report.executiveSummary}
          </p>

          {report.detectedTechStack.length > 0 && (
            <div className="mt-6 pt-6 border-t border-border flex flex-wrap items-center gap-2">
              <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground mr-2">
                Detected stack:
              </span>
              {report.detectedTechStack.map((tool) => (
                <span
                  key={tool}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-sm border border-border bg-deep text-xs text-muted-foreground"
                >
                  {tool}
                </span>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Priority move callout */}
      <section className="max-w-5xl mx-auto px-4 pb-12">
        <div className="relative rounded-md border border-primary/30 bg-gradient-to-br from-primary/10 to-transparent p-7 sm:p-9">
          <div className="absolute top-7 right-7 text-primary opacity-20">
            <Target className="w-16 h-16" />
          </div>
          <p className="text-xs font-mono uppercase tracking-wider text-primary mb-2">
            Your Priority Move
          </p>
          <h2 className="font-serif text-2xl sm:text-3xl text-foreground mb-4 leading-tight pr-20">
            {report.priorityMove.title}
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-5">
            {report.priorityMove.rationale}
          </p>
          <div className="bg-card/60 border border-border rounded-md p-4 flex items-start gap-3">
            <ChevronRight className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-mono uppercase tracking-wider text-primary mb-1">
                First Step This Week
              </p>
              <p className="text-sm text-foreground">{report.priorityMove.firstStep}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Opportunities */}
      <section className="max-w-5xl mx-auto px-4 pb-12">
        <div className="mb-8">
          <p className="text-xs font-mono uppercase tracking-wider text-primary mb-2">
            All Opportunities
          </p>
          <h2 className="font-serif text-3xl sm:text-4xl text-foreground leading-tight">
            {report.opportunities.length} ranked moves for {report.companyName}
          </h2>
          <p className="text-muted-foreground text-sm mt-2">
            Sorted by impact-to-effort ratio. Each one references your actual business.
          </p>
        </div>

        <div className="space-y-4">
          {report.opportunities.map((opp) => (
            <OpportunityCard key={opp.rank} opportunity={opp} />
          ))}
        </div>
      </section>

      {/* Competitive landscape */}
      {report.competitiveLandscape && (
        <section className="max-w-5xl mx-auto px-4 pb-12">
          <div className="bg-card border border-border rounded-md p-7">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-4 h-4 text-primary" />
              <p className="text-xs font-mono uppercase tracking-wider text-primary">
                Competitive Landscape
              </p>
            </div>
            <p className="text-base text-foreground leading-relaxed">
              {report.competitiveLandscape}
            </p>
          </div>
        </section>
      )}

      {/* The Collective pitch */}
      <section className="max-w-5xl mx-auto px-4 pb-16">
        <div className="relative overflow-hidden rounded-md border border-primary/40 bg-gradient-to-br from-primary/15 via-card to-card p-8 sm:p-12">
          <div className="absolute -top-16 -right-16 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
          <div className="relative">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/20 text-primary text-xs font-mono uppercase tracking-wider rounded-full mb-5">
              <Sparkles className="w-3.5 h-3.5" />
              The Hard Part
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl text-foreground mb-5 leading-tight">
              You now know what to build.{" "}
              <span className="block text-primary italic">Knowing how to ship it is the harder problem.</span>
            </h2>
            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed mb-7 max-w-2xl">
              {report.collectivePitch}
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed mb-7 max-w-2xl">
              The AI Operator Collective is the implementation community for operators
              shipping AI inside real businesses. You bring the report — we bring the
              playbooks, the tooling, and the network of operators who&apos;ve already
              shipped what you&apos;re trying to build.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href={APPLY_URL}
                className="inline-flex items-center justify-center gap-2 px-7 py-4 bg-primary text-white font-semibold rounded-md hover:bg-primary/90 transition-colors shadow-[0_0_40px_rgba(196,151,42,0.3)]"
              >
                Apply to the Collective <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="https://aioperatorcollective.com"
                className="inline-flex items-center justify-center gap-2 px-7 py-4 bg-card border border-border text-foreground font-semibold rounded-md hover:border-primary/40 transition-colors"
              >
                Learn more about the program
              </Link>
            </div>
            <p className="text-xs text-muted-foreground mt-5">
              Application-only · No payment to apply · Reviewed by a real operator within 24 hours
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card">
        <div className="max-w-5xl mx-auto px-4 py-8 text-center">
          <p className="text-xs text-muted-foreground">
            Report generated by the AI Operator Collective using {report.modelUsed} ·{" "}
            {report.pagesAnalyzed.length} pages analyzed
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            The recommendations on this page are educational. They are not guarantees of results.
            Tool pricing and capabilities change frequently — verify before purchase.
          </p>
        </div>
      </footer>
    </div>
  )
}

// ─── Subcomponents ────────────────────────────────────────────────────────

function CompanyLogo({
  logoUrl,
  faviconUrl,
  companyName,
}: {
  logoUrl: string | null
  faviconUrl: string | null
  companyName: string
}) {
  const src = logoUrl ?? faviconUrl
  if (!src) {
    return (
      <div className="w-16 h-16 sm:w-20 sm:h-20 bg-primary/20 border border-primary/30 rounded-md flex items-center justify-center flex-shrink-0">
        <span className="text-2xl font-serif text-primary">
          {companyName.charAt(0).toUpperCase()}
        </span>
      </div>
    )
  }
  return (
    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-card border border-border rounded-md flex items-center justify-center overflow-hidden flex-shrink-0">
      {/* Use plain img to avoid Next.js domain whitelist issues for arbitrary prospect domains */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={`${companyName} logo`}
        className="w-full h-full object-contain"
        referrerPolicy="no-referrer"
      />
    </div>
  )
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center px-2.5 py-1 rounded-sm border border-border bg-card text-xs text-muted-foreground">
      {children}
    </span>
  )
}

function ScoreCard({ score, label, hint }: { score: number; label: string; hint: string }) {
  const color =
    score >= 70 ? "text-primary" : score >= 40 ? "text-orange-400" : "text-green-400"
  return (
    <div className="bg-card border border-border rounded-md p-5">
      <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-2">
        {label}
      </p>
      <div className="flex items-baseline gap-2 mb-2">
        <span className={cn("text-4xl font-bold", color)}>{score}</span>
        <span className="text-sm text-muted-foreground">/100</span>
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{hint}</p>
    </div>
  )
}

function StatCard({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: typeof Target
  label: string
  value: string
  hint: string
}) {
  return (
    <div className="bg-card border border-border rounded-md p-5">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-3.5 h-3.5 text-primary" />
        <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
      </div>
      <div className="text-4xl font-bold text-foreground mb-2">{value}</div>
      <p className="text-xs text-muted-foreground">{hint}</p>
    </div>
  )
}

function OpportunityCard({
  opportunity,
}: {
  opportunity: OpportunityReport["opportunities"][number]
}) {
  const impactColor =
    opportunity.impact === "high"
      ? "text-primary border-primary/30 bg-primary/10"
      : opportunity.impact === "medium"
      ? "text-orange-400 border-orange-500/30 bg-orange-500/10"
      : "text-muted-foreground border-border bg-card"

  const effortColor =
    opportunity.effort === "low"
      ? "text-green-400 border-green-500/30 bg-green-500/10"
      : opportunity.effort === "medium"
      ? "text-orange-400 border-orange-500/30 bg-orange-500/10"
      : "text-primary border-primary/30 bg-primary/10"

  return (
    <div className="bg-card border border-border rounded-md p-6 sm:p-7 hover:border-primary/30 transition-colors">
      <div className="flex items-start gap-4 mb-4">
        <div className="w-9 h-9 rounded-md bg-primary/15 border border-primary/30 flex items-center justify-center flex-shrink-0">
          <span className="text-sm font-bold text-primary">#{opportunity.rank}</span>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-serif text-xl sm:text-2xl text-foreground leading-tight mb-2">
            {opportunity.title}
          </h3>
          <div className="flex flex-wrap gap-2">
            <span
              className={cn(
                "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-sm border text-[10px] font-mono uppercase tracking-wider",
                impactColor
              )}
            >
              <TrendingUp className="w-3 h-3" />
              {opportunity.impact} impact
            </span>
            <span
              className={cn(
                "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-sm border text-[10px] font-mono uppercase tracking-wider",
                effortColor
              )}
            >
              <Zap className="w-3 h-3" />
              {opportunity.effort} effort
            </span>
            {opportunity.estimatedTimeSavings && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-sm border border-border bg-card text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                <Clock className="w-3 h-3" />
                {opportunity.estimatedTimeSavings}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
        <div>
          <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-1.5">
            The Problem
          </p>
          <p className="text-sm text-foreground leading-relaxed">{opportunity.problem}</p>
        </div>
        <div>
          <p className="text-[10px] font-mono uppercase tracking-wider text-primary mb-1.5">
            The AI Solution
          </p>
          <p className="text-sm text-foreground leading-relaxed">{opportunity.solution}</p>
        </div>
      </div>

      {opportunity.estimatedRoi && (
        <div className="bg-deep border border-border rounded-md px-4 py-3 mb-5 flex items-start gap-3">
          <TrendingUp className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-[10px] font-mono uppercase tracking-wider text-primary mb-0.5">
              Estimated ROI
            </p>
            <p className="text-sm text-foreground">{opportunity.estimatedRoi}</p>
          </div>
        </div>
      )}

      {opportunity.tools.length > 0 && (
        <div className="mb-5">
          <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-3">
            Recommended Tools
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {opportunity.tools.map((tool, i) => (
              <div
                key={`${tool.name}-${i}`}
                className="bg-deep border border-border rounded-md p-3"
              >
                <div className="flex items-center gap-2 mb-1">
                  <Wrench className="w-3.5 h-3.5 text-primary" />
                  <span className="text-sm font-semibold text-foreground">{tool.name}</span>
                </div>
                {tool.category && (
                  <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-1">
                    {tool.category}
                    {tool.pricing ? ` · ${tool.pricing}` : ""}
                  </p>
                )}
                <p className="text-xs text-muted-foreground leading-relaxed">{tool.why}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {opportunity.whyTheCantBuildThisAlone && (
        <div className="border-t border-border pt-4 flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-0.5">
              Why This Is Hard To Ship Alone
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {opportunity.whyTheCantBuildThisAlone}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
