"use client"

import Image from "next/image"
import { motion } from "framer-motion"
import { Calendar, TrendingUp } from "lucide-react"
import { cn } from "@/lib/utils"
import { ENGAGEMENT_STAGES, CONFIDENCE_TIERS } from "@/lib/ops-excellence/config"
import type { EngagementSummary, ScoreSummary } from "@/lib/ops-excellence/types"

interface CompanyHeaderProps {
  engagement: EngagementSummary
  score: ScoreSummary | null
}

function CompanyInitials({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0] ?? "")
    .join("")
    .toUpperCase()

  return (
    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2 border-primary/40 bg-primary/10">
      <span className="text-lg font-bold font-serif text-primary">
        {initials}
      </span>
    </div>
  )
}

export default function CompanyHeader({ engagement, score }: CompanyHeaderProps) {
  const stageConfig = ENGAGEMENT_STAGES[engagement.stage as keyof typeof ENGAGEMENT_STAGES]

  return (
    <motion.div
      className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-6 border-b border-border"
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Left: Company identity */}
      <div className="flex items-center gap-4">
        {engagement.companyLogo ? (
          <Image
            src={engagement.companyLogo}
            alt={engagement.companyName}
            width={56}
            height={56}
            unoptimized
            className="h-14 w-14 shrink-0 rounded-full object-cover border-2 border-border"
          />
        ) : (
          <CompanyInitials name={engagement.companyName} />
        )}

        <div>
          <h1 className="font-serif text-3xl font-bold text-foreground leading-tight">
            {engagement.companyName}
          </h1>
          {engagement.industry && (
            <p className="text-sm text-muted-foreground mt-0.5">
              {engagement.industry}
            </p>
          )}
        </div>
      </div>

      {/* Right: Status indicators */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Stage badge */}
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium",
            stageConfig.bgColor,
            stageConfig.color
          )}
        >
          {stageConfig.label}
        </span>

        {/* Confidence tier */}
        {score && (
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium",
              CONFIDENCE_TIERS[score.confidenceTier as keyof typeof CONFIDENCE_TIERS].bgColor,
              CONFIDENCE_TIERS[score.confidenceTier as keyof typeof CONFIDENCE_TIERS].color
            )}
          >
            {CONFIDENCE_TIERS[score.confidenceTier as keyof typeof CONFIDENCE_TIERS].label} Confidence
          </span>
        )}

        {/* Days since start */}
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
          <Calendar className="h-3 w-3" />
          Day {engagement.daysSinceStart}
        </span>

        {/* Score delta */}
        {score && score.version > 1 && (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-400">
            <TrendingUp className="h-3 w-3" />
            Score improved since baseline
          </span>
        )}
      </div>
    </motion.div>
  )
}
