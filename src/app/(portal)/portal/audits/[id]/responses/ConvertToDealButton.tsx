"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Briefcase, Loader2, Check, ArrowRight, AlertTriangle } from "lucide-react"
import Link from "next/link"

interface ConvertToDealButtonProps {
  responseId: string
  /** If known (already-converted), renders a "View deal" link straight away. */
  initialDealId?: string | null
  className?: string
}

/**
 * Convert an AuditResponse into a ClientDeal in one click. Idempotent
 * server-side (re-clicks return the existing deal id). On success
 * shows a "View deal" affordance so operators can jump straight to
 * the new pipeline entry.
 */
export function ConvertToDealButton({
  responseId,
  initialDealId,
  className,
}: ConvertToDealButtonProps) {
  const router = useRouter()
  const [dealId, setDealId] = useState<string | null>(initialDealId ?? null)
  const [converting, setConverting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleConvert() {
    setError(null)
    setConverting(true)
    try {
      const res = await fetch(
        `/api/portal/audits/responses/${responseId}/convert-to-deal`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        },
      )
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "Conversion failed")
        return
      }
      setDealId(data.dealId)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error")
    } finally {
      setConverting(false)
    }
  }

  if (dealId) {
    return (
      <Link
        href={`/portal/crm/${dealId}`}
        onClick={(e) => e.stopPropagation()}
        className={`inline-flex items-center gap-1 rounded-md border border-emerald-500/30 bg-emerald-500/5 px-2.5 py-1 text-[11px] font-semibold text-emerald-600 hover:border-emerald-500/60 transition-colors ${className ?? ""}`}
      >
        <Check className="h-3 w-3" />
        In CRM
        <ArrowRight className="h-2.5 w-2.5" />
      </Link>
    )
  }

  if (error) {
    return (
      <div className="inline-flex items-center gap-1 text-[11px] text-destructive">
        <AlertTriangle className="h-3 w-3" />
        {error}
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation()
        handleConvert()
      }}
      disabled={converting}
      className={`inline-flex items-center gap-1 rounded-md border border-border bg-background px-2.5 py-1 text-[11px] font-semibold text-foreground hover:border-primary hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${className ?? ""}`}
    >
      {converting ? (
        <>
          <Loader2 className="h-3 w-3 animate-spin" />
          Converting...
        </>
      ) : (
        <>
          <Briefcase className="h-3 w-3" />
          Convert to deal
        </>
      )}
    </button>
  )
}
