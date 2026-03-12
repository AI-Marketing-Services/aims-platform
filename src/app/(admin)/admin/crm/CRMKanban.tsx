"use client"

import { useState, useMemo } from "react"
import { motion } from "framer-motion"
import { Plus, Search, ChevronDown } from "lucide-react"
import Link from "next/link"
import { AddDealModal } from "./AddDealModal"
import {
  DndContext,
  DragOverlay,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core"
import { CSS } from "@dnd-kit/utilities"
import { cn } from "@/lib/utils"

type DealStage =
  | "NEW_LEAD"
  | "QUALIFIED"
  | "DEMO_BOOKED"
  | "PROPOSAL_SENT"
  | "NEGOTIATION"
  | "ACTIVE_CLIENT"
  | "CHURNED"
  | "LOST"

type Deal = {
  id: string
  contactName: string
  company?: string
  stage: DealStage
  value: number
  mrr: number
  source?: string
  channelTag?: string
  serviceArms: string[]
  daysInStage: number
  leadScore?: number
  assignedTo?: string
  updatedAt?: string
}

const KANBAN_STAGES: { key: DealStage; label: string; color: string }[] = [
  { key: "NEW_LEAD", label: "New Lead", color: "border-gray-500" },
  { key: "QUALIFIED", label: "Qualified", color: "border-blue-500" },
  { key: "DEMO_BOOKED", label: "Demo Booked", color: "border-purple-500" },
  { key: "PROPOSAL_SENT", label: "Proposal Sent", color: "border-yellow-500" },
  { key: "NEGOTIATION", label: "Negotiation", color: "border-orange-500" },
  { key: "ACTIVE_CLIENT", label: "Active Client", color: "border-green-500" },
]

const CLOSED_STAGES: { key: DealStage; label: string; color: string }[] = [
  { key: "CHURNED", label: "Churned", color: "border-gray-600" },
  { key: "LOST", label: "Lost", color: "border-red-900" },
]

const SOURCE_OPTIONS = [
  { value: "all", label: "All Sources" },
  { value: "Quiz", label: "Quiz" },
  { value: "Calculator", label: "Calculator" },
  { value: "Audit", label: "Audit" },
  { value: "Chatbot", label: "Chatbot" },
  { value: "Referral", label: "Referral" },
  { value: "Direct", label: "Direct" },
  { value: "Intake", label: "Intake" },
]

const SCORE_OPTIONS = [
  { value: "all", label: "All Scores" },
  { value: "hot", label: "Hot (70+)" },
  { value: "warm", label: "Warm (40–69)" },
  { value: "cold", label: "Cold (<40)" },
]

function getInitials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0] ?? "")
    .join("")
    .toUpperCase()
}

function timeInStage(updatedAt: string | undefined, daysInStage: number): { label: string; stale: boolean } {
  if (updatedAt) {
    const days = Math.max(0, Math.floor((Date.now() - new Date(updatedAt).getTime()) / 86_400_000))
    return { label: `${days}d`, stale: days > 7 }
  }
  return { label: `${daysInStage}d`, stale: daysInStage > 7 }
}

function LeadScoreDot({ score }: { score?: number }) {
  if (score == null) return null
  if (score >= 70) {
    return (
      <span className="flex items-center gap-1">
        <span className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />
        <span className="text-xs text-red-400 font-mono">Hot</span>
      </span>
    )
  }
  if (score >= 40) {
    return (
      <span className="flex items-center gap-1">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0" />
        <span className="text-xs text-amber-400 font-mono">Warm</span>
      </span>
    )
  }
  return null
}

function DealCardInner({ deal, isDraggingOverlay = false }: { deal: Deal; isDraggingOverlay?: boolean }) {
  const { label: timeLabel, stale } = timeInStage(deal.updatedAt, deal.daysInStage)

  return (
    <>
      <div className="flex items-start justify-between mb-2">
        {isDraggingOverlay ? (
          <div>
            <div className="text-foreground font-semibold text-sm">{deal.contactName}</div>
            {deal.company && <div className="text-muted-foreground text-xs">{deal.company}</div>}
          </div>
        ) : (
          <Link
            href={`/admin/crm/${deal.id}`}
            className="hover:underline min-w-0"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-foreground font-semibold text-sm leading-tight">{deal.contactName}</div>
            {deal.company && <div className="text-muted-foreground text-xs mt-0.5">{deal.company}</div>}
          </Link>
        )}
        {deal.assignedTo && (
          <div
            className="flex-shrink-0 ml-2 w-6 h-6 rounded-full bg-[#DC2626]/20 border border-[#DC2626]/30 flex items-center justify-center text-[10px] font-bold text-[#DC2626]"
            title={deal.assignedTo}
          >
            {getInitials(deal.assignedTo)}
          </div>
        )}
      </div>

      {/* Value badge */}
      <div className="flex items-center gap-2 mb-2 flex-wrap">
        <span className="text-xs font-mono text-foreground bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200">
          ${deal.mrr.toLocaleString()}/mo
        </span>
        {deal.channelTag && (
          <span className="text-xs px-1.5 py-0.5 bg-blue-50 text-blue-600 border border-blue-200 rounded">
            {deal.channelTag}
          </span>
        )}
      </div>

      {/* Score + time row */}
      <div className="flex items-center justify-between gap-2">
        <LeadScoreDot score={deal.leadScore} />
        <span className={cn("text-xs font-mono ml-auto", stale ? "text-red-400" : "text-gray-500")}>
          {timeLabel}
        </span>
      </div>

      {deal.serviceArms.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {deal.serviceArms.slice(0, 2).map((arm) => (
            <span key={arm} className="text-xs px-1.5 py-0.5 bg-muted text-gray-400 rounded">
              {arm}
            </span>
          ))}
          {deal.serviceArms.length > 2 && (
            <span className="text-xs px-1.5 py-0.5 bg-muted text-gray-400 rounded">
              +{deal.serviceArms.length - 2}
            </span>
          )}
        </div>
      )}
    </>
  )
}

function DraggableDealCard({ deal }: { deal: Deal }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: deal.id,
    data: { stage: deal.stage },
  })

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.3 : 1,
    cursor: isDragging ? "grabbing" : "grab",
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="bg-white border border-gray-200 rounded-xl p-3.5 hover:border-gray-400 hover:shadow-sm transition-all touch-none"
    >
      <DealCardInner deal={deal} />
    </div>
  )
}

function DroppableColumn({
  stage,
  deals,
  onAddDeal,
  activeId,
}: {
  stage: { key: DealStage; label: string; color: string }
  deals: Deal[]
  onAddDeal: (stage: DealStage) => void
  activeId: string | null
}) {
  const stageMRR = deals.reduce((sum, d) => sum + d.mrr, 0)
  const { isOver, setNodeRef } = useDroppable({ id: stage.key })
  const isDragging = activeId !== null

  return (
    <div className="flex flex-col w-60 flex-shrink-0">
      {/* Column header */}
      <div className={cn("border-t-2 pt-3 mb-3", stage.color)}>
        <div className="flex items-baseline justify-between gap-1">
          <span className="text-sm font-medium text-foreground truncate">{stage.label}</span>
          <span className="text-xs font-mono text-gray-500 flex-shrink-0">({deals.length})</span>
        </div>
        {stageMRR > 0 && (
          <div className="text-xs font-mono text-gray-500 mt-0.5">${stageMRR.toLocaleString()}/mo</div>
        )}
      </div>

      <div
        ref={setNodeRef}
        className={cn(
          "flex-1 space-y-2 overflow-y-auto pr-1 rounded-xl min-h-24 transition-all",
          isDragging && isOver
            ? "bg-red-50 ring-1 ring-inset ring-red-200 border border-dashed border-red-300"
            : isDragging
            ? "bg-white/2 ring-1 ring-inset ring-white/5"
            : ""
        )}
      >
        {deals.map((deal) => (
          <motion.div
            key={deal.id}
            layout
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.15 }}
          >
            <DraggableDealCard deal={deal} />
          </motion.div>
        ))}
        <button
          onClick={() => onAddDeal(stage.key)}
          className="w-full flex items-center gap-2 py-2.5 px-3 text-gray-600 hover:text-gray-400 text-sm transition-colors rounded-xl hover:bg-white/3 border border-dashed border-white/5 hover:border-border"
        >
          <Plus className="w-3.5 h-3.5" />
          Add deal
        </button>
      </div>
    </div>
  )
}

export function CRMKanban({ initialDeals }: { initialDeals: Deal[] }) {
  const [deals, setDeals] = useState<Deal[]>(initialDeals)
  const [activeDeal, setActiveDeal] = useState<Deal | null>(null)
  const [addingToStage, setAddingToStage] = useState<DealStage | null>(null)
  const [search, setSearch] = useState("")
  const [sourceFilter, setSourceFilter] = useState<string>("all")
  const [scoreFilter, setScoreFilter] = useState<string>("all")
  const [showClosed, setShowClosed] = useState(false)

  const filteredDeals = useMemo(() => {
    return deals.filter((d) => {
      const q = search.toLowerCase()
      if (
        q &&
        !d.contactName.toLowerCase().includes(q) &&
        !d.company?.toLowerCase().includes(q)
      )
        return false
      if (sourceFilter !== "all") {
        const src = (d.source ?? d.channelTag ?? "").toLowerCase()
        if (!src.includes(sourceFilter.toLowerCase())) return false
      }
      if (scoreFilter !== "all") {
        const score = d.leadScore ?? 0
        if (scoreFilter === "hot" && score < 70) return false
        if (scoreFilter === "warm" && (score < 40 || score >= 70)) return false
        if (scoreFilter === "cold" && score >= 40) return false
      }
      return true
    })
  }, [deals, search, sourceFilter, scoreFilter])

  const visibleStages = useMemo(() => {
    return showClosed ? [...KANBAN_STAGES, ...CLOSED_STAGES] : KANBAN_STAGES
  }, [showClosed])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  function handleDragStart(event: DragStartEvent) {
    const deal = deals.find((d) => d.id === String(event.active.id))
    if (deal) setActiveDeal(deal)
  }

  async function handleDragEnd(event: DragEndEvent) {
    setActiveDeal(null)
    const { active, over } = event
    if (!over) return

    const dealId = String(active.id)
    const newStage = String(over.id) as DealStage
    const allStageKeys = [...KANBAN_STAGES, ...CLOSED_STAGES].map((s) => s.key)

    if (!allStageKeys.includes(newStage)) return

    // Optimistic update
    const prevStage = deals.find((d) => d.id === dealId)?.stage
    setDeals((prev) =>
      prev.map((d) => (d.id === dealId ? { ...d, stage: newStage } : d))
    )

    try {
      const res = await fetch(`/api/deals/${dealId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage: newStage }),
      })
      if (!res.ok && prevStage) {
        // Rollback on failure
        setDeals((prev) =>
          prev.map((d) => (d.id === dealId ? { ...d, stage: prevStage } : d))
        )
      }
    } catch {
      // Rollback on network error
      if (prevStage) {
        setDeals((prev) =>
          prev.map((d) => (d.id === dealId ? { ...d, stage: prevStage } : d))
        )
      }
    }
  }

  return (
    <>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        {/* Search */}
        <div className="relative flex-1 min-w-[160px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search deals..."
            className="w-full pl-9 pr-4 py-2 bg-card border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-border"
          />
        </div>

        {/* Source filter */}
        <div className="relative">
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="appearance-none pl-3 pr-8 py-2 bg-card border border-border rounded-lg text-sm text-gray-300 focus:outline-none focus:border-border cursor-pointer"
          >
            {SOURCE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500 pointer-events-none" />
        </div>

        {/* Score filter */}
        <div className="relative">
          <select
            value={scoreFilter}
            onChange={(e) => setScoreFilter(e.target.value)}
            className="appearance-none pl-3 pr-8 py-2 bg-card border border-border rounded-lg text-sm text-gray-300 focus:outline-none focus:border-border cursor-pointer"
          >
            {SCORE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500 pointer-events-none" />
        </div>

        {/* Show Closed toggle */}
        <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-400 hover:text-gray-300 select-none">
          <input
            type="checkbox"
            checked={showClosed}
            onChange={(e) => setShowClosed(e.target.checked)}
            className="w-3.5 h-3.5 accent-[#DC2626] cursor-pointer"
          />
          Show Closed
        </label>

        {/* Result count */}
        {(search || sourceFilter !== "all" || scoreFilter !== "all") && (
          <span className="text-xs text-gray-500 font-mono">
            {filteredDeals.length} / {deals.length} deals
          </span>
        )}

        {/* Add Deal button */}
        <button
          onClick={() => setAddingToStage("NEW_LEAD")}
          className="ml-auto flex items-center gap-2 px-4 py-2 bg-[#DC2626] hover:bg-[#B91C1C] text-white text-sm font-medium rounded-lg transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Deal
        </button>
      </div>

      {addingToStage && (
        <AddDealModal
          stage={addingToStage as "NEW_LEAD" | "QUALIFIED" | "DEMO_BOOKED" | "PROPOSAL_SENT" | "NEGOTIATION" | "ACTIVE_CLIENT"}
          onClose={() => setAddingToStage(null)}
          onCreated={(deal) => setDeals((prev) => [deal as Deal, ...prev])}
        />
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex-1 overflow-x-auto">
          <div
            className="flex gap-4 h-full pb-4"
            style={{ minWidth: `${visibleStages.length * 260}px` }}
          >
            {visibleStages.map((stage) => (
              <DroppableColumn
                key={stage.key}
                stage={stage}
                deals={filteredDeals.filter((d) => d.stage === stage.key)}
                onAddDeal={setAddingToStage}
                activeId={activeDeal?.id ?? null}
              />
            ))}
          </div>
        </div>

        <DragOverlay dropAnimation={null}>
          {activeDeal && (
            <div className="bg-white border border-gray-300 rounded-xl p-3.5 w-60 shadow-lg rotate-1">
              <DealCardInner deal={activeDeal} isDraggingOverlay />
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </>
  )
}
