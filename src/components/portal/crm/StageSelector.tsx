"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { X } from "lucide-react"

const STAGES = [
  { key: "PROSPECT", label: "Prospect", color: "bg-blue-400/20 text-blue-400 border-blue-400/30" },
  { key: "DISCOVERY_CALL", label: "Discovery", color: "bg-violet-400/20 text-violet-400 border-violet-400/30" },
  { key: "PROPOSAL_SENT", label: "Proposal", color: "bg-amber-400/20 text-amber-400 border-amber-400/30" },
  { key: "ACTIVE_RETAINER", label: "Active", color: "bg-emerald-400/20 text-emerald-400 border-emerald-400/30" },
  { key: "COMPLETED", label: "Completed", color: "bg-primary/20 text-primary border-primary/30" },
  { key: "LOST", label: "Lost", color: "bg-red-400/20 text-red-400 border-red-400/30" },
] as const

const LOST_REASONS = [
  "Price too high",
  "Went with a competitor",
  "No budget right now",
  "Not the right fit",
  "No decision made",
  "Unresponsive",
  "Other",
]

interface StageSelectorProps {
  dealId: string
  currentStage: string
}

export function StageSelector({ dealId, currentStage }: StageSelectorProps) {
  const router = useRouter()
  const [stage, setStage] = useState(currentStage)
  const [isPending, startTransition] = useTransition()
  const [showLostModal, setShowLostModal] = useState(false)
  const [lostReason, setLostReason] = useState("")
  const [lostNote, setLostNote] = useState("")

  function commitStageChange(newStage: string, extra?: { lostReason?: string }) {
    setStage(newStage)
    setShowLostModal(false)
    startTransition(async () => {
      await fetch(`/api/portal/crm/deals/${dealId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage: newStage, ...extra }),
      })
      router.refresh()
    })
  }

  function handleStageChange(newStage: string) {
    if (newStage === stage) return
    if (newStage === "LOST") {
      setShowLostModal(true)
      return
    }
    commitStageChange(newStage)
  }

  return (
    <>
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

      {/* Lost reason modal */}
      {showLostModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-foreground">Mark as Lost</h3>
              <button onClick={() => setShowLostModal(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="text-xs text-muted-foreground mb-4">Why did this deal not close? (optional — helps improve your win rate)</p>

            <div className="flex flex-wrap gap-1.5 mb-4">
              {LOST_REASONS.map((r) => (
                <button
                  key={r}
                  onClick={() => setLostReason(r)}
                  className={cn(
                    "px-2.5 py-1 rounded-full text-xs border transition-all",
                    lostReason === r
                      ? "bg-red-400/20 text-red-400 border-red-400/30"
                      : "text-muted-foreground border-border/50 hover:border-border"
                  )}
                >
                  {r}
                </button>
              ))}
            </div>

            {lostReason === "Other" && (
              <textarea
                value={lostNote}
                onChange={(e) => setLostNote(e.target.value)}
                placeholder="Describe what happened…"
                rows={2}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/50 resize-none mb-4"
              />
            )}

            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setShowLostModal(false)}
                className="px-3 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground border border-border hover:bg-surface transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => commitStageChange("LOST", { lostReason: lostReason === "Other" ? lostNote || "Other" : lostReason || undefined })}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-500/80 text-white hover:bg-red-500 transition-all"
              >
                Mark as Lost
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
