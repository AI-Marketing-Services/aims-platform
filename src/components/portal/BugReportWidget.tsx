"use client"

import { useRef, useState } from "react"
import {
  Bug,
  X,
  Loader2,
  CheckCircle2,
  ImagePlus,
  Image as ImageIcon,
} from "lucide-react"

type Category = "BUG" | "IDEA" | "QUESTION" | "OTHER"

const CATEGORY_LABEL: Record<Category, string> = {
  BUG: "Bug",
  IDEA: "Idea / Suggestion",
  QUESTION: "Question",
  OTHER: "Other",
}

const SCREENSHOT_ALLOWED_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
])
const SCREENSHOT_MAX_BYTES = 5 * 1024 * 1024 // 5 MB — keep in sync with API

interface BugReportWidgetProps {
  variant?: "pill" | "sidebar-link" | "chat-tile"
}

export function BugReportWidget({ variant = "pill" }: BugReportWidgetProps) {
  const [open, setOpen] = useState(false)
  const [category, setCategory] = useState<Category>("BUG")
  const [title, setTitle] = useState("")
  const [details, setDetails] = useState("")
  const [screenshot, setScreenshot] = useState<File | null>(null)
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(
    null,
  )
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  function reset() {
    setCategory("BUG")
    setTitle("")
    setDetails("")
    clearScreenshot()
    setSubmitting(false)
    setSubmitted(false)
    setError(null)
  }

  function close() {
    setOpen(false)
    setTimeout(reset, 250)
  }

  function clearScreenshot() {
    setScreenshot(null)
    if (screenshotPreview) URL.revokeObjectURL(screenshotPreview)
    setScreenshotPreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  function attachFile(file: File) {
    if (!SCREENSHOT_ALLOWED_TYPES.has(file.type)) {
      setError("Screenshot must be PNG, JPEG, or WebP.")
      return
    }
    if (file.size > SCREENSHOT_MAX_BYTES) {
      setError("Screenshot exceeds 5 MB. Crop or compress and try again.")
      return
    }
    setError(null)
    // Replace any existing preview cleanly so we don't leak object URLs.
    if (screenshotPreview) URL.revokeObjectURL(screenshotPreview)
    setScreenshot(file)
    setScreenshotPreview(URL.createObjectURL(file))
  }

  function handleFilePick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) attachFile(file)
  }

  // Allow Cmd/Ctrl+V to paste a clipboard screenshot directly into the form.
  // Browsers expose this when the user copies an image (snipping tool,
  // Cmd+Shift+4 → clipboard, etc.) — far less friction than the file picker.
  function handlePaste(e: React.ClipboardEvent<HTMLDivElement>) {
    if (screenshot) return
    const items = e.clipboardData?.items
    if (!items) return
    for (const item of items) {
      if (item.kind === "file" && item.type.startsWith("image/")) {
        const file = item.getAsFile()
        if (file) {
          attachFile(file)
          e.preventDefault()
          break
        }
      }
    }
  }

  // Drag + drop for desktop users who already have a screenshot file.
  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
    if (screenshot) return
    const file = e.dataTransfer.files?.[0]
    if (file) attachFile(file)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (submitting) return
    setError(null)
    setSubmitting(true)
    try {
      // Build the request. Multipart when a screenshot is attached so we
      // can stream the binary alongside the form fields without base64
      // bloat; JSON otherwise to keep the lightweight path unchanged.
      let res: Response
      const meta = {
        category,
        title: title.trim(),
        details: details.trim(),
        pageUrl:
          typeof window !== "undefined" ? window.location.href : undefined,
        userAgent:
          typeof navigator !== "undefined" ? navigator.userAgent : undefined,
      }
      if (screenshot) {
        const form = new FormData()
        form.append("category", meta.category)
        form.append("title", meta.title)
        form.append("details", meta.details)
        if (meta.pageUrl) form.append("pageUrl", meta.pageUrl)
        if (meta.userAgent) form.append("userAgent", meta.userAgent)
        form.append("screenshot", screenshot)
        res = await fetch("/api/portal/feedback", {
          method: "POST",
          body: form,
        })
      } else {
        res = await fetch("/api/portal/feedback", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(meta),
        })
      }
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
            onPaste={handlePaste}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
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
                <div className="mx-auto h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                </div>
                <p className="text-sm font-semibold text-foreground">
                  Thanks, we got it
                </p>
                <p className="text-xs text-muted-foreground">
                  Our team will review it and follow up if needed.
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

                {/* Screenshot attachment — paste from clipboard, drop a file
                    onto the modal, or click to pick. Capped at 5 MB; PNG /
                    JPEG / WebP only. Crash-resistant: a failed upload still
                    sends the text. */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Screenshot (optional)
                  </label>
                  {screenshotPreview ? (
                    <div className="relative rounded-lg border border-border overflow-hidden bg-background">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={screenshotPreview}
                        alt="Screenshot preview"
                        className="max-h-48 w-full object-contain bg-black/5"
                      />
                      <button
                        type="button"
                        onClick={clearScreenshot}
                        className="absolute top-1.5 right-1.5 p-1 rounded-full bg-black/60 text-white hover:bg-black/80"
                        aria-label="Remove screenshot"
                      >
                        <X className="h-3 w-3" />
                      </button>
                      <div className="px-2 py-1 text-[10px] text-muted-foreground bg-surface/60 border-t border-border truncate">
                        {screenshot?.name ?? "Pasted image"} ·{" "}
                        {screenshot
                          ? `${(screenshot.size / 1024).toFixed(0)} KB`
                          : ""}
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full flex items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-background px-3 py-4 text-xs text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors"
                    >
                      <ImagePlus className="h-4 w-4" />
                      <span>
                        Paste, drop, or{" "}
                        <span className="underline">click to attach</span> a
                        screenshot
                      </span>
                    </button>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={handleFilePick}
                    className="hidden"
                  />
                  <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <ImageIcon className="h-2.5 w-2.5" />
                    PNG/JPEG/WebP up to 5 MB. ⌘V or Ctrl+V to paste from
                    clipboard.
                  </p>
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
                      submitting ||
                      title.trim().length === 0 ||
                      details.trim().length === 0
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
