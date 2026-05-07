"use client"

import { useState } from "react"
import { Check, Pencil } from "lucide-react"

interface Props {
  kpis: {
    prospects: number
    messagesThisWeek: number
    discoveryRequested: number
    discoveryCompleted: number
    revenueImpact: number
    strongOpportunities: number
  }
  onPatch: (delta: {
    revenueImpact?: number
    strongOpportunities?: number
  }) => void
}

const fmtUsd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
})

export function ScorecardKpiTiles({ kpis, onPatch }: Props) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      <Tile
        label="Prospects"
        value={kpis.prospects.toLocaleString()}
        sublabel="Calls completed"
      />
      <Tile
        label="Messages this week"
        value={kpis.messagesThisWeek.toLocaleString()}
        sublabel="Logged manually"
      />
      <Tile
        label="Discovery requested"
        value={kpis.discoveryRequested.toLocaleString()}
        sublabel="Asked for the meeting"
      />
      <Tile
        label="Discovery completed"
        value={kpis.discoveryCompleted.toLocaleString()}
        sublabel="Met + recorded"
      />
      <EditableTile
        label="Revenue impact"
        value={fmtUsd.format(kpis.revenueImpact)}
        rawValue={kpis.revenueImpact}
        onSave={(v) => onPatch({ revenueImpact: v })}
        sublabel="MRR / one-time"
        kind="currency"
      />
      <EditableTile
        label="Strong opportunities"
        value={kpis.strongOpportunities.toLocaleString()}
        rawValue={kpis.strongOpportunities}
        onSave={(v) => onPatch({ strongOpportunities: v })}
        sublabel="Pipeline-grade"
        kind="integer"
      />
    </div>
  )
}

function Tile({
  label,
  value,
  sublabel,
}: {
  label: string
  value: string
  sublabel?: string
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="text-2xl font-bold text-foreground mt-1.5 tabular-nums">
        {value}
      </p>
      {sublabel && (
        <p className="text-[11px] text-muted-foreground mt-0.5">{sublabel}</p>
      )}
    </div>
  )
}

function EditableTile({
  label,
  value,
  rawValue,
  onSave,
  sublabel,
  kind,
}: {
  label: string
  value: string
  rawValue: number
  onSave: (next: number) => void
  sublabel?: string
  kind: "currency" | "integer"
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(rawValue.toString())

  function commit() {
    const parsed = kind === "integer" ? parseInt(draft, 10) : parseFloat(draft)
    if (Number.isFinite(parsed) && parsed !== rawValue) {
      onSave(Math.max(0, parsed))
    }
    setEditing(false)
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4 group relative">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      {editing ? (
        <div className="mt-1.5 flex items-center gap-1">
          {kind === "currency" && (
            <span className="text-xl font-bold text-muted-foreground">$</span>
          )}
          <input
            autoFocus
            type="number"
            value={draft}
            min={0}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === "Enter") commit()
              if (e.key === "Escape") {
                setDraft(rawValue.toString())
                setEditing(false)
              }
            }}
            className="text-2xl font-bold text-foreground tabular-nums w-full bg-transparent focus:outline-none"
          />
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={commit}
            className="text-muted-foreground hover:text-primary"
            aria-label="Save"
          >
            <Check className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => {
            setDraft(rawValue.toString())
            setEditing(true)
          }}
          className="mt-1.5 block text-left w-full"
        >
          <span className="text-2xl font-bold text-foreground tabular-nums">
            {value}
          </span>
        </button>
      )}
      {sublabel && (
        <p className="text-[11px] text-muted-foreground mt-0.5">{sublabel}</p>
      )}
      <Pencil className="absolute top-3 right-3 h-3 w-3 text-muted-foreground/40 opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
  )
}
