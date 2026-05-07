"use client"

import { useState } from "react"
import { toast } from "sonner"
import { ONBOARDING_STEPS, groupStepsByWeek, TOTAL_STEPS, type OnboardingStep } from "@/lib/onboarding/steps"
import { CheckCircle2, Circle, ExternalLink, ChevronDown, ChevronUp } from "lucide-react"
import { cn } from "@/lib/utils"

interface Props {
  initialCompletedKeys: string[]
  variant?: "full" | "compact"
  className?: string
}

type StepWithCompleted = OnboardingStep & { completed: boolean }

async function toggleStep(stepKey: string, currentlyCompleted: boolean) {
  const method = currentlyCompleted ? "DELETE" : "POST"
  const url = currentlyCompleted
    ? `/api/portal/onboarding/progress?stepKey=${encodeURIComponent(stepKey)}`
    : `/api/portal/onboarding/progress`

  const res = await fetch(url, {
    method,
    headers: currentlyCompleted ? undefined : { "Content-Type": "application/json" },
    body: currentlyCompleted ? undefined : JSON.stringify({ stepKey }),
  })
  if (!res.ok) throw new Error("Failed to update step")
}

function StepRow({
  step,
  onToggle,
  isPending,
}: {
  step: StepWithCompleted
  onToggle: () => void
  isPending: boolean
}) {
  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-xl border px-4 py-3 transition-all",
        step.completed
          ? "border-primary/20 bg-primary/[0.04]"
          : "border-border bg-background hover:border-border"
      )}
    >
      <button
        onClick={onToggle}
        disabled={isPending}
        className="mt-0.5 shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-full"
        aria-label={step.completed ? `Unmark ${step.title}` : `Mark ${step.title} complete`}
      >
        {step.completed ? (
          <CheckCircle2 className="h-5 w-5 text-primary" />
        ) : (
          <Circle className={cn("h-5 w-5 text-muted-foreground", isPending && "opacity-50")} />
        )}
      </button>

      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "text-sm font-medium",
            step.completed ? "text-muted-foreground line-through" : "text-foreground"
          )}
        >
          {step.title}
        </p>
        {!step.completed && (
          <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">{step.description}</p>
        )}
      </div>

      {!step.completed && (
        <a
          href={step.href}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/80 transition-colors whitespace-nowrap"
          onClick={(e) => e.stopPropagation()}
        >
          {step.ctaLabel} <ExternalLink className="h-3 w-3" />
        </a>
      )}
    </div>
  )
}

export function OnboardingChecklist({ initialCompletedKeys, variant = "full", className }: Props) {
  // Use plain useState — useOptimistic is for Server Actions and resets after transition
  const [completedKeys, setCompletedKeys] = useState<Set<string>>(new Set(initialCompletedKeys))
  const [pendingKey, setPendingKey] = useState<string | null>(null)

  // One key per week defined in lib/onboarding/steps.ts. The old `week34`
  // key was a leftover from the 3-week curriculum — replaced with explicit
  // week3/week4/week5 to match the current 5-phase journey.
  const [expandedWeeks, setExpandedWeeks] = useState<Record<string, boolean>>({
    week1: true,
    week2: true,
    week3: true,
    week4: true,
    week5: true,
  })

  const weeks = groupStepsByWeek(completedKeys)
  const completedCount = completedKeys.size
  const percent = Math.round((completedCount / TOTAL_STEPS) * 100)

  async function handleToggle(step: StepWithCompleted) {
    if (pendingKey === step.key) return
    const nowCompleted = !step.completed

    // Optimistic update — update state immediately
    setCompletedKeys((prev) => {
      const next = new Set(prev)
      if (nowCompleted) next.add(step.key)
      else next.delete(step.key)
      return next
    })
    setPendingKey(step.key)

    try {
      await toggleStep(step.key, step.completed)
    } catch {
      // Revert on error and surface a toast — silent revert was confusing
      // ("the box flickers and I don't know why") per audit feedback.
      setCompletedKeys((prev) => {
        const next = new Set(prev)
        if (nowCompleted) next.delete(step.key)
        else next.add(step.key)
        return next
      })
      toast.error("Couldn't save your progress — try again.")
    } finally {
      setPendingKey(null)
    }
  }

  if (variant === "compact") {
    const nextSteps = ONBOARDING_STEPS.filter((s) => !completedKeys.has(s.key)).slice(0, 3)
    return (
      <div className={cn("space-y-2", className)}>
        {nextSteps.map((step) => (
          <StepRow
            key={step.key}
            step={{ ...step, completed: false }}
            onToggle={() => handleToggle({ ...step, completed: false })}
            isPending={pendingKey === step.key}
          />
        ))}
      </div>
    )
  }

  return (
    <div className={cn("space-y-1", className)}>
      {/* Progress bar */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-foreground">
            {completedCount} of {TOTAL_STEPS} complete
          </span>
          <span className="text-xs text-muted-foreground">{percent}%</span>
        </div>
        <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      {Object.entries(weeks).map(([weekKey, { label, steps: weekSteps }]) => {
        // Hydrate WeekGroup steps with their completion state so the row
        // renderer below can render checkmarks. The lib doesn't ship the
        // `completed` flag because step records are static — we attach it
        // here at render-time from the live completedKeys set.
        const steps: StepWithCompleted[] = weekSteps.map((s) => ({
          ...s,
          completed: completedKeys.has(s.key),
        }))
        const weekComplete = steps.length > 0 && steps.every((s) => s.completed)
        const isExpanded = expandedWeeks[weekKey] ?? true
        if (steps.length === 0) return null
        return (
            <div key={weekKey} className="rounded-xl border border-border overflow-hidden">
              <button
                className="w-full flex items-center justify-between px-4 py-3 bg-muted/30 hover:bg-muted/50 transition-colors"
                onClick={() =>
                  setExpandedWeeks((prev) => ({ ...prev, [weekKey]: !prev[weekKey] }))
                }
              >
                <div className="flex items-center gap-2">
                  {weekComplete ? (
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                  ) : (
                    <Circle className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span className="text-sm font-semibold text-foreground">{label}</span>
                  <span className="text-xs text-muted-foreground">
                    ({steps.filter((s) => s.completed).length}/{steps.length})
                  </span>
                </div>
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                )}
              </button>

              {isExpanded && (
                <div className="p-3 space-y-2">
                  {steps.map((step) => (
                    <StepRow
                      key={step.key}
                      step={step}
                      onToggle={() => handleToggle(step)}
                      isPending={pendingKey === step.key}
                    />
                  ))}
                </div>
              )}
            </div>
          )
      })}
    </div>
  )
}
