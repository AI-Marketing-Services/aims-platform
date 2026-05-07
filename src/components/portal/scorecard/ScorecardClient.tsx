"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Loader2, Megaphone } from "lucide-react"
import type { ScorecardPayload, TrackerRow } from "./types"
import { ScorecardHeader } from "./ScorecardHeader"
import { ScorecardKpiTiles } from "./ScorecardKpiTiles"
import { ScorecardTable } from "./ScorecardTable"
import { ProspectingTracker } from "./ProspectingTracker"

/**
 * Top-level controller for the scorecard page. Owns:
 * - the currently-viewed week (Monday-anchored, local TZ)
 * - the loaded payload + tracker rows
 * - debounced patch helpers for inline manual edits
 *
 * Subcomponents are pure renderers; all I/O lives here so optimistic
 * updates are easy and we don't fan out a refetch on every keystroke.
 */
export function ScorecardClient() {
  const [tzOffset] = useState(() => new Date().getTimezoneOffset())
  const [weekStart, setWeekStart] = useState<string | null>(null)
  const [data, setData] = useState<ScorecardPayload | null>(null)
  const [tracker, setTracker] = useState<TrackerRow[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadScorecard = useCallback(
    async (week?: string | null) => {
      setLoading(true)
      setError(null)
      try {
        const params = new URLSearchParams({ tzOffset: String(tzOffset) })
        if (week) params.set("week", week)
        const [scRes, trRes] = await Promise.all([
          fetch(`/api/portal/scorecard?${params.toString()}`),
          fetch(`/api/portal/scorecard/tracker?limit=100`),
        ])
        if (!scRes.ok) throw new Error(`Scorecard ${scRes.status}`)
        const sc = (await scRes.json()) as ScorecardPayload
        const tr = trRes.ok
          ? ((await trRes.json()) as { rows: TrackerRow[] })
          : { rows: [] }
        setData(sc)
        setTracker(tr.rows ?? [])
        setWeekStart(sc.week.start)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load")
      } finally {
        setLoading(false)
      }
    },
    [tzOffset],
  )

  useEffect(() => {
    loadScorecard()
  }, [loadScorecard])

  const patchScorecard = useCallback(
    async (
      delta: Partial<{
        manualNewProspects: number
        manualOutreachSent: number
        manualFollowUpsSent: number
        manualReferralAsks: number
        manualProblemHypotheses: number
        manualDiscoveryRequested: number
        manualDiscoveryBooked: number
        manualDiscoveryCompleted: number
        manualQuickWinHypotheses: number
        revenueImpact: number
        strongOpportunities: number
        notes: string
        commitmentLevel: "PART_TIME" | "FULL_TIME"
        weeklyGoalText: string
        weeklyRule: string
        focusNiche: string
      }>,
    ) => {
      if (!data) return
      setSaving(true)
      // Optimistic: merge delta into the local state immediately.
      setData((prev) => {
        if (!prev) return prev
        const next = structuredClone(prev) as ScorecardPayload
        const manualKeys = [
          "manualNewProspects",
          "manualOutreachSent",
          "manualFollowUpsSent",
          "manualReferralAsks",
          "manualProblemHypotheses",
          "manualDiscoveryRequested",
          "manualDiscoveryBooked",
          "manualDiscoveryCompleted",
          "manualQuickWinHypotheses",
        ] as const
        for (const k of manualKeys) {
          const v = delta[k]
          if (typeof v === "number") {
            const camel = k.replace(/^manual/, "")
            const lc = camel[0].toLowerCase() + camel.slice(1)
            ;(next.manual as Record<string, number>)[lc] = v
          }
        }
        if (typeof delta.revenueImpact === "number")
          next.kpis.revenueImpact = delta.revenueImpact
        if (typeof delta.strongOpportunities === "number")
          next.kpis.strongOpportunities = delta.strongOpportunities
        if (typeof delta.notes === "string") next.notes = delta.notes
        if (delta.commitmentLevel) next.profile.commitmentLevel = delta.commitmentLevel
        if (typeof delta.weeklyGoalText === "string")
          next.profile.weeklyGoalText = delta.weeklyGoalText
        if (typeof delta.weeklyRule === "string")
          next.profile.weeklyRule = delta.weeklyRule
        if (typeof delta.focusNiche === "string")
          next.profile.focusNiche = delta.focusNiche
        return next
      })
      try {
        const res = await fetch(`/api/portal/scorecard`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ weekStart: data.week.start, ...delta }),
        })
        if (!res.ok) throw new Error(`Save failed (${res.status})`)
        // Recompute targets server-side when commitment level changes.
        if (delta.commitmentLevel) await loadScorecard(data.week.start)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Save failed")
      } finally {
        setSaving(false)
      }
    },
    [data, loadScorecard],
  )

  const logActivity = useCallback(
    async (row: string, clientDealId: string, description?: string) => {
      try {
        const res = await fetch(`/api/portal/scorecard/log`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ row, clientDealId, description }),
        })
        if (!res.ok) throw new Error(`Log failed (${res.status})`)
        // Pull a fresh auto-tally so the hint reflects the new activity.
        if (data) await loadScorecard(data.week.start)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Log failed")
      }
    },
    [data, loadScorecard],
  )

  const updateTrackerRow = useCallback(
    async (id: string, fields: Partial<TrackerRow>) => {
      // Optimistic update.
      setTracker((prev) =>
        prev.map((r) => (r.id === id ? { ...r, ...fields } : r)),
      )
      try {
        const res = await fetch(`/api/portal/scorecard/tracker`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, ...fields }),
        })
        if (!res.ok) throw new Error(`Save failed (${res.status})`)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Save failed")
      }
    },
    [],
  )

  const addTrackerRow = useCallback(
    async (companyName: string) => {
      try {
        const res = await fetch(`/api/portal/scorecard/tracker`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ companyName }),
        })
        if (!res.ok) throw new Error(`Create failed (${res.status})`)
        const json = (await res.json()) as { id: string }
        // Refresh the tracker so the new row appears with full schema.
        const trRes = await fetch(`/api/portal/scorecard/tracker?limit=100`)
        if (trRes.ok) {
          const tr = (await trRes.json()) as { rows: TrackerRow[] }
          setTracker(tr.rows ?? [])
        }
        return json.id
      } catch (err) {
        setError(err instanceof Error ? err.message : "Create failed")
        return null
      }
    },
    [],
  )

  const headerKpis = useMemo(() => {
    if (!data) return null
    return {
      prospects: data.manual.newProspects,
      messagesThisWeek: data.manual.outreachSent,
      discoveryRequested: data.manual.discoveryRequested,
      discoveryCompleted: data.manual.discoveryCompleted,
      revenueImpact: data.kpis.revenueImpact,
      strongOpportunities: data.kpis.strongOpportunities,
    }
  }, [data])

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error && !data) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-sm text-destructive">
        {error}
      </div>
    )
  }

  if (!data) return null

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
            <Megaphone className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">
              Prospecting Activity
            </h1>
            <p className="text-xs text-muted-foreground">
              Daily momentum tracker — warm network, outreach, follow-ups,
              discovery asks, next actions.
            </p>
          </div>
        </div>

        {saving && (
          <span className="text-[11px] text-muted-foreground inline-flex items-center gap-1">
            <Loader2 className="h-3 w-3 animate-spin" />
            Saving…
          </span>
        )}
      </div>

      {error && (
        <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
          {error}
        </div>
      )}

      <ScorecardHeader
        week={data.week}
        profile={data.profile}
        onPatch={patchScorecard}
        onChangeWeek={(w) => {
          setWeekStart(w)
          loadScorecard(w)
        }}
        currentWeekStart={weekStart}
      />

      {headerKpis && (
        <ScorecardKpiTiles
          kpis={headerKpis}
          onPatch={patchScorecard}
        />
      )}

      <ScorecardTable
        manual={data.manual}
        auto={data.auto}
        targets={data.targets}
        onPatch={patchScorecard}
        onLog={logActivity}
        tracker={tracker}
      />

      <ProspectingTracker
        rows={tracker}
        onUpdate={updateTrackerRow}
        onAdd={addTrackerRow}
      />

      {/* Notes journal */}
      <div className="rounded-xl border border-border bg-card p-4">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
          Weekly notes
        </p>
        <textarea
          defaultValue={data.notes}
          onBlur={(e) => {
            if (e.target.value !== data.notes) {
              patchScorecard({ notes: e.target.value })
            }
          }}
          rows={4}
          placeholder="What worked this week? What didn't? What's the bottleneck?"
          className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none resize-y leading-relaxed"
        />
      </div>
    </div>
  )
}
