"use client"

import { useEffect, useState } from "react"
import { Zap } from "lucide-react"
import { cn } from "@/lib/utils"

interface UsageRow {
  type: string
  used: number
  allowance: number
  remaining: number
}

const TYPE_LABELS: Record<string, string> = {
  lead_scout: "Lead Scout",
  proposal_generate: "Proposals",
  signal_digest: "Signal Digest",
  ai_chat: "AI Chat",
}

export function UsageWidget() {
  const [rows, setRows] = useState<UsageRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/portal/usage")
      .then((r) => r.json())
      .then((d) => { setRows(d.usage ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="bg-card border border-border rounded-xl p-4 animate-pulse">
        <div className="h-4 w-24 bg-muted rounded mb-3" />
        <div className="space-y-2">
          {[1, 2, 3].map((i) => <div key={i} className="h-3 bg-muted rounded" />)}
        </div>
      </div>
    )
  }

  const activeRows = rows.filter((r) => r.allowance > 0)

  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <Zap className="h-3.5 w-3.5 text-primary" />
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Monthly Credits</p>
      </div>
      <div className="space-y-3">
        {activeRows.map((row) => {
          const pct = Math.min(100, Math.round((row.used / row.allowance) * 100))
          const warn = pct >= 80
          return (
            <div key={row.type}>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-foreground">{TYPE_LABELS[row.type] ?? row.type}</span>
                <span className={cn("font-mono", warn ? "text-primary font-bold" : "text-muted-foreground")}>
                  {row.used}/{row.allowance}
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <div
                  className={cn("h-full rounded-full transition-all", warn ? "bg-primary" : "bg-primary/50")}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          )
        })}
        {activeRows.length === 0 && (
          <p className="text-xs text-muted-foreground/60">No usage this month</p>
        )}
      </div>
    </div>
  )
}
