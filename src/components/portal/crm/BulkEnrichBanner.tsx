"use client"

import { useEffect, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Sparkles, Loader2, Check, AlertTriangle } from "lucide-react"

/**
 * BulkEnrichBanner — appears above the Kanban when the operator has
 * unenriched ClientDeals. One-click 'Enrich all pending' with a clear
 * worst-case cost preview. Updates state on success and refreshes the
 * Kanban to show the new enrichment data.
 */
export function BulkEnrichBanner({ creditBalance }: { creditBalance: number }) {
  const router = useRouter()
  const [pending, setPending] = useState<number | null>(null)
  const [estCost, setEstCost] = useState<number>(0)
  const [perDeal, setPerDeal] = useState<number>(80)
  const [running, setRunning] = useState(false)
  const [, startTransition] = useTransition()
  const [result, setResult] = useState<{
    enriched: number
    errors: number
    stopped: boolean
    stoppedReason: string | null
  } | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch("/api/portal/crm/deals/bulk-enrich")
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return
        if (typeof d.pending === "number") {
          setPending(d.pending)
          setEstCost(d.estimatedMaxCost ?? 0)
          setPerDeal(d.perDealMax ?? 80)
        }
      })
      .catch(() => {
        if (!cancelled) setPending(0)
      })
    return () => {
      cancelled = true
    }
  }, [])

  // Don't render if nothing to enrich
  if (pending === null || pending === 0) return null

  const insufficient = creditBalance < perDeal

  async function handleBulk() {
    setError(null)
    setRunning(true)
    setResult(null)
    try {
      const res = await fetch("/api/portal/crm/deals/bulk-enrich", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ onlyUnenriched: true, max: 20 }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        if (res.status === 402) {
          setError(`Insufficient credits — need at least ${data.required ?? perDeal}.`)
        } else {
          setError(typeof data.error === "string" ? data.error : "Bulk enrich failed")
        }
        return
      }
      setResult({
        enriched: data.enriched ?? 0,
        errors: data.errors ?? 0,
        stopped: data.stopped ?? false,
        stoppedReason: data.stoppedReason ?? null,
      })
      setPending(Math.max(0, (pending ?? 0) - (data.enriched ?? 0)))
      startTransition(() => router.refresh())
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error")
    } finally {
      setRunning(false)
    }
  }

  if (result) {
    return (
      <div className="mb-4 rounded-xl border border-primary/30 bg-primary/5 px-4 py-3 flex items-start gap-3">
        <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
        <div className="flex-1 text-sm">
          <p className="font-semibold text-foreground">
            Enriched {result.enriched} deal{result.enriched === 1 ? "" : "s"}.
          </p>
          {result.errors > 0 && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {result.errors} failed. Check Deal detail pages for retry.
            </p>
          )}
          {result.stopped && result.stoppedReason && (
            <p className="text-xs text-primary mt-0.5">{result.stoppedReason}</p>
          )}
        </div>
        <button
          type="button"
          onClick={() => setResult(null)}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          Dismiss
        </button>
      </div>
    )
  }

  return (
    <div className="mb-4 rounded-xl border border-primary/30 bg-primary/5 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-3 min-w-0">
        <Sparkles className="h-4 w-4 text-primary shrink-0" />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground">
            {pending} deal{pending === 1 ? "" : "s"} {pending === 1 ? "is" : "are"} not yet enriched
          </p>
          <p className="text-[11px] text-muted-foreground">
            Bulk-enrich up to 20 at a time · ~{perDeal} credits per deal worst case ·{" "}
            estimated max <strong className="text-foreground">{Math.min(estCost, perDeal * 20).toLocaleString()}</strong> for the next batch
          </p>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 text-xs text-destructive">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <button
        type="button"
        onClick={handleBulk}
        disabled={running || insufficient}
        className="inline-flex items-center gap-1.5 rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {running ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Enriching…
          </>
        ) : (
          <>
            <Sparkles className="h-4 w-4" />
            Enrich {Math.min(pending, 20)} now
          </>
        )}
      </button>
    </div>
  )
}
