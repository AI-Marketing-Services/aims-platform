"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { Search, Users, Activity, BarChart3, Eye } from "lucide-react"
import { cn } from "@/lib/utils"
import { ENGAGEMENT_STAGES, CONFIDENCE_TIERS } from "@/lib/ops-excellence/config"
import type { EngagementListItem, EngagementStage, ConfidenceTier } from "@/lib/ops-excellence/types"

interface Props {
  engagements: EngagementListItem[]
}

type StageFilter = "ALL" | EngagementStage

const STAGE_TABS: { value: StageFilter; label: string }[] = [
  { value: "ALL", label: "All" },
  { value: "INTAKE", label: "Intake" },
  { value: "ONBOARDING", label: "Onboarding" },
  { value: "PHASE_1_INSTRUMENT", label: "Phase 1" },
  { value: "PHASE_2_EXECUTE", label: "Phase 2" },
  { value: "PHASE_3_PROVE", label: "Phase 3" },
  { value: "ACTIVE_ONGOING", label: "Active" },
]

function StageBadge({ stage }: { stage: EngagementStage }) {
  const config = ENGAGEMENT_STAGES[stage as keyof typeof ENGAGEMENT_STAGES]
  if (!config) return <span className="text-xs text-muted-foreground">{stage}</span>
  return (
    <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full", config.bgColor, config.color)}>
      {config.label}
    </span>
  )
}

function ConfidenceDot({ tier }: { tier: ConfidenceTier | null }) {
  if (!tier) return <span className="w-2.5 h-2.5 rounded-full bg-muted-foreground/30 inline-block" />
  const config = CONFIDENCE_TIERS[tier as keyof typeof CONFIDENCE_TIERS]
  const colorMap: Record<string, string> = {
    GREEN: "bg-emerald-400",
    YELLOW: "bg-yellow-400",
    RED: "bg-red-400",
  }
  return (
    <span
      className={cn("w-2.5 h-2.5 rounded-full inline-block", colorMap[tier] ?? "bg-muted-foreground/30")}
      title={config?.label ?? tier}
    />
  )
}

function ScoreBar({ score }: { score: number | null }) {
  if (score === null) return <span className="text-xs text-muted-foreground">--</span>
  const pct = Math.min(100, Math.max(0, score))
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium text-foreground w-8 text-right">{score}</span>
      <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full bg-[#981B1B] transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

function TierBadge({ tier }: { tier: string }) {
  const colorMap: Record<string, string> = {
    DIAGNOSE: "text-yellow-400 bg-yellow-900/20",
    EXECUTE: "text-blue-400 bg-blue-900/20",
    PROVE: "text-emerald-400 bg-emerald-900/20",
  }
  return (
    <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full", colorMap[tier] ?? "text-muted-foreground bg-muted/20")}>
      {tier.charAt(0) + tier.slice(1).toLowerCase()}
    </span>
  )
}

export function EngagementPipeline({ engagements }: Props) {
  const [search, setSearch] = useState("")
  const [stageFilter, setStageFilter] = useState<StageFilter>("ALL")

  const filtered = useMemo(() => {
    const lowerSearch = search.toLowerCase()
    return engagements.filter((e) => {
      if (stageFilter !== "ALL" && e.stage !== stageFilter) return false
      if (lowerSearch && !e.companyName.toLowerCase().includes(lowerSearch)) return false
      return true
    })
  }, [engagements, search, stageFilter])

  const stats = useMemo(() => {
    const total = engagements.length
    const active = engagements.filter((e) =>
      !["PAUSED", "COMPLETED"].includes(e.stage)
    ).length
    const scores = engagements
      .map((e) => e.latestScore)
      .filter((s): s is number => s !== null)
    const avgScore = scores.length > 0
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      : 0
    return { total, active, avgScore }
  }, [engagements])

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-2xl p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Users className="h-4 w-4" />
            <span className="text-xs uppercase tracking-wider">Total Engagements</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{stats.total}</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Activity className="h-4 w-4" />
            <span className="text-xs uppercase tracking-wider">Active</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{stats.active}</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <BarChart3 className="h-4 w-4" />
            <span className="text-xs uppercase tracking-wider">Average Score</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{stats.avgScore || "--"}</p>
        </div>
      </div>

      {/* Search + Stage Tabs */}
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by company name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-border bg-card pl-10 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#981B1B]/50"
          />
        </div>

        <div className="flex gap-1 border-b border-border overflow-x-auto">
          {STAGE_TABS.map((tab) => {
            const count = tab.value === "ALL"
              ? engagements.length
              : engagements.filter((e) => e.stage === tab.value).length
            return (
              <button
                key={tab.value}
                onClick={() => setStageFilter(tab.value)}
                className={cn(
                  "px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors",
                  stageFilter === tab.value
                    ? "border-b-2 border-[#981B1B] text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {tab.label}
                <span className="ml-1.5 text-xs text-muted-foreground">({count})</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl p-12 text-center">
          <Users className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">
            {engagements.length === 0
              ? "No engagements yet. They will appear here once a CEO completes the intake form."
              : "No engagements match your filters."}
          </p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left text-xs uppercase tracking-wider text-muted-foreground px-4 py-3 font-medium">
                    Company
                  </th>
                  <th className="text-left text-xs uppercase tracking-wider text-muted-foreground px-4 py-3 font-medium">
                    Contact
                  </th>
                  <th className="text-left text-xs uppercase tracking-wider text-muted-foreground px-4 py-3 font-medium">
                    Stage
                  </th>
                  <th className="text-left text-xs uppercase tracking-wider text-muted-foreground px-4 py-3 font-medium">
                    Score
                  </th>
                  <th className="text-center text-xs uppercase tracking-wider text-muted-foreground px-4 py-3 font-medium">
                    Confidence
                  </th>
                  <th className="text-left text-xs uppercase tracking-wider text-muted-foreground px-4 py-3 font-medium">
                    Tier
                  </th>
                  <th className="text-right text-xs uppercase tracking-wider text-muted-foreground px-4 py-3 font-medium">
                    Days Active
                  </th>
                  <th className="text-right text-xs uppercase tracking-wider text-muted-foreground px-4 py-3 font-medium">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((e) => (
                  <tr key={e.id} className="border-b border-border last:border-b-0 hover:bg-panel/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium text-foreground">{e.companyName}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-foreground">{e.userName ?? "--"}</div>
                      <div className="text-xs text-muted-foreground">{e.userEmail}</div>
                    </td>
                    <td className="px-4 py-3">
                      <StageBadge stage={e.stage} />
                    </td>
                    <td className="px-4 py-3">
                      <ScoreBar score={e.latestScore} />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <ConfidenceDot tier={e.confidenceTier} />
                    </td>
                    <td className="px-4 py-3">
                      <TierBadge tier={e.tier} />
                    </td>
                    <td className="px-4 py-3 text-right text-muted-foreground">
                      {e.daysSinceStart}d
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/ops-excellence/${e.id}`}
                        className="inline-flex items-center gap-1.5 text-xs font-medium text-[#981B1B] hover:text-[#791515] transition-colors"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
