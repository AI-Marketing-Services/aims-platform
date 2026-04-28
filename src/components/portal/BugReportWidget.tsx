"use client"

import { useState } from "react"
import { Bug, X, Loader2, CheckCircle2 } from "lucide-react"

type Category = "BUG" | "IDEA" | "QUESTION" | "OTHER"

const CATEGORY_LABEL: Record<Category, string> = {
  BUG: "Bug",
  IDEA: "Idea / Suggestion",
  QUESTION: "Question",
  OTHER: "Other",
}

interface BugReportWidgetProps {
  variant?: "pill" | "sidebar-link" | "chat-tile"
}

export function BugReportWidget({ variant = "pill" }: BugReportWidgetProps) {
  const [open, setOpen] = useState(false)
  const [category, setCategory] = useState<Category>("BUG")
  const [title, setTitle] = useState("")
  const [details, setDetails] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function reset() {
    setCategory("BUG")
    setTitle("")
    setDetails("")
    setSubmitting(false)
    setSubmitted(false)
    setError(null)
  }

  function close() {
    setOpen(false)
    setTimeout(reset, 250)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (submitting) return
    setError(null)
    setSubmitting(true)
    try {
      const res = await fetch("/api/portal/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category,
          title: title.trim(),
          details: details.trim(),
          pageUrl:
            typeof window !== "undefined" ? window.location.href : undefined,
          userAgent:
            typeof navigator !== "undefined" ? navigator.userAgent : undefined,
        }),
      })
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(body.error ?? "Could not send feedback")
      }
      setSubmitted(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setSubmitting(false)
    }
  }

  const trigger = (() => {
    if (variant === "sidebar-link") {
      return (
        <button
          onClick={() => setOpen(true)}
          className="w-full flex items-center gap-2.5 rounded-lg py-1.5 pl-3 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-surface/80 transition-colors"
        >
          <Bug className="h-4 w-4 shrink-0" />
          <span className="flex-1 text-left">Report a Bug</span>
        </button>
      )
    }
    if (variant === "chat-tile") {
      return (
        <button
          onClick={() => setOpen(true)}
          className="flex flex-col items-center gap-1 px-3 py-2 rounded-lg border border-border bg-card hover:bg-white/5 transition-colors"
        >
          <Bug className="h-4 w-4 text-muted-foreground" />
          <span className="text-[10px] text-muted-foreground text-center leading-tight">
            Report a Bug
          </span>
        </button>
      )
    }
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 left-6 z-40 hidden lg:flex items-center gap-2 px-3 py-2 rounded-full border border-border bg-card text-xs font-semibold text-muted-foreground hover:text-foreground hover:border-primary/30 shadow-md transition-colors"
        aria-label="Report a bug"
      >
        <Bug className="h-3.5 w-3.5" />
        Report a Bug
      </button>
    )
  })()

  return (
    <>
      {trigger}

      {open && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60"
          onClick={close}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-border bg-card shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <div className="flex items-center gap-2">
                <Bug className="h-4 w-4 text-primary" />
                <p className="text-sm font-semibold text-foreground">
                  Send Feedback
                </p>
              </div>
              <button
                onClick={close}
                className="p-1 rounded hover:bg-surface transition-colors"
                aria-label="Close"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>

            {submitted ? (
              <div className="p-8 text-center space-y-3">
                <div className="mx-auto h-10 w-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                </div>
                <p className="text-sm font-semibold text-foreground">
                  Thanks — we got it
                </p>
                <p className="text-xs text-muted-foreground">
                  Adam will review and follow up if needed.
                </p>
                <button
                  onClick={close}
                  className="mt-2 text-xs font-medium text-primary hover:underline"
                >
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="p-5 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Type
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {(Object.keys(CATEGORY_LABEL) as Category[]).map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setCategory(c)}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                          category === c
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border bg-surface text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {CATEGORY_LABEL[c]}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="bug-title"
                    className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
                  >
                    Title
                  </label>
                  <input
                    id="bug-title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Short summary"
                    maxLength={140}
                    required
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                  />
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="bug-details"
                    className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
                  >
                    Details
                  </label>
                  <textarea
                    id="bug-details"
                    value={details}
                    onChange={(e) => setDetails(e.target.value)}
                    placeholder="What happened? What did you expect? Any steps to reproduce?"
                    maxLength={4000}
                    rows={5}
                    required
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 resize-none"
                  />
                </div>

                {error && (
                  <p className="text-xs text-red-500 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                    {error}
                  </p>
                )}

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={close}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={
                      submitting || title.trim().length === 0 || details.trim().length === 0
                    }
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary text-white hover:bg-primary/90 disabled:opacity-50 transition-colors"
                  >
                    {submitting && <Loader2 className="h-3 w-3 animate-spin" />}
                    {submitting ? "Sending…" : "Send"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  )
}
