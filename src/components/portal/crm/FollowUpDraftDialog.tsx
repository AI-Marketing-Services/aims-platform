"use client"

import { useState, useRef, useEffect } from "react"
import {
  MessageSquare,
  Wand2,
  Loader2,
  Copy,
  Check,
  Mail,
  X,
  AlertTriangle,
  RotateCcw,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface FollowUpDraftDialogProps {
  dealId: string
  companyName: string
  defaultRecipientEmail: string | null
  open: boolean
  onClose: () => void
}

type Tone = "friendly" | "direct" | "curious" | "value-led"
type Intent = "check-in" | "share-resource" | "ask-for-meeting" | "respond-to-objection"

const TONES: Array<{ value: Tone; label: string; description: string }> = [
  { value: "friendly", label: "Friendly", description: "Warm, conversational" },
  { value: "direct", label: "Direct", description: "No fluff, to the point" },
  { value: "curious", label: "Curious", description: "Leads with a question" },
  { value: "value-led", label: "Value-led", description: "Leads with insight" },
]

const INTENTS: Array<{ value: Intent; label: string }> = [
  { value: "check-in", label: "Check in" },
  { value: "share-resource", label: "Share resource" },
  { value: "ask-for-meeting", label: "Ask for meeting" },
  { value: "respond-to-objection", label: "Address objection" },
]

export function FollowUpDraftDialog({
  dealId,
  companyName,
  defaultRecipientEmail,
  open,
  onClose,
}: FollowUpDraftDialogProps) {
  const [tone, setTone] = useState<Tone>("friendly")
  const [intent, setIntent] = useState<Intent>("check-in")
  const [customNote, setCustomNote] = useState("")
  const [draft, setDraft] = useState<{
    subject: string
    body: string
    rationale: string | null
    recipientEmail: string | null
  } | null>(null)
  const [drafting, setDrafting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState<"subject" | "body" | "all" | null>(null)
  const subjectInputRef = useRef<HTMLInputElement>(null)
  const bodyTextareaRef = useRef<HTMLTextAreaElement>(null)

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setDraft(null)
      setError(null)
      setCustomNote("")
      setCopied(null)
    }
  }, [open])

  async function handleDraft() {
    setError(null)
    setDrafting(true)
    try {
      const res = await fetch(
        `/api/portal/crm/deals/${dealId}/draft-follow-up`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tone,
            intent,
            customNote: customNote.trim() || undefined,
          }),
        },
      )
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        if (res.status === 402) {
          setError(
            `Need ${data.required ?? 3} credits but have ${data.available ?? 0}.`,
          )
        } else {
          setError(typeof data.error === "string" ? data.error : "Draft failed")
        }
        return
      }
      setDraft({
        subject: data.subject ?? "",
        body: data.body ?? "",
        rationale: data.rationale ?? null,
        recipientEmail: data.recipient?.email ?? defaultRecipientEmail,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error")
    } finally {
      setDrafting(false)
    }
  }

  async function handleCopy(which: "subject" | "body" | "all") {
    if (!draft) return
    const text =
      which === "subject"
        ? draft.subject
        : which === "body"
          ? bodyTextareaRef.current?.value ?? draft.body
          : `Subject: ${subjectInputRef.current?.value ?? draft.subject}\n\n${bodyTextareaRef.current?.value ?? draft.body}`
    try {
      await navigator.clipboard.writeText(text)
      setCopied(which)
      setTimeout(() => setCopied(null), 2000)
    } catch {
      // ignore
    }
  }

  function openInMailto() {
    if (!draft) return
    const subject = subjectInputRef.current?.value ?? draft.subject
    const body = bodyTextareaRef.current?.value ?? draft.body
    const to = draft.recipientEmail ?? ""
    const url = `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    window.open(url, "_blank", "noopener,noreferrer")
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-card border border-border shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-primary" />
            <div>
              <h2 className="text-base font-bold text-foreground">
                Draft a follow-up email
              </h2>
              <p className="text-xs text-muted-foreground">
                For {companyName} · 3 credits per draft
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Setup form (shown until draft is generated) */}
        {!draft && (
          <div className="p-5 space-y-4">
            {/* Tone selector */}
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Tone
              </label>
              <div className="grid grid-cols-2 gap-2">
                {TONES.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setTone(t.value)}
                    className={cn(
                      "rounded-lg border px-3 py-2 text-left text-xs transition-all",
                      tone === t.value
                        ? "border-primary bg-primary/10"
                        : "border-border bg-background hover:border-primary/40",
                    )}
                  >
                    <p className="font-semibold text-foreground">{t.label}</p>
                    <p className="text-[11px] text-muted-foreground">{t.description}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Intent selector */}
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Intent
              </label>
              <div className="flex flex-wrap gap-2">
                {INTENTS.map((i) => (
                  <button
                    key={i.value}
                    type="button"
                    onClick={() => setIntent(i.value)}
                    className={cn(
                      "rounded-md border px-3 py-1.5 text-xs font-medium transition-all",
                      intent === i.value
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-background text-muted-foreground hover:border-primary/40",
                    )}
                  >
                    {i.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom note */}
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Anything specific to mention? (optional)
              </label>
              <textarea
                value={customNote}
                onChange={(e) => setCustomNote(e.target.value)}
                placeholder="e.g. they mentioned they're hiring, or asked about pricing on our last call"
                rows={2}
                maxLength={500}
                className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/50 resize-none"
              />
            </div>

            {error && (
              <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={onClose}
                disabled={drafting}
                className="px-4 py-2 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDraft}
                disabled={drafting}
                className="inline-flex items-center gap-1.5 rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {drafting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Drafting…
                  </>
                ) : (
                  <>
                    <Wand2 className="h-4 w-4" />
                    Draft email
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Generated draft (editable) */}
        {draft && (
          <div className="p-5 space-y-4">
            {draft.rationale && (
              <div className="rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-xs text-muted-foreground">
                <strong className="text-primary">Why this works:</strong>{" "}
                {draft.rationale}
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Subject
                </label>
                <button
                  type="button"
                  onClick={() => handleCopy("subject")}
                  className="text-[11px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
                >
                  {copied === "subject" ? (
                    <>
                      <Check className="h-3 w-3 text-emerald-500" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3" />
                      Copy
                    </>
                  )}
                </button>
              </div>
              <input
                ref={subjectInputRef}
                defaultValue={draft.subject}
                className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Body
                </label>
                <button
                  type="button"
                  onClick={() => handleCopy("body")}
                  className="text-[11px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
                >
                  {copied === "body" ? (
                    <>
                      <Check className="h-3 w-3 text-emerald-500" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3" />
                      Copy
                    </>
                  )}
                </button>
              </div>
              <textarea
                ref={bodyTextareaRef}
                defaultValue={draft.body}
                rows={10}
                className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 resize-none font-mono text-[13px] leading-relaxed"
              />
              <p className="text-[11px] text-muted-foreground mt-1">
                Edit anything before sending — AI never sends, you do.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border">
              <button
                type="button"
                onClick={() => {
                  setDraft(null)
                  setError(null)
                }}
                className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
              >
                <RotateCcw className="h-3 w-3" />
                Re-draft
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleCopy("all")}
                  className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-2 text-xs font-semibold text-foreground hover:bg-muted/40 transition-colors"
                >
                  {copied === "all" ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-500" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      Copy all
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={openInMailto}
                  className="inline-flex items-center gap-1.5 rounded-md bg-primary text-primary-foreground px-3 py-2 text-xs font-semibold hover:bg-primary/90 transition-colors"
                >
                  <Mail className="h-3.5 w-3.5" />
                  Open in mail app
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
