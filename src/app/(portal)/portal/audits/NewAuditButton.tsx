"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Plus } from "lucide-react"

interface NewAuditButtonProps {
  label?: string
}

export function NewAuditButton({ label = "New audit" }: NewAuditButtonProps) {
  const router = useRouter()
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleClick = async () => {
    if (creating) return
    setCreating(true)
    setError(null)
    try {
      const res = await fetch("/api/portal/audits", { method: "POST" })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body?.error ?? "Failed to create audit")
      }
      const { quiz } = await res.json()
      router.push(`/portal/audits/${quiz.id}`)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create audit")
      setCreating(false)
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={handleClick}
        disabled={creating}
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-60"
      >
        {creating ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Plus className="h-4 w-4" />
        )}
        {creating ? "Creating…" : label}
      </button>
      {error && (
        <p className="text-[11px] text-red-500 max-w-xs text-right">{error}</p>
      )}
    </div>
  )
}
