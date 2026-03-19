"use client"

import { useState } from "react"
import { Plus, X, Send, Clock, ChevronDown, Check } from "lucide-react"
import { cn } from "@/lib/utils"

interface RecentReport {
  id: string
  date: string
  completed: unknown
  nextPriority: unknown
  blockers: unknown
  hoursWorked: number | null
}

interface CompletedTask {
  id: string
  title: string
}

interface Props {
  internId: string | null
  recentReports: RecentReport[]
  recentCompletedTasks: CompletedTask[]
}

function parseJsonArray(val: unknown): string[] {
  if (!val) return []
  if (Array.isArray(val)) return val.filter((v) => typeof v === "string") as string[]
  return []
}

export function EODReportClient({ internId, recentReports, recentCompletedTasks }: Props) {
  const [completed, setCompleted] = useState<string[]>([])
  const [completedInput, setCompletedInput] = useState("")
  const [nextItems, setNextItems] = useState<string[]>([])
  const [nextInput, setNextInput] = useState("")
  const [blockers, setBlockers] = useState<string[]>([])
  const [blockerInput, setBlockerInput] = useState("")
  const [hours, setHours] = useState("")
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showHistory, setShowHistory] = useState(false)

  function addItem(list: string[], setList: (v: string[]) => void, value: string, setValue: (v: string) => void) {
    const trimmed = value.trim()
    if (!trimmed) return
    setList([...list, trimmed])
    setValue("")
  }

  function removeItem(list: string[], setList: (v: string[]) => void, index: number) {
    setList(list.filter((_, i) => i !== index))
  }

  async function handleSubmit() {
    if (!internId || completed.length === 0) return
    setLoading(true)
    try {
      const res = await fetch("/api/intern/eod-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          internId,
          completed,
          nextPriority: nextItems,
          blockers,
          hoursWorked: hours ? parseFloat(hours) : null,
        }),
      })
      if (res.ok) {
        setSubmitted(true)
      }
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="rounded-xl border border-green-500/20 bg-green-400/5 p-8 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-400/10 mx-auto mb-4">
          <Send className="h-6 w-6 text-green-400" />
        </div>
        <h3 className="text-lg font-semibold text-foreground">Report Submitted</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Great work today. See you tomorrow!
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Completed today */}
      <div className="rounded-xl border border-border bg-card p-6">
        <label className="block text-sm font-semibold text-foreground mb-3">
          What did you complete today? <span className="text-[#C4972A]">*</span>
        </label>
        <div className="space-y-2 mb-3">
          {completed.map((item, i) => (
            <div key={i} className="flex items-center gap-2 text-sm bg-muted/50 rounded-lg px-3 py-2">
              <span className="flex-1 text-foreground">{item}</span>
              <button onClick={() => removeItem(completed, setCompleted, i)} className="text-muted-foreground hover:text-foreground">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
        {/* Quick-add from recent tasks */}
        {recentCompletedTasks.length > 0 && completed.length === 0 && (
          <div className="mb-3">
            <p className="text-xs text-muted-foreground mb-2">Quick-add from completed tasks:</p>
            <div className="flex flex-wrap gap-1.5">
              {recentCompletedTasks.slice(0, 5).map((t) => (
                <button
                  key={t.id}
                  onClick={() => setCompleted([...completed, t.title])}
                  className="text-xs px-2.5 py-1 bg-muted border border-border rounded-full text-muted-foreground hover:text-foreground hover:border-border/70 transition-colors"
                >
                  + {t.title.length > 40 ? t.title.slice(0, 40) + "…" : t.title}
                </button>
              ))}
            </div>
          </div>
        )}
        <div className="flex gap-2">
          <input
            value={completedInput}
            onChange={(e) => setCompletedInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") addItem(completed, setCompleted, completedInput, setCompletedInput)
            }}
            placeholder="What did you build/complete?"
            className="flex-1 px-3 py-2 bg-muted border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#C4972A]/30"
          />
          <button
            onClick={() => addItem(completed, setCompleted, completedInput, setCompletedInput)}
            className="flex items-center gap-1.5 px-3 py-2 bg-[#C4972A] text-white text-sm font-medium rounded-lg hover:bg-[#A17D22] transition-colors"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Tomorrow's priorities */}
      <div className="rounded-xl border border-border bg-card p-6">
        <label className="block text-sm font-semibold text-foreground mb-3">
          Top priorities for tomorrow
        </label>
        <div className="space-y-2 mb-3">
          {nextItems.map((item, i) => (
            <div key={i} className="flex items-center gap-2 text-sm bg-muted/50 rounded-lg px-3 py-2">
              <span className="text-muted-foreground mr-1">{i + 1}.</span>
              <span className="flex-1 text-foreground">{item}</span>
              <button onClick={() => removeItem(nextItems, setNextItems, i)} className="text-muted-foreground hover:text-foreground">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            value={nextInput}
            onChange={(e) => setNextInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") addItem(nextItems, setNextItems, nextInput, setNextInput)
            }}
            placeholder="What's most important tomorrow?"
            className="flex-1 px-3 py-2 bg-muted border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#C4972A]/30"
          />
          <button
            onClick={() => addItem(nextItems, setNextItems, nextInput, setNextInput)}
            className="flex items-center gap-1.5 px-3 py-2 bg-muted border border-border text-foreground text-sm font-medium rounded-lg hover:bg-accent transition-colors"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Blockers */}
      <div className="rounded-xl border border-border bg-card p-6">
        <label className="block text-sm font-semibold text-foreground mb-3">
          Blockers or help needed
          <span className="ml-2 text-xs text-muted-foreground font-normal">(optional)</span>
        </label>
        <div className="space-y-2 mb-3">
          {blockers.map((item, i) => (
            <div key={i} className="flex items-center gap-2 text-sm bg-primary/100/5 border border-primary/10 rounded-lg px-3 py-2">
              <span className="flex-1 text-foreground">{item}</span>
              <button onClick={() => removeItem(blockers, setBlockers, i)} className="text-muted-foreground hover:text-foreground">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            value={blockerInput}
            onChange={(e) => setBlockerInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") addItem(blockers, setBlockers, blockerInput, setBlockerInput)
            }}
            placeholder="Any blockers or dependencies?"
            className="flex-1 px-3 py-2 bg-muted border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#C4972A]/30"
          />
          <button
            onClick={() => addItem(blockers, setBlockers, blockerInput, setBlockerInput)}
            className="flex items-center gap-1.5 px-3 py-2 bg-muted border border-border text-foreground text-sm font-medium rounded-lg hover:bg-accent transition-colors"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Hours */}
      <div className="rounded-xl border border-border bg-card p-6">
        <label className="block text-sm font-semibold text-foreground mb-3">
          Hours worked today
          <span className="ml-2 text-xs text-muted-foreground font-normal">(optional)</span>
        </label>
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <input
            type="number"
            value={hours}
            onChange={(e) => setHours(e.target.value)}
            min="0"
            max="24"
            step="0.5"
            placeholder="e.g. 4.5"
            className="w-32 px-3 py-2 bg-muted border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#C4972A]/30"
          />
          <span className="text-sm text-muted-foreground">hours</span>
        </div>
      </div>

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={completed.length === 0 || loading || !internId}
        className="w-full flex items-center justify-center gap-2 py-3 bg-[#C4972A] text-white font-semibold rounded-xl hover:bg-[#A17D22] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        <Send className="h-4 w-4" />
        {loading ? "Submitting…" : "Submit EOD Report"}
      </button>

      {/* History */}
      {recentReports.length > 0 && (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="w-full flex items-center justify-between px-5 py-4 text-sm font-semibold text-foreground"
          >
            Recent Reports ({recentReports.length})
            <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", showHistory && "rotate-180")} />
          </button>
          {showHistory && (
            <div className="border-t border-border divide-y divide-border">
              {recentReports.map((r) => {
                const items = parseJsonArray(r.completed)
                return (
                  <div key={r.id} className="px-5 py-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium text-foreground">
                        {new Date(r.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                      </p>
                      {r.hoursWorked && (
                        <span className="text-xs text-muted-foreground">{r.hoursWorked}h</span>
                      )}
                    </div>
                    <ul className="space-y-1">
                      {items.slice(0, 3).map((item, i) => (
                        <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                          <Check className="h-3.5 w-3.5 text-green-400 mt-0.5" />
                          {item}
                        </li>
                      ))}
                      {items.length > 3 && (
                        <li className="text-xs text-muted-foreground">+{items.length - 3} more</li>
                      )}
                    </ul>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
