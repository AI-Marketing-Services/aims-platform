"use client"

import { useState } from "react"
import { ClientDealCard } from "./ClientDealCard"
import { AddDealDialog } from "./AddDealDialog"
import { cn } from "@/lib/utils"

interface ClientDeal {
  id: string
  companyName: string
  contactName: string | null
  contactEmail: string | null
  value: number
  currency: string
  stage: string
  tags: string[]
  leadScore: number | null
  lastEnrichedAt: string | null
  updatedAt: string
  _count: { activities: number }
}

interface KanbanPipelineProps {
  initialDeals: ClientDeal[]
}

const STAGES = [
  { key: "PROSPECT", label: "Prospect", color: "text-muted-foreground", dot: "bg-muted-foreground/40" },
  { key: "DISCOVERY_CALL", label: "Discovery", color: "text-muted-foreground", dot: "bg-primary/30" },
  { key: "PROPOSAL_SENT", label: "Proposal", color: "text-foreground", dot: "bg-primary/60" },
  { key: "ACTIVE_RETAINER", label: "Active", color: "text-primary", dot: "bg-primary" },
  { key: "COMPLETED", label: "Completed", color: "text-primary", dot: "bg-primary" },
  { key: "LOST", label: "Lost", color: "text-muted-foreground", dot: "bg-muted-foreground/40" },
] as const

type StageKey = (typeof STAGES)[number]["key"]

function totalValue(deals: ClientDeal[]) {
  return deals.reduce((sum, d) => sum + d.value, 0)
}

function formatTotal(v: number) {
  if (v === 0) return null
  if (v >= 1000) return `$${(v / 1000).toFixed(0)}k`
  return `$${v.toLocaleString()}`
}

export function KanbanPipeline({ initialDeals }: KanbanPipelineProps) {
  const [deals, setDeals] = useState(initialDeals)
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [dragOverStage, setDragOverStage] = useState<StageKey | null>(null)

  function handleDelete(id: string) {
    setDeals((prev) => prev.filter((d) => d.id !== id))
  }

  function handleCreated() {
    // router.refresh() is called inside AddDealDialog — just a hook
  }

  async function handleDrop(targetStage: StageKey, e: React.DragEvent) {
    e.preventDefault()
    setDragOverStage(null)
    const dealId = e.dataTransfer.getData("text/plain") || draggingId
    setDraggingId(null)
    if (!dealId) return

    const deal = deals.find((d) => d.id === dealId)
    if (!deal || deal.stage === targetStage) return

    // Optimistic update — flip the card's stage in local state instantly,
    // PATCH the server, revert on failure.
    const previousStage = deal.stage
    setDeals((prev) =>
      prev.map((d) =>
        d.id === dealId ? { ...d, stage: targetStage, updatedAt: new Date().toISOString() } : d,
      ),
    )

    try {
      const res = await fetch(`/api/portal/crm/deals/${dealId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage: targetStage }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
    } catch {
      // Revert on failure
      setDeals((prev) =>
        prev.map((d) => (d.id === dealId ? { ...d, stage: previousStage } : d)),
      )
    }
  }

  return (
    <div className="flex gap-3 overflow-x-auto pb-4 min-h-[calc(100vh-12rem)]">
      {STAGES.map((stage) => {
        const stageDeals = deals
          .filter((d) => d.stage === stage.key)
          .sort((a, b) => {
            // Lead score desc (nulls last), then value desc, then most-recent
            const sa = a.leadScore ?? -1
            const sb = b.leadScore ?? -1
            if (sa !== sb) return sb - sa
            if (a.value !== b.value) return b.value - a.value
            return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
          })
        const total = formatTotal(totalValue(stageDeals))
        const isDropTarget = dragOverStage === stage.key

        return (
          <div
            key={stage.key}
            onDragOver={(e) => {
              if (!draggingId) return
              e.preventDefault()
              e.dataTransfer.dropEffect = "move"
              setDragOverStage(stage.key as StageKey)
            }}
            onDragLeave={(e) => {
              // Only clear when leaving the column entirely (not when
              // moving between children).
              if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                setDragOverStage(null)
              }
            }}
            onDrop={(e) => handleDrop(stage.key as StageKey, e)}
            className={cn(
              "flex flex-col gap-2 min-w-[220px] w-[220px] shrink-0 rounded-lg transition-colors",
              isDropTarget && "bg-primary/5 ring-1 ring-primary/30",
            )}
          >
            {/* Column header */}
            <div className="flex items-center justify-between px-1 py-1">
              <div className="flex items-center gap-2">
                <span className={cn("h-2 w-2 rounded-full shrink-0", stage.dot)} />
                <span className={cn("text-xs font-semibold uppercase tracking-wider", stage.color)}>
                  {stage.label}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                {total && (
                  <span className="text-[10px] text-muted-foreground font-medium">{total}</span>
                )}
                <span className="text-[10px] text-muted-foreground/60 bg-surface/80 px-1.5 py-0.5 rounded">
                  {stageDeals.length}
                </span>
              </div>
            </div>

            {/* Cards */}
            <div className="flex flex-col gap-2 flex-1">
              {stageDeals.map((deal) => (
                <ClientDealCard
                  key={deal.id}
                  deal={deal}
                  onDelete={handleDelete}
                  onDragStart={(id) => setDraggingId(id)}
                  onDragEnd={() => {
                    setDraggingId(null)
                    setDragOverStage(null)
                  }}
                  isDragging={draggingId === deal.id}
                />
              ))}
              {/* Empty drop hint when actively dragging into an empty column */}
              {isDropTarget && stageDeals.length === 0 && (
                <div className="rounded-lg border-2 border-dashed border-primary/30 p-4 text-[11px] text-primary text-center">
                  Drop to move to {stage.label}
                </div>
              )}
            </div>

            {/* Add deal */}
            <div className="mt-1">
              <AddDealDialog defaultStage={stage.key as StageKey} onCreated={handleCreated} />
            </div>
          </div>
        )
      })}
    </div>
  )
}
