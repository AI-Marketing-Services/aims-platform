"use client"

import { motion } from "framer-motion"
import { cn, formatCurrency } from "@/lib/utils"
import { DIMENSION_CONFIG } from "@/lib/ops-excellence/config"
import type { DashboardData } from "@/lib/ops-excellence/types"
import CompanyHeader from "./CompanyHeader"
import ScoreGauge from "./ScoreGauge"
import DimensionCard from "./DimensionCard"
import CapacityChart from "./CapacityChart"
import SpendSummary from "./SpendSummary"
import ActivityFeed from "./ActivityFeed"
import ExecSummaryBanner from "./ExecSummaryBanner"
import CFOTestPanel from "./CFOTestPanel"
import DiscoveryMetrics from "./DiscoveryMetrics"

interface ExecutiveDashboardProps {
  data: DashboardData
}

export default function ExecutiveDashboard({ data }: ExecutiveDashboardProps) {
  const { engagement, latestScore, previousScore } = data

  const hasScore = latestScore !== null
  const compositeDelta =
    latestScore && previousScore
      ? latestScore.compositeScore - previousScore.compositeScore
      : null

  const dimensionKeys = Object.keys(DIMENSION_CONFIG) as Array<
    keyof typeof DIMENSION_CONFIG
  >

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* 1. Company Header */}
      <CompanyHeader engagement={engagement} score={latestScore} />

      {/* 2. Executive Summary Banner */}
      <ExecSummaryBanner
        engagement={engagement}
        score={latestScore}
        previousScore={previousScore}
      />

      {/* 3. Score Section */}
      <motion.div
        className="rounded-2xl border border-border bg-card p-6"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
      >
        {hasScore ? (
          <div className="flex flex-col items-center">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-4">
              Operational Excellence Score
            </p>

            <ScoreGauge
              score={latestScore.compositeScore}
              previousScore={previousScore?.compositeScore}
              confidenceTier={latestScore.confidenceTier}
              maxScore={100}
            />

            {/* Score metadata */}
            <div className="flex flex-wrap items-center justify-center gap-4 mt-6">
              <span className="text-xs text-muted-foreground font-mono">
                V{latestScore.version}
              </span>
              <span className="text-xs text-muted-foreground">
                {latestScore.confidencePercent}% confidence
              </span>
              {compositeDelta !== null && compositeDelta !== 0 && (
                <span
                  className={cn(
                    "text-xs font-mono font-medium",
                    compositeDelta > 0 ? "text-emerald-400" : "text-red-400"
                  )}
                >
                  {compositeDelta > 0 ? "+" : ""}
                  {compositeDelta} pts from V{previousScore!.version}
                </span>
              )}
            </div>

            {/* Highlight metrics */}
            {(latestScore.totalHoursFreed !== null ||
              latestScore.totalDollarsSaved !== null ||
              latestScore.automationsDeployed !== null) && (
              <div className="flex flex-wrap items-center justify-center gap-6 mt-4 pt-4 border-t border-border">
                {latestScore.totalHoursFreed !== null && (
                  <div className="text-center">
                    <p className="text-lg font-bold font-mono text-foreground">
                      {latestScore.totalHoursFreed.toFixed(0)}h
                    </p>
                    <p className="text-xs text-muted-foreground">Hours Freed</p>
                  </div>
                )}
                {latestScore.totalDollarsSaved !== null && (
                  <div className="text-center">
                    <p className="text-lg font-bold font-mono text-foreground">
                      {formatCurrency(latestScore.totalDollarsSaved)}
                    </p>
                    <p className="text-xs text-muted-foreground">Dollars Saved</p>
                  </div>
                )}
                {latestScore.automationsDeployed !== null && (
                  <div className="text-center">
                    <p className="text-lg font-bold font-mono text-foreground">
                      {latestScore.automationsDeployed}
                    </p>
                    <p className="text-xs text-muted-foreground">Automations</p>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center py-8">
            <ScoreGauge score={0} confidenceTier="RED" maxScore={100} />
            <p className="text-sm text-muted-foreground mt-6 text-center max-w-sm">
              Your Operational Excellence Score has not been calculated yet.
              Complete the CFO Test and onboarding to generate your first score.
            </p>
          </div>
        )}
      </motion.div>

      {/* Dimension Cards (2x2 grid) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {dimensionKeys.map((key, index) => {
          const config = DIMENSION_CONFIG[key]
          const score = hasScore ? latestScore[key] : 0
          const prevScore = previousScore ? previousScore[key] : undefined

          return (
            <DimensionCard
              key={key}
              label={config.label}
              score={score}
              maxScore={config.maxScore}
              color={config.color}
              description={config.description}
              previousScore={prevScore}
              index={index}
            />
          )
        })}
      </div>

      {/* 5. CFO Test + Discovery row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CFOTestPanel cfoTest={data.cfoTest} />
        <DiscoveryMetrics metrics={data.discoveryMetrics} />
      </div>

      {/* 6. Capacity ROI Section */}
      <CapacityChart metrics={data.capacityMetrics} />

      {/* 7. Spend Summary */}
      <SpendSummary metrics={data.spendMetrics} />

      {/* 8. Activity Feed */}
      <ActivityFeed activities={data.recentActivity} />
    </div>
  )
}
