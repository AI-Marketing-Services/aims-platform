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
  updatedAt: string
  _count: { activities: number }
}

interface KanbanPipelineProps {
  initialDeals: ClientDeal[]
}

const STAGES = [
  { key: "PROSPECT", label: "Prospect", color: "text-blue-400", dot: "bg-blue-400" },
  { key: "DISCOVERY_CALL", label: "Discovery", color: "text-violet-400", dot: "bg-violet-400" },
  { key: "PROPOSAL_SENT", label: "Proposal", color: "text-amber-400", dot: "bg-amber-400" },
  { key: "ACTIVE_RETAINER", label: "Active", color: "text-emerald-400", dot: "bg-emerald-400" },
  { key: "COMPLETED", label: "Completed", color: "text-primary", dot: "bg-primary" },
  { key: "LOST", label: "Lost", color: "text-red-400", dot: "bg-red-400" },
] as const

type StageKey = typeof STAGES[number]["key"]

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

  function handleDelete(id: string) {
    setDeals((prev) => prev.filter((d) => d.id !== id))
  }

  function handleCreated() {
    // router.refresh() is called inside AddDealDialog — just a hook
  }

  return (
    <div className="flex gap-3 overflow-x-auto pb-4 min-h-[calc(100vh-12rem)]">
      {STAGES.map((stage) => {
        const stageDeals = deals.filter((d) => d.stage === stage.key)
        const total = formatTotal(totalValue(stageDeals))

        return (
          <div
            key={stage.key}
            className="flex flex-col gap-2 min-w-[220px] w-[220px] shrink-0"
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
                <ClientDealCard key={deal.id} deal={deal} onDelete={handleDelete} />
              ))}
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
