"use client"

import Link from "next/link"
import { Rocket, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { TOTAL_STEPS } from "@/lib/onboarding/steps"

interface Props {
  completedCount: number
  percent: number
  onboardingCompletedAt: string | null
  collapsed?: boolean
}

export function OnboardingProgressWidget({
  completedCount,
  percent,
  onboardingCompletedAt,
  collapsed = false,
}: Props) {
  const isDone = !!onboardingCompletedAt && percent === 100

  if (isDone) return null

  if (collapsed) {
    return (
      <Link
        href="/portal/onboard"
        className="flex items-center justify-center py-2 text-primary hover:text-primary/80 transition-colors"
        title={`Onboarding ${completedCount}/${TOTAL_STEPS}`}
      >
        <Rocket className="h-4.5 w-4.5" />
      </Link>
    )
  }

  return (
    <Link
      href="/portal/onboard"
      className="mx-2 mb-2 flex flex-col gap-2 rounded-xl border border-primary/20 bg-primary/5 px-3 py-3 hover:border-primary/40 transition-colors group"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Rocket className="h-3.5 w-3.5 text-primary shrink-0" />
          <span className="text-xs font-semibold text-foreground">Getting Started</span>
        </div>
        <span className="flex items-center gap-0.5 text-xs text-primary font-medium">
          {completedCount}/{TOTAL_STEPS}
          <ChevronRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
        </span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-primary/15 overflow-hidden">
        <div
          className={cn("h-full rounded-full bg-primary transition-all duration-500")}
          style={{ width: `${percent}%` }}
        />
      </div>
      <p className="text-[10px] text-muted-foreground">{percent}% complete — continue your roadmap</p>
    </Link>
  )
}
