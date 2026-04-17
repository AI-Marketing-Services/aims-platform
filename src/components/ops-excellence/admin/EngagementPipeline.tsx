"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { Search, Users, Activity, BarChart3, Eye } from "lucide-react"
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
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { ENGAGEMENT_STAGES, CONFIDENCE_TIERS } from "@/lib/ops-excellence/config"
import type {
  EngagementListItem,
  EngagementStage,
  ConfidenceTier,
} from "@/lib/ops-excellence/types"

interface Props {
  engagements: EngagementListItem[]
}

// Kanban columns — in the same left-to-right order as the original tab bar,
// plus Paused and Completed at the end so those rows are still reachable.
const COLUMNS: { key: EngagementStage; label: string }[] = [
  { key: "INTAKE", label: "Intake" },
  { key: "ONBOARDING", label: "Onboarding" },
  { key: "PHASE_1_INSTRUMENT", label: "Phase 1 · Instrument" },
  { key: "PHASE_2_EXECUTE", label: "Phase 2 · Execute" },
  { key: "PHASE_3_PROVE", label: "Phase 3 · Prove" },
  { key: "ACTIVE_ONGOING", label: "Active Ongoing" },
  { key: "PAUSED", label: "Paused" },
  { key: "COMPLETED", label: "Completed" },
]

function ConfidenceDot({ tier }: { tier: ConfidenceTier | null }) {
  if (!tier) return <span className="w-2.5 h-2.5 rounded-full bg-muted-foreground/30 inline-block" />
  const config = CONFIDENCE_TIERS[tier as keyof typeof CONFIDENCE_TIERS]
  const colorMap: Record<string, string> = {
    GREEN: "bg-emerald-400",
    YELLOW: "bg-yellow-400",
    RED: "bg-red-400",
  }
  return (
    <span
      className={cn("w-2.5 h-2.5 rounded-full inline-block", colorMap[tier] ?? "bg-muted-foreground/30")}
      title={config?.label ?? tier}
    />
  )
}

function TierBadge({ tier }: { tier: string }) {
  return (
    <span className="text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded-sm border border-[#E3E3E3] bg-[#FAFAF7] text-[#737373]">
      {tier.charAt(0) + tier.slice(1).toLowerCase()}
    </span>
  )
}

function EngagementCardInner({ engagement }: { engagement: EngagementListItem }) {
  return (
    <>
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-foreground text-sm leading-tight truncate">
            {engagement.companyName}
          </p>
          {engagement.userName && (
            <p className="text-xs text-muted-foreground mt-0.5 truncate">
              {engagement.userName}
            </p>
          )}
        </div>
        <ConfidenceDot tier={engagement.confidenceTier} />
      </div>

      {/* Score bar */}
      {engagement.latestScore !== null && (
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-mono text-foreground w-6 text-right">
            {engagement.latestScore}
          </span>
          <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-[#981B1B] transition-all"
              style={{ width: `${Math.min(100, Math.max(0, engagement.latestScore))}%` }}
            />
          </div>
        </div>
      )}

      <div className="flex items-center justify-between gap-2">
        <TierBadge tier={engagement.tier} />
        <span className="text-[11px] font-mono text-muted-foreground">
          {engagement.daysSinceStart}d
        </span>
      </div>
    </>
  )
}

function DraggableEngagementCard({ engagement }: { engagement: EngagementListItem }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: engagement.id,
    data: { stage: engagement.stage },
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
      className="bg-card border border-border rounded-xl p-3.5 hover:border-border hover:shadow-sm transition-all touch-none"
    >
      <EngagementCardInner engagement={engagement} />

      {/* View link — click propagation stopped so the card doesn't start a
          drag when the user just wants to open the detail page. */}
      <div
        className="mt-3 pt-2 border-t border-border flex items-center justify-between"
        onPointerDown={(e) => e.stopPropagation()}
      >
        <Link
          href={`/admin/ops-excellence/${engagement.id}`}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-[#981B1B] hover:text-[#791515] transition-colors"
        >
          <Eye className="h-3.5 w-3.5" />
          View
        </Link>
        <span className="text-[11px] text-muted-foreground truncate max-w-[100px]" title={engagement.userEmail}>
          {engagement.userEmail}
        </span>
      </div>
    </div>
  )
}

function DroppableColumn({
  col,
  engagements,
  activeId,
}: {
  col: { key: EngagementStage; label: string }
  engagements: EngagementListItem[]
  activeId: string | null
}) {
  const stageConfig = ENGAGEMENT_STAGES[col.key as keyof typeof ENGAGEMENT_STAGES]
  const { isOver, setNodeRef } = useDroppable({ id: col.key })
  const isDragging = activeId !== null

  return (
    <div className="flex flex-col w-64 flex-shrink-0">
      <div className={cn("border-t-2 pt-3 mb-3", stageConfig?.color ? "" : "border-muted-foreground")}>
        <div className="flex items-baseline justify-between gap-1">
          <span className="text-sm font-medium text-foreground truncate">
            {col.label}
          </span>
          <span className="text-xs font-mono text-muted-foreground flex-shrink-0">
            ({engagements.length})
          </span>
        </div>
      </div>

      <div
        ref={setNodeRef}
        className={cn(
          "flex-1 space-y-2 overflow-y-auto pr-1 rounded-xl min-h-24 transition-all",
          isDragging && isOver
            ? "bg-primary/10 ring-1 ring-inset ring-primary/30 border border-dashed border-primary/30"
            : ""
        )}
      >
        {engagements.map((e) => (
          <motion.div
            key={e.id}
            layout
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.15 }}
          >
            <DraggableEngagementCard engagement={e} />
          </motion.div>
        ))}
      </div>
    </div>
  )
}

export function EngagementPipeline({ engagements: initial }: Props) {
  const [engagements, setEngagements] = useState<EngagementListItem[]>(initial)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [search, setSearch] = useState("")

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return engagements
    return engagements.filter(
      (e) =>
        e.companyName.toLowerCase().includes(q) ||
        e.userName?.toLowerCase().includes(q) ||
        e.userEmail?.toLowerCase().includes(q)
    )
  }, [engagements, search])

  const stats = useMemo(() => {
    const total = engagements.length
    const active = engagements.filter(
      (e) => !["PAUSED", "COMPLETED"].includes(e.stage)
    ).length
    const scores = engagements
      .map((e) => e.latestScore)
      .filter((s): s is number => s !== null)
    const avgScore =
      scores.length > 0
        ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
        : 0
    return { total, active, avgScore }
  }, [engagements])

  const activeEngagement = useMemo(
    () => engagements.find((e) => e.id === activeId) ?? null,
    [engagements, activeId]
  )

  function handleDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id))
  }

  async function handleDragEnd(event: DragEndEvent) {
    setActiveId(null)
    const { active, over } = event
    if (!over) return

    const id = String(active.id)
    const newStage = String(over.id) as EngagementStage
    const validStages = COLUMNS.map((c) => c.key)
    if (!validStages.includes(newStage)) return

    const prev = engagements.find((e) => e.id === id)
    if (!prev || prev.stage === newStage) return

    // Optimistic update
    setEngagements((rows) =>
      rows.map((e) => (e.id === id ? { ...e, stage: newStage } : e))
    )

    try {
      const res = await fetch(`/api/ops-excellence/engagement/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage: newStage }),
      })
      if (!res.ok) {
        // Rollback
        setEngagements((rows) =>
          rows.map((e) => (e.id === id ? prev : e))
        )
        toast.error("Failed to move engagement — reverted")
        return
      }
      toast.success(`Moved to ${COLUMNS.find((c) => c.key === newStage)?.label ?? newStage}`)
    } catch {
      setEngagements((rows) => rows.map((e) => (e.id === id ? prev : e)))
      toast.error("Network error — reverted")
    }
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatTile icon={<Users className="h-4 w-4" />} label="Total Engagements" value={stats.total} />
        <StatTile icon={<Activity className="h-4 w-4" />} label="Active" value={stats.active} />
        <StatTile
          icon={<BarChart3 className="h-4 w-4" />}
          label="Average Score"
          value={stats.avgScore || "--"}
        />
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search by company, contact, or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-border bg-card pl-10 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#981B1B]/50"
        />
      </div>

      {engagements.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl p-12 text-center">
          <Users className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">
            No engagements yet. They will appear here once a CEO completes the intake form.
          </p>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="overflow-x-auto">
            <div
              className="flex gap-4 pb-4"
              style={{ minWidth: `${COLUMNS.length * 272}px` }}
            >
              {COLUMNS.map((col) => (
                <DroppableColumn
                  key={col.key}
                  col={col}
                  engagements={filtered.filter((e) => e.stage === col.key)}
                  activeId={activeId}
                />
              ))}
            </div>
          </div>

          <DragOverlay dropAnimation={null}>
            {activeEngagement && (
              <div className="bg-card border border-border rounded-xl p-3.5 w-64 shadow-lg rotate-1">
                <EngagementCardInner engagement={activeEngagement} />
              </div>
            )}
          </DragOverlay>
        </DndContext>
      )}
    </div>
  )
}

function StatTile({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: number | string
}) {
  return (
    <div className="bg-card border border-border rounded-2xl p-4">
      <div className="flex items-center gap-2 text-muted-foreground mb-1">
        {icon}
        <span className="text-xs uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-2xl font-bold text-foreground">{value}</p>
    </div>
  )
}
