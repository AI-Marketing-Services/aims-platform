"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { RefreshCw } from "lucide-react"
import { cn } from "@/lib/utils"

export function CloseSyncButton() {
  const router = useRouter()
  const [busy, setBusy] = useState(false)

  async function runSync() {
    setBusy(true)
    try {
      const res = await fetch("/api/admin/close/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ includeOpportunities: true }),
      })
      const body = await res.json()
      if (!res.ok) {
        toast.error(body.error ?? "Sync failed")
        return
      }
      const parts = [
        `${body.total} lead(s)`,
        body.created > 0 ? `${body.created} new` : null,
        body.updated > 0 ? `${body.updated} updated` : null,
        body.wonOpportunityCount > 0
          ? `$${body.totalOpportunityValue.toLocaleString()} won`
          : null,
      ].filter(Boolean)
      toast.success(`Sync complete: ${parts.join(" · ")}`)
      router.refresh()
    } catch {
      toast.error("Network error")
    } finally {
      setBusy(false)
    }
  }

  return (
    <button
      onClick={runSync}
      disabled={busy}
      className="inline-flex items-center gap-2 rounded-lg bg-primary text-white px-4 py-2 text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
    >
      <RefreshCw className={cn("h-4 w-4", busy && "animate-spin")} />
      {busy ? "Syncing..." : "Sync now"}
    </button>
  )
}
