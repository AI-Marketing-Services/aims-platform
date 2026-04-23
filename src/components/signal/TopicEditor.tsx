"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { X, Plus, Loader2, Sparkles } from "lucide-react"

type Topic = {
  id: string
  label: string
  query: string
  enabled: boolean
}

const SUGGESTED_TOPICS = [
  { label: "AI Industry News", query: "artificial intelligence industry news week" },
  { label: "ChatGPT & OpenAI", query: "openai chatgpt gpt product update" },
  { label: "Claude & Anthropic", query: "anthropic claude AI release news" },
  { label: "AI Automation Tools", query: "AI automation tools n8n make zapier update" },
  { label: "AI for Small Business", query: "AI small business automation sales marketing" },
  { label: "Prompt Engineering", query: "prompt engineering techniques AI agents" },
  { label: "AI Agents & Copilots", query: "AI agents autonomous copilot product launch" },
  { label: "Tech & Startup News", query: "tech startup funding AI venture news" },
]

export function TopicEditor({ initial }: { initial: Topic[] }) {
  const [topics, setTopics] = useState<Topic[]>(initial)
  const [label, setLabel] = useState("")
  const [query, setQuery] = useState("")
  const [adding, setAdding] = useState(false)
  const [addingSuggested, setAddingSuggested] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [, start] = useTransition()
  const router = useRouter()
  const MAX = 5

  async function addTopic(topicLabel: string, topicQuery: string) {
    setError(null)
    const res = await fetch("/api/signal/topics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label: topicLabel.trim(), query: topicQuery.trim() }),
    })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error ?? "Failed to add")
      return false
    }
    setTopics((prev) => [...prev, data.topic])
    start(() => router.refresh())
    return true
  }

  async function add(e: React.FormEvent) {
    e.preventDefault()
    if (!label.trim() || !query.trim()) return
    setAdding(true)
    const ok = await addTopic(label, query)
    if (ok) {
      setLabel("")
      setQuery("")
    }
    setAdding(false)
  }

  async function addSuggested(s: (typeof SUGGESTED_TOPICS)[number]) {
    if (topics.length >= MAX) return
    if (topics.some((t) => t.label === s.label)) return
    setAddingSuggested(s.label)
    await addTopic(s.label, s.query)
    setAddingSuggested(null)
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
  const addedLabels = new Set(topics.map((t) => t.label))
  const availableSuggestions = SUGGESTED_TOPICS.filter((s) => !addedLabels.has(s.label))

  return (
    <div className="space-y-6">
      {/* Current topics */}
      {topics.length > 0 && (
        <ul className="space-y-2">
          {topics.map((t) => (
            <li
              key={t.id}
              className="flex items-center gap-3 p-3 rounded-lg bg-surface/50 border border-border/50 group"
            >
              <button
                onClick={() => toggle(t)}
                aria-label={t.enabled ? "Disable" : "Enable"}
                className={`h-2.5 w-2.5 rounded-full shrink-0 transition-colors ${t.enabled ? "bg-primary" : "bg-muted-foreground/30"}`}
              />
              <div className="flex-1 min-w-0">
                <div className={`text-sm font-medium ${t.enabled ? "text-foreground" : "text-muted-foreground"}`}>
                  {t.label}
                </div>
                <div className="text-xs text-muted-foreground/60 truncate">{t.query}</div>
              </div>
              <button
                onClick={() => remove(t.id)}
                className="opacity-0 group-hover:opacity-100 text-muted-foreground/50 hover:text-foreground transition-all"
                aria-label="Remove"
              >
                <X className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {topics.length === 0 && (
        <p className="text-sm text-muted-foreground">No topics yet — add from suggestions below or create your own.</p>
      )}

      {/* Suggested topics */}
      {!atLimit && availableSuggestions.length > 0 && (
        <div>
          <div className="flex items-center gap-1.5 mb-3">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <p className="text-xs font-semibold text-foreground uppercase tracking-wider">Quick Add</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {availableSuggestions.map((s) => (
              <button
                key={s.label}
                onClick={() => addSuggested(s)}
                disabled={atLimit || addingSuggested !== null}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border border-border bg-surface hover:border-primary/50 hover:text-primary hover:bg-primary/5 text-muted-foreground transition-all disabled:opacity-40"
              >
                {addingSuggested === s.label ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Plus className="h-3 w-3" />
                )}
                {s.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Custom topic form */}
      {!atLimit && (
        <div>
          <p className="text-xs font-semibold text-foreground uppercase tracking-wider mb-3">Custom Topic</p>
          <form onSubmit={add} className="space-y-2">
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Topic label (e.g. Claude SDK releases)"
              maxLength={60}
              className="w-full h-9 px-3 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/50"
            />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search query (e.g. anthropic claude sdk release)"
              maxLength={200}
              className="w-full h-9 px-3 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/50"
            />
            {error && <div className="text-xs text-red-400">{error}</div>}
            <button
              type="submit"
              disabled={adding || !label.trim() || !query.trim()}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-primary/10 text-primary hover:bg-primary/20 disabled:opacity-40 transition-colors"
            >
              {adding ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
              Add Topic
            </button>
          </form>
        </div>
      )}

      {atLimit && (
        <p className="text-xs text-muted-foreground">
          Topic limit reached ({MAX}/{MAX}). Remove one to add another.
        </p>
      )}
    </div>
  )
}
