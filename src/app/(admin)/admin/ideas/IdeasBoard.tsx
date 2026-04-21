"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Plus, X, Trash2, ChevronDown, ChevronRight } from "lucide-react"

export type IdeaRecord = {
  id: string
  ownerId: string
  title: string
  body: string
  tags: string[]
  status: "INBOX" | "ACTIVE" | "SHIPPED" | "PARKED"
  rank: number
  createdAt: string | Date
  updatedAt: string | Date
}

const COLUMNS: { key: IdeaRecord["status"]; label: string; hint: string }[] = [
  { key: "INBOX", label: "Inbox", hint: "Fresh captures" },
  { key: "ACTIVE", label: "Active", hint: "In motion" },
  { key: "SHIPPED", label: "Shipped", hint: "Done + notes" },
  { key: "PARKED", label: "Parked", hint: "Not now" },
]

export default function IdeasBoard({ initial }: { initial: IdeaRecord[] }) {
  const router = useRouter()
  const [ideas, setIdeas] = useState<IdeaRecord[]>(initial)
  const [creating, setCreating] = useState(false)
  const [draft, setDraft] = useState({ title: "", body: "", tags: "" })
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [busy, setBusy] = useState<string | null>(null)
  const composerRef = useRef<HTMLTextAreaElement | null>(null)

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === "i") {
        e.preventDefault()
        setCreating(true)
        setTimeout(() => composerRef.current?.focus(), 10)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  const grouped = useMemo(() => {
    const g: Record<IdeaRecord["status"], IdeaRecord[]> = {
      INBOX: [],
      ACTIVE: [],
      SHIPPED: [],
      PARKED: [],
    }
    for (const i of ideas) g[i.status].push(i)
    return g
  }, [ideas])

  async function createIdea(e: React.FormEvent) {
    e.preventDefault()
    const title = draft.title.trim()
    if (!title) return
    setBusy("create")
    try {
      const res = await fetch("/api/ideas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          body: draft.body.trim(),
          tags: draft.tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
        }),
      })
      const data = await res.json()
      if (res.ok && data.idea) {
        setIdeas((cur) => [data.idea, ...cur])
        setDraft({ title: "", body: "", tags: "" })
        setCreating(false)
        router.refresh()
      }
    } finally {
      setBusy(null)
    }
  }

  async function updateStatus(id: string, status: IdeaRecord["status"]) {
    const prev = ideas
    setIdeas((cur) => cur.map((i) => (i.id === id ? { ...i, status } : i)))
    setBusy(id)
    const res = await fetch(`/api/ideas/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    })
    if (!res.ok) setIdeas(prev)
    setBusy(null)
  }

  async function deleteIdea(id: string) {
    if (!confirm("Delete this idea? This can't be undone.")) return
    const prev = ideas
    setIdeas((cur) => cur.filter((i) => i.id !== id))
    setBusy(id)
    const res = await fetch(`/api/ideas/${id}`, { method: "DELETE" })
    if (!res.ok) setIdeas(prev)
    setBusy(null)
  }

  function toggleExpanded(id: string) {
    setExpanded((cur) => ({ ...cur, [id]: !cur[id] }))
  }

  return (
    <div className="space-y-8">
      {/* Composer */}
      <div className="border border-border/50 rounded-[2px] bg-surface/30">
        {!creating ? (
          <button
            onClick={() => {
              setCreating(true)
              setTimeout(() => composerRef.current?.focus(), 10)
            }}
            className="w-full flex items-center gap-2 px-5 py-4 text-left text-foreground/50 hover:text-primary transition font-mono text-xs uppercase tracking-wider"
          >
            <Plus className="h-4 w-4" />
            Capture a new idea &middot; <span className="text-foreground/30">cmd+shift+i</span>
          </button>
        ) : (
          <form onSubmit={createIdea} className="p-5 space-y-3">
            <input
              type="text"
              value={draft.title}
              onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
              placeholder="Idea title"
              className="w-full bg-transparent border-b border-border/40 focus:border-primary outline-none py-2 text-base font-serif placeholder:text-foreground/30"
              autoFocus
              maxLength={200}
            />
            <textarea
              ref={composerRef}
              value={draft.body}
              onChange={(e) => setDraft((d) => ({ ...d, body: e.target.value }))}
              placeholder="Body (markdown supported). Details, links, sketch, pricing assumptions..."
              rows={6}
              className="w-full bg-transparent border border-border/30 rounded-[2px] p-3 text-sm placeholder:text-foreground/30 focus:border-primary outline-none resize-none"
            />
            <input
              type="text"
              value={draft.tags}
              onChange={(e) => setDraft((d) => ({ ...d, tags: e.target.value }))}
              placeholder="tags, comma-separated (lead-magnet, marketplace, copy)"
              className="w-full bg-transparent border-b border-border/40 focus:border-primary outline-none py-2 text-sm font-mono placeholder:text-foreground/30"
            />
            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={!draft.title.trim() || busy === "create"}
                className="inline-flex items-center gap-2 bg-primary text-background px-5 py-2 rounded-[2px] font-mono text-xs uppercase tracking-wider hover:bg-primary/90 transition disabled:opacity-40"
              >
                {busy === "create" ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
                capture
              </button>
              <button
                type="button"
                onClick={() => {
                  setCreating(false)
                  setDraft({ title: "", body: "", tags: "" })
                }}
                className="text-xs font-mono uppercase tracking-wider text-foreground/50 hover:text-foreground"
              >
                cancel
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Columns */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {COLUMNS.map((col) => (
          <div key={col.key} className="space-y-3">
            <div className="flex items-baseline justify-between px-1">
              <div>
                <div className="font-mono text-[11px] uppercase tracking-wider text-primary">
                  {col.label}
                </div>
                <div className="font-mono text-[9px] text-foreground/40">{col.hint}</div>
              </div>
              <div className="font-mono text-[10px] text-foreground/40">
                {grouped[col.key].length}
              </div>
            </div>

            <div className="space-y-2 min-h-[100px]">
              {grouped[col.key].length === 0 && (
                <div className="border border-dashed border-border/30 rounded-[2px] p-4 text-center text-xs font-mono text-foreground/30">
                  empty
                </div>
              )}
              {grouped[col.key].map((idea) => {
                const isExpanded = expanded[idea.id] || false
                return (
                  <div
                    key={idea.id}
                    className="border border-border/40 rounded-[2px] bg-surface/20 hover:border-primary/40 transition group"
                  >
                    <div className="p-3 space-y-2">
                      <div className="flex items-start gap-2">
                        <button
                          type="button"
                          onClick={() => toggleExpanded(idea.id)}
                          className="mt-0.5 text-foreground/40 hover:text-foreground"
                          aria-label={isExpanded ? "Collapse" : "Expand"}
                        >
                          {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                        </button>
                        <div className="flex-1 min-w-0">
                          <div className="font-serif text-base text-foreground leading-tight">
                            {idea.title}
                          </div>
                          {idea.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1.5">
                              {idea.tags.map((t) => (
                                <span
                                  key={t}
                                  className="font-mono text-[9px] uppercase tracking-wider text-primary/80 bg-primary/5 border border-primary/20 rounded-[2px] px-1.5 py-0.5"
                                >
                                  {t}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => deleteIdea(idea.id)}
                          className="opacity-0 group-hover:opacity-100 text-foreground/40 hover:text-red-400 transition"
                          aria-label="Delete"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>

                      {isExpanded && idea.body && (
                        <div className="text-[13px] text-foreground/70 whitespace-pre-wrap leading-relaxed pl-5 pt-1 border-l border-border/30 ml-1">
                          {idea.body}
                        </div>
                      )}

                      <div className="flex items-center gap-1 pt-2 border-t border-border/20">
                        {COLUMNS.filter((c) => c.key !== idea.status).map((c) => (
                          <button
                            key={c.key}
                            type="button"
                            onClick={() => updateStatus(idea.id, c.key)}
                            disabled={busy === idea.id}
                            className="text-[9px] font-mono uppercase tracking-wider text-foreground/40 hover:text-primary disabled:opacity-40 px-1.5 py-0.5"
                          >
                            &rarr; {c.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
