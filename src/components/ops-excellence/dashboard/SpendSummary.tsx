"use client"

import { DollarSign } from "lucide-react"
import { motion } from "framer-motion"
import { cn, formatCurrency } from "@/lib/utils"
import { SPEND_DECISION_LABELS } from "@/lib/ops-excellence/config"
import type { SpendMetrics } from "@/lib/ops-excellence/types"

interface SpendSummaryProps {
  metrics: SpendMetrics
}

const DECISION_BAR_COLORS: Record<string, string> = {
  ELIMINATE: "#EF4444",
  CONSOLIDATE: "#F97316",
  RENEGOTIATE: "#EAB308",
  JUSTIFY: "#34D399",
}

export default function SpendSummary({ metrics }: SpendSummaryProps) {
  const hasDecisions = metrics.totalDecisions > 0

  const summaryCards = [
    {
      label: "Savings Identified",
      value: formatCurrency(metrics.totalSavingsIdentified),
      color: "text-[#981B1B]",
      borderColor: "border-l-[#981B1B]",
    },
    {
      label: "Savings Realized",
      value: formatCurrency(metrics.totalSavingsRealized),
      color: "text-emerald-400",
      borderColor: "border-l-emerald-400",
    },
    {
      label: "Implementation Backlog",
      value: formatCurrency(metrics.implementationBacklog),
      color: "text-yellow-400",
      borderColor: "border-l-yellow-400",
    },
  ]

  const totalDecisionCount = Object.values(metrics.decisionsByType).reduce(
    (sum, count) => sum + count,
    0
  )

  const decisionSegments = Object.entries(metrics.decisionsByType)
    .filter(([, count]) => count > 0)
    .map(([type, count]) => ({
      type,
      count,
      label:
        SPEND_DECISION_LABELS[type as keyof typeof SPEND_DECISION_LABELS]?.label ?? type,
      color: DECISION_BAR_COLORS[type] ?? "#8B8B9E",
      pct: totalDecisionCount > 0 ? (count / totalDecisionCount) * 100 : 0,
    }))

  return (
    <motion.div
      className="rounded-2xl border border-border bg-card overflow-hidden"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.7, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Header */}
      <div className="px-6 py-4 border-b border-border">
        <h3 className="text-lg font-semibold text-foreground">
          Spend Efficiency
        </h3>
        <p className="text-sm text-muted-foreground mt-0.5">
          Savings identified and realized through spend optimization
        </p>
      </div>

      {hasDecisions ? (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4">
            {summaryCards.map((card) => (
              <div
                key={card.label}
                className={cn(
                  "bg-surface rounded-xl p-4 border-l-2",
                  card.borderColor
                )}
              >
                <p className="text-xs text-muted-foreground mb-1">{card.label}</p>
                <p className={cn("text-xl font-bold font-mono", card.color)}>
                  {card.value}
                </p>
              </div>
            ))}
          </div>

          {/* Decision type breakdown bar */}
          {decisionSegments.length > 0 && (
            <div className="px-6 pb-5 pt-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
                Decisions by Type
              </p>

              {/* Horizontal stacked bar */}
              <div className="h-3 w-full rounded-full overflow-hidden flex bg-surface">
                {decisionSegments.map((seg) => (
                  <motion.div
                    key={seg.type}
                    className="h-full first:rounded-l-full last:rounded-r-full"
                    style={{ backgroundColor: seg.color }}
                    initial={{ width: 0 }}
                    animate={{ width: `${seg.pct}%` }}
                    transition={{
                      duration: 0.8,
                      delay: 0.9,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                  />
                ))}
              </div>

              {/* Legend */}
              <div className="flex flex-wrap gap-4 mt-3">
                {decisionSegments.map((seg) => (
                  <div key={seg.type} className="flex items-center gap-1.5">
                    <span
                      className="inline-block h-2 w-2 rounded-full"
                      style={{ backgroundColor: seg.color }}
                    />
                    <span className="text-xs text-muted-foreground">{seg.label}</span>
                    <span className="text-xs font-mono font-medium text-foreground">
                      {seg.count}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="px-6 py-16 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-deep mx-auto mb-3">
            <DollarSign className="h-5 w-5 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">
            Spend decisions will be tracked here during Phase 2
          </p>
        </div>
      )}
    </motion.div>
  )
}
