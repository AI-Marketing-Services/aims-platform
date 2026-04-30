"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import {
  MessageSquare,
  Phone,
  Mail,
  Calendar,
  FileText,
  ArrowRight,
  UserPlus,
  Plus,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { formatDistanceToNow } from "date-fns"

interface Activity {
  id: string
  type: string
  description: string | null
  createdAt: string
}

const ACTIVITY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  NOTE: MessageSquare,
  CALL: Phone,
  EMAIL: Mail,
  MEETING: Calendar,
  PROPOSAL_SENT: FileText,
  STAGE_CHANGE: ArrowRight,
  CONTACT_ADDED: UserPlus,
}

// Activity types share a single muted treatment + the type icon does
// the visual differentiation. Keeps the timeline on-brand (no rainbow
// chips) and easier to scan.
const ACTIVITY_COLORS: Record<string, string> = {
  NOTE: "bg-muted/40 border-border text-muted-foreground",
  CALL: "bg-muted/40 border-border text-muted-foreground",
  EMAIL: "bg-muted/40 border-border text-muted-foreground",
  MEETING: "bg-muted/40 border-border text-muted-foreground",
  PROPOSAL_SENT: "bg-primary/10 border-primary/20 text-primary",
  STAGE_CHANGE: "bg-primary/10 border-primary/20 text-primary",
  CONTACT_ADDED: "bg-muted/40 border-border text-muted-foreground",
}

const ACTIVITY_LABELS: Record<string, string> = {
  NOTE: "Note",
  CALL: "Call",
  EMAIL: "Email",
  MEETING: "Meeting",
  PROPOSAL_SENT: "Proposal",
  STAGE_CHANGE: "Stage change",
  CONTACT_ADDED: "Contact added",
}

const LOG_TYPES = ["NOTE", "CALL", "EMAIL", "MEETING", "PROPOSAL_SENT"] as const

interface ActivityTimelineProps {
  dealId: string
  activities: Activity[]
}

export function ActivityTimeline({ dealId, activities: initialActivities }: ActivityTimelineProps) {
  const router = useRouter()
  const [activities, setActivities] = useState(initialActivities)
  const [type, setType] = useState("NOTE")
  const [description, setDescription] = useState("")
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!description.trim()) return

    setError(null)
    startTransition(async () => {
      const res = await fetch(`/api/portal/crm/deals/${dealId}/activities`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, description }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? "Failed to log activity")
        return
      }

      const { activity } = await res.json()
      setActivities((prev) => [activity, ...prev])
      setDescription("")
      router.refresh()
    })
  }

  return (
    <div className="space-y-4">
      {/* Log activity form */}
      <form onSubmit={handleSubmit} className="space-y-2">
        <div className="flex items-center gap-2">
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="h-8 px-2 rounded-lg bg-surface border border-border text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-primary/50"
          >
            {LOG_TYPES.map((t) => (
              <option key={t} value={t}>
                {ACTIVITY_LABELS[t]}
              </option>
            ))}
          </select>
          <span className="text-xs text-muted-foreground">Log activity</span>
        </div>

        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What happened? Outcomes, next steps…"
          rows={3}
          className="w-full px-3 py-2 rounded-lg bg-surface border border-border text-foreground text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/50 resize-none"
        />

        {error && <p className="text-xs text-red-400">{error}</p>}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isPending || !description.trim()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            {isPending ? "Logging…" : "Log"}
          </button>
        </div>
      </form>

      <div className="border-t border-border" />

      {/* Timeline */}
      {activities.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-4">No activity yet</p>
      ) : (
        <div className="space-y-3">
          {activities.map((activity) => {
            const Icon = ACTIVITY_ICONS[activity.type] ?? MessageSquare
            const colorClass = ACTIVITY_COLORS[activity.type] ?? ACTIVITY_COLORS.NOTE

            return (
              <div key={activity.id} className="flex gap-3">
                <div
                  className={cn(
                    "h-7 w-7 rounded-full border flex items-center justify-center shrink-0 mt-0.5",
                    colorClass
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-foreground">
                      {ACTIVITY_LABELS[activity.type] ?? activity.type}
                    </span>
                    <span className="text-[10px] text-muted-foreground/60 shrink-0">
                      {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                  {activity.description && (
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                      {activity.description}
                    </p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
