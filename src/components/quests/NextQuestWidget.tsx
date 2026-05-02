"use client"

import Link from "next/link"
import { useQuests } from "./QuestContext"
import { ChevronRight, Trophy, Lock, CheckCircle2, Sparkles } from "lucide-react"

/**
 * Compact "what to do next" card. Lives on the dashboard above the fold.
 * Always shows the ONE next thing — never a wall of options.
 */
export function NextQuestWidget() {
  const { progress, loading } = useQuests()

  if (loading) {
    return (
      <div className="rounded-xl border border-border bg-card p-5 animate-pulse">
        <div className="h-3 w-24 bg-surface rounded mb-3" />
        <div className="h-5 w-3/4 bg-surface rounded mb-2" />
        <div className="h-3 w-full bg-surface rounded" />
      </div>
    )
  }

  if (!progress) return null

  const next = progress.nextQuest
  const tierName = TIER_NAMES[progress.questLevel] ?? "Operator"
  const pct = progress.pctToNextUnlock

  // All main quests done — show a victory state.
  if (!next || progress.completedCount >= progress.totalMainCount) {
    return (
      <div className="rounded-xl border border-primary/40 bg-gradient-to-br from-primary/10 to-primary/5 p-5">
        <div className="flex items-center gap-2 text-primary text-xs uppercase tracking-wider font-bold mb-2">
          <Trophy className="h-3.5 w-3.5" />
          All Quests Complete
        </div>
        <p className="text-base font-semibold text-foreground mb-1">
          You've mastered the platform.
        </p>
        <p className="text-xs text-muted-foreground">
          Keep your streak alive and refer operators to earn ongoing rewards.
        </p>
      </div>
    )
  }

  const isLocked = next.status === "LOCKED"

  return (
    <Link
      href="/portal/quests"
      className="group block rounded-xl border border-border bg-card hover:border-primary/40 hover:bg-surface/40 transition-all duration-150 overflow-hidden"
    >
      {/* Progress bar at top */}
      <div className="h-1 bg-surface w-full">
        <div
          className="h-full bg-primary transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-primary text-[11px] uppercase tracking-wider font-bold">
            <Trophy className="h-3 w-3" />
            Next Quest · Tier {progress.questLevel}: {tierName}
          </div>
          <span className="text-[10px] text-muted-foreground">
            {pct}% to next unlock
          </span>
        </div>

        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            {isLocked ? (
              <Lock className="h-4 w-4" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-bold text-foreground mb-1 truncate">
              {next.title}
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {next.shortHint ?? next.description}
            </p>
            {next.goal > 1 && next.progress > 0 ? (
              <p className="text-[11px] text-primary mt-1.5">
                Progress: {next.progress} / {next.goal}
              </p>
            ) : null}
            {isLocked && next.prerequisiteTitles?.length ? (
              <p className="text-[11px] text-muted-foreground mt-1.5">
                Locked — finish:{" "}
                <span className="text-foreground">
                  {next.prerequisiteTitles.join(", ")}
                </span>
              </p>
            ) : null}
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
        </div>

        <div className="mt-4 flex items-center gap-3 text-[11px] text-muted-foreground border-t border-border/50 pt-3">
          <div className="flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3 text-primary" />
            {progress.completedCount} / {progress.totalMainCount} completed
          </div>
          <span className="opacity-30">·</span>
          <div className="flex items-center gap-1">
            <Sparkles className="h-3 w-3 text-primary" />
            {progress.totalXp.toLocaleString()} XP
          </div>
          {progress.streak && progress.streak.current > 0 ? (
            <>
              <span className="opacity-30">·</span>
              <span className="text-foreground font-semibold">
                {progress.streak.current}-day streak
              </span>
            </>
          ) : null}
        </div>
      </div>
    </Link>
  )
}

const TIER_NAMES: Record<number, string> = {
  0: "Day Zero",
  1: "Foundation",
  2: "Activation",
  3: "Revenue",
  4: "Mastery",
  5: "Master Operator",
}
