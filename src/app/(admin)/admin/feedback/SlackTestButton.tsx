"use client"

import { useState } from "react"
import { Send, Loader2, CheckCircle2, AlertTriangle } from "lucide-react"

type Result =
  | { kind: "idle" }
  | { kind: "ok"; ts: number }
  | { kind: "error"; message: string; ts: number }

export function SlackTestButton() {
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<Result>({ kind: "idle" })

  async function send() {
    if (busy) return
    setBusy(true)
    try {
      const res = await fetch("/api/admin/notifications/test", { method: "POST" })
      const body = (await res.json().catch(() => ({}))) as { error?: string }
      if (!res.ok) {
        setResult({
          kind: "error",
          message: body.error ?? "Test failed",
          ts: Date.now(),
        })
      } else {
        setResult({ kind: "ok", ts: Date.now() })
      }
    } catch (err) {
      setResult({
        kind: "error",
        message: err instanceof Error ? err.message : "Network error",
        ts: Date.now(),
      })
    } finally {
      setBusy(false)
      // Auto-clear after 6s so the button returns to its idle state.
      setTimeout(() => setResult({ kind: "idle" }), 6000)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={send}
        disabled={busy}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-border bg-card hover:bg-surface text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
        title="Post a test message to #aoc-alerts to verify Slack wiring."
      >
        {busy ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Send className="h-3.5 w-3.5" />
        )}
        {busy ? "Sending…" : "Test Slack"}
      </button>
      {result.kind === "ok" && (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-500">
          <CheckCircle2 className="h-3.5 w-3.5" />
          Posted to #aoc-alerts
        </span>
      )}
      {result.kind === "error" && (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-red-500 max-w-[420px] truncate">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
          {result.message}
        </span>
      )}
    </div>
  )
}
