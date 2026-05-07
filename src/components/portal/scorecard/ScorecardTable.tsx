"use client"

import { useEffect, useState } from "react"
import { Check, Minus, Plus, Sparkles } from "lucide-react"
import {
  SCORECARD_ROWS,
  type ScorecardRowKey,
  type ScorecardRowMeta,
} from "@/lib/scorecard/targets"
import type { ScorecardCounts, TrackerRow } from "./types"
import { LogActivityDialog } from "./LogActivityDialog"

interface Props {
  manual: ScorecardCounts
  auto: ScorecardCounts
  targets: ScorecardCounts
  tracker: TrackerRow[]
  onPatch: (delta: Partial<Record<string, number>>) => void
  onLog: (
    row: string,
    clientDealId: string,
    description?: string,
  ) => Promise<void>
}

const ROWS_LOGGABLE = new Set([
  "outreachSent",
  "followUpsSent",
  "referralAsks",
  "discoveryRequested",
  "discoveryCompleted",
  "problemHypotheses",
  "quickWinHypotheses",
])

export function ScorecardTable({
  manual,
  auto,
  targets,
  tracker,
  onPatch,
  onLog,
}: Props) {
  const [logDialog, setLogDialog] = useState<{ row: string; label: string } | null>(
    null,
  )

  const totalActual = SCORECARD_ROWS.reduce(
    (sum, r) => sum + (manual[r.key] ?? 0),
    0,
  )
  const totalTarget = SCORECARD_ROWS.reduce(
    (sum, r) => sum + (targets[r.key] ?? 0),
    0,
  )

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="px-4 py-3 border-b border-border bg-muted/20 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-foreground">
            Weekly Revenue Activity Scorecard
          </p>
          <p className="text-[11px] text-muted-foreground">
            You&apos;re the source of truth — auto-tally hints come from your
            CRM but never overwrite your numbers.
          </p>
        </div>
        <div className="text-right">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Total
          </p>
          <p className="text-sm font-semibold text-foreground tabular-nums">
            {totalActual} / {totalTarget}
          </p>
        </div>
      </div>

      <table className="w-full">
        <thead>
          <tr className="text-[10px] uppercase tracking-wider text-muted-foreground border-b border-border">
            <th className="px-4 py-2 text-left font-semibold">Activity</th>
            <th className="px-3 py-2 text-right font-semibold w-16">Target</th>
            <th className="px-3 py-2 text-right font-semibold w-32">Actual</th>
            <th className="px-3 py-2 text-right font-semibold w-28">Progress</th>
            <th className="px-3 py-2 text-right font-semibold w-32">Auto-tally</th>
          </tr>
        </thead>
        <tbody>
          {SCORECARD_ROWS.map((row) => (
            <Row
              key={row.key}
              row={row}
              manual={manual[row.key] ?? 0}
              auto={auto[row.key] ?? 0}
              target={targets[row.key] ?? 0}
              loggable={ROWS_LOGGABLE.has(row.key)}
              onPatch={onPatch}
              onOpenLog={() => setLogDialog({ row: row.key, label: row.label })}
            />
          ))}
        </tbody>
      </table>

      {logDialog && (
        <LogActivityDialog
          row={logDialog.row}
          label={logDialog.label}
          tracker={tracker}
          onClose={() => setLogDialog(null)}
          onLog={async (clientDealId, description) => {
            await onLog(logDialog.row, clientDealId, description)
            setLogDialog(null)
          }}
        />
      )}
    </div>
  )
}

function Row({
  row,
  manual,
  auto,
  target,
  loggable,
  onPatch,
  onOpenLog,
}: {
  row: ScorecardRowMeta
  manual: number
  auto: number
  target: number
  loggable: boolean
  onPatch: (delta: Partial<Record<string, number>>) => void
  onOpenLog: () => void
}) {
  const progress = target > 0 ? Math.min(100, Math.round((manual / target) * 100)) : 0
  const reachedTarget = target > 0 && manual >= target

  // Local string draft so the operator can blank the input, type a
  // multi-digit value, then commit on blur (or Enter). The previous
  // controlled-on-onChange version fired one PATCH per keystroke
  // ("100" = 3 PATCHes) and made it impossible to clear the field.
  // Re-syncs to `manual` whenever the parent's value changes (e.g.,
  // after the auto-tally "Apply" hint runs or the row is nudged).
  const [draft, setDraft] = useState<string>(String(manual))
  useEffect(() => {
    setDraft(String(manual))
  }, [manual])

  function commitDraft() {
    const trimmed = draft.trim()
    if (trimmed === "") {
      // Empty input → restore the canonical value rather than committing
      // a zero the operator didn't ask for.
      setDraft(String(manual))
      return
    }
    const n = parseInt(trimmed, 10)
    if (!Number.isFinite(n) || n < 0) {
      setDraft(String(manual))
      return
    }
    if (n === manual) return
    onPatch({ [row.manualField]: n })
  }

  function nudge(delta: number) {
    const next = Math.max(0, manual + delta)
    onPatch({ [row.manualField]: next })
  }

  function applyAuto() {
    if (auto !== manual) onPatch({ [row.manualField]: auto })
  }

  return (
    <tr className="border-b border-border/60 last:border-0 group">
      <td className="px-4 py-3 text-sm text-foreground">
        <div className="flex items-center gap-2">
          <span>{row.label}</span>
          {loggable && (
            <button
              type="button"
              onClick={onOpenLog}
              className="opacity-0 group-hover:opacity-100 transition-opacity inline-flex items-center gap-1 text-[10px] font-semibold text-primary hover:underline"
              title="Log activity tied to a deal"
            >
              <Sparkles className="h-3 w-3" />
              Log
            </button>
          )}
        </div>
      </td>
      <td className="px-3 py-3 text-sm text-right text-muted-foreground tabular-nums">
        {target}
      </td>
      <td className="px-3 py-3 text-right">
        <div className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-1">
          <button
            type="button"
            onClick={() => nudge(-1)}
            disabled={manual === 0}
            className="h-6 w-6 inline-flex items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label="Decrement"
          >
            <Minus className="h-3 w-3" />
          </button>
          <input
            type="number"
            min={0}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commitDraft}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault()
                commitDraft()
                ;(e.target as HTMLInputElement).blur()
              } else if (e.key === "Escape") {
                setDraft(String(manual))
                ;(e.target as HTMLInputElement).blur()
              }
            }}
            className="w-10 bg-transparent text-center text-sm font-semibold text-foreground tabular-nums focus:outline-none"
          />
          <button
            type="button"
            onClick={() => nudge(1)}
            className="h-6 w-6 inline-flex items-center justify-center text-muted-foreground hover:text-primary"
            aria-label="Increment"
          >
            <Plus className="h-3 w-3" />
          </button>
        </div>
      </td>
      <td className="px-3 py-3 text-right">
        <div className="inline-flex items-center gap-2 justify-end">
          <div className="h-1.5 w-16 rounded-full bg-muted/60 overflow-hidden">
            <div
              className={`h-full transition-all ${
                reachedTarget ? "bg-emerald-500" : "bg-primary"
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-[11px] text-muted-foreground tabular-nums w-9 text-right">
            {progress}%
          </span>
        </div>
      </td>
      <td className="px-3 py-3 text-right">
        {row.autoSource ? (
          auto === manual ? (
            <span className="text-[11px] text-muted-foreground/60 inline-flex items-center gap-1">
              <Check className="h-3 w-3 text-emerald-600" />
              {auto} synced
            </span>
          ) : (
            <button
              type="button"
              onClick={applyAuto}
              className="text-[11px] font-medium text-primary hover:underline"
              title={`Auto-tracked: ${auto}. Click to apply.`}
            >
              Auto: {auto} → apply
            </button>
          )
        ) : (
          <span className="text-[11px] text-muted-foreground/40">—</span>
        )}
      </td>
    </tr>
  )
}
