"use client"

import { useState } from "react"
import { Loader2, ArrowUpRight, AlertTriangle } from "lucide-react"

const TOPUP_OPTIONS = [
  { credits: 500, priceLabel: "$20" },
  { credits: 2_000, priceLabel: "$60" },
  { credits: 10_000, priceLabel: "$200" },
] as const

export function CreditTopupButton() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleTopup(credits: number) {
    setError(null)
    setLoading(credits)
    try {
      const res = await fetch("/api/portal/credits/topup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credits }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data.url) {
        throw new Error(data.error ?? "Couldn't start checkout")
      }
      window.location.href = data.url
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error")
      setLoading(null)
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-1.5 rounded-md bg-primary text-primary-foreground px-3 py-1.5 text-sm font-semibold hover:bg-primary/90 transition-colors"
      >
        Buy credits
        <ArrowUpRight className="h-3.5 w-3.5" />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-72 rounded-xl border border-border bg-card shadow-lg z-20 overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Top up credits
            </p>
          </div>
          <ul className="divide-y divide-border">
            {TOPUP_OPTIONS.map((opt) => (
              <li key={opt.credits}>
                <button
                  type="button"
                  onClick={() => handleTopup(opt.credits)}
                  disabled={loading !== null}
                  className="w-full flex items-center justify-between gap-3 px-4 py-3 hover:bg-muted/40 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-left"
                >
                  <div>
                    <p className="text-sm font-bold text-foreground">
                      {opt.credits.toLocaleString()} credits
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      ~{Math.floor(opt.credits / 80)} full enrichments
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-foreground">{opt.priceLabel}</span>
                    {loading === opt.credits ? (
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    ) : null}
                  </div>
                </button>
              </li>
            ))}
          </ul>
          {error && (
            <div className="px-4 py-2 border-t border-destructive/30 bg-destructive/5 text-xs text-destructive flex items-start gap-2">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
