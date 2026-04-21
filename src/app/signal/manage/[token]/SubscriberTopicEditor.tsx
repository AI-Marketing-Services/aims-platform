"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Check, Loader2, Plus, X } from "lucide-react"

type Topic = { label: string; query: string }

const MAX_TOPICS = 5

export default function SubscriberTopicEditor({
  token,
  initialTopics,
}: {
  token: string
  initialTopics: Topic[]
}) {
  const router = useRouter()
  const [topics, setTopics] = useState<Topic[]>(initialTopics)
  const [customLabel, setCustomLabel] = useState("")
  const [customQuery, setCustomQuery] = useState("")
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const atLimit = topics.length >= MAX_TOPICS

  function removeTopic(label: string) {
    setSaved(false)
    setTopics((cur) => cur.filter((t) => t.label !== label))
  }

  function addCustom(e: React.FormEvent) {
    e.preventDefault()
    const label = customLabel.trim()
    const query = customQuery.trim() || label
    if (!label || topics.some((t) => t.label === label) || atLimit) return
    setSaved(false)
    setTopics((cur) => [...cur, { label, query }])
    setCustomLabel("")
    setCustomQuery("")
  }

  async function save() {
    setSaving(true)
    setError(null)
    try {
      const res = await fetch(`/api/signal/manage/${encodeURIComponent(token)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topics }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.error ?? "Couldn't save")
      } else {
        setSaved(true)
        router.refresh()
      }
    } catch {
      setError("Network error")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <ul className="space-y-2">
        {topics.length === 0 && (
          <li className="text-sm text-foreground/50 italic font-mono">no topics yet</li>
        )}
        {topics.map((t) => (
          <li key={t.label} className="flex items-center gap-3 py-2 border-b border-border/30 group">
            <div className="h-2 w-2 rounded-full shrink-0 bg-primary" />
            <div className="flex-1 min-w-0">
              <div className="font-mono text-[11px] uppercase tracking-wider text-primary">
                {t.label}
              </div>
              <div className="text-xs text-foreground/50 truncate">{t.query}</div>
            </div>
            <button
              onClick={() => removeTopic(t.label)}
              className="opacity-0 group-hover:opacity-100 text-foreground/40 hover:text-foreground transition"
              aria-label="Remove"
            >
              <X className="h-4 w-4" />
            </button>
          </li>
        ))}
      </ul>

      {!atLimit && (
        <form onSubmit={addCustom} className="space-y-2 pt-4 border-t border-border/30">
          <div className="font-mono text-[11px] uppercase tracking-wider text-foreground/50 mb-2">
            Add a topic
          </div>
          <input
            type="text"
            value={customLabel}
            onChange={(e) => setCustomLabel(e.target.value)}
            placeholder="Topic label"
            maxLength={60}
            className="w-full bg-transparent border-b border-border/40 focus:border-primary outline-none py-2 text-sm font-mono placeholder:text-foreground/30"
          />
          <input
            type="text"
            value={customQuery}
            onChange={(e) => setCustomQuery(e.target.value)}
            placeholder="Search hint (optional)"
            maxLength={200}
            className="w-full bg-transparent border-b border-border/40 focus:border-primary outline-none py-2 text-sm placeholder:text-foreground/30"
          />
          <button
            type="submit"
            disabled={!customLabel.trim()}
            className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-primary hover:opacity-80 disabled:opacity-40 pt-2"
          >
            <Plus className="h-3 w-3" />
            add topic
          </button>
        </form>
      )}

      <div className="pt-6 border-t border-border/30 flex items-center gap-4">
        <button
          type="button"
          onClick={save}
          disabled={saving || topics.length === 0}
          className="inline-flex items-center gap-2 bg-primary text-background px-5 py-2.5 rounded-[2px] font-mono text-xs uppercase tracking-wider hover:bg-primary/90 transition disabled:opacity-40"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <Check className="h-4 w-4" /> : null}
          {saved ? "Saved" : "Save topics"}
        </button>
        {error && <span className="text-xs text-red-400 font-mono">{error}</span>}
      </div>
    </div>
  )
}
