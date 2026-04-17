"use client"

import { motion } from "framer-motion"
import { Search, Layers, Cpu, BadgeCheck } from "lucide-react"
import { cn } from "@/lib/utils"
import { TIER_DEFINITIONS, DEPARTMENTS } from "@/lib/ops-excellence/config"
import type { DiscoveryMetrics as DiscoveryMetricsType } from "@/lib/ops-excellence/types"

interface DiscoveryMetricsProps {
  metrics: DiscoveryMetricsType
}

export default function DiscoveryMetrics({ metrics }: DiscoveryMetricsProps) {
  const hasCards = metrics.totalCards > 0

  const summaryStats = [
    {
      label: "Processes Discovered",
      value: metrics.totalCards,
      icon: Search,
      color: "#60A5FA",
    },
    {
      label: "Automation Candidates",
      value: metrics.automationCandidates,
      icon: Cpu,
      color: "#34D399",
    },
    {
      label: "Validated",
      value: metrics.validated,
      icon: BadgeCheck,
      color: "#981B1B",
    },
    {
      label: "Departments Covered",
      value: Object.keys(metrics.cardsByDepartment).length,
      icon: Layers,
      color: "#A78BFA",
    },
  ]

  const tierEntries = [1, 2, 3, 4].map((tier) => ({
    tier,
    count: metrics.cardsByTier[tier] ?? 0,
    config: TIER_DEFINITIONS[tier as keyof typeof TIER_DEFINITIONS],
  }))

  const topDepts = Object.entries(metrics.cardsByDepartment)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)

  return (
    <motion.div
      className="rounded-2xl border border-border bg-card overflow-hidden"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="px-6 py-4 border-b border-border">
        <h3 className="text-base font-semibold text-foreground">AI Readiness — Process Discovery</h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          How many processes have been mapped and triaged for AI automation?
        </p>
      </div>

      {hasCards ? (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4">
            {summaryStats.map(({ label, value, icon: Icon, color }, i) => (
              <motion.div
                key={label}
                className="rounded-xl bg-surface border border-border p-4 text-center"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: 0.65 + i * 0.06 }}
              >
                <Icon className="h-4 w-4 mx-auto mb-2" style={{ color }} />
                <p className="text-xl font-bold font-mono text-foreground">{value}</p>
                <p className="text-xs text-muted-foreground mt-0.5 leading-tight">{label}</p>
              </motion.div>
            ))}
          </div>

          {/* Tier distribution */}
          <div className="px-6 py-4 border-t border-border">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
              Priority Tier Distribution
            </p>
            <div className="grid grid-cols-2 gap-2">
              {tierEntries.map(({ tier, count, config }) => (
                <div
                  key={tier}
                  className={cn(
                    "flex items-center gap-3 rounded-lg border px-4 py-3",
                    "bg-surface border-border"
                  )}
                >
                  <span
                    className={cn(
                      "flex h-6 w-6 items-center justify-center rounded-md text-xs font-bold shrink-0",
                      config.bgColor,
                      config.color
                    )}
                  >
                    T{tier}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground font-mono">{count}</p>
                    <p className="text-xs text-muted-foreground truncate">{config.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Department breakdown */}
          {topDepts.length > 0 && (
            <div className="px-6 pb-5 border-t border-border pt-4">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
                Top Departments
              </p>
              <div className="space-y-2">
                {topDepts.map(([dept, count]) => {
                  const maxCount = topDepts[0][1]
                  const pct = maxCount > 0 ? (count / maxCount) * 100 : 0
                  return (
                    <div key={dept} className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground w-40 truncate shrink-0">
                        {dept}
                      </span>
                      <div className="flex-1 h-1.5 bg-deep rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-blue-400 rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.7, delay: 0.8, ease: [0.22, 1, 0.36, 1] }}
                        />
                      </div>
                      <span className="text-xs font-mono font-medium text-foreground w-6 text-right shrink-0">
                        {count}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="px-6 py-14 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-deep mx-auto mb-3">
            <Search className="h-5 w-5 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium text-foreground mb-1">Discovery not started yet</p>
          <p className="text-sm text-muted-foreground max-w-xs mx-auto">
            Process discovery cards are added during Phase 1. Each card represents a workflow your team does today that we evaluate for automation.
          </p>
        </div>
      )}
    </motion.div>
  )
}
