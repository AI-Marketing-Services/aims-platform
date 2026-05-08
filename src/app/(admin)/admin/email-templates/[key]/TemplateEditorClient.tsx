"use client"

/**
 * Editor surface for one EmailTemplateOverride row.
 *
 * UX model:
 *   - Subject: plain text input.
 *   - Body:    iframe with `designMode = "on"` so the user sees the
 *              fully-rendered email and types inline. No HTML markup
 *              visible by default. A "View HTML" toggle drops down
 *              to a raw textarea for power users.
 *
 * Defaults are server-rendered via dry-run (see page.tsx) and handed
 * to us as `defaultSubject` / `defaultHtml` — so the editor always
 * starts populated with exactly what the production send would
 * produce. If a saved override exists, that wins; otherwise we seed
 * the default into the editable fields.
 *
 * Save → PUT to /api/admin/email-templates/[key]
 * Test → POST .../test (defaults recipient to admin's own email)
 * Reset to default (no override saved) → just resets the editor.
 * Revert override (override exists) → DELETE.
 */

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react"
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
  RefreshCw,
  Link as LinkIcon,
  Unlink,
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
  /** Used as the title attribute on the iframe for accessibility. */
  displayName: string
  defaultSubject: string
  defaultHtml: string
  override: OverrideShape | null
}

export function TemplateEditorClient({
  templateKey,
  displayName,
  defaultSubject,
  defaultHtml,
  override,
}: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  // Initial editable values: override (if saved) → default (otherwise).
  const initialSubject = override?.subject ?? defaultSubject
  const initialHtml = override?.html ?? defaultHtml

  const [subject, setSubject] = useState(initialSubject)
  const [html, setHtml] = useState(initialHtml)
  const [note, setNote] = useState(override?.note ?? "")
  const [view, setView] = useState<"visual" | "html">("visual")
  const [testRecipient, setTestRecipient] = useState("")
  const [savingState, setSavingState] = useState<
    "idle" | "saving" | "sending" | "reverting"
  >("idle")
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(
    override?.updatedAt ?? null,
  )

  const hasOverride = lastSavedAt !== null
  const dirty =
    subject !== (override?.subject ?? defaultSubject) ||
    html !== (override?.html ?? defaultHtml) ||
    note !== (override?.note ?? "")

  // Latest timestamp the server reports for THIS template. Set every
  // time we successfully save AND on every staleness poll. When the
  // editor has unsaved edits AND remoteUpdatedAt is newer than
  // lastSavedAt, a banner appears warning that someone else saved
  // since the editor was opened.
  const [remoteUpdatedAt, setRemoteUpdatedAt] = useState<string | null>(
    override?.updatedAt ?? null,
  )

  const otherEditorSavedSince =
    dirty &&
    remoteUpdatedAt !== null &&
    remoteUpdatedAt !== (lastSavedAt ?? null)

  // Poll the server every 30s while the tab is open. Cheap (one row
  // by primary key) and the only way an editor finds out a colleague
  // hit save before they did. Skips while a save / send-test / revert
  // is mid-flight to avoid clobbering its own optimistic update.
  useEffect(() => {
    let cancelled = false
    async function poll() {
      try {
        const res = await fetch(
          `/api/admin/email-templates/${encodeURIComponent(templateKey)}`,
          { cache: "no-store" },
        )
        if (!res.ok) return
        const body = (await res.json()) as {
          override?: { updatedAt?: string } | null
        }
        if (cancelled) return
        setRemoteUpdatedAt(body.override?.updatedAt ?? null)
      } catch {
        // Network blip — try again next tick.
      }
    }
    const id = setInterval(() => {
      if (savingState === "idle") void poll()
    }, 30_000)
    return () => {
      cancelled = true
      clearInterval(id)
    }
  }, [templateKey, savingState])

  async function performSave(force: boolean) {
    setSavingState("saving")
    try {
      const res = await fetch(
        `/api/admin/email-templates/${encodeURIComponent(templateKey)}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            subject,
            html,
            note: note || undefined,
            // Optimistic-concurrency token: the timestamp we last saw on
            // the server. Server returns 409 if the row has moved.
            expectedUpdatedAt: force ? undefined : lastSavedAt ?? null,
            ...(force ? { force: true } : {}),
          }),
        },
      )

      if (res.status === 409) {
        const err = (await res.json().catch(() => ({}))) as {
          message?: string
          latest?: { updatedAt?: string }
        }
        const latestTs = err.latest?.updatedAt
          ? new Date(err.latest.updatedAt).toLocaleTimeString()
          : "just now"
        const choice = window.confirm(
          `Someone else saved this template at ${latestTs}.\n\n` +
            `Click OK to overwrite their version with yours.\n` +
            `Click Cancel to keep your edits visible and reload to see ` +
            `their version (use the browser refresh button when ready).`,
        )
        if (choice) {
          await performSave(true)
        } else {
          // Surface the remote update so the staleness banner stays
          // visible until the user reloads.
          if (err.latest?.updatedAt) setRemoteUpdatedAt(err.latest.updatedAt)
          toast.message(
            "Save canceled. Refresh to see their version, then re-apply your edits.",
          )
        }
        return
      }

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err?.error || `Save failed (${res.status})`)
      }
      const body = (await res.json()) as {
        override?: { updatedAt?: string }
      }
      const ts = body.override?.updatedAt ?? new Date().toISOString()
      setLastSavedAt(ts)
      setRemoteUpdatedAt(ts)
      toast.success("Override saved. Future sends will use this version.")
      startTransition(() => router.refresh())
    } catch (err) {
      const message = err instanceof Error ? err.message : "Save failed"
      toast.error(message)
    } finally {
      setSavingState("idle")
    }
  }

  async function handleSave() {
    if (!subject.trim() || !html.trim()) {
      toast.error("Subject + body are both required.")
      return
    }
    await performSave(false)
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
        "Revert to the code default? This deletes your saved override and resets the editor to the default copy.",
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
      // Reset the editor to the code default in-place.
      setSubject(defaultSubject)
      setHtml(defaultHtml)
      setNote("")
      setLastSavedAt(null)
      toast.success("Reverted. Editor reset to the code default.")
      startTransition(() => router.refresh())
    } catch (err) {
      const message = err instanceof Error ? err.message : "Revert failed"
      toast.error(message)
    } finally {
      setSavingState("idle")
    }
  }

  function handleResetToDefault() {
    if (
      dirty &&
      !confirm(
        "Reset editor back to the code default? Any unsaved changes will be lost.",
      )
    ) {
      return
    }
    setSubject(defaultSubject)
    setHtml(defaultHtml)
    toast.success("Editor reset to default.")
  }

  const isBusy = savingState !== "idle" || pending

  return (
    <div className="space-y-5">
      {/* Concurrent-edit banner — fires when the staleness poll
          (or a save attempt) discovers someone else has saved this
          template since the editor was opened AND the local editor
          has unsaved changes. Without this, two admins editing the
          same template at the same time would silently overwrite
          each other on save. */}
      {otherEditorSavedSince && (
        <div className="flex items-start gap-3 px-4 py-3 rounded-xl border border-amber-300 bg-amber-50 text-amber-900">
          <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <div className="text-xs leading-relaxed">
            <p className="font-semibold mb-0.5">
              Someone else saved this template
              {remoteUpdatedAt
                ? ` at ${new Date(remoteUpdatedAt).toLocaleTimeString()}`
                : ""}
              .
            </p>
            <p>
              You still have unsaved edits in this tab. If you hit Save,
              you&apos;ll be asked whether to overwrite their version. To see
              theirs first, refresh the page (your local edits will be
              lost).
            </p>
          </div>
        </div>
      )}

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
                You&apos;re editing the live default copy. Save to override —
                future sends will use your version.
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
          placeholder="Type the subject line…"
          className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm font-medium text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          disabled={isBusy}
        />
        <p className="mt-1 text-[11px] text-muted-foreground">
          Keep it under ~75 chars so Gmail shows the full thing on
          mobile. Curly braces like <code>{"{{firstName}}"}</code> stay
          as-is — interpolation happens upstream in the send function.
        </p>
      </div>

      {/* Body — Visual / HTML toggle */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Email body
          </label>
          <div className="flex items-center gap-1 border border-border rounded-lg p-1 bg-muted/20">
            <button
              type="button"
              onClick={() => setView("visual")}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors",
                view === "visual"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Eye className="h-3 w-3" />
              Visual
            </button>
            <button
              type="button"
              onClick={() => setView("html")}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors",
                view === "html"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Code2 className="h-3 w-3" />
              HTML
            </button>
          </div>
        </div>

        {view === "visual" ? (
          <VisualEditor
            title={displayName}
            html={html}
            onChange={setHtml}
            disabled={isBusy}
          />
        ) : (
          <textarea
            value={html}
            onChange={(e) => setHtml(e.target.value)}
            rows={20}
            className="w-full px-3 py-2 rounded-lg border border-border bg-background text-xs font-mono text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-y leading-relaxed"
            disabled={isBusy}
          />
        )}

        <p className="mt-1 text-[11px] text-muted-foreground">
          {view === "visual" ? (
            <>
              Click anywhere in the email and start typing. Selection
              shortcuts (bold / italic / lists) work like a Google Doc.
              Switch to <span className="font-semibold text-foreground">HTML</span> if
              you need to edit a button URL or layout markup.
            </>
          ) : (
            <>
              Raw HTML. Use inline styles — most email clients strip{" "}
              <code>&lt;style&gt;</code> tags. Switch back to{" "}
              <span className="font-semibold text-foreground">Visual</span> for
              copy edits.
            </>
          )}
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
            disabled={isBusy || dirty}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-background text-foreground text-sm font-medium hover:bg-muted/40 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title={
              dirty
                ? "Save your changes first — Send test always uses the saved version, not your in-progress edits."
                : "Sends through the real production pipeline using the catalog's sample data. Override (if saved) is applied."
            }
          >
            {savingState === "sending" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            {dirty ? "Save first to test" : "Send test"}
          </button>
        </div>

        <div className="flex-1" />

        <button
          type="button"
          onClick={handleResetToDefault}
          disabled={isBusy}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="Resets the editor to the codebase default. Doesn't save anything yet."
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Reset editor to default
        </button>

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
            Delete override
          </button>
        )}
      </div>
    </div>
  )
}

/* --------------------------------------------------------------------- */
/* VisualEditor — iframe with designMode="on"                            */
/*                                                                       */
/* Why iframe? Email HTML uses inline styles + <table> layouts that      */
/* would conflict with the page's Tailwind. An iframe gives us a         */
/* sandboxed Gmail-like rendering surface, and `designMode="on"` makes   */
/* every text node inside it editable. Cursor + selection + bold/italic  */
/* shortcuts all "just work" via execCommand.                            */
/*                                                                       */
/* We sync changes back to React state via an `input` listener on the    */
/* iframe's body — debounced lightly to avoid thrashing setState on      */
/* every keystroke.                                                      */
/* --------------------------------------------------------------------- */
function VisualEditor({
  html,
  onChange,
  disabled,
  title,
}: {
  html: string
  onChange: (next: string) => void
  disabled?: boolean
  title: string
}) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null)
  // Track the html value the iframe was last seeded with, so external
  // resets (e.g. "Reset to default") re-seed the iframe but normal
  // typing doesn't blow away the user's cursor.
  const seededRef = useRef<string>("")
  // Stable ref to the latest onChange so the iframe listener doesn't
  // need to be re-attached when the parent re-renders.
  const onChangeRef = useRef(onChange)
  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])

  useEffect(() => {
    const iframe = iframeRef.current
    if (!iframe) return

    function setup() {
      const doc = iframe!.contentDocument
      if (!doc) return

      // Re-seed the iframe content only when the parent's html changed
      // from somewhere OTHER than this iframe (e.g. parent reset). Strip any
      // leading doctype before writing — `doc.write` re-adds one, so passing
      // `<!doctype html><html>...</html>` would nest. We defensively normalise.
      if (html !== seededRef.current) {
        const seedHtml = (html || "<p>(empty)</p>").replace(
          /^\s*<!doctype[^>]*>\s*/i,
          "",
        )
        doc.open()
        doc.write(seedHtml)
        doc.close()
        seededRef.current = html
        try {
          doc.designMode = disabled ? "off" : "on"
        } catch {
          // Some browsers throw if called too early — retry on next tick.
        }
      }

      const onInput = () => {
        const innerHtml = doc.documentElement?.outerHTML ?? ""
        const wrapped = innerHtml.startsWith("<!")
          ? innerHtml
          : `<!doctype html>${innerHtml}`
        seededRef.current = wrapped
        onChangeRef.current(wrapped)
      }

      // Bind input listener. Capture the cleanup so the effect can tear it
      // down — otherwise old `onInput` closures stack up across renders and
      // every keystroke fires N setState calls (one per past render).
      doc.addEventListener("input", onInput)
      return () => doc.removeEventListener("input", onInput)
    }

    // Setup returns its own cleanup (the input-listener teardown). We need
    // to forward it whether setup ran inline (doc already loaded) or after
    // the load event — otherwise switching between templates leaves the
    // previous template's input listener attached to the now-recycled iframe.
    let cleanup: (() => void) | undefined
    const onLoad = () => {
      cleanup = setup()
    }
    if (iframe.contentDocument?.readyState === "complete") {
      cleanup = setup()
    } else {
      iframe.addEventListener("load", onLoad, { once: true })
    }
    return () => {
      cleanup?.()
      iframe.removeEventListener("load", onLoad)
    }
  }, [html, disabled])

  // Toggle designMode when disabled changes.
  useEffect(() => {
    const doc = iframeRef.current?.contentDocument
    if (!doc) return
    try {
      doc.designMode = disabled ? "off" : "on"
    } catch {
      // ignore
    }
  }, [disabled])

  // Floating toolbar — basic formatting via execCommand. Not all email
  // clients render every tag, but bold/italic/links are universally safe.
  const exec = useMemo(
    () => (cmd: string, value?: string) => {
      const doc = iframeRef.current?.contentDocument
      if (!doc) return
      try {
        // execCommand is deprecated but still works everywhere and is
        // by far the simplest way to format inside designMode. The
        // alternative (Tiptap / Slate) adds 100KB+ of deps for what's
        // ultimately a copy-tweaking surface for non-engineers.
        doc.execCommand(cmd, false, value)
        const newHtml = doc.documentElement?.outerHTML ?? ""
        const wrapped = newHtml.startsWith("<!")
          ? newHtml
          : `<!doctype html>${newHtml}`
        seededRef.current = wrapped
        onChangeRef.current(wrapped)
      } catch {
        // ignore
      }
    },
    [],
  )

  return (
    <div className="rounded-lg border border-border bg-white overflow-hidden">
      <div className="flex items-center gap-1 px-3 py-2 border-b border-border bg-muted/20">
        <ToolbarBtn onClick={() => exec("bold")} title="Bold (⌘B)">
          <span className="font-bold">B</span>
        </ToolbarBtn>
        <ToolbarBtn onClick={() => exec("italic")} title="Italic (⌘I)">
          <span className="italic">I</span>
        </ToolbarBtn>
        <ToolbarBtn
          onClick={() => exec("underline")}
          title="Underline (⌘U)"
        >
          <span className="underline">U</span>
        </ToolbarBtn>
        <div className="w-px h-4 bg-border mx-1" />
        <ToolbarBtn
          onClick={() => exec("insertUnorderedList")}
          title="Bullet list"
        >
          •
        </ToolbarBtn>
        <ToolbarBtn
          onClick={() => exec("insertOrderedList")}
          title="Numbered list"
        >
          1.
        </ToolbarBtn>
        <div className="w-px h-4 bg-border mx-1" />
        <ToolbarBtn
          onClick={() => {
            const url = prompt("Link URL:")
            if (url) exec("createLink", url)
          }}
          title="Insert link"
        >
          <LinkIcon className="h-3 w-3" />
        </ToolbarBtn>
        <ToolbarBtn
          onClick={() => exec("unlink")}
          title="Remove link"
        >
          <Unlink className="h-3 w-3" />
        </ToolbarBtn>
        <div className="flex-1" />
        <p className="text-[10px] text-muted-foreground hidden sm:block">
          Click in the email and type. Standard shortcuts work.
        </p>
      </div>
      <iframe
        ref={iframeRef}
        title={`${title} — body editor`}
        className="w-full h-[600px] bg-white"
      />
    </div>
  )
}

function ToolbarBtn({
  onClick,
  title,
  children,
}: {
  onClick: () => void
  title: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => {
        // Prevent the iframe from losing focus when we click the toolbar.
        e.preventDefault()
      }}
      onClick={onClick}
      title={title}
      className="h-7 min-w-7 px-2 rounded text-xs text-foreground hover:bg-muted/60 transition-colors flex items-center justify-center"
    >
      {children}
    </button>
  )
}
