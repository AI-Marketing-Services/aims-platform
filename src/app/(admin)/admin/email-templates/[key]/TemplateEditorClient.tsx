"use client"

/**
 * Editor surface for one EmailTemplateOverride row.
 *
 * The detail page hands us the saved override (or `null` if nothing is
 * customised yet). The user types into Subject + HTML, hits Save, and
 * we PUT to /api/admin/email-templates/[key]. Save success bumps the
 * `lastSavedAt` indicator; we leave the form values alone so they can
 * keep editing without losing context.
 *
 * Send Test fires the real send pipeline through the catalog's
 * `sample()` factory + `send()` wrapper — same code path as
 * production — so the override is applied automatically. Defaults the
 * recipient to the admin's own Clerk email so we can never test-send to
 * a real client.
 *
 * Revert deletes the override row, then refreshes the page so we
 * re-fetch and the editor falls back to "no override" state. The send
 * pipeline will resume using the code default on the next email.
 */

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  Save,
  Send,
  RotateCcw,
  Eye,
  Code2,
  AlertTriangle,
  Loader2,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface OverrideShape {
  subject: string
  html: string
  note: string | null
  updatedAt: string
}

interface Props {
  templateKey: string
  displayName: string
  override: OverrideShape | null
}

const PLACEHOLDER_SUBJECT =
  "e.g. Welcome to AI Operator Collective — your first 7 days"

const PLACEHOLDER_HTML = `<!doctype html>
<html>
  <body style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1a1a1a;">
    <h1 style="font-size: 24px; margin-bottom: 16px;">Hey {{firstName}},</h1>

    <p>Write your email body here. You can use HTML.</p>

    <p>
      <a
        href="https://aimseos.com/portal/dashboard"
        style="display: inline-block; padding: 12px 24px; background: #C4972A; color: white; text-decoration: none; border-radius: 6px;"
      >
        Open the portal
      </a>
    </p>

    <p style="color: #666; font-size: 12px; margin-top: 32px;">
      AI Operator Collective &middot; aimseos.com
    </p>
  </body>
</html>`

export function TemplateEditorClient({
  templateKey,
  displayName,
  override,
}: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  const [subject, setSubject] = useState(override?.subject ?? "")
  const [html, setHtml] = useState(override?.html ?? "")
  const [note, setNote] = useState(override?.note ?? "")
  const [view, setView] = useState<"edit" | "preview">("edit")
  const [testRecipient, setTestRecipient] = useState("")
  const [savingState, setSavingState] = useState<
    "idle" | "saving" | "sending" | "reverting"
  >("idle")
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(
    override?.updatedAt ?? null,
  )

  const hasOverride = lastSavedAt !== null
  const dirty =
    subject !== (override?.subject ?? "") ||
    html !== (override?.html ?? "") ||
    note !== (override?.note ?? "")

  async function handleSave() {
    if (!subject.trim() || !html.trim()) {
      toast.error("Subject + HTML are both required.")
      return
    }
    setSavingState("saving")
    try {
      const res = await fetch(
        `/api/admin/email-templates/${encodeURIComponent(templateKey)}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ subject, html, note: note || undefined }),
        },
      )
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err?.error || `Save failed (${res.status})`)
      }
      const body = (await res.json()) as {
        override?: { updatedAt?: string }
      }
      setLastSavedAt(body.override?.updatedAt ?? new Date().toISOString())
      toast.success("Override saved. Future sends will use this version.")
      startTransition(() => router.refresh())
    } catch (err) {
      const message = err instanceof Error ? err.message : "Save failed"
      toast.error(message)
    } finally {
      setSavingState("idle")
    }
  }

  async function handleSendTest() {
    setSavingState("sending")
    try {
      const res = await fetch(
        `/api/admin/email-templates/${encodeURIComponent(templateKey)}/test`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            testRecipient ? { to: testRecipient } : {},
          ),
        },
      )
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err?.error || `Test send failed (${res.status})`)
      }
      const body = (await res.json()) as { recipient?: string }
      toast.success(
        `Test sent to ${body.recipient ?? "your inbox"}. Check Resend if it doesn't arrive in ~30s.`,
      )
    } catch (err) {
      const message = err instanceof Error ? err.message : "Test send failed"
      toast.error(message)
    } finally {
      setSavingState("idle")
    }
  }

  async function handleRevert() {
    if (
      !confirm(
        "Revert to the code default? This deletes your saved override. Future sends will use whatever ships in the codebase.",
      )
    ) {
      return
    }
    setSavingState("reverting")
    try {
      const res = await fetch(
        `/api/admin/email-templates/${encodeURIComponent(templateKey)}`,
        { method: "DELETE" },
      )
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err?.error || `Revert failed (${res.status})`)
      }
      setSubject("")
      setHtml("")
      setNote("")
      setLastSavedAt(null)
      toast.success("Reverted. Sends now use the code default.")
      startTransition(() => router.refresh())
    } catch (err) {
      const message = err instanceof Error ? err.message : "Revert failed"
      toast.error(message)
    } finally {
      setSavingState("idle")
    }
  }

  const isBusy = savingState !== "idle" || pending

  return (
    <div className="space-y-5">
      {/* Status strip */}
      <div
        className={cn(
          "flex flex-wrap items-center justify-between gap-3 px-4 py-3 rounded-xl border text-xs",
          hasOverride
            ? "border-primary/30 bg-primary/[0.04]"
            : "border-border bg-muted/20",
        )}
      >
        <div className="flex items-center gap-2 text-muted-foreground">
          {hasOverride ? (
            <>
              <span className="text-[10px] font-bold uppercase tracking-widest text-primary">
                Customised
              </span>
              <span>
                Last saved{" "}
                {lastSavedAt
                  ? new Date(lastSavedAt).toLocaleString()
                  : "—"}
              </span>
            </>
          ) : (
            <>
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Default (code)
              </span>
              <span>
                No override saved yet. Anything you save here will replace
                the default at send-time.
              </span>
            </>
          )}
        </div>

        {dirty && (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-amber-600">
            <AlertTriangle className="h-3 w-3" />
            Unsaved changes
          </span>
        )}
      </div>

      {/* View toggle */}
      <div className="flex items-center gap-1 border border-border rounded-lg p-1 w-fit bg-muted/20">
        <button
          type="button"
          onClick={() => setView("edit")}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
            view === "edit"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          <Code2 className="h-3.5 w-3.5" />
          Edit
        </button>
        <button
          type="button"
          onClick={() => setView("preview")}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
            view === "preview"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          <Eye className="h-3.5 w-3.5" />
          Preview
        </button>
      </div>

      {/* Editor or preview */}
      {view === "edit" ? (
        <div className="space-y-4">
          {/* Subject */}
          <div>
            <label
              htmlFor={`subject-${templateKey}`}
              className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5"
            >
              Subject line
            </label>
            <input
              id={`subject-${templateKey}`}
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder={PLACEHOLDER_SUBJECT}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm font-medium text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              disabled={isBusy}
            />
            <p className="mt-1 text-[11px] text-muted-foreground">
              Keep it under ~75 chars so Gmail shows the full thing on
              mobile. Curly braces like <code>{"{{firstName}}"}</code> are
              passed through as-is — interpolation happens upstream in the
              send function.
            </p>
          </div>

          {/* HTML body */}
          <div>
            <label
              htmlFor={`html-${templateKey}`}
              className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5"
            >
              HTML body
            </label>
            <textarea
              id={`html-${templateKey}`}
              value={html}
              onChange={(e) => setHtml(e.target.value)}
              placeholder={PLACEHOLDER_HTML}
              rows={20}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-xs font-mono text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-y leading-relaxed"
              disabled={isBusy}
            />
            <p className="mt-1 text-[11px] text-muted-foreground">
              Paste full HTML. Use inline styles — most email clients
              strip <code>&lt;style&gt;</code> tags. Hit{" "}
              <span className="font-semibold text-foreground">Preview</span>{" "}
              above to render it, or <span className="font-semibold text-foreground">Send Test</span>{" "}
              to receive it in your inbox.
            </p>
          </div>

          {/* Internal note */}
          <div>
            <label
              htmlFor={`note-${templateKey}`}
              className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5"
            >
              Internal note (optional)
            </label>
            <input
              id={`note-${templateKey}`}
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Reworded by Jess 5/3 to soften the CTA."
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              disabled={isBusy}
            />
            <p className="mt-1 text-[11px] text-muted-foreground">
              Just for the team — never sent. Helps the next person
              understand why this was changed.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="rounded-lg border border-border bg-muted/20 px-4 py-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
              Subject
            </p>
            <p className="text-sm font-medium text-foreground">
              {subject || (
                <span className="italic text-muted-foreground">
                  (empty — type a subject in the Edit view)
                </span>
              )}
            </p>
          </div>

          <div className="rounded-lg border border-border bg-white overflow-hidden">
            <div className="px-4 py-2 border-b border-border bg-muted/20 flex items-center justify-between">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                HTML preview
              </p>
              <p className="text-[10px] text-muted-foreground">
                Iframe-sandboxed · approximate Gmail rendering
              </p>
            </div>
            {html.trim() ? (
              <iframe
                title={`${displayName} preview`}
                srcDoc={html}
                sandbox=""
                className="w-full h-[600px] bg-white"
              />
            ) : (
              <div className="h-[300px] flex items-center justify-center text-sm text-muted-foreground italic">
                (empty — paste HTML in the Edit view)
              </div>
            )}
          </div>
        </div>
      )}

      {/* Action bar */}
      <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-border">
        <button
          type="button"
          onClick={handleSave}
          disabled={isBusy || !dirty}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {savingState === "saving" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {hasOverride ? "Save changes" : "Save override"}
        </button>

        <div className="flex items-center gap-2">
          <input
            type="email"
            value={testRecipient}
            onChange={(e) => setTestRecipient(e.target.value)}
            placeholder="(your email)"
            className="px-3 py-2 rounded-lg border border-border bg-background text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary w-[200px]"
            disabled={isBusy}
          />
          <button
            type="button"
            onClick={handleSendTest}
            disabled={isBusy}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-background text-foreground text-sm font-medium hover:bg-muted/40 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Sends through the real production pipeline using the catalog's sample data. Override (if saved) is applied."
          >
            {savingState === "sending" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            Send test
          </button>
        </div>

        <div className="flex-1" />

        {hasOverride && (
          <button
            type="button"
            onClick={handleRevert}
            disabled={isBusy}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-muted-foreground hover:text-destructive disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {savingState === "reverting" ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <RotateCcw className="h-3.5 w-3.5" />
            )}
            Revert to default
          </button>
        )}
      </div>
    </div>
  )
}
