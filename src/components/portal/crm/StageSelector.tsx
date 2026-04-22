"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

const STAGES = [
  { key: "PROSPECT", label: "Prospect", color: "bg-blue-400/20 text-blue-400 border-blue-400/30" },
  { key: "DISCOVERY_CALL", label: "Discovery", color: "bg-violet-400/20 text-violet-400 border-violet-400/30" },
  { key: "PROPOSAL_SENT", label: "Proposal", color: "bg-amber-400/20 text-amber-400 border-amber-400/30" },
  { key: "ACTIVE_RETAINER", label: "Active", color: "bg-emerald-400/20 text-emerald-400 border-emerald-400/30" },
  { key: "COMPLETED", label: "Completed", color: "bg-primary/20 text-primary border-primary/30" },
  { key: "LOST", label: "Lost", color: "bg-red-400/20 text-red-400 border-red-400/30" },
] as const

interface StageSelectorProps {
  dealId: string
  currentStage: string
}

export function StageSelector({ dealId, currentStage }: StageSelectorProps) {
  const router = useRouter()
  const [stage, setStage] = useState(currentStage)
  const [isPending, startTransition] = useTransition()

  function handleStageChange(newStage: string) {
    if (newStage === stage) return
    setStage(newStage)
    startTransition(async () => {
      await fetch(`/api/portal/crm/deals/${dealId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage: newStage }),
      })
      router.refresh()
    })
  }

  const current = STAGES.find((s) => s.key === stage)

  return (
    <div className="flex flex-wrap gap-1.5">
      {STAGES.map((s) => (
        <button
          key={s.key}
          onClick={() => handleStageChange(s.key)}
          disabled={isPending}
          className={cn(
            "px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-all duration-150",
            s.key === stage
              ? s.color
              : "bg-surface/40 text-muted-foreground/60 border-border/40 hover:text-muted-foreground hover:border-border"
          )}
        >
          {s.label}
        </button>
      ))}
    </div>
  )
}
