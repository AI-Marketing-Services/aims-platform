"use client"

import { useState, useMemo } from "react"
import { motion } from "framer-motion"
import { Search, ChevronDown, Calendar, User, AlertTriangle } from "lucide-react"
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
  { key: "in_progress", label: "In Progress", color: "border-blue-500" },
  { key: "needs_attention", label: "Needs Attention", color: "border-orange-500" },
  { key: "in_review", label: "In Review", color: "border-purple-500" },
  { key: "done", label: "Completed", color: "border-green-500" },
]

const STATUS_OPTIONS = [
  { value: "todo", label: "Pending Setup" },
  { value: "in_progress", label: "In Progress" },
  { value: "needs_attention", label: "Needs Attention" },
  { value: "in_review", label: "In Review" },
  { value: "done", label: "Completed" },
]

const PRIORITY_COLORS: Record<string, string> = {
  urgent: "bg-primary/15 text-primary border-primary/30",
  high: "bg-orange-900/20 text-orange-400 border-orange-800",
  medium: "bg-yellow-900/20 text-yellow-400 border-yellow-800",
  low: "bg-deep text-muted-foreground border-border",
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


function TaskCard({
  task,
  onStatusChange,
}: {
  task: FulfillmentTask
  onStatusChange: (taskId: string, status: string) => void
}) {
  const overdue = task.status !== "done" && isOverdue(task.dueDate)

  return (
    <div className="bg-card border border-border rounded-xl p-3.5 hover:border-border hover:shadow-sm transition-all">
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
            className="flex-shrink-0 ml-2 w-6 h-6 rounded-full bg-blue-900/20 border border-blue-800 flex items-center justify-center text-[10px] font-bold text-blue-400"
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

      {/* Status dropdown */}
      <div className="relative">
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
    </div>
  )
}

export function FulfillmentPipeline({
  initialTasks,
}: {
  initialTasks: FulfillmentTask[]
}) {
  const [tasks, setTasks] = useState<FulfillmentTask[]>(initialTasks)
  const [search, setSearch] = useState("")
  const [priorityFilter, setPriorityFilter] = useState("all")

  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      const q = search.toLowerCase()
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
  }, [tasks, search, priorityFilter])

  async function handleStatusChange(taskId: string, newStatus: string) {
    const prevTask = tasks.find((t) => t.id === taskId)
    if (!prevTask) return

    // Optimistic update
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? { ...t, status: newStatus, completedAt: newStatus === "done" ? new Date().toISOString() : t.completedAt }
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
        // Rollback
        setTasks((prev) =>
          prev.map((t) => (t.id === taskId ? prevTask : t))
        )
      }
    } catch {
      // Rollback on network error
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? prevTask : t))
      )
    }
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

      {/* Kanban columns */}
      <div className="flex-1 overflow-x-auto">
        <div
          className="flex gap-4 h-full pb-4"
          style={{ minWidth: `${COLUMNS.length * 260}px` }}
        >
          {COLUMNS.map((col) => {
            const colTasks = filteredTasks.filter((t) => t.status === col.key)
            return (
              <div key={col.key} className="flex flex-col w-60 flex-shrink-0">
                {/* Column header */}
                <div className={cn("border-t-2 pt-3 mb-3", col.color)}>
                  <div className="flex items-baseline justify-between gap-1">
                    <span className="text-sm font-medium text-foreground truncate">
                      {col.label}
                    </span>
                    <span className="text-xs font-mono text-muted-foreground flex-shrink-0">
                      ({colTasks.length})
                    </span>
                  </div>
                </div>

                {/* Cards */}
                <div className="flex-1 space-y-2 overflow-y-auto pr-1 min-h-24">
                  {colTasks.map((task) => (
                    <motion.div
                      key={task.id}
                      layout
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.15 }}
                    >
                      <TaskCard
                        task={task}
                        onStatusChange={handleStatusChange}
                      />
                    </motion.div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </>
  )
}
