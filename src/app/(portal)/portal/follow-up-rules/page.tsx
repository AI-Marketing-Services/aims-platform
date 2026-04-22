"use client"

import { useState, useEffect, useCallback } from "react"
import { Bell, Plus, Trash2, ToggleLeft, ToggleRight, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"

const STAGES = [
  { value: "PROSPECT", label: "Prospect" },
  { value: "DISCOVERY_CALL", label: "Discovery Call" },
  { value: "PROPOSAL_SENT", label: "Proposal Sent" },
  { value: "ACTIVE_RETAINER", label: "Active Retainer" },
  { value: "COMPLETED", label: "Completed" },
  { value: "LOST", label: "Lost" },
] as const

type Stage = (typeof STAGES)[number]["value"]

interface FollowUpRule {
  id: string
  stageTrigger: Stage
  daysStale: number
  message: string | null
  isActive: boolean
  lastTriggered: string | null
  createdAt: string
}

const STAGE_COLORS: Record<Stage, string> = {
  PROSPECT: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  DISCOVERY_CALL: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  PROPOSAL_SENT: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  ACTIVE_RETAINER: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  COMPLETED: "bg-gray-500/10 text-gray-400 border-gray-500/20",
  LOST: "bg-red-500/10 text-red-400 border-red-500/20",
}

const DEFAULT_FORM = {
  stageTrigger: "PROSPECT" as Stage,
  daysStale: 7,
  message: "",
}

export default function FollowUpRulesPage() {
  const [rules, setRules] = useState<FollowUpRule[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(DEFAULT_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  const fetchRules = useCallback(async () => {
    try {
      const res = await fetch("/api/portal/follow-up-rules")
      if (!res.ok) throw new Error("Failed to load rules")
      const data = await res.json()
      setRules(data.rules)
    } catch {
      setError("Could not load rules. Please refresh.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchRules()
  }, [fetchRules])

  const handleCreate = async () => {
    if (!form.stageTrigger || form.daysStale < 1) return
    setSaving(true)
    setError(null)
    try {
      const res = await fetch("/api/portal/follow-up-rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stageTrigger: form.stageTrigger,
          daysStale: form.daysStale,
          message: form.message.trim() || null,
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? "Failed to create rule")
      }
      const data = await res.json()
      setRules((prev) => [data.rule, ...prev])
      setForm(DEFAULT_FORM)
      setShowForm(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create rule")
    } finally {
      setSaving(false)
    }
  }

  const handleToggle = async (rule: FollowUpRule) => {
    setTogglingId(rule.id)
    try {
      const res = await fetch(`/api/portal/follow-up-rules/${rule.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !rule.isActive }),
      })
      if (!res.ok) throw new Error("Failed to update rule")
      const data = await res.json()
      setRules((prev) => prev.map((r) => (r.id === rule.id ? data.rule : r)))
    } catch {
      setError("Failed to toggle rule. Please try again.")
    } finally {
      setTogglingId(null)
    }
  }

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    try {
      const res = await fetch(`/api/portal/follow-up-rules/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to delete rule")
      setRules((prev) => prev.filter((r) => r.id !== id))
    } catch {
      setError("Failed to delete rule. Please try again.")
    } finally {
      setDeletingId(null)
    }
  }

  const stageLabel = (v: Stage) => STAGES.find((s) => s.value === v)?.label ?? v

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
            <Bell className="h-4.5 w-4.5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">Follow-up Rules</h1>
            <p className="text-xs text-muted-foreground">Get nudged when deals go stale</p>
          </div>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-2 rounded-lg bg-primary px-3.5 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Rule
        </button>
      </div>

      {/* Error banner */}
      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Add Rule Form */}
      {showForm && (
        <div className="mb-6 rounded-xl border border-border bg-[#141923] p-5 space-y-4">
          <p className="text-sm font-semibold text-foreground">New Follow-up Rule</p>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Stage Trigger
              </label>
              <select
                value={form.stageTrigger}
                onChange={(e) => setForm((f) => ({ ...f, stageTrigger: e.target.value as Stage }))}
                className="rounded-lg border border-border bg-[#08090D] px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {STAGES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Days Without Activity
              </label>
              <input
                type="number"
                min={1}
                max={90}
                value={form.daysStale}
                onChange={(e) =>
                  setForm((f) => ({ ...f, daysStale: Math.max(1, Math.min(90, Number(e.target.value))) }))
                }
                className="rounded-lg border border-border bg-[#08090D] px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Custom Message <span className="normal-case">(optional)</span>
            </label>
            <textarea
              rows={2}
              value={form.message}
              onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
              placeholder="Leave blank to use default message"
              className="rounded-lg border border-border bg-[#08090D] px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary resize-none"
            />
          </div>

          <div className="flex items-center gap-3 pt-1">
            <button
              onClick={handleCreate}
              disabled={saving}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {saving ? "Saving..." : "Save Rule"}
            </button>
            <button
              onClick={() => {
                setShowForm(false)
                setForm(DEFAULT_FORM)
                setError(null)
              }}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-surface transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Rules list */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-20 rounded-xl border border-border bg-[#141923] animate-pulse" />
          ))}
        </div>
      ) : rules.length === 0 ? (
        <div className="rounded-xl border border-border bg-[#141923] px-6 py-12 text-center">
          <Bell className="h-10 w-10 mx-auto mb-4 text-muted-foreground opacity-40" />
          <p className="text-sm font-semibold text-foreground mb-1">No follow-up rules yet</p>
          <p className="text-xs text-muted-foreground max-w-xs mx-auto">
            Rules send you an in-app nudge whenever a deal spends too long in a stage without
            activity.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {rules.map((rule) => (
            <div
              key={rule.id}
              className={cn(
                "rounded-xl border bg-[#141923] px-5 py-4 flex items-start gap-4 transition-opacity",
                !rule.isActive && "opacity-60"
              )}
              style={{ borderColor: "rgba(255,255,255,0.08)" }}
            >
              <div className="flex-1 min-w-0 space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                      STAGE_COLORS[rule.stageTrigger]
                    )}
                  >
                    {stageLabel(rule.stageTrigger)}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    after{" "}
                    <span className="font-semibold text-foreground">{rule.daysStale}</span>{" "}
                    {rule.daysStale === 1 ? "day" : "days"}
                  </span>
                  {!rule.isActive && (
                    <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                      Paused
                    </span>
                  )}
                </div>
                {rule.message && (
                  <p className="text-xs text-muted-foreground truncate">{rule.message}</p>
                )}
                {rule.lastTriggered && (
                  <p className="text-[10px] text-muted-foreground">
                    Last triggered:{" "}
                    {new Date(rule.lastTriggered).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => void handleToggle(rule)}
                  disabled={togglingId === rule.id}
                  aria-label={rule.isActive ? "Pause rule" : "Enable rule"}
                  className="text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
                >
                  {rule.isActive ? (
                    <ToggleRight className="h-5 w-5 text-primary" />
                  ) : (
                    <ToggleLeft className="h-5 w-5" />
                  )}
                </button>
                <button
                  onClick={() => void handleDelete(rule.id)}
                  disabled={deletingId === rule.id}
                  aria-label="Delete rule"
                  className="text-muted-foreground hover:text-red-400 transition-colors disabled:opacity-50"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
