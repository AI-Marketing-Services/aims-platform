"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { X, Plus, Loader2 } from "lucide-react"

type Topic = {
  id: string
  label: string
  query: string
  enabled: boolean
}

export function TopicEditor({ initial }: { initial: Topic[] }) {
  const [topics, setTopics] = useState<Topic[]>(initial)
  const [label, setLabel] = useState("")
  const [query, setQuery] = useState("")
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [, start] = useTransition()
  const router = useRouter()
  const MAX = 5

  async function add(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!label.trim() || !query.trim()) return
    setAdding(true)
    try {
      const res = await fetch("/api/signal/topics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label: label.trim(), query: query.trim() }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? "Failed to add")
        return
      }
      setTopics((prev) => [...prev, data.topic])
      setLabel("")
      setQuery("")
      start(() => router.refresh())
    } finally {
      setAdding(false)
    }
  }

  async function remove(id: string) {
    const prev = topics
    setTopics((t) => t.filter((x) => x.id !== id))
    const res = await fetch(`/api/signal/topics/${id}`, { method: "DELETE" })
    if (!res.ok) setTopics(prev)
    else start(() => router.refresh())
  }

  async function toggle(t: Topic) {
    const next = !t.enabled
    setTopics((ts) => ts.map((x) => (x.id === t.id ? { ...x, enabled: next } : x)))
    const res = await fetch(`/api/signal/topics/${t.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled: next }),
    })
    if (!res.ok) setTopics((ts) => ts.map((x) => (x.id === t.id ? { ...x, enabled: !next } : x)))
  }

  const atLimit = topics.length >= MAX

  return (
    <div className="space-y-5">
      <ul className="space-y-2">
        {topics.length === 0 && (
          <li className="text-sm text-foreground/50 italic font-mono">no topics yet</li>
        )}
        {topics.map((t) => (
          <li key={t.id} className="flex items-center gap-3 py-2 border-b border-border/30 group">
            <button
              onClick={() => toggle(t)}
              aria-label={t.enabled ? "Disable" : "Enable"}
              className={`h-2 w-2 rounded-full shrink-0 transition-colors ${t.enabled ? "bg-primary" : "bg-foreground/20"}`}
            />
            <div className="flex-1 min-w-0">
              <div className={`font-mono text-[11px] uppercase tracking-wider ${t.enabled ? "text-primary" : "text-foreground/40"}`}>
                {t.label}
              </div>
              <div className="text-xs text-foreground/50 truncate">{t.query}</div>
            </div>
            <button
              onClick={() => remove(t.id)}
              className="opacity-0 group-hover:opacity-100 text-foreground/40 hover:text-foreground transition"
              aria-label="Remove"
            >
              <X className="h-4 w-4" />
            </button>
          </li>
        ))}
      </ul>

      {!atLimit && (
        <form onSubmit={add} className="space-y-2 pt-4 border-t border-border/30">
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Topic label (e.g. Claude SDK releases)"
            maxLength={60}
            className="w-full bg-transparent border-b border-border/40 focus:border-primary outline-none py-2 text-sm font-mono placeholder:text-foreground/30"
          />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search query (e.g. anthropic claude sdk release)"
            maxLength={200}
            className="w-full bg-transparent border-b border-border/40 focus:border-primary outline-none py-2 text-sm placeholder:text-foreground/30"
          />
          {error && <div className="text-xs text-red-400 font-mono">{error}</div>}
          <button
            type="submit"
            disabled={adding || !label.trim() || !query.trim()}
            className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-primary hover:opacity-80 disabled:opacity-40 pt-2"
          >
            {adding ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
            add topic
          </button>
        </form>
      )}
      {atLimit && (
        <div className="text-xs font-mono text-foreground/40 pt-4 border-t border-border/30">
          limit reached ({MAX}/{MAX})
        </div>
      )}
    </div>
  )
}
