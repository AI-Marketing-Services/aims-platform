"use client"

import { motion } from "framer-motion"
import { TrendingUp, AlertCircle, CheckCircle2, ArrowRight, Target } from "lucide-react"
import { cn } from "@/lib/utils"
import { DIMENSION_CONFIG, CONFIDENCE_TIERS } from "@/lib/ops-excellence/config"
import type { ScoreSummary, EngagementSummary } from "@/lib/ops-excellence/types"

interface ExecSummaryBannerProps {
  engagement: EngagementSummary
  score: ScoreSummary | null
  previousScore: ScoreSummary | null
}

interface Recommendation {
  dimension: string
  action: string
  color: string
}

function getScoreLabel(score: number): { label: string; color: string } {
  if (score >= 85) return { label: "World-Class", color: "text-emerald-400" }
  if (score >= 70) return { label: "Optimized", color: "text-blue-400" }
  if (score >= 50) return { label: "Advanced", color: "text-[#C4972A]" }
  if (score >= 30) return { label: "Developing", color: "text-yellow-400" }
  return { label: "Emerging", color: "text-muted-foreground" }
}

function getRecommendations(score: ScoreSummary): Recommendation[] {
  const dims = [
    {
      key: "financialClarity" as const,
      score: score.financialClarity,
      action: "Complete the CFO Test and populate revenue segmentation data to improve Financial Clarity.",
      color: DIMENSION_CONFIG.financialClarity.color,
    },
    {
      key: "aiReadiness" as const,
      score: score.aiReadiness,
      action: "Add more process discovery cards across all departments to boost AI Readiness.",
      color: DIMENSION_CONFIG.aiReadiness.color,
    },
    {
      key: "capacityRoi" as const,
      score: score.capacityRoi,
      action: "Deploy and measure automations — track hours freed to unlock Capacity ROI points.",
      color: DIMENSION_CONFIG.capacityRoi.color,
    },
    {
      key: "spendEfficiency" as const,
      score: score.spendEfficiency,
      action: "Log spend decisions and begin executing the eliminate/consolidate backlog to raise Spend Efficiency.",
      color: DIMENSION_CONFIG.spendEfficiency.color,
    },
  ]

  return dims
    .filter((d) => d.score < DIMENSION_CONFIG[d.key].maxScore * 0.7)
    .sort((a, b) => a.score - b.score)
    .slice(0, 3)
    .map((d) => ({
      dimension: DIMENSION_CONFIG[d.key].label,
      action: d.action,
      color: d.color,
    }))
}

function getStrengths(score: ScoreSummary): string[] {
  const strengths: string[] = []
  const dims = [
    { key: "financialClarity" as const, label: DIMENSION_CONFIG.financialClarity.label },
    { key: "aiReadiness" as const, label: DIMENSION_CONFIG.aiReadiness.label },
    { key: "capacityRoi" as const, label: DIMENSION_CONFIG.capacityRoi.label },
    { key: "spendEfficiency" as const, label: DIMENSION_CONFIG.spendEfficiency.label },
  ]
  for (const d of dims) {
    const pct = score[d.key] / DIMENSION_CONFIG[d.key].maxScore
    if (pct >= 0.7) {
      strengths.push(d.label)
    }
  }
  if (score.totalHoursFreed && score.totalHoursFreed >= 40) {
    strengths.push(`${score.totalHoursFreed.toFixed(0)} hours freed via automation`)
  }
  if (score.automationsDeployed && score.automationsDeployed >= 2) {
    strengths.push(`${score.automationsDeployed} automations actively running`)
  }
  if (score.totalDollarsSaved && score.totalDollarsSaved >= 1000) {
    strengths.push(`$${score.totalDollarsSaved.toLocaleString()} in savings realized`)
  }
  return strengths.slice(0, 3)
}

function getNextMilestone(score: ScoreSummary): { label: string; pointsNeeded: number } | null {
  const s = score.compositeScore
  if (s < 30) return { label: "Developing (30+)", pointsNeeded: 30 - s }
  if (s < 50) return { label: "Advanced (50+)", pointsNeeded: 50 - s }
  if (s < 70) return { label: "Optimized (70+)", pointsNeeded: 70 - s }
  if (s < 85) return { label: "World-Class (85+)", pointsNeeded: 85 - s }
  return null
}

export default function ExecSummaryBanner({
  engagement,
  score,
  previousScore,
}: ExecSummaryBannerProps) {
  if (!score) {
    return (
      <motion.div
        className="rounded-2xl border border-border bg-card p-6"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
            <Target className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground mb-1">
              Your AI Audit is in progress
            </p>
            <p className="text-sm text-muted-foreground">
              Complete the CFO Test and onboarding to generate your first Operational Excellence Score. Once scored, this section will show your executive summary, top wins, and recommended next actions.
            </p>
          </div>
        </div>
      </motion.div>
    )
  }

  const { label: scoreLabel, color: scoreColor } = getScoreLabel(score.compositeScore)
  const recommendations = getRecommendations(score)
  const strengths = getStrengths(score)
  const nextMilestone = getNextMilestone(score)
  const compositeDelta = previousScore
    ? score.compositeScore - previousScore.compositeScore
    : null
  const tierConfig = CONFIDENCE_TIERS[score.confidenceTier as keyof typeof CONFIDENCE_TIERS]

  return (
    <motion.div
      className="rounded-2xl border border-border bg-card overflow-hidden"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Score headline */}
      <div className="px-6 py-5 border-b border-border flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="flex flex-col">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-0.5">
              Executive Summary
            </span>
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className={cn("text-2xl font-black font-mono", scoreColor)}>
                {score.compositeScore}
                <span className="text-sm font-medium text-muted-foreground font-sans ml-1">/100</span>
              </span>
              <span className={cn("text-sm font-semibold", scoreColor)}>
                — {scoreLabel}
              </span>
              {compositeDelta !== null && compositeDelta !== 0 && (
                <span
                  className={cn(
                    "flex items-center gap-1 text-xs font-mono font-medium px-2 py-0.5 rounded-full",
                    compositeDelta > 0
                      ? "bg-emerald-900/20 text-emerald-400"
                      : "bg-red-900/20 text-red-400"
                  )}
                >
                  <TrendingUp className={cn("h-3 w-3", compositeDelta < 0 && "rotate-180")} />
                  {compositeDelta > 0 ? "+" : ""}
                  {compositeDelta} pts
                </span>
              )}
            </div>
          </div>
        </div>
        <div
          className={cn(
            "flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border",
            score.confidenceTier === "GREEN"
              ? "bg-emerald-900/20 text-emerald-400 border-emerald-800"
              : score.confidenceTier === "YELLOW"
              ? "bg-yellow-900/20 text-yellow-400 border-yellow-800"
              : "bg-red-900/20 text-red-400 border-red-800"
          )}
        >
          <span
            className={cn(
              "h-1.5 w-1.5 rounded-full",
              score.confidenceTier === "GREEN"
                ? "bg-emerald-400"
                : score.confidenceTier === "YELLOW"
                ? "bg-yellow-400"
                : "bg-red-400"
            )}
          />
          {tierConfig?.label ?? score.confidenceTier} Confidence · {score.confidencePercent}%
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border">
        {/* Strengths column */}
        <div className="px-6 py-5">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Current Strengths
            </span>
          </div>
          {strengths.length > 0 ? (
            <ul className="space-y-2.5">
              {strengths.map((s, i) => (
                <motion.li
                  key={s}
                  className="flex items-start gap-2 text-sm text-foreground"
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.1 + i * 0.07 }}
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 mt-2 shrink-0" />
                  {s}
                </motion.li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">
              Strengths will appear as you complete more of the engagement.
            </p>
          )}
        </div>

        {/* Recommendations column */}
        <div className="px-6 py-5">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="h-4 w-4 text-[#C4972A] shrink-0" />
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Recommended Next Actions
            </span>
          </div>
          {recommendations.length > 0 ? (
            <ul className="space-y-3">
              {recommendations.map((r, i) => (
                <motion.li
                  key={r.dimension}
                  className="flex items-start gap-2.5"
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.1 + i * 0.07 }}
                >
                  <span
                    className="h-1.5 w-1.5 rounded-full mt-2 shrink-0"
                    style={{ backgroundColor: r.color }}
                  />
                  <div>
                    <span
                      className="text-xs font-semibold uppercase tracking-wide block mb-0.5"
                      style={{ color: r.color }}
                    >
                      {r.dimension}
                    </span>
                    <span className="text-sm text-muted-foreground leading-relaxed">
                      {r.action}
                    </span>
                  </div>
                </motion.li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">
              All dimensions are performing well. Keep maintaining current scores.
            </p>
          )}
        </div>
      </div>

      {/* Next milestone footer */}
      {nextMilestone && (
        <div className="px-6 py-3 border-t border-border bg-surface/40 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              Next milestone:{" "}
              <span className="font-semibold text-foreground">{nextMilestone.label}</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-24 rounded-full bg-deep overflow-hidden">
              <div
                className="h-full bg-primary rounded-full"
                style={{
                  width: `${Math.max(5, 100 - (nextMilestone.pointsNeeded / 15) * 100)}%`,
                }}
              />
            </div>
            <span className="text-xs font-mono text-muted-foreground">
              {nextMilestone.pointsNeeded} pts needed
            </span>
          </div>
        </div>
      )}
    </motion.div>
  )
}
