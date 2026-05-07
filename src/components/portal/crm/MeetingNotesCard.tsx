"use client"

import { useState, useEffect, useRef, useTransition } from "react"
import { useRouter } from "next/navigation"
import {
  StickyNote,
  Plus,
  X,
  FileText,
  Mic,
  File as FileIcon,
  ScrollText,
  Trash2,
  Loader2,
  AlertTriangle,
  Upload,
  Check,
  ChevronDown,
  ChevronUp,
  Calendar,
  ExternalLink,
} from "lucide-react"
import { cn } from "@/lib/utils"

// Mirrors the ClientDealNoteKind enum so we don't drift when new kinds
// (e.g. PROBLEM_HYPOTHESIS, QUICK_WIN_HYPOTHESIS) are added. Anything
// outside the file/transcript card surfaces as a plain "NOTE" badge.
type NoteKind =
  | "NOTE"
  | "TRANSCRIPT"
  | "RECORDING"
  | "PDF"
  | "FILE"
  | "PROBLEM_HYPOTHESIS"
  | "QUICK_WIN_HYPOTHESIS"

interface NoteRow {
  id: string
  kind: NoteKind
  title: string | null
  content: string | null
  fileUrl: string | null
  fileName: string | null
  fileSize: number | null
  fileType: string | null
  meetingDate: string | null
  createdAt: string
}

interface MeetingNotesCardProps {
  dealId: string
  initialNotes: NoteRow[]
}

type Mode = "closed" | "text" | "file"

export function MeetingNotesCard({ dealId, initialNotes }: MeetingNotesCardProps) {
  const router = useRouter()
  const [notes, setNotes] = useState<NoteRow[]>(initialNotes)
  const [mode, setMode] = useState<Mode>("closed")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [, startTransition] = useTransition()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Form state
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [kind, setKind] = useState<"NOTE" | "TRANSCRIPT">("NOTE")
  const [meetingDate, setMeetingDate] = useState("")
  const [pendingFile, setPendingFile] = useState<File | null>(null)

  // Reset form when mode closes
  useEffect(() => {
    if (mode === "closed") {
      setTitle("")
      setContent("")
      setKind("NOTE")
      setMeetingDate("")
      setPendingFile(null)
      setError(null)
    }
  }, [mode])

  function toggleExpand(id: string) {
    const next = new Set(expanded)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setExpanded(next)
  }

  async function handleSubmitText() {
    if (!content.trim()) {
      setError("Content can't be empty")
      return
    }
    setError(null)
    setSubmitting(true)
    try {
      const res = await fetch(`/api/portal/crm/deals/${dealId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind,
          title: title.trim() || undefined,
          content: content.trim(),
          meetingDate: meetingDate
            ? new Date(meetingDate).toISOString()
            : undefined,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "Save failed")
        return
      }
      setNotes((n) => [data.note, ...n])
      setMode("closed")
      startTransition(() => router.refresh())
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error")
    } finally {
      setSubmitting(false)
    }
  }

  async function handleSubmitFile() {
    if (!pendingFile) {
      setError("Pick a file first")
      return
    }
    setError(null)
    setSubmitting(true)
    try {
      const formData = new FormData()
      formData.append("file", pendingFile)
      if (title.trim()) formData.append("title", title.trim())
      if (meetingDate)
        formData.append("meetingDate", new Date(meetingDate).toISOString())

      const res = await fetch(`/api/portal/crm/deals/${dealId}/notes`, {
        method: "POST",
        body: formData,
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "Upload failed")
        return
      }
      setNotes((n) => [data.note, ...n])
      setMode("closed")
      startTransition(() => router.refresh())
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error")
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(noteId: string) {
    if (confirmDelete !== noteId) {
      setConfirmDelete(noteId)
      setTimeout(() => setConfirmDelete(null), 3000)
      return
    }
    try {
      await fetch(
        `/api/portal/crm/deals/${dealId}/notes?noteId=${noteId}`,
        { method: "DELETE" },
      )
      setNotes((n) => n.filter((x) => x.id !== noteId))
      setConfirmDelete(null)
      startTransition(() => router.refresh())
    } catch {
      // ignore
    }
  }

  const totalChars = notes.reduce(
    (sum, n) => sum + (n.content?.length ?? 0),
    0,
  )

  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <StickyNote className="h-4 w-4 text-primary" />
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Meeting notes &amp; files ({notes.length})
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          {mode !== "closed" && (
            <button
              type="button"
              onClick={() => setMode("closed")}
              className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
            >
              <X className="h-3 w-3" />
              Cancel
            </button>
          )}
          {mode === "closed" && (
            <>
              <button
                type="button"
                onClick={() => setMode("text")}
                className="text-xs text-primary hover:underline inline-flex items-center gap-1"
              >
                <ScrollText className="h-3 w-3" />
                Paste notes
              </button>
              <span className="text-muted-foreground">·</span>
              <button
                type="button"
                onClick={() => setMode("file")}
                className="text-xs text-primary hover:underline inline-flex items-center gap-1"
              >
                <Upload className="h-3 w-3" />
                Upload file
              </button>
            </>
          )}
        </div>
      </div>

      {totalChars > 0 && (
        <p className="text-[11px] text-muted-foreground -mt-1">
          AI follow-ups + proposal recommendations on this deal automatically
          read your most recent notes for context.
        </p>
      )}

      {/* Text-note form */}
      {mode === "text" && (
        <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 space-y-2.5">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setKind("NOTE")}
              className={cn(
                "px-2.5 py-1 rounded text-xs font-semibold border transition-colors",
                kind === "NOTE"
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-background text-muted-foreground hover:border-primary/40",
              )}
            >
              Note
            </button>
            <button
              type="button"
              onClick={() => setKind("TRANSCRIPT")}
              className={cn(
                "px-2.5 py-1 rounded text-xs font-semibold border transition-colors",
                kind === "TRANSCRIPT"
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-background text-muted-foreground hover:border-primary/40",
              )}
            >
              Transcript
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Title (optional, e.g. 'Discovery call')"
              className="px-2.5 py-1.5 rounded border border-border bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
            />
            <input
              type="datetime-local"
              value={meetingDate}
              onChange={(e) => setMeetingDate(e.target.value)}
              className="px-2.5 py-1.5 rounded border border-border bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
            />
          </div>

          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={
              kind === "TRANSCRIPT"
                ? "Paste your meeting transcript here. AI will reference specifics in future follow-ups + proposals."
                : "Type or paste your notes about this lead. What was discussed? What objections came up? What's the next step?"
            }
            rows={kind === "TRANSCRIPT" ? 12 : 6}
            className="w-full px-3 py-2 rounded border border-border bg-background text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/50 resize-y font-mono text-[12.5px] leading-relaxed"
          />

          {error && (
            <div className="flex items-start gap-2 text-xs text-destructive">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex justify-between items-center">
            <p className="text-[10px] text-muted-foreground">
              {content.length.toLocaleString()} chars · max 120K
            </p>
            <button
              type="button"
              onClick={handleSubmitText}
              disabled={submitting || !content.trim()}
              className="inline-flex items-center gap-1.5 rounded bg-primary text-primary-foreground px-3 py-1.5 text-xs font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Saving…
                </>
              ) : (
                <>
                  <Check className="h-3 w-3" />
                  Save {kind === "TRANSCRIPT" ? "transcript" : "note"}
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* File-upload form */}
      {mode === "file" && (
        <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 space-y-2.5">
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => setPendingFile(e.target.files?.[0] ?? null)}
            accept=".pdf,.txt,.md,.csv,audio/*,video/*"
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full inline-flex items-center justify-center gap-2 rounded-lg border-2 border-dashed border-primary/30 hover:border-primary/60 hover:bg-primary/5 px-4 py-6 transition-colors"
          >
            <Upload className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">
              {pendingFile ? pendingFile.name : "Choose file"}
            </span>
            {pendingFile && (
              <span className="text-[11px] text-muted-foreground">
                ({(pendingFile.size / 1024 / 1024).toFixed(1)} MB)
              </span>
            )}
          </button>
          <p className="text-[10px] text-muted-foreground text-center -mt-1">
            PDF · audio (mp3/m4a/wav) · text · markdown · 10MB max
          </p>

          <div className="grid grid-cols-2 gap-2">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Title (optional)"
              className="px-2.5 py-1.5 rounded border border-border bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
            />
            <input
              type="datetime-local"
              value={meetingDate}
              onChange={(e) => setMeetingDate(e.target.value)}
              className="px-2.5 py-1.5 rounded border border-border bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
            />
          </div>

          {error && (
            <div className="flex items-start gap-2 text-xs text-destructive">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleSubmitFile}
              disabled={submitting || !pendingFile}
              className="inline-flex items-center gap-1.5 rounded bg-primary text-primary-foreground px-3 py-1.5 text-xs font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Uploading…
                </>
              ) : (
                <>
                  <Check className="h-3 w-3" />
                  Upload
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Notes list */}
      {notes.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-4">
          No notes yet. Paste a meeting transcript or upload a PDF — the AI on
          this deal will reference specifics from your notes in every future
          follow-up draft + proposal.
        </p>
      ) : (
        <ul className="space-y-2">
          {notes.map((n) => {
            const isExpanded = expanded.has(n.id)
            const isFile = n.fileUrl && n.fileName
            const Icon = iconForKind(n.kind)
            const dateStr = n.meetingDate ?? n.createdAt
            return (
              <li
                key={n.id}
                className="rounded-lg border border-border bg-background overflow-hidden"
              >
                <div
                  className="px-3 py-2 flex items-center gap-2 cursor-pointer hover:bg-muted/40 transition-colors"
                  onClick={() => !isFile && toggleExpand(n.id)}
                >
                  <div className="h-7 w-7 rounded bg-primary/10 flex items-center justify-center shrink-0">
                    <Icon className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {n.title ?? n.fileName ?? labelForKind(n.kind)}
                    </p>
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                      <span className="uppercase tracking-wider">{n.kind}</span>
                      <span>·</span>
                      <span className="inline-flex items-center gap-0.5">
                        <Calendar className="h-2.5 w-2.5" />
                        {new Date(dateStr).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                      {n.content && (
                        <>
                          <span>·</span>
                          <span>{n.content.length.toLocaleString()} chars</span>
                        </>
                      )}
                      {n.fileSize && (
                        <>
                          <span>·</span>
                          <span>{(n.fileSize / 1024 / 1024).toFixed(1)}MB</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {isFile && (
                      <a
                        href={n.fileUrl!}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="p-1 rounded text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                        title="Open file in new tab"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    )}
                    {!isFile && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleExpand(n.id)
                        }}
                        className="p-1 rounded text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {isExpanded ? (
                          <ChevronUp className="h-3.5 w-3.5" />
                        ) : (
                          <ChevronDown className="h-3.5 w-3.5" />
                        )}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDelete(n.id)
                      }}
                      className={cn(
                        "p-1 rounded transition-colors",
                        confirmDelete === n.id
                          ? "text-red-400 bg-red-400/10"
                          : "text-muted-foreground hover:text-red-400 hover:bg-red-400/10",
                      )}
                      title={
                        confirmDelete === n.id
                          ? "Click again to delete"
                          : "Delete note"
                      }
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Expanded text content */}
                {isExpanded && n.content && (
                  <div className="px-3 pb-3 pt-1 border-t border-border">
                    <pre className="text-[12.5px] leading-relaxed text-foreground whitespace-pre-wrap font-mono">
                      {n.content}
                    </pre>
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

function iconForKind(kind: NoteRow["kind"]) {
  switch (kind) {
    case "TRANSCRIPT":
      return ScrollText
    case "PDF":
      return FileText
    case "RECORDING":
      return Mic
    case "FILE":
      return FileIcon
    default:
      return StickyNote
  }
}

function labelForKind(kind: NoteRow["kind"]) {
  if (kind === "PROBLEM_HYPOTHESIS") return "Problem hypothesis"
  if (kind === "QUICK_WIN_HYPOTHESIS") return "Quick-win hypothesis"
  return kind.charAt(0) + kind.slice(1).toLowerCase()
}

// Suppress unused import — Plus may be used in a future "new note from
// template" feature. Keep import light for now.
void Plus
