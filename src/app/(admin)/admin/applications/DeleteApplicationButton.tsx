"use client"

import { useState, useTransition, useEffect } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Trash2, Loader2, AlertTriangle, X } from "lucide-react"

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
 * UX: trash icon opens a centered confirmation modal (not an inline
 * confirm crammed into the row's last td — that overflowed the table
 * and looked janky on every screen size).
 */
export function DeleteApplicationButton({
  submissionId,
  contactEmail,
  contactName,
}: Props) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [alsoClose, setAlsoClose] = useState(false)
  const [isPending, startTransition] = useTransition()

  // Esc to close, body scroll lock while open. Both cleaned up on unmount
  // / state change to avoid leaving the page un-scrollable if the user
  // navigates away mid-modal.
  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isPending) close()
    }
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    document.addEventListener("keydown", onKey)
    return () => {
      document.body.style.overflow = prevOverflow
      document.removeEventListener("keydown", onKey)
    }
    // close() is stable enough — only re-bind when isOpen / isPending changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, isPending])

  const close = () => {
    setIsOpen(false)
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
          close()
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
        close()
        router.refresh()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to delete")
        close()
      }
    })
  }

  const displayName = contactName || contactEmail

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        disabled={isPending}
        className="inline-flex items-center justify-center w-7 h-7 rounded-sm text-ink/40 hover:text-[#981B1B] hover:bg-[#981B1B]/5 transition-colors disabled:opacity-50"
        title={`Delete application for ${displayName}`}
        aria-label="Delete application"
      >
        {isPending ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <Trash2 className="w-3.5 h-3.5" />
        )}
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4 sm:px-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-app-title"
        >
          {/* Backdrop — click to dismiss */}
          <button
            type="button"
            aria-label="Close"
            onClick={() => !isPending && close()}
            className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
          />

          {/* Modal */}
          <div className="relative w-full max-w-md rounded-xl border border-border bg-card text-foreground shadow-2xl">
            <div className="flex items-start gap-3 p-5 border-b border-border">
              <span className="shrink-0 inline-flex items-center justify-center w-9 h-9 rounded-full bg-[#981B1B]/10 text-[#981B1B]">
                <AlertTriangle className="w-4 h-4" />
              </span>
              <div className="flex-1 min-w-0">
                <h2
                  id="delete-app-title"
                  className="text-sm font-semibold text-foreground"
                >
                  Delete this application?
                </h2>
                <p className="mt-1 text-xs text-muted-foreground leading-snug break-words">
                  Removes the submission and any linked deal for{" "}
                  <span className="font-medium text-foreground">
                    {displayName}
                  </span>
                  . This can&apos;t be undone.
                </p>
              </div>
              <button
                type="button"
                onClick={() => !isPending && close()}
                className="shrink-0 -mt-1 -mr-1 p-1 rounded text-ink/40 hover:text-foreground hover:bg-muted transition-colors"
                aria-label="Cancel"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-3">
              <label className="flex items-start gap-2.5 text-xs cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={alsoClose}
                  onChange={(e) => setAlsoClose(e.target.checked)}
                  className="mt-0.5 h-3.5 w-3.5 rounded border-border accent-[#981B1B]"
                  disabled={isPending}
                />
                <span className="leading-snug">
                  <span className="font-medium text-foreground">
                    Also remove from Close CRM
                  </span>
                  <span className="block text-muted-foreground mt-0.5">
                    Off by default — Close is the source of truth for
                    Stephen&apos;s shared workspace, so we don&apos;t touch it
                    unless you opt in.
                  </span>
                </span>
              </label>
            </div>

            <div className="flex items-center justify-end gap-2 p-4 border-t border-border bg-muted/30 rounded-b-xl">
              <button
                type="button"
                onClick={close}
                disabled={isPending}
                className="text-xs font-medium px-3.5 py-2 rounded-md border border-border bg-card text-foreground hover:bg-muted transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isPending}
                className="text-xs font-semibold px-3.5 py-2 rounded-md border border-[#981B1B] bg-[#981B1B] text-white hover:bg-[#7a1515] transition-colors disabled:opacity-50 inline-flex items-center gap-1.5 min-w-[7rem] justify-center"
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Deleting…
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete{alsoClose ? " (AIMS + Close)" : ""}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
