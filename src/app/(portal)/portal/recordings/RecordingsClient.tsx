"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Plus, Sparkles, AlertCircle, Mic, X } from "lucide-react"

interface Deal {
  id: string
  companyName: string
}

interface Recording {
  id: string
  title: string
  source: string | null
  clientDealId: string | null
  createdAt: string
  summary: Record<string, unknown> | null
}

export function RecordingsClient({
  deals,
  initialRecordings,
}: {
  deals: Deal[]
  initialRecordings: Recording[]
}) {
  const router = useRouter()
  const [recordings, setRecordings] = useState<Recording[]>(initialRecordings)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  return (
    <>
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-sm font-bold text-foreground">Your recordings</h2>
        <button
          type="button"
          onClick={() => setCreating(true)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
          New recording
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive flex items-start gap-2">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          {error}
        </div>
      )}

      {recordings.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card/40 p-12 text-center">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 mb-4">
            <Mic className="h-7 w-7 text-primary/60" />
          </div>
          <p className="font-semibold text-foreground mb-1">
            No recordings yet
          </p>
          <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
            Paste a Zoom or Meet transcript and the AI will extract the buyer
            summary and draft your follow-up email.
          </p>
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add your first recording
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {recordings.map((r) => {
            const summary = r.summary as { summary?: string; scoreOutOf10?: number } | null
            return (
              <Link
                key={r.id}
                href={`/portal/recordings/${r.id}`}
                className="rounded-xl border border-border bg-card p-4 hover:border-primary/40 transition-colors"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="text-sm font-bold text-foreground truncate">
                    {r.title}
                  </h3>
                  {summary?.scoreOutOf10 !== undefined && (
                    <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded-full shrink-0">
                      {summary.scoreOutOf10}/10
                    </span>
                  )}
                </div>
                {r.source && (
                  <p className="text-[11px] text-muted-foreground truncate mb-2">
                    {r.source}
                  </p>
                )}
                <p className="text-xs text-muted-foreground line-clamp-3">
                  {summary?.summary ?? "Click to view summary"}
                </p>
                <p className="text-[10px] text-muted-foreground mt-2">
                  {new Date(r.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              </Link>
            )
          })}
        </div>
      )}

      {creating && (
        <CreateRecordingModal
          deals={deals}
          onClose={() => setCreating(false)}
          onCreated={(rec) => {
            setRecordings((prev) => [rec, ...prev])
            setCreating(false)
            router.push(`/portal/recordings/${rec.id}`)
          }}
          onError={setError}
        />
      )}
    </>
  )
}

function CreateRecordingModal({
  deals,
  onClose,
  onCreated,
  onError,
}: {
  deals: Deal[]
  onClose: () => void
  onCreated: (rec: Recording) => void
  onError: (msg: string) => void
}) {
  const [title, setTitle] = useState("")
  const [source, setSource] = useState("")
  const [transcript, setTranscript] = useState("")
  const [clientDealId, setClientDealId] = useState("")
  const [busy, setBusy] = useState(false)

  const handle = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !transcript.trim()) return
    setBusy(true)
    onError("")
    try {
      const res = await fetch("/api/portal/recordings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          source: source.trim() || undefined,
          transcript,
          clientDealId: clientDealId || undefined,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok)
        throw new Error(data?.error ?? `Failed (${res.status})`)
      onCreated({
        id: data.recording.id,
        title: data.recording.title,
        source: data.recording.source,
        clientDealId: data.recording.clientDealId,
        createdAt: data.recording.createdAt,
        summary: data.recording.summary,
      })
    } catch (err) {
      onError(err instanceof Error ? err.message : "Failed")
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <form
        onSubmit={handle}
        className="w-full max-w-2xl rounded-2xl bg-card border border-border shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="text-base font-bold text-foreground">
            <Sparkles className="inline h-4 w-4 mr-1 text-primary" />
            Add a recording
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded hover:bg-muted text-muted-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4 flex-1 overflow-y-auto">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">
              Title
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={200}
              placeholder="Acme Co — discovery call"
              className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary/40"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">
              Source (optional)
            </label>
            <input
              type="text"
              value={source}
              onChange={(e) => setSource(e.target.value)}
              maxLength={200}
              placeholder="Zoom – April 28, 30 min"
              className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary/40"
            />
          </div>

          {deals.length > 0 && (
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                Link to deal (optional)
              </label>
              <select
                value={clientDealId}
                onChange={(e) => setClientDealId(e.target.value)}
                className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary/40"
              >
                <option value="">— none —</option>
                {deals.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.companyName}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">
              Transcript
            </label>
            <textarea
              required
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              maxLength={200_000}
              rows={14}
              placeholder="Paste the full call transcript here…"
              className="w-full bg-card border border-border rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:border-primary/40 leading-relaxed"
            />
            <p className="text-[10px] text-muted-foreground mt-1">
              The AI extracts buyer pain, budget, decision-makers, objections,
              action items, plus drafts the follow-up email automatically.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-border bg-muted/10">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={busy || !title.trim() || !transcript.trim()}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Sparkles className="h-4 w-4" />
            {busy ? "Analyzing…" : "Analyze + save"}
          </button>
        </div>
      </form>
    </div>
  )
}
