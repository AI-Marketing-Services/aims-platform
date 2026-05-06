"use client"

import { useOptimistic, useTransition } from "react"
import { toast } from "sonner"
import { CheckCircle2, Circle, RotateCcw } from "lucide-react"
import { ONBOARDING_STEPS, groupStepsByWeek } from "@/lib/onboarding/steps"
import { timeAgo } from "@/lib/utils"

interface Props {
  dealId: string
  userId: string | null
  completedKeys: string[]
  completedCount: number
  percent: number
  lastCompletedAt: string | null
  profile: {
    businessName: string | null
    logoUrl: string | null
    oneLiner: string | null
    niche: string | null
    idealClient: string | null
    businessUrl: string | null
  } | null
}

type OptimisticAction =
  | { type: "complete"; stepKey: string }
  | { type: "reset"; stepKey: string }

function applyOptimistic(keys: Set<string>, action: OptimisticAction): Set<string> {
  if (action.type === "complete") {
    return new Set([...keys, action.stepKey])
  }
  const next = new Set(keys)
  next.delete(action.stepKey)
  return next
}

export function MemberOnboardingPanel({
  dealId: _dealId,
  userId,
  completedKeys: initialCompletedKeys,
  completedCount: initialCount,
  percent: initialPercent,
  lastCompletedAt,
  profile,
}: Props) {
  const [isPending, startTransition] = useTransition()

  const [optimisticKeys, dispatchOptimistic] = useOptimistic(
    new Set(initialCompletedKeys),
    applyOptimistic
  )

  const optimisticCount = optimisticKeys.size
  const optimisticPercent = Math.round((optimisticCount / ONBOARDING_STEPS.length) * 100)

  async function toggleStep(stepKey: string) {
    if (!userId) return
    const isCompleted = optimisticKeys.has(stepKey)
    const action = isCompleted ? "reset" : "complete"

    startTransition(async () => {
      dispatchOptimistic({ type: action, stepKey })

      try {
        const res = await fetch(`/api/admin/onboarding/${userId}/progress`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ stepKey, action }),
        })
        if (!res.ok) {
          // Revert by dispatching the inverse
          dispatchOptimistic({ type: isCompleted ? "complete" : "reset", stepKey })
          toast.error("Failed to update step")
        }
      } catch {
        dispatchOptimistic({ type: isCompleted ? "complete" : "reset", stepKey })
        toast.error("Failed to update step")
      }
    })
  }

  if (!userId) {
    return (
      <div className="bg-card border border-border rounded-2xl p-5">
        <h2 className="text-sm font-semibold text-foreground mb-2">Member Onboarding</h2>
        <p className="text-sm text-muted-foreground">
          Member hasn&apos;t linked their AIMS account yet. Once they sign into the portal, their
          progress will appear here.
        </p>
      </div>
    )
  }

  const weeks = groupStepsByWeek(optimisticKeys)

  return (
    <div className="bg-card border border-border rounded-2xl p-5 space-y-5">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold text-foreground">Member Onboarding</h2>
          <span className="text-xs text-muted-foreground font-mono">
            {optimisticCount}/{ONBOARDING_STEPS.length} &bull; {optimisticPercent}%
          </span>
        </div>

        {/* Progress bar */}
        <div className="w-full h-1.5 bg-border rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${optimisticPercent}%` }}
          />
        </div>

        {lastCompletedAt && (
          <p className="text-xs text-muted-foreground mt-1.5">
            Last active {timeAgo(lastCompletedAt)}
          </p>
        )}
      </div>

      {/* Profile block */}
      {profile && (profile.businessName || profile.niche || profile.oneLiner) && (
        <div className="rounded-xl bg-deep border border-border px-4 py-3 space-y-1">
          {profile.businessName && (
            <p className="text-sm font-semibold text-foreground">{profile.businessName}</p>
          )}
          {profile.niche && (
            <p className="text-xs text-muted-foreground">{profile.niche}</p>
          )}
          {profile.oneLiner && (
            <p className="text-xs text-foreground/70 italic">{profile.oneLiner}</p>
          )}
        </div>
      )}

      {/* Steps grouped by week */}
      <div className="space-y-4">
        {(["week1", "week2", "week3", "week4", "week5"] as const).map((weekKey) => {
          const week = weeks[weekKey]
          return (
            <div key={weekKey}>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                {week.label}
              </p>
              <div className="space-y-1.5">
                {week.steps.map((step) => {
                  const isCompleted = optimisticKeys.has(step.key)
                  return (
                    <button
                      key={step.key}
                      onClick={() => toggleStep(step.key)}
                      disabled={isPending}
                      className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-deep disabled:opacity-60 group"
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                      ) : (
                        <Circle className="w-4 h-4 text-muted-foreground flex-shrink-0 group-hover:text-foreground transition-colors" />
                      )}
                      <span
                        className={
                          isCompleted
                            ? "text-sm text-muted-foreground line-through"
                            : "text-sm text-foreground"
                        }
                      >
                        {step.title}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {/* Footer */}
      <div className="pt-3 border-t border-border">
        <button
          disabled
          title="Coming soon"
          className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-not-allowed opacity-50"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset all progress
        </button>
      </div>
    </div>
  )
}
