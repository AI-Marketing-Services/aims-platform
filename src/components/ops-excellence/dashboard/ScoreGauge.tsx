"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { TrendingUp, TrendingDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { CONFIDENCE_TIERS } from "@/lib/ops-excellence/config"
import type { ConfidenceTier } from "@/lib/ops-excellence/types"

interface ScoreGaugeProps {
  score: number
  previousScore?: number
  confidenceTier: ConfidenceTier
  maxScore?: number
}

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad),
  }
}

function describeArc(cx: number, cy: number, r: number, startDeg: number, endDeg: number) {
  const start = polarToCartesian(cx, cy, r, endDeg)
  const end = polarToCartesian(cx, cy, r, startDeg)
  const largeArcFlag = endDeg - startDeg <= 180 ? "0" : "1"
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`
}

export default function ScoreGauge({
  score,
  previousScore,
  confidenceTier,
  maxScore = 100,
}: ScoreGaugeProps) {
  const [animated, setAnimated] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setAnimated(true), 100)
    return () => clearTimeout(timer)
  }, [])

  const svgSize = 240
  const strokeWidth = 12
  const radius = (svgSize - strokeWidth) / 2
  const center = svgSize / 2

  const startAngle = 135
  const endAngle = 405
  const totalAngle = endAngle - startAngle

  const scorePercent = Math.min(score / maxScore, 1)
  const fillAngle = totalAngle * scorePercent

  const delta = previousScore !== undefined ? score - previousScore : null
  const deltaAbs = delta !== null ? Math.abs(delta) : 0

  const backgroundArc = describeArc(center, center, radius, startAngle, endAngle)
  const filledArc = fillAngle > 0
    ? describeArc(center, center, radius, startAngle, startAngle + fillAngle)
    : ""

  const tickCount = 20
  const ticks = Array.from({ length: tickCount + 1 }, (_, i) => {
    const angle = startAngle + (totalAngle / tickCount) * i
    const innerR = radius - 18
    const outerR = radius - 10
    const inner = polarToCartesian(center, center, innerR, angle)
    const outer = polarToCartesian(center, center, outerR, angle)
    const isMajor = i % 5 === 0
    return { inner, outer, isMajor }
  })

  const tierConfig = CONFIDENCE_TIERS[confidenceTier as keyof typeof CONFIDENCE_TIERS]

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: svgSize, height: svgSize }}>
        <svg
          width={svgSize}
          height={svgSize}
          viewBox={`0 0 ${svgSize} ${svgSize}`}
          className="overflow-visible"
        >
          <defs>
            <linearGradient id="score-gauge-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#981B1B" stopOpacity="0.7" />
              <stop offset="50%" stopColor="#981B1B" stopOpacity="1" />
              <stop offset="100%" stopColor="#D4A73A" stopOpacity="1" />
            </linearGradient>
            <filter id="score-gauge-glow">
              <feGaussianBlur stdDeviation="4" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Tick marks */}
          {ticks.map((tick, i) => (
            <line
              key={i}
              x1={tick.inner.x}
              y1={tick.inner.y}
              x2={tick.outer.x}
              y2={tick.outer.y}
              stroke={tick.isMajor ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.06)"}
              strokeWidth={tick.isMajor ? 1.5 : 0.75}
            />
          ))}

          {/* Background arc */}
          <path
            d={backgroundArc}
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />

          {/* Progress arc */}
          {filledArc && (
            <motion.path
              d={filledArc}
              fill="none"
              stroke="url(#score-gauge-gradient)"
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              filter="url(#score-gauge-glow)"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={animated ? { pathLength: 1, opacity: 1 } : { pathLength: 0, opacity: 0 }}
              transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
            />
          )}
        </svg>

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            className="text-5xl font-bold font-mono text-foreground leading-none"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={animated ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.6, delay: 0.8, ease: [0.22, 1, 0.36, 1] }}
          >
            {score}
          </motion.span>
          <motion.span
            className="text-sm font-mono text-muted-foreground mt-1"
            initial={{ opacity: 0 }}
            animate={animated ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 0.4, delay: 1.0 }}
          >
            / {maxScore}
          </motion.span>
        </div>
      </div>

      {/* Confidence tier badge */}
      <motion.div
        className={cn(
          "mt-2 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium",
          tierConfig.bgColor,
          tierConfig.color
        )}
        initial={{ opacity: 0, y: 8 }}
        animate={animated ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
        transition={{ duration: 0.4, delay: 1.2 }}
      >
        <span
          className="inline-block h-1.5 w-1.5 rounded-full"
          style={{ backgroundColor: "#981B1B" }}
        />
        {tierConfig.label} Confidence
      </motion.div>

      {/* Delta from previous score */}
      {delta !== null && delta !== 0 && (
        <motion.div
          className={cn(
            "mt-2 flex items-center gap-1 text-sm font-medium",
            delta > 0 ? "text-emerald-400" : "text-red-400"
          )}
          initial={{ opacity: 0, y: 4 }}
          animate={animated ? { opacity: 1, y: 0 } : { opacity: 0, y: 4 }}
          transition={{ duration: 0.4, delay: 1.4 }}
        >
          {delta > 0 ? (
            <TrendingUp className="h-3.5 w-3.5" />
          ) : (
            <TrendingDown className="h-3.5 w-3.5" />
          )}
          <span className="font-mono">
            {delta > 0 ? "+" : "-"}{deltaAbs} points since baseline
          </span>
        </motion.div>
      )}
    </div>
  )
}
