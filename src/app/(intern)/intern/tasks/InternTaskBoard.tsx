"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Clock, AlertCircle, CheckSquare, TrendingUp, Eye, Plus } from "lucide-react"
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

type TaskStatus = "TODO" | "IN_PROGRESS" | "IN_REVIEW" | "DONE" | "BLOCKED"

interface Task {
  id: string
  title: string
  description: string | null
  status: TaskStatus
  priority: string
  sprintGoal: string | null
  estimatedHours: number | null
  dueDate: string | null
  linkedProductSlug: string | null
}

const COLUMNS: { key: TaskStatus; label: string; color: string; icon: React.FC<{ className?: string }> }[] = [
  { key: "TODO", label: "To Do", color: "border-muted-foreground", icon: Clock },
  { key: "IN_PROGRESS", label: "In Progress", color: "border-blue-500", icon: TrendingUp },
  { key: "IN_REVIEW", label: "In Review", color: "border-yellow-500", icon: Eye },
  { key: "DONE", label: "Done", color: "border-green-500", icon: CheckSquare },
  { key: "BLOCKED", label: "Blocked", color: "border-primary", icon: AlertCircle },
]

const PRIORITY_COLOR: Record<string, string> = {
  URGENT: "text-primary bg-primary/10 border-primary/30",
  HIGH: "text-primary bg-primary/10 border-primary/30",
  MEDIUM: "text-yellow-400 bg-yellow-900/20 border-yellow-800",
  LOW: "text-muted-foreground bg-deep border-border",
}

function TaskCardInner({ task }: { task: Task }) {
  return (
    <>
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className="text-sm font-medium text-foreground leading-snug">{task.title}</p>
        <span className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded border flex-shrink-0", PRIORITY_COLOR[task.priority])}>
          {task.priority.charAt(0)}
        </span>
      </div>
      {task.description && (
        <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{task.description}</p>
      )}
      <div className="flex flex-wrap items-center gap-2 mt-2">
        {task.sprintGoal && (
          <span className="text-[10px] text-muted-foreground bg-deep px-1.5 py-0.5 rounded truncate max-w-[120px]">
            {task.sprintGoal}
          </span>
        )}
        {task.estimatedHours && (
          <span className="text-[10px] text-muted-foreground bg-deep px-1.5 py-0.5 rounded">
            {task.estimatedHours}h
          </span>
        )}
        {task.dueDate && (
          <span className="text-[10px] text-muted-foreground">
            Due {new Date(task.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
          </span>
        )}
      </div>
    </>
  )
}

function DraggableTask({ task }: { task: Task }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
    data: { status: task.status },
  })

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.35 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="bg-card border border-border rounded-xl p-4 cursor-grab active:cursor-grabbing hover:border-border transition-colors touch-none"
    >
      <TaskCardInner task={task} />
    </div>
  )
}

function DroppableColumn({ col, tasks }: { col: typeof COLUMNS[number]; tasks: Task[] }) {
  const { isOver, setNodeRef } = useDroppable({ id: col.key })
  const Icon = col.icon

  return (
    <div className="flex flex-col w-52 flex-shrink-0">
      <div className={cn("border-t-2 pt-3 mb-3 flex items-center gap-2", col.color)}>
        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-sm font-medium text-foreground">{col.label}</span>
        <span className="text-xs text-muted-foreground ml-auto">{tasks.length}</span>
      </div>
      <div
        ref={setNodeRef}
        className={cn(
          "flex-1 space-y-2 overflow-y-auto min-h-20 rounded-xl transition-colors",
          isOver ? "bg-deep ring-1 ring-inset ring-gray-200" : ""
        )}
      >
        {tasks.map((task) => (
          <motion.div
            key={task.id}
            layout
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.12 }}
          >
            <DraggableTask task={task} />
          </motion.div>
        ))}
        {tasks.length === 0 && (
          <div className="border border-dashed border-border rounded-xl h-16 flex items-center justify-center">
            <p className="text-xs text-muted-foreground">Drop here</p>
          </div>
        )}
      </div>
    </div>
  )
}

export function InternTaskBoard({ tasks: initialTasks }: { tasks: Task[] }) {
  const [tasks, setTasks] = useState(initialTasks)
  const [activeTask, setActiveTask] = useState<Task | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  function handleDragStart(event: DragStartEvent) {
    const task = tasks.find((t) => t.id === String(event.active.id))
    if (task) setActiveTask(task)
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveTask(null)
    const { active, over } = event
    if (!over) return

    const taskId = String(active.id)
    const newStatus = String(over.id) as TaskStatus

    if (!COLUMNS.some((c) => c.key === newStatus)) return
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t)))

    const prevStatus = tasks.find((t) => t.id === taskId)?.status
    fetch(`/api/intern/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    }).catch(() => {
      if (prevStatus) {
        setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status: prevStatus } : t)))
      }
    })
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="overflow-x-auto pb-4">
        <div className="flex gap-4" style={{ minWidth: `${COLUMNS.length * 220}px` }}>
          {COLUMNS.map((col) => (
            <DroppableColumn
              key={col.key}
              col={col}
              tasks={tasks.filter((t) => t.status === col.key)}
            />
          ))}
        </div>
      </div>

      <DragOverlay dropAnimation={null}>
        {activeTask && (
          <div className="bg-card border border-border rounded-xl p-4 w-52 shadow-2xl shadow-black/40 rotate-1">
            <TaskCardInner task={activeTask} />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  )
}
