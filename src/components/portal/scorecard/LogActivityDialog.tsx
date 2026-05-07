"use client"

import { useState } from "react"
import { X } from "lucide-react"
import type { TrackerRow } from "./types"

interface Props {
  row: string
  label: string
  tracker: TrackerRow[]
  onClose: () => void
  onLog: (clientDealId: string, description?: string) => Promise<void>
}

export function LogActivityDialog({
  label,
  tracker,
  onClose,
  onLog,
}: Props) {
  const [dealId, setDealId] = useState<string>(tracker[0]?.id ?? "")
  const [description, setDescription] = useState("")
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!dealId) return
    setSubmitting(true)
    try {
      await onLog(dealId, description || undefined)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-xl bg-card border border-border shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-foreground">Log activity</p>
            <p className="text-[11px] text-muted-foreground">{label}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded hover:bg-muted/60 text-muted-foreground"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-3">
          {tracker.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              You need at least one deal in your prospecting tracker before
              logging an activity. Add one below the scorecard, then come back.
            </p>
          ) : (
            <>
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                  Tied to deal
                </label>
                <select
                  value={dealId}
                  onChange={(e) => setDealId(e.target.value)}
                  className="w-full rounded-md border border-border bg-card text-sm text-foreground px-2 py-2 focus:outline-none focus:border-primary"
                >
                  {tracker.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.companyName}
                      {t.contactName ? ` — ${t.contactName}` : ""}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                  Description (optional)
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder="What did you say / send / ask?"
                  className="w-full rounded-md border border-border bg-card text-sm text-foreground px-2 py-2 focus:outline-none focus:border-primary placeholder:text-muted-foreground/60"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3 py-1.5 rounded-md text-xs font-semibold text-muted-foreground hover:text-foreground"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !dealId}
                  className="px-3 py-1.5 rounded-md text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? "Logging…" : "Log activity"}
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  )
}
