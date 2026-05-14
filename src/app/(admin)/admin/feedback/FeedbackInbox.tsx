"use client"

import { useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Bug, Lightbulb, HelpCircle, MessageSquare, ExternalLink, Loader2 } from "lucide-react"

type Item = {
  id: string
  category: string
  title: string
  details: string
  pageUrl: string | null
  userAgent: string | null
  screenshotUrl: string | null
  status: string
  adminNote: string | null
  reporterEmail: string
  reporterName: string | null
  reporterId: string | null
  reporter: { id: string; name: string | null; email: string } | null
  createdAt: string
  updatedAt: string
}

const CATEGORY_META: Record<string, { icon: React.ComponentType<{ className?: string }>; label: string; color: string }> = {
  BUG: { icon: Bug, label: "Bug", color: "text-red-500 bg-red-500/10" },
  IDEA: { icon: Lightbulb, label: "Idea", color: "text-amber-500 bg-amber-500/10" },
  QUESTION: { icon: HelpCircle, label: "Question", color: "text-blue-500 bg-blue-500/10" },
  OTHER: { icon: MessageSquare, label: "Other", color: "text-muted-foreground bg-muted" },
}

const STATUS_META: Record<string, { label: string; color: string }> = {
  NEW: { label: "New", color: "bg-primary/15 text-primary border-primary/30" },
  TRIAGED: { label: "Triaged", color: "bg-blue-500/10 text-blue-500 border-blue-500/30" },
  IN_PROGRESS: { label: "In Progress", color: "bg-amber-500/10 text-amber-500 border-amber-500/30" },
  RESOLVED: { label: "Resolved", color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/30" },
  WONT_FIX: { label: "Won't Fix", color: "bg-muted text-muted-foreground border-border" },
}

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime()
  const m = Math.floor(ms / 60000)
  if (m < 1) return "just now"
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  return `${d}d ago`
}

export function FeedbackInbox({
  items,
  statuses,
}: {
  items: Item[]
  statuses: string[]
}) {
  const router = useRouter()
  const [filter, setFilter] = useState<string>("ALL")
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [, startTransition] = useTransition()
  const [noteDraft, setNoteDraft] = useState<Record<string, string>>({})

  const filtered = useMemo(() => {
    if (filter === "ALL") return items
    if (filter === "OPEN")
      return items.filter(
        (i) => i.status !== "RESOLVED" && i.status !== "WONT_FIX",
      )
    return items.filter((i) => i.status === filter)
  }, [items, filter])

  async function update(id: string, patch: { status?: string; adminNote?: string }) {
    setPendingId(id)
    try {
      const res = await fetch(`/api/admin/feedback/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      })
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(body.error ?? "Update failed")
      }
      startTransition(() => router.refresh())
    } catch (err) {
      alert(err instanceof Error ? err.message : "Update failed")
    } finally {
      setPendingId(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        {[
          { key: "ALL", label: "All" },
          { key: "OPEN", label: "Open" },
          ...statuses.map((s) => ({ key: s, label: STATUS_META[s]?.label ?? s })),
        ].map((tab) => {
          const active = filter === tab.key
          const count =
            tab.key === "ALL"
              ? items.length
              : tab.key === "OPEN"
                ? items.filter((i) => i.status !== "RESOLVED" && i.status !== "WONT_FIX").length
                : items.filter((i) => i.status === tab.key).length
          return (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                active
                  ? "bg-primary/10 text-primary border-primary/30"
                  : "bg-surface text-muted-foreground hover:text-foreground border-border"
              }`}
            >
              {tab.label}
              <span className="ml-1.5 opacity-70">{count}</span>
            </button>
          )
        })}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-border border-dashed bg-card p-12 text-center">
          <Bug className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm font-semibold text-foreground">No feedback in this view</p>
          <p className="text-xs text-muted-foreground mt-1">
            Reports from the portal show up here in real time.
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {filtered.map((item) => {
            const meta = CATEGORY_META[item.category] ?? CATEGORY_META.OTHER
            const status = STATUS_META[item.status] ?? STATUS_META.NEW
            const expanded = expandedId === item.id
            const Icon = meta.icon
            const isPending = pendingId === item.id

            return (
              <li
                key={item.id}
                className="rounded-xl border border-border bg-card overflow-hidden"
              >
                <button
                  onClick={() => setExpandedId(expanded ? null : item.id)}
                  className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-surface/40 transition-colors"
                >
                  <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${meta.color}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-foreground truncate">
                        {item.title}
                      </p>
                      <span
                        className={`text-[10px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded border ${status.color}`}
                      >
                        {status.label}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">
                      {item.reporterName ?? item.reporterEmail} · {timeAgo(item.createdAt)}
                      {item.pageUrl && (
                        <>
                          {" · "}
                          <span className="font-mono text-[10px]">
                            {new URL(item.pageUrl).pathname}
                          </span>
                        </>
                      )}
                    </p>
                  </div>
                  <span className="text-[10px] text-muted-foreground shrink-0 mt-1">
                    {expanded ? "▲" : "▼"}
                  </span>
                </button>

                {expanded && (
                  <div className="px-4 pb-4 space-y-4 border-t border-border bg-surface/30">
                    <div className="pt-4">
                      <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mb-1.5">
                        Details
                      </p>
                      <p className="text-sm text-foreground whitespace-pre-wrap">
                        {item.details}
                      </p>
                    </div>

                    {item.screenshotUrl && (
                      <div>
                        <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mb-1.5">
                          Screenshot
                        </p>
                        {/* Link wrapper lets admin open the full-res image
                            in a new tab; the inline render is bounded so
                            5MB phone screenshots don't blow out the row. */}
                        <a
                          href={item.screenshotUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block rounded-lg border border-border overflow-hidden bg-background hover:border-primary/40 transition-colors"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={item.screenshotUrl}
                            alt="Reporter screenshot"
                            className="max-h-96 w-full object-contain bg-black/5"
                          />
                        </a>
                        <p className="text-[10px] text-muted-foreground mt-1">
                          Click image to open at full resolution.
                        </p>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      <div>
                        <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mb-1">
                          Reporter
                        </p>
                        <p className="text-foreground">
                          {item.reporterName ?? "(no name)"}
                        </p>
                        <a
                          href={`mailto:${item.reporterEmail}`}
                          className="text-primary hover:underline"
                        >
                          {item.reporterEmail}
                        </a>
                      </div>

                      {item.pageUrl && (
                        <div>
                          <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mb-1">
                            Page
                          </p>
                          <a
                            href={item.pageUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline inline-flex items-center gap-1 break-all"
                          >
                            {item.pageUrl}
                            <ExternalLink className="h-3 w-3 shrink-0" />
                          </a>
                        </div>
                      )}

                      {item.userAgent && (
                        <div className="md:col-span-2">
                          <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mb-1">
                            User Agent
                          </p>
                          <p className="text-foreground/70 font-mono text-[10px] break-all">
                            {item.userAgent}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">
                        Admin note (private)
                      </p>
                      <textarea
                        defaultValue={item.adminNote ?? ""}
                        onChange={(e) =>
                          setNoteDraft((d) => ({ ...d, [item.id]: e.target.value }))
                        }
                        placeholder="Triage notes, follow-up, etc."
                        rows={2}
                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 resize-none"
                      />
                      <button
                        onClick={() => {
                          const draft = noteDraft[item.id]
                          if (draft === undefined) return
                          update(item.id, { adminNote: draft })
                        }}
                        disabled={
                          isPending ||
                          noteDraft[item.id] === undefined ||
                          noteDraft[item.id] === (item.adminNote ?? "")
                        }
                        className="text-[11px] font-semibold text-primary hover:underline disabled:opacity-40 disabled:no-underline"
                      >
                        Save note
                      </button>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-border/60">
                      <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mr-1">
                        Status
                      </span>
                      {statuses.map((s) => {
                        const meta = STATUS_META[s]
                        const active = item.status === s
                        return (
                          <button
                            key={s}
                            onClick={() => !active && update(item.id, { status: s })}
                            disabled={isPending || active}
                            className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider border transition-colors disabled:cursor-default ${
                              active
                                ? meta.color
                                : "bg-surface text-muted-foreground hover:text-foreground border-border"
                            }`}
                          >
                            {meta.label}
                          </button>
                        )
                      })}
                      {isPending && (
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground ml-1" />
                      )}
                    </div>
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
