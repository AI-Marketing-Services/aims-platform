"use client"

import { useState, useTransition } from "react"
import { ChevronDown, Clock, Send, FileText, StickyNote } from "lucide-react"
import { cn } from "@/lib/utils"

type ActivityType =
  | "EMAIL_SENT"
  | "CALL_MADE"
  | "DEMO_COMPLETED"
  | "STAGE_CHANGE"
  | "NOTE_ADDED"
  | "SUBSCRIPTION_CREATED"
  | "SUBSCRIPTION_CANCELLED"
  | "PAYMENT_RECEIVED"
  | "TASK_CREATED"
  | "FORM_SUBMITTED"

interface Activity {
  id: string
  type: ActivityType
  detail: string
  authorId: string | null
  createdAt: string
}

interface Note {
  id: string
  content: string
  authorId: string
  createdAt: string
}

interface Props {
  dealId: string
  currentStage: string
  stageLabel: string
  stageColor: string
  stageOptions: { value: string; label: string }[]
  activities: Activity[]
  notes: Note[]
  authorId: string
}

const ACTIVITY_ICONS: Record<ActivityType, string> = {
  EMAIL_SENT: "📧",
  CALL_MADE: "📞",
  DEMO_COMPLETED: "🖥",
  STAGE_CHANGE: "→",
  NOTE_ADDED: "✏",
  SUBSCRIPTION_CREATED: "✓",
  SUBSCRIPTION_CANCELLED: "✗",
  PAYMENT_RECEIVED: "$",
  TASK_CREATED: "□",
  FORM_SUBMITTED: "◆",
}

function timeAgo(isoDate: string) {
  const diff = Date.now() - new Date(isoDate).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

export function DealDetailClient({
  dealId,
  currentStage,
  stageLabel,
  stageColor,
  stageOptions,
  activities: initialActivities,
  notes: initialNotes,
  authorId,
}: Props) {
  const [stage, setStage] = useState(currentStage)
  const [stageDropdown, setStageDropdown] = useState(false)
  const [activities, setActivities] = useState(initialActivities)
  const [notes, setNotes] = useState(initialNotes)
  const [noteText, setNoteText] = useState("")
  const [activeTab, setActiveTab] = useState<"activity" | "notes">("activity")
  const [isPending, startTransition] = useTransition()

  function handleStageChange(newStage: string) {
    const prev = stage
    setStage(newStage)
    setStageDropdown(false)

    startTransition(async () => {
      try {
        const res = await fetch(`/api/deals/${dealId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ stage: newStage, authorId }),
        })
        if (!res.ok) {
          setStage(prev)
        } else {
          const label = stageOptions.find((s) => s.value === newStage)?.label ?? newStage
          setActivities((prev) => [
            {
              id: crypto.randomUUID(),
              type: "STAGE_CHANGE",
              detail: `Moved to ${label}`,
              authorId,
              createdAt: new Date().toISOString(),
            },
            ...prev,
          ])
        }
      } catch {
        setStage(prev)
      }
    })
  }

  async function handleAddNote() {
    const content = noteText.trim()
    if (!content) return
    setNoteText("")

    try {
      const res = await fetch(`/api/deals/${dealId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, authorId }),
      })
      if (res.ok) {
        const data = await res.json()
        setNotes((prev) => [{ id: data.id, content, authorId, createdAt: new Date().toISOString() }, ...prev])
        setActivities((prev) => [
          {
            id: crypto.randomUUID(),
            type: "NOTE_ADDED",
            detail: content.slice(0, 80) + (content.length > 80 ? "…" : ""),
            authorId,
            createdAt: new Date().toISOString(),
          },
          ...prev,
        ])
      }
    } catch {
      setNoteText(content)
    }
  }

  const currentLabel = stageOptions.find((s) => s.value === stage)?.label ?? stageLabel

  return (
    <div className="space-y-4">
      {/* Stage selector */}
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold text-foreground">Pipeline Stage</p>
          {isPending && <span className="text-xs text-muted-foreground">Saving…</span>}
        </div>
        <div className="relative inline-block">
          <button
            onClick={() => setStageDropdown(!stageDropdown)}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors",
              stageColor
            )}
          >
            {currentLabel}
            <ChevronDown className="h-3.5 w-3.5" />
          </button>
          {stageDropdown && (
            <div className="absolute left-0 top-full mt-1 z-10 w-52 rounded-xl border border-border bg-card shadow-xl py-1">
              {stageOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => handleStageChange(opt.value)}
                  className={cn(
                    "w-full text-left px-4 py-2.5 text-sm transition-colors",
                    opt.value === stage
                      ? "text-foreground bg-accent"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="flex border-b border-border">
          <button
            onClick={() => setActiveTab("activity")}
            className={cn(
              "flex items-center gap-2 px-5 py-3 text-sm font-medium transition-colors",
              activeTab === "activity"
                ? "text-foreground border-b-2 border-[#DC2626]"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Clock className="h-3.5 w-3.5" />
            Activity ({activities.length})
          </button>
          <button
            onClick={() => setActiveTab("notes")}
            className={cn(
              "flex items-center gap-2 px-5 py-3 text-sm font-medium transition-colors",
              activeTab === "notes"
                ? "text-foreground border-b-2 border-[#DC2626]"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <StickyNote className="h-3.5 w-3.5" />
            Notes ({notes.length})
          </button>
        </div>

        <div className="p-5">
          {activeTab === "activity" && (
            <div className="space-y-4">
              {activities.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-6">No activity yet</p>
              )}
              {activities.map((act) => (
                <div key={act.id} className="flex items-start gap-3">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-muted text-xs flex-shrink-0">
                    {ACTIVITY_ICONS[act.type] ?? "·"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm text-foreground font-medium capitalize">{act.type.replace(/_/g, " ").toLowerCase()}</p>
                      <span className="text-xs text-muted-foreground flex-shrink-0">{timeAgo(act.createdAt)}</span>
                    </div>
                    {act.detail && <p className="text-xs text-muted-foreground mt-0.5">{act.detail}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === "notes" && (
            <div className="space-y-4">
              {/* Add note */}
              <div className="space-y-2">
                <textarea
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="Add a note..."
                  rows={3}
                  className="w-full px-3 py-2.5 bg-muted border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-[#DC2626]/30 focus:border-[#DC2626]"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleAddNote()
                  }}
                />
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">⌘+Enter to save</span>
                  <button
                    onClick={handleAddNote}
                    disabled={!noteText.trim()}
                    className="flex items-center gap-2 px-4 py-1.5 bg-[#DC2626] text-white text-sm font-medium rounded-lg hover:bg-[#B91C1C] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <Send className="h-3.5 w-3.5" />
                    Save Note
                  </button>
                </div>
              </div>

              {/* Notes list */}
              {notes.length === 0 && (
                <div className="flex flex-col items-center py-6 gap-2">
                  <FileText className="h-8 w-8 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">No notes yet</p>
                </div>
              )}
              {notes.map((note) => (
                <div key={note.id} className="rounded-lg bg-muted/50 border border-border p-4">
                  <p className="text-sm text-foreground whitespace-pre-wrap">{note.content}</p>
                  <p className="text-xs text-muted-foreground mt-2">{timeAgo(note.createdAt)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
