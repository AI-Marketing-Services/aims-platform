"use client"

import Link from "next/link"
import { useQuests } from "./QuestContext"

/**
 * Tiny circular progress ring shown in the top-nav. Always visible so the
 * user has a constant nudge toward the next unlock.
 */
export function QuestProgressRing({ size = 28 }: { size?: number }) {
  const { progress } = useQuests()

  if (!progress) return null

  const pct = progress.pctToNextUnlock
  const radius = (size - 4) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (pct / 100) * circumference

  return (
    <Link
      href="/portal/quests"
      title={`${pct}% to next unlock — ${progress.completedCount}/${progress.totalMainCount} quests complete`}
      className="relative inline-flex items-center justify-center group"
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          className="text-border"
          strokeWidth="2"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          className="text-primary transition-all duration-500"
          strokeWidth="2"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-foreground group-hover:text-primary transition-colors">
        {pct}%
      </span>
    </Link>
  )
}
