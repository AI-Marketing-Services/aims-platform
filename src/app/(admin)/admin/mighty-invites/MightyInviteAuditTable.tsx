"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { Search, AlertCircle, CheckCircle2, Clock, Send } from "lucide-react"
import { cn, timeAgo } from "@/lib/utils"

export type AuditRow = {
  id: string
  dealId: string
  contactName: string
  email: string
  dealStage: string | null
  leadScoreTier: string | null
  planName: string
  status: string
  errorMessage: string | null
  mightyInviteId: number | null
  sentAt: string
  resentAt: string | null
  acceptedAt: string | null
}

const STATUS_COLORS: Record<string, string> = {
  accepted: "text-green-400 bg-green-900/15 border-green-800",
  sent: "text-blue-400 bg-blue-900/15 border-blue-800",
  pending: "text-amber-400 bg-amber-900/15 border-amber-800",
  failed: "text-primary bg-primary/10 border-primary/30",
  expired: "text-muted-foreground bg-deep border-border",
}

const STATUS_ICONS: Record<string, React.ReactNode> = {
  accepted: <CheckCircle2 className="w-3 h-3" />,
  sent: <Send className="w-3 h-3" />,
  pending: <Clock className="w-3 h-3" />,
  failed: <AlertCircle className="w-3 h-3" />,
}

const STATUS_FILTERS = ["all", "failed", "pending", "sent", "accepted", "expired"] as const

export function MightyInviteAuditTable({ rows }: { rows: AuditRow[] }) {
  const [query, setQuery] = useState("")
  const [status, setStatus] = useState<(typeof STATUS_FILTERS)[number]>("all")

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim()
    return rows.filter((r) => {
      if (status !== "all" && r.status !== status) return false
      if (!q) return true
      return (
        r.contactName.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q) ||
        r.planName.toLowerCase().includes(q) ||
        (r.errorMessage ?? "").toLowerCase().includes(q)
      )
    })
  }, [rows, query, status])

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, email, plan, error…"
            className="w-full pl-9 pr-4 py-2 bg-card border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-border"
          />
        </div>
        <div className="flex gap-1">
          {STATUS_FILTERS.map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={cn(
                "px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors capitalize",
                status === s
                  ? "bg-primary/15 text-primary border-primary/40"
                  : "bg-card text-muted-foreground border-border hover:text-foreground"
              )}
            >
              {s}
            </button>
          ))}
        </div>
        <span className="text-xs text-muted-foreground font-mono ml-auto">
          {filtered.length} / {rows.length}
        </span>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-deep/60 border-b border-border">
            <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
              <th className="px-4 py-3 font-medium">Contact</th>
              <th className="px-4 py-3 font-medium">Plan</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Sent</th>
              <th className="px-4 py-3 font-medium">Outcome</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr
                key={r.id}
                className="border-b border-border last:border-0 hover:bg-deep/30 transition-colors"
              >
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/crm/${r.dealId}`}
                    className="text-foreground font-medium hover:text-primary hover:underline"
                  >
                    {r.contactName}
                  </Link>
                  <div className="text-xs text-muted-foreground font-mono">{r.email}</div>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{r.planName}</td>
                <td className="px-4 py-3">
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 px-1.5 py-0.5 rounded border text-xs font-medium capitalize",
                      STATUS_COLORS[r.status] ?? STATUS_COLORS.pending
                    )}
                  >
                    {STATUS_ICONS[r.status]}
                    {r.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-muted-foreground text-xs font-mono">
                  {timeAgo(r.sentAt)}
                  {r.resentAt && (
                    <div className="text-[11px]">resent {timeAgo(r.resentAt)}</div>
                  )}
                </td>
                <td className="px-4 py-3 text-xs max-w-md">
                  {r.status === "accepted" && r.acceptedAt && (
                    <span className="text-green-400">
                      Joined {timeAgo(r.acceptedAt)}
                    </span>
                  )}
                  {r.status === "failed" && r.errorMessage && (
                    <span className="text-primary whitespace-pre-wrap break-words">
                      {r.errorMessage}
                    </span>
                  )}
                  {r.status === "sent" && (
                    <span className="text-muted-foreground">Waiting for acceptance</span>
                  )}
                  {r.status === "pending" && (
                    <span className="text-muted-foreground">Queued</span>
                  )}
                  {r.status === "expired" && (
                    <span className="text-muted-foreground">Invite expired</span>
                  )}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-muted-foreground text-sm">
                  No invites match those filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
