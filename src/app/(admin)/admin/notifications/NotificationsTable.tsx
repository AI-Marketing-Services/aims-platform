"use client"

import { useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Trash2, CheckCheck, Search, Loader2 } from "lucide-react"
import { cn, timeAgo } from "@/lib/utils"

interface Notification {
  id: string
  type: string
  title: string
  message: string
  read: boolean
  sentAt: string
  metadata?: Record<string, unknown>
}

interface TypeCount {
  type: string
  total: number
  unread: number
}

interface Props {
  initial: Notification[]
  typeCounts: TypeCount[]
}

type ReadFilter = "all" | "unread" | "read"

export function NotificationsTable({ initial, typeCounts }: Props) {
  const router = useRouter()
  const [items, setItems] = useState<Notification[]>(initial)
  const [readFilter, setReadFilter] = useState<ReadFilter>("all")
  const [typeFilter, setTypeFilter] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [isPending, startTransition] = useTransition()

  const filtered = useMemo(() => {
    return items.filter((n) => {
      if (readFilter === "unread" && n.read) return false
      if (readFilter === "read" && !n.read) return false
      if (typeFilter && n.type !== typeFilter) return false
      if (search.trim()) {
        const q = search.toLowerCase()
        if (
          !n.title.toLowerCase().includes(q) &&
          !n.message.toLowerCase().includes(q)
        ) {
          return false
        }
      }
      return true
    })
  }, [items, readFilter, typeFilter, search])

  const allSelected =
    filtered.length > 0 && filtered.every((n) => selectedIds.has(n.id))

  const toggleAll = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (allSelected) {
        for (const n of filtered) next.delete(n.id)
      } else {
        for (const n of filtered) next.add(n.id)
      }
      return next
    })
  }

  const toggleOne = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const markFilteredRead = () => {
    const ids = filtered.filter((n) => !n.read).map((n) => n.id)
    if (ids.length === 0) {
      toast.info("Nothing to mark — every visible row is already read.")
      return
    }
    startTransition(async () => {
      try {
        // No bulk endpoint for read — use mark-all-read when no filters,
        // otherwise loop. (DB-side updateMany still completes fast.)
        const noFilters =
          readFilter === "all" && !typeFilter && !search.trim()
        if (noFilters) {
          const res = await fetch("/api/notifications/mark-all-read", {
            method: "PATCH",
          })
          if (!res.ok) throw new Error("mark-all-read failed")
        } else {
          await Promise.all(
            ids.map((id) =>
              fetch(`/api/notifications/${id}/read`, { method: "PATCH" }),
            ),
          )
        }
        setItems((prev) =>
          prev.map((n) => (ids.includes(n.id) ? { ...n, read: true } : n)),
        )
        toast.success(`Marked ${ids.length} notification${ids.length > 1 ? "s" : ""} as read`)
        router.refresh()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to mark read")
      }
    })
  }

  const deleteSelected = () => {
    const ids = Array.from(selectedIds)
    if (ids.length === 0) {
      toast.info("Select at least one row first.")
      return
    }
    if (
      !window.confirm(
        `Permanently delete ${ids.length} notification${ids.length > 1 ? "s" : ""}? This cannot be undone.`,
      )
    ) {
      return
    }
    startTransition(async () => {
      try {
        const res = await fetch("/api/notifications/bulk-delete", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ ids }),
        })
        const data = (await res.json().catch(() => ({}))) as {
          error?: string
          deleted?: number
        }
        if (!res.ok) throw new Error(data.error ?? "Delete failed")
        setItems((prev) => prev.filter((n) => !selectedIds.has(n.id)))
        setSelectedIds(new Set())
        toast.success(`Deleted ${data.deleted ?? ids.length} notification${(data.deleted ?? ids.length) === 1 ? "" : "s"}`)
        router.refresh()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to delete")
      }
    })
  }

  const deleteFiltered = () => {
    if (filtered.length === 0) {
      toast.info("No rows match the current filter.")
      return
    }
    if (
      !window.confirm(
        `Permanently delete ALL ${filtered.length} notification${filtered.length > 1 ? "s" : ""} matching the current filter? This cannot be undone.`,
      )
    ) {
      return
    }
    const ids = filtered.map((n) => n.id)
    startTransition(async () => {
      try {
        const res = await fetch("/api/notifications/bulk-delete", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ ids }),
        })
        const data = (await res.json().catch(() => ({}))) as {
          error?: string
          deleted?: number
        }
        if (!res.ok) throw new Error(data.error ?? "Delete failed")
        setItems((prev) => prev.filter((n) => !ids.includes(n.id)))
        setSelectedIds(new Set())
        toast.success(`Deleted ${data.deleted ?? ids.length} notification${(data.deleted ?? ids.length) === 1 ? "" : "s"}`)
        router.refresh()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to delete")
      }
    })
  }

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-ink/40" />
          <input
            type="text"
            placeholder="Search title or message..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-sm rounded-md border border-line bg-surface text-ink placeholder:text-ink/40 focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div className="flex items-center gap-1 rounded-md border border-line bg-surface p-0.5">
          {(["all", "unread", "read"] as ReadFilter[]).map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => setReadFilter(opt)}
              className={cn(
                "px-2.5 py-1 text-xs font-mono uppercase tracking-wider rounded transition-colors",
                readFilter === opt
                  ? "bg-primary text-primary-foreground"
                  : "text-ink/60 hover:text-ink",
              )}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>

      {/* Type chips */}
      {typeCounts.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setTypeFilter(null)}
            className={cn(
              "text-[10px] font-mono uppercase tracking-wider px-2 py-1 rounded-sm border transition-colors",
              typeFilter === null
                ? "border-primary bg-primary/10 text-primary"
                : "border-line bg-surface text-ink/60 hover:text-ink",
            )}
          >
            All types
          </button>
          {typeCounts
            .sort((a, b) => b.total - a.total)
            .map((tc) => (
              <button
                key={tc.type}
                type="button"
                onClick={() =>
                  setTypeFilter((cur) => (cur === tc.type ? null : tc.type))
                }
                className={cn(
                  "text-[10px] font-mono uppercase tracking-wider px-2 py-1 rounded-sm border transition-colors",
                  typeFilter === tc.type
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-line bg-surface text-ink/60 hover:text-ink",
                )}
                title={`${tc.unread} unread of ${tc.total}`}
              >
                {tc.type} ({tc.total})
              </button>
            ))}
        </div>
      )}

      {/* Action bar */}
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-ink/60 font-mono">
          Showing {filtered.length} of {items.length}
          {selectedIds.size > 0 ? ` · ${selectedIds.size} selected` : ""}
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={markFilteredRead}
            disabled={isPending}
            className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md border border-line bg-surface text-ink/70 hover:text-ink hover:bg-panel disabled:opacity-50 transition-colors"
          >
            <CheckCheck className="h-3.5 w-3.5" />
            Mark filtered read
          </button>
          <button
            type="button"
            onClick={deleteSelected}
            disabled={isPending || selectedIds.size === 0}
            className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md border border-line bg-surface text-ink/70 hover:text-[#981B1B] hover:border-[#981B1B] disabled:opacity-30 transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete selected ({selectedIds.size})
          </button>
          <button
            type="button"
            onClick={deleteFiltered}
            disabled={isPending || filtered.length === 0}
            className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md border border-[#981B1B] bg-[#981B1B] text-white hover:bg-[#7a1515] disabled:opacity-30 transition-colors"
            title="Deletes every row matching the current filter (not just visible page)"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete all filtered ({filtered.length})
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border border-line bg-surface overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line bg-panel">
                <th className="text-left p-3 w-8">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleAll}
                    className="rounded border-line"
                    aria-label="Select all visible"
                  />
                </th>
                <th className="text-left p-3 text-xs font-mono uppercase tracking-wider text-ink/60">
                  Title
                </th>
                <th className="text-left p-3 text-xs font-mono uppercase tracking-wider text-ink/60">
                  Message
                </th>
                <th className="text-center p-3 text-xs font-mono uppercase tracking-wider text-ink/60">
                  Type
                </th>
                <th className="text-right p-3 text-xs font-mono uppercase tracking-wider text-ink/60">
                  When
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-ink/50 text-sm">
                    No notifications match the current filter.
                  </td>
                </tr>
              ) : (
                filtered.map((n) => (
                  <tr
                    key={n.id}
                    className={cn(
                      "border-b border-line last:border-0 hover:bg-panel/50 transition-colors",
                      !n.read && "bg-primary/5",
                    )}
                  >
                    <td className="p-3 align-top">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(n.id)}
                        onChange={() => toggleOne(n.id)}
                        className="rounded border-line mt-0.5"
                        aria-label={`Select ${n.title}`}
                      />
                    </td>
                    <td className="p-3 align-top max-w-[260px]">
                      <p
                        className={cn(
                          "text-sm",
                          !n.read ? "font-semibold text-ink" : "text-ink/80",
                        )}
                      >
                        {n.title}
                      </p>
                    </td>
                    <td className="p-3 align-top text-ink/70 text-xs leading-relaxed max-w-[480px]">
                      {n.message}
                    </td>
                    <td className="p-3 align-top text-center">
                      <span className="inline-block text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded-sm border border-line text-ink/60 bg-panel">
                        {n.type}
                      </span>
                    </td>
                    <td className="p-3 align-top text-right text-ink/50 text-xs whitespace-nowrap">
                      {timeAgo(n.sentAt)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isPending && (
        <div className="flex items-center justify-center gap-2 text-xs text-ink/50">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Working...
        </div>
      )}
    </div>
  )
}
