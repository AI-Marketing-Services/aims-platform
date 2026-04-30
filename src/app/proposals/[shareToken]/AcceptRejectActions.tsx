"use client"

import { useState } from "react"
import { Check, X, Loader2 } from "lucide-react"

interface AcceptRejectActionsProps {
  shareToken: string
  proposalTitle: string
  initialStatus: string
  brandColor: string
}

/**
 * Public-facing accept/reject buttons on the proposal share page.
 * No auth required — share token is the auth.
 *
 * On accept: posts to /api/proposals/:shareToken/respond, success state
 * thanks the recipient and shows next steps.
 * On reject: prompts for optional reason, posts, shows ack.
 */
export function AcceptRejectActions({
  shareToken,
  proposalTitle,
  initialStatus,
  brandColor,
}: AcceptRejectActionsProps) {
  const [status, setStatus] = useState(initialStatus)
  const [submitting, setSubmitting] = useState<"accept" | "reject" | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showRejectForm, setShowRejectForm] = useState(false)
  const [recipientName, setRecipientName] = useState("")
  const [reason, setReason] = useState("")

  // Already responded — show ack instead of buttons
  if (status === "ACCEPTED") {
    return (
      <div
        className="rounded-xl border p-6 text-center"
        style={{
          borderColor: `${brandColor}30`,
          backgroundColor: `${brandColor}08`,
        }}
      >
        <Check
          className="h-8 w-8 mx-auto mb-2"
          style={{ color: brandColor }}
        />
        <p className="text-base font-bold" style={{ color: brandColor }}>
          Proposal accepted
        </p>
        <p className="text-sm mt-1 text-muted-foreground">
          Thank you. {proposalTitle} is moving forward — we&apos;ll be in touch
          shortly with next steps and your invoice.
        </p>
      </div>
    )
  }

  if (status === "REJECTED") {
    return (
      <div className="rounded-xl border border-muted p-6 text-center">
        <p className="text-sm text-muted-foreground">
          Thanks for letting us know — this proposal has been declined.
        </p>
      </div>
    )
  }

  async function handleSubmit(action: "accept" | "reject") {
    setError(null)
    setSubmitting(action)
    try {
      const res = await fetch(`/api/proposals/${shareToken}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          recipientName: recipientName.trim() || undefined,
          reason: action === "reject" ? reason.trim() || undefined : undefined,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "Couldn't record your response")
        return
      }
      setStatus(action === "accept" ? "ACCEPTED" : "REJECTED")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error")
    } finally {
      setSubmitting(null)
    }
  }

  return (
    <div className="space-y-3">
      <div className="text-center mb-4">
        <p className="text-sm font-semibold text-foreground">
          Ready to move forward?
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Click Accept to proceed, or let us know if it&apos;s not the right fit.
        </p>
      </div>

      <input
        type="text"
        value={recipientName}
        onChange={(e) => setRecipientName(e.target.value)}
        placeholder="Your name (optional)"
        className="w-full px-3 py-2 rounded-lg bg-card border border-border text-foreground text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1"
        style={
          {
            ["--tw-ring-color" as string]: brandColor,
          } as React.CSSProperties
        }
      />

      {!showRejectForm ? (
        <div className="flex flex-col sm:flex-row gap-2">
          <button
            type="button"
            onClick={() => handleSubmit("accept")}
            disabled={submitting !== null}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg px-6 py-3 text-sm font-bold uppercase tracking-wider text-white shadow-md hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
            style={{ backgroundColor: brandColor }}
          >
            {submitting === "accept" ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Accepting…
              </>
            ) : (
              <>
                <Check className="h-4 w-4" />
                Accept proposal
              </>
            )}
          </button>
          <button
            type="button"
            onClick={() => setShowRejectForm(true)}
            disabled={submitting !== null}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-border px-6 py-3 text-sm font-semibold text-muted-foreground hover:text-foreground hover:bg-card disabled:opacity-50 transition-colors"
          >
            Decline
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            placeholder="Help us learn — why isn't this a fit? (optional)"
            className="w-full px-3 py-2 rounded-lg bg-card border border-border text-foreground text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 resize-none"
            style={
              {
                ["--tw-ring-color" as string]: brandColor,
              } as React.CSSProperties
            }
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => handleSubmit("reject")}
              disabled={submitting !== null}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-2.5 text-sm font-semibold text-destructive hover:bg-destructive/10 disabled:opacity-50 transition-colors"
            >
              {submitting === "reject" ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Submitting…
                </>
              ) : (
                <>
                  <X className="h-4 w-4" />
                  Confirm decline
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => setShowRejectForm(false)}
              disabled={submitting !== null}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              Back
            </button>
          </div>
        </div>
      )}

      {error && (
        <p className="text-xs text-destructive text-center">{error}</p>
      )}
    </div>
  )
}
