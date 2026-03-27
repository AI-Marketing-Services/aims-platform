"use client"

import { motion } from "framer-motion"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"
import { cn } from "@/lib/utils"

interface DimensionCardProps {
  label: string
  score: number
  maxScore: number
  color: string
  description: string
  previousScore?: number
  index?: number
}

export default function DimensionCard({
  label,
  score,
  maxScore,
  color,
  description,
  previousScore,
  index = 0,
}: DimensionCardProps) {
  const pct = Math.min((score / maxScore) * 100, 100)
  const delta = previousScore !== undefined ? score - previousScore : null
  const deltaAbs = delta !== null ? Math.abs(delta) : 0

  function getDeltaDisplay() {
    if (delta === null) return null
    if (delta > 0) {
      return {
        icon: TrendingUp,
        color: "text-emerald-400",
        label: `+${deltaAbs}`,
      }
    }
    if (delta < 0) {
      return {
        icon: TrendingDown,
        color: "text-red-400",
        label: `-${deltaAbs}`,
      }
    }
    return {
      icon: Minus,
      color: "text-muted-foreground",
      label: "0",
    }
  }

  const deltaDisplay = getDeltaDisplay()

  return (
    <motion.div
      className={cn(
        "bg-card border border-border rounded-xl p-5",
        "transition-all duration-200",
        "hover:shadow-lg hover:shadow-primary/5 hover:border-primary/20",
        "group"
      )}
      style={{ borderLeftWidth: 2, borderLeftColor: color }}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.5,
        delay: 0.15 * index,
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
          {label}
        </p>
        {deltaDisplay && (
          <div className={cn("flex items-center gap-1 text-xs font-medium", deltaDisplay.color)}>
            <deltaDisplay.icon className="h-3.5 w-3.5" />
            <span className="font-mono">{deltaDisplay.label}</span>
          </div>
        )}
      </div>

      {/* Score */}
      <div className="flex items-baseline gap-1.5 mb-3">
        <span
          className="text-2xl font-bold font-mono"
          style={{ color }}
        >
          {score}
        </span>
        <span className="text-sm text-muted-foreground font-mono">
          / {maxScore}
        </span>
      </div>

      {/* Progress bar */}
      <div className="mb-3">
        <div className="h-1.5 w-full rounded-full bg-surface overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: color }}
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{
              duration: 1,
              delay: 0.3 + 0.15 * index,
              ease: [0.22, 1, 0.36, 1],
            }}
          />
        </div>
      </div>

      {/* Description */}
      <p className="text-xs text-muted-foreground leading-relaxed">
        {description}
      </p>
    </motion.div>
  )
}
