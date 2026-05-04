"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Trash2, Loader2 } from "lucide-react"

interface Props {
  submissionId: string
  contactEmail: string
  contactName: string
}

/**
 * Permanent-delete control for a Collective Application row.
 *
 * SAFETY MODEL: defaults to AIMS-only delete. Close CRM is NEVER touched
 * unless the admin explicitly checks "Also remove from Close". Stephen's
 * shared Vendingpreneurs workspace is the source of truth for sales
 * activity and we must not accidentally nuke its data while cleaning
 * up local seed/test rows.
 *
 * Confirmation flow:
 *   1. Click trash icon to arm
 *   2. Optional: tick "Also remove from Close"
 *   3. Click Confirm to commit; Cancel to back out
 */
export function DeleteApplicationButton({
  submissionId,
  contactEmail,
  contactName,
}: Props) {
  const router = useRouter()
  const [armed, setArmed] = useState(false)
  const [alsoClose, setAlsoClose] = useState(false)
  const [isPending, startTransition] = useTransition()

  const reset = () => {
    setArmed(false)
    setAlsoClose(false)
  }

  const handleDelete = () => {
    startTransition(async () => {
      try {
        // Default: skipClose=1 (Close stays untouched). Only when the
        // admin explicitly opts in do we let the API cascade to Close.
        const url = alsoClose
          ? `/api/admin/applications/${submissionId}`
          : `/api/admin/applications/${submissionId}?skipClose=1`
        const res = await fetch(url, { method: "DELETE" })
        const data = (await res.json().catch(() => ({}))) as {
          error?: string
          submissionsDeleted?: number
          dealsDeleted?: number
          cascadedToClose?: boolean
        }
        if (!res.ok) {
          toast.error(data.error ?? "Failed to delete application")
          setArmed(false)
          return
        }
        const parts: string[] = []
        if (data.submissionsDeleted)
          parts.push(`${data.submissionsDeleted} application${data.submissionsDeleted > 1 ? "s" : ""}`)
        if (data.dealsDeleted)
          parts.push(`${data.dealsDeleted} deal${data.dealsDeleted > 1 ? "s" : ""}`)
        if (data.cascadedToClose) parts.push("Close lead")
        toast.success(
          parts.length > 0
            ? `Deleted ${parts.join(", ")} for ${contactName || contactEmail}`
            : `Deleted ${contactName || contactEmail} (AIMS only)`,
        )
        router.refresh()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to delete")
        setArmed(false)
      }
    })
  }

  if (isPending) {
    return (
      <span className="inline-flex items-center justify-center w-7 h-7 text-ink/50">
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      </span>
    )
  }

  if (!armed) {
    return (
      <button
        type="button"
        onClick={() => setArmed(true)}
        className="inline-flex items-center justify-center w-7 h-7 rounded-sm text-ink/40 hover:text-[#981B1B] hover:bg-[#981B1B]/5 transition-colors"
        title={`Delete application for ${contactName || contactEmail}`}
        aria-label="Delete application"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    )
  }

  return (
    <span className="inline-flex flex-col items-end gap-1">
      <label className="inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider text-ink/60 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={alsoClose}
          onChange={(e) => setAlsoClose(e.target.checked)}
          className="rounded border-line h-3 w-3"
        />
        Also remove from Close
      </label>
      <span className="inline-flex items-center gap-1">
        <button
          type="button"
          onClick={handleDelete}
          className="text-[10px] font-mono uppercase tracking-wider px-2 py-1 rounded-sm border border-[#981B1B] bg-[#981B1B] text-white hover:bg-[#7a1515] transition-colors"
          title={
            alsoClose
              ? "Confirm: deletes from AIMS AND Close"
              : "Confirm: deletes from AIMS only (Close untouched)"
          }
        >
          {alsoClose ? "Confirm (AIMS + Close)" : "Confirm (AIMS only)"}
        </button>
        <button
          type="button"
          onClick={reset}
          className="text-[10px] font-mono uppercase tracking-wider px-2 py-1 rounded-sm border border-line bg-surface text-ink/70 hover:bg-panel transition-colors"
          title="Cancel"
        >
          Cancel
        </button>
      </span>
    </span>
  )
}
