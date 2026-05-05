"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  FileCode2,
  Save,
  Copy,
  Check,
  Trash2,
  Loader2,
  Briefcase,
  AlertTriangle,
  Edit3,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface ScriptDetailClientProps {
  scriptId: string
  initialTitle: string
  initialContent: string
  scriptType: string
  linkedDeal: {
    id: string
    companyName: string
    contactName: string | null
  } | null
  createdAt: string
  updatedAt: string
}

export function ScriptDetailClient({
  scriptId,
  initialTitle,
  initialContent,
  scriptType,
  linkedDeal,
  createdAt,
  updatedAt,
}: ScriptDetailClientProps) {
  const router = useRouter()
  const [title, setTitle] = useState(initialTitle)
  const [content, setContent] = useState(initialContent)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [savedAt, setSavedAt] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [, startTransition] = useTransition()

  const dirty = title !== initialTitle || content !== initialContent

  async function handleSave() {
    setSaveError(null)
    setSaving(true)
    try {
      const res = await fetch(`/api/portal/scripts/${scriptId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), content }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setSaveError(typeof data.error === "string" ? data.error : "Save failed")
        return
      }
      setSavedAt(new Date().toLocaleTimeString())
      setEditing(false)
      startTransition(() => router.refresh())
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Network error")
    } finally {
      setSaving(false)
    }
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // ignore
    }
  }

  async function handleDelete() {
    if (!confirmDelete) {
      setConfirmDelete(true)
      setTimeout(() => setConfirmDelete(false), 3000)
      return
    }
    try {
      const res = await fetch(`/api/portal/scripts/${scriptId}`, {
        method: "DELETE",
      })
      if (res.ok) {
        router.push("/portal/scripts")
      }
    } catch {
      // ignore
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 min-w-0">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <FileCode2 className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0">
            {editing ? (
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="text-xl font-bold bg-transparent border-b border-primary/30 focus:outline-none focus:border-primary text-foreground min-w-0 w-full"
              />
            ) : (
              <h1 className="text-xl font-bold text-foreground">{title}</h1>
            )}
            <div className="flex items-center gap-3 mt-1 text-[11px] text-muted-foreground">
              <span className="uppercase tracking-wider font-semibold">
                {scriptType.replace(/_/g, " ")}
              </span>
              {linkedDeal && (
                <Link
                  href={`/portal/crm/${linkedDeal.id}`}
                  className="inline-flex items-center gap-1 hover:text-primary"
                >
                  <Briefcase className="h-3 w-3" />
                  {linkedDeal.companyName}
                </Link>
              )}
              <span>
                Updated {new Date(updatedAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {!editing ? (
            <>
              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-2 text-xs font-semibold text-foreground hover:border-primary hover:text-primary transition-colors"
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-primary" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    Copy
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="inline-flex items-center gap-1.5 rounded-md bg-primary text-primary-foreground px-3 py-2 text-xs font-semibold hover:bg-primary/90 transition-colors"
              >
                <Edit3 className="h-3.5 w-3.5" />
                Edit
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => {
                  setTitle(initialTitle)
                  setContent(initialContent)
                  setEditing(false)
                  setSaveError(null)
                }}
                disabled={saving}
                className="inline-flex items-center gap-1 rounded-md border border-border px-3 py-2 text-xs text-muted-foreground hover:text-foreground"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving || !dirty}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-xs font-semibold transition-colors",
                  dirty
                    ? "bg-primary text-primary-foreground hover:bg-primary/90"
                    : "bg-muted text-muted-foreground cursor-not-allowed",
                )}
              >
                {saving ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Saving…
                  </>
                ) : (
                  <>
                    <Save className="h-3.5 w-3.5" />
                    Save changes
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>

      {saveError && (
        <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
          <span>{saveError}</span>
        </div>
      )}
      {savedAt && !editing && (
        <p className="text-[11px] text-primary">Saved at {savedAt}</p>
      )}

      {/* Content body */}
      <div className="rounded-xl border border-border bg-card p-5">
        {editing ? (
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={24}
            className="w-full font-mono text-[13px] leading-relaxed text-foreground bg-background border border-border rounded-lg p-3 focus:outline-none focus:ring-1 focus:ring-primary/50 resize-y"
          />
        ) : (
          <pre className="font-mono text-[13px] leading-relaxed text-foreground whitespace-pre-wrap">
            {content}
          </pre>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Created {new Date(createdAt).toLocaleDateString()}</span>
        <button
          type="button"
          onClick={handleDelete}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-md px-2 py-1 transition-colors",
            confirmDelete
              ? "bg-destructive/10 text-destructive border border-destructive/30"
              : "text-muted-foreground hover:text-destructive hover:bg-destructive/10",
          )}
        >
          <Trash2 className="h-3 w-3" />
          {confirmDelete ? "Click again to delete" : "Delete script"}
        </button>
      </div>
    </div>
  )
}
