"use client"

import { ChevronLeft, ChevronRight } from "lucide-react"
import { useMemo } from "react"
import type { ScorecardProfile, ScorecardWeek } from "./types"

const DAY_MS = 24 * 60 * 60 * 1000

interface Props {
  week: ScorecardWeek
  profile: ScorecardProfile
  currentWeekStart: string | null
  onChangeWeek: (weekStart: string) => void
  onPatch: (delta: {
    commitmentLevel?: "PART_TIME" | "FULL_TIME"
    weeklyGoalText?: string
    weeklyRule?: string
    focusNiche?: string
  }) => void
}

function shiftWeek(weekStart: string, weeks: number): string {
  const d = new Date(`${weekStart}T00:00:00.000Z`)
  d.setUTCDate(d.getUTCDate() + weeks * 7)
  return d.toISOString().slice(0, 10)
}

export function ScorecardHeader({
  week,
  profile,
  currentWeekStart,
  onChangeWeek,
  onPatch,
}: Props) {
  const weekLabel = useMemo(() => {
    const start = new Date(`${week.start}T00:00:00.000Z`)
    const end = new Date(start.getTime() + 6 * DAY_MS)
    const fmt = (d: Date) =>
      d.toLocaleDateString("en-US", { month: "short", day: "numeric" })
    return `${fmt(start)} — ${fmt(end)}`
  }, [week.start])

  const isCurrent = useMemo(() => {
    if (!currentWeekStart) return true
    return currentWeekStart === week.start
  }, [currentWeekStart, week.start])

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-4">
      {/* Top row: week navigation + commitment toggle */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onChangeWeek(shiftWeek(week.start, -1))}
            className="h-8 w-8 inline-flex items-center justify-center rounded-md border border-border hover:border-primary/40 hover:text-primary transition-colors"
            aria-label="Previous week"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div className="px-3">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Week of
            </p>
            <p className="text-sm font-semibold text-foreground tabular-nums">
              {weekLabel}
            </p>
          </div>
          <button
            type="button"
            disabled={isCurrent}
            onClick={() => onChangeWeek(shiftWeek(week.start, 1))}
            className="h-8 w-8 inline-flex items-center justify-center rounded-md border border-border hover:border-primary/40 hover:text-primary transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label="Next week"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <div className="inline-flex items-center rounded-lg border border-border p-0.5 text-[11px] font-semibold">
          {(["PART_TIME", "FULL_TIME"] as const).map((level) => (
            <button
              key={level}
              type="button"
              onClick={() => onPatch({ commitmentLevel: level })}
              className={`px-3 py-1 rounded-md transition-colors ${
                profile.commitmentLevel === level
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {level === "PART_TIME" ? "Part-time" : "Full-time"}
            </button>
          ))}
        </div>
      </div>

      {/* Editable header fields */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Field
          label="Member"
          value={profile.businessName ?? ""}
          placeholder="Your business name"
          readOnly
        />
        <Field
          label="Focus niche"
          value={profile.focusNiche ?? ""}
          placeholder="Local med spas, contractors, agencies…"
          onSave={(v) => onPatch({ focusNiche: v })}
        />
        <div />
        <Field
          label="Weekly goal"
          value={profile.weeklyGoalText}
          placeholder="What does winning the week look like?"
          onSave={(v) => onPatch({ weeklyGoalText: v })}
          colSpan={2}
        />
        <Field
          label="Rule"
          value={profile.weeklyRule}
          placeholder="One sentence rule for the week"
          onSave={(v) => onPatch({ weeklyRule: v })}
        />
      </div>
    </div>
  )
}

function Field({
  label,
  value,
  placeholder,
  onSave,
  readOnly,
  colSpan,
}: {
  label: string
  value: string
  placeholder?: string
  onSave?: (v: string) => void
  readOnly?: boolean
  colSpan?: number
}) {
  return (
    <div className={colSpan === 2 ? "md:col-span-2" : ""}>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
        {label}
      </p>
      <input
        type="text"
        defaultValue={value}
        placeholder={placeholder}
        readOnly={readOnly}
        onBlur={(e) => {
          if (!onSave) return
          if (e.target.value !== value) onSave(e.target.value)
        }}
        className="w-full bg-transparent border-b border-transparent hover:border-border focus:border-primary text-sm text-foreground focus:outline-none py-1 placeholder:text-muted-foreground/50 read-only:text-muted-foreground read-only:cursor-default transition-colors"
      />
    </div>
  )
}
