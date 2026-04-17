"use client"

import { useState } from "react"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

export function CancelSubscriptionButton({
  subscriptionId,
  serviceName,
}: {
  subscriptionId: string
  serviceName: string
}) {
  const [loading, setLoading] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [cancelled, setCancelled] = useState(false)

  const handleCancel = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/portal/cancel-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscriptionId }),
      })
      const data = await res.json()
      if (res.ok) {
        setCancelled(true)
        setShowConfirm(false)
        toast.success(`${serviceName} will cancel at the end of the billing period.`)
      } else {
        toast.error(data.error ?? "Failed to cancel. Please contact support.")
      }
    } catch {
      toast.error("Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  if (cancelled) {
    return (
      <span className="text-sm text-orange-400 font-medium">
        Cancels at period end
      </span>
    )
  }

  if (showConfirm) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">Cancel {serviceName}?</span>
        <button
          onClick={handleCancel}
          disabled={loading}
          className="text-sm text-primary border border-primary/30 rounded-lg px-3 py-1.5 hover:bg-primary/10 transition-colors disabled:opacity-60"
        >
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Confirm"}
        </button>
        <button
          onClick={() => setShowConfirm(false)}
          disabled={loading}
          className="text-sm text-muted-foreground border border-border rounded-lg px-3 py-1.5 hover:bg-surface transition-colors"
        >
          Keep
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => setShowConfirm(true)}
      className="text-sm text-muted-foreground border border-border rounded-lg px-3 py-1.5 hover:bg-surface transition-colors"
    >
      Cancel
    </button>
  )
}
