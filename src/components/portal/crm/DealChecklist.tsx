"use client"

import { useState, useEffect, useCallback } from "react"
import { CheckCircle2, Circle, ClipboardList } from "lucide-react"
import { cn } from "@/lib/utils"
import type { ChecklistStep, DealChecklistProgress } from "@/lib/onboarding/deal-checklist"

interface DealChecklistProps {
  dealId: string
  stage: string
}

export function DealChecklist({ dealId, stage }: DealChecklistProps) {
  const [checklist, setChecklist] = useState<DealChecklistProgress | null>(null)
  const [loading, setLoading] = useState(true)
  const [togglingKey, setTogglingKey] = useState<string | null>(null)

  const isVisible = stage === "ACTIVE_RETAINER" || stage === "COMPLETED"

  const fetchChecklist = useCallback(async () => {
    if (!isVisible) return
    try {
      const res = await fetch(`/api/portal/deals/${dealId}/checklist`)
      if (!res.ok) throw new Error("Failed to load checklist")
      const data = await res.json()
      setChecklist(data.checklist)
    } catch {
      // Non-critical — checklist simply won't render on error
    } finally {
      setLoading(false)
    }
  }, [dealId, isVisible])

  useEffect(() => {
    void fetchChecklist()
  }, [fetchChecklist])

  const handleToggle = async (step: ChecklistStep) => {
    if (stage === "COMPLETED") return // read-only when deal is completed
    setTogglingKey(step.key)
    const wasCompleted = step.completedAt !== null

    // Optimistic update
    setChecklist((prev) => {
      if (!prev) return prev
      const updatedSteps = prev.steps.map((s) =>
        s.key === step.key ? { ...s, completedAt: wasCompleted ? null : new Date() } : s
      )
      const completedCount = updatedSteps.filter((s) => s.completedAt !== null).length
      return {
        ...prev,
        steps: updatedSteps,
        completedCount,
        percent: Math.round((completedCount / prev.totalCount) * 100),
      }
    })

    try {
      const res = await fetch(`/api/portal/deals/${dealId}/checklist`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stepKey: step.key, completed: !wasCompleted }),
      })
      if (!res.ok) throw new Error("Failed to update checklist")
      const data = await res.json()
      setChecklist(data.checklist)
    } catch {
      // Revert optimistic update on failure
      void fetchChecklist()
    } finally {
      setTogglingKey(null)
    }
  }

  if (!isVisible) return null

  if (loading) {
    return (
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="h-4 w-40 rounded bg-muted animate-pulse mb-4" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-8 rounded bg-muted animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  if (!checklist) return null

  const { steps, completedCount, totalCount, percent } = checklist

  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ClipboardList className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">Onboarding Checklist</span>
        </div>
        <span className="text-xs font-semibold text-muted-foreground">
          {completedCount}/{totalCount}
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full bg-primary transition-all duration-300"
          style={{ width: `${percent}%` }}
        />
      </div>

      {/* Steps */}
      <ul className="space-y-2">
        {steps.map((step) => {
          const isCompleted = step.completedAt !== null
          const isToggling = togglingKey === step.key
          const isReadOnly = stage === "COMPLETED"

          return (
            <li key={step.key}>
              <button
                onClick={() => void handleToggle(step)}
                disabled={isToggling || isReadOnly}
                className={cn(
                  "flex items-center gap-3 w-full text-left rounded-lg px-3 py-2.5 transition-colors",
                  isReadOnly
                    ? "cursor-default"
                    : "hover:bg-muted/60 cursor-pointer",
                  isToggling && "opacity-60"
                )}
              >
                {isCompleted ? (
                  <CheckCircle2 className="h-4.5 w-4.5 text-primary shrink-0" />
                ) : (
                  <Circle className="h-4.5 w-4.5 text-muted-foreground/40 shrink-0" />
                )}
                <span
                  className={cn(
                    "text-sm",
                    isCompleted ? "text-muted-foreground line-through" : "text-foreground"
                  )}
                >
                  {step.label}
                </span>
                {step.completedAt && (
                  <span className="ml-auto text-[10px] text-muted-foreground shrink-0">
                    {new Date(step.completedAt).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                )}
              </button>
            </li>
          )
        })}
      </ul>

      {percent === 100 && (
        <p className="text-xs font-semibold text-primary text-center pt-1">
          Onboarding complete
        </p>
      )}
    </div>
  )
}
