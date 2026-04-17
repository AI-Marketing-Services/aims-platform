"use client"

import { useState, useMemo, useDeferredValue } from "react"
import { motion } from "framer-motion"
import { Search, ChevronDown, Calendar, User, AlertTriangle } from "lucide-react"
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
import { cn, getInitials } from "@/lib/utils"

type FulfillmentTask = {
  id: string
  title: string
  description?: string
  status: string
  assignedTo?: string
  priority: string
  dueDate?: string
  completedAt?: string
  clientName: string
  clientEmail: string
  serviceName: string
  serviceSlug: string
  subscriptionId: string
}

const COLUMNS = [
  { key: "todo", label: "Pending Setup", color: "border-muted-foreground" },
  { key: "in_progress", label: "In Progress", color: "border-primary/40" },
  { key: "needs_attention", label: "Needs Attention", color: "border-primary" },
  { key: "in_review", label: "In Review", color: "border-primary/60" },
  { key: "done", label: "Completed", color: "border-emerald-500" },
]

const STATUS_OPTIONS = [
  { value: "todo", label: "Pending Setup" },
  { value: "in_progress", label: "In Progress" },
  { value: "needs_attention", label: "Needs Attention" },
  { value: "in_review", label: "In Review" },
  { value: "done", label: "Completed" },
]

const PRIORITY_COLORS: Record<string, string> = {
  urgent: "bg-primary/15 text-primary border-primary/40",
  high: "bg-primary/10 text-primary border-primary/30",
  medium: "bg-primary/5 text-primary/70 border-primary/20",
  low: "bg-muted/40 text-muted-foreground border-border",
}

function PriorityBadge({ priority }: { priority: string }) {
  return (
    <span
      className={cn(
        "text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded border",
        PRIORITY_COLORS[priority] ?? PRIORITY_COLORS.medium
      )}
    >
      {priority}
    </span>
  )
}

function isOverdue(dueDate?: string): boolean {
  if (!dueDate) return false
  return new Date(dueDate) < new Date()
}

function formatDate(iso?: string): string {
  if (!iso) return "--"
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  })
}


function TaskCardInner({
  task,
  onStatusChange,
  dragOverlay = false,
}: {
  task: FulfillmentTask
  onStatusChange?: (taskId: string, status: string) => void
  dragOverlay?: boolean
}) {
  const overdue = task.status !== "done" && isOverdue(task.dueDate)

  return (
    <>
      {/* Title + assignee */}
      <div className="flex items-start justify-between mb-2">
        <div className="min-w-0 flex-1">
          <div className="text-foreground font-semibold text-sm leading-tight truncate">
            {task.title}
          </div>
          <div className="text-muted-foreground text-xs mt-0.5 truncate">
            {task.clientName}
          </div>
        </div>
        {task.assignedTo && (
          <div
            className="flex-shrink-0 ml-2 w-6 h-6 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center text-[10px] font-bold text-primary"
            title={task.assignedTo}
          >
            {getInitials(task.assignedTo)}
          </div>
        )}
      </div>

      {/* Service + priority */}
      <div className="flex items-center gap-2 mb-2 flex-wrap">
        <span className="text-xs px-1.5 py-0.5 bg-deep text-muted-foreground border border-border rounded">
          {task.serviceName}
        </span>
        <PriorityBadge priority={task.priority} />
      </div>

      {/* Due date + overdue indicator */}
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-1">
          <Calendar className="h-3 w-3 text-muted-foreground" />
          <span
            className={cn(
              "text-xs font-mono",
              overdue ? "text-primary font-semibold" : "text-muted-foreground"
            )}
          >
            {formatDate(task.dueDate)}
          </span>
          {overdue && <AlertTriangle className="h-3 w-3 text-primary" />}
        </div>
        {task.assignedTo && (
          <div className="flex items-center gap-1">
            <User className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground truncate max-w-[80px]">
              {task.assignedTo}
            </span>
          </div>
        )}
      </div>

      {/* Status dropdown — kept alongside drag-and-drop so keyboard users
          (and people dragging tasks between off-screen columns) still have
          an accessible way to move cards. Stops event propagation so the
          select doesn't start a drag. */}
      {!dragOverlay && onStatusChange && (
        <div
          className="relative"
          onPointerDown={(e) => e.stopPropagation()}
        >
          <select
            value={task.status}
            onChange={(e) => onStatusChange(task.id, e.target.value)}
            className="w-full appearance-none pl-2.5 pr-7 py-1.5 bg-deep border border-border rounded-lg text-xs text-foreground focus:outline-none focus:border-border cursor-pointer"
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground pointer-events-none" />
        </div>
      )}
    </>
  )
}

function DraggableTaskCard({
  task,
  onStatusChange,
}: {
  task: FulfillmentTask
  onStatusChange: (taskId: string, status: string) => void
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
    data: { status: task.status },
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
      <TaskCardInner task={task} onStatusChange={onStatusChange} />
    </div>
  )
}

function DroppableColumn({
  col,
  tasks,
  activeId,
  onStatusChange,
}: {
  col: { key: string; label: string; color: string }
  tasks: FulfillmentTask[]
  activeId: string | null
  onStatusChange: (taskId: string, status: string) => void
}) {
  const { isOver, setNodeRef } = useDroppable({ id: col.key })
  const isDragging = activeId !== null

  return (
    <div className="flex flex-col w-60 flex-shrink-0">
      <div className={cn("border-t-2 pt-3 mb-3", col.color)}>
        <div className="flex items-baseline justify-between gap-1">
          <span className="text-sm font-medium text-foreground truncate">
            {col.label}
          </span>
          <span className="text-xs font-mono text-muted-foreground flex-shrink-0">
            ({tasks.length})
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
        {tasks.map((task) => (
          <motion.div
            key={task.id}
            layout
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.15 }}
          >
            <DraggableTaskCard task={task} onStatusChange={onStatusChange} />
          </motion.div>
        ))}
      </div>
    </div>
  )
}

export function FulfillmentPipeline({
  initialTasks,
}: {
  initialTasks: FulfillmentTask[]
}) {
  const [tasks, setTasks] = useState<FulfillmentTask[]>(initialTasks)
  const [activeTask, setActiveTask] = useState<FulfillmentTask | null>(null)
  const [search, setSearch] = useState("")
  const deferredSearch = useDeferredValue(search)
  const [priorityFilter, setPriorityFilter] = useState("all")

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      const q = deferredSearch.toLowerCase()
      if (
        q &&
        !t.title.toLowerCase().includes(q) &&
        !t.clientName.toLowerCase().includes(q) &&
        !t.serviceName.toLowerCase().includes(q)
      )
        return false
      if (priorityFilter !== "all" && t.priority !== priorityFilter) return false
      return true
    })
  }, [tasks, deferredSearch, priorityFilter])

  async function handleStatusChange(taskId: string, newStatus: string) {
    const prevTask = tasks.find((t) => t.id === taskId)
    if (!prevTask || prevTask.status === newStatus) return

    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? {
              ...t,
              status: newStatus,
              completedAt:
                newStatus === "done" ? new Date().toISOString() : t.completedAt,
            }
          : t
      )
    )

    try {
      const res = await fetch("/api/admin/fulfillment", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId, status: newStatus }),
      })
      if (!res.ok) {
        setTasks((prev) => prev.map((t) => (t.id === taskId ? prevTask : t)))
      }
    } catch {
      setTasks((prev) => prev.map((t) => (t.id === taskId ? prevTask : t)))
    }
  }

  function handleDragStart(event: DragStartEvent) {
    const task = tasks.find((t) => t.id === String(event.active.id))
    if (task) setActiveTask(task)
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveTask(null)
    const { active, over } = event
    if (!over) return

    const taskId = String(active.id)
    const newStatus = String(over.id)
    const validStatuses = COLUMNS.map((c) => c.key)
    if (!validStatuses.includes(newStatus)) return

    // Reuse the same optimistic-update + API call as the dropdown
    handleStatusChange(taskId, newStatus)
  }

  return (
    <>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="relative flex-1 min-w-[160px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tasks..."
            className="w-full pl-9 pr-4 py-2 bg-card border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-border"
          />
        </div>

        <div className="relative">
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="appearance-none pl-3 pr-8 py-2 bg-card border border-border rounded-lg text-sm text-foreground focus:outline-none focus:border-border cursor-pointer"
          >
            <option value="all">All Priorities</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
        </div>

        {(search || priorityFilter !== "all") && (
          <span className="text-xs text-muted-foreground font-mono">
            {filteredTasks.length} / {tasks.length} tasks
          </span>
        )}
      </div>

      {/* Empty state */}
      {tasks.length === 0 && (
        <div className="rounded-xl border border-dashed border-border bg-deep py-12 text-center mb-6">
          <p className="text-lg font-semibold text-foreground mb-1">No fulfillment tasks yet</p>
          <p className="text-sm text-muted-foreground">
            Tasks will appear here when clients purchase subscriptions.
          </p>
        </div>
      )}

      {/* Kanban columns — drag-and-drop enabled via @dnd-kit. Dropping a
          card on a different column reuses the same PATCH handler the
          per-card status dropdown uses, so there's one source of truth
          for optimistic updates + rollback. */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex-1 overflow-x-auto">
          <div
            className="flex gap-4 h-full pb-4"
            style={{ minWidth: `${COLUMNS.length * 260}px` }}
          >
            {COLUMNS.map((col) => (
              <DroppableColumn
                key={col.key}
                col={col}
                tasks={filteredTasks.filter((t) => t.status === col.key)}
                activeId={activeTask?.id ?? null}
                onStatusChange={handleStatusChange}
              />
            ))}
          </div>
        </div>

        <DragOverlay dropAnimation={null}>
          {activeTask && (
            <div className="bg-card border border-border rounded-xl p-3.5 w-60 shadow-lg rotate-1">
              <TaskCardInner task={activeTask} dragOverlay />
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </>
  )
}
