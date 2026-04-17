"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { toast } from "sonner"
import { Search, AlertCircle, CheckCircle2, Clock, Send, RefreshCw } from "lucide-react"
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

// Single-brand palette: neutral for in-progress / informational states,
// crimson for outcomes that need attention. Green reserved for the one happy
// terminal state (accepted) since that's the actual win.
const STATUS_COLORS: Record<string, string> = {
  accepted: "text-emerald-700 bg-emerald-50 border-emerald-200",
  sent: "text-muted-foreground bg-muted/50 border-border",
  pending: "text-muted-foreground bg-muted/50 border-border",
  failed: "text-primary bg-primary/10 border-primary/30",
  expired: "text-muted-foreground bg-muted/30 border-border",
}

const STATUS_ICONS: Record<string, React.ReactNode> = {
  accepted: <CheckCircle2 className="w-3 h-3" />,
  sent: <Send className="w-3 h-3" />,
  pending: <Clock className="w-3 h-3" />,
  failed: <AlertCircle className="w-3 h-3" />,
}

const STATUS_FILTERS = ["all", "failed", "pending", "sent", "accepted", "expired"] as const

const TIER_FROM_PLAN: Record<string, "community" | "accelerator" | "innerCircle"> = {
  Community: "community",
  Accelerator: "accelerator",
  "Inner Circle": "innerCircle",
}

export function MightyInviteAuditTable({ rows: initialRows }: { rows: AuditRow[] }) {
  const [rows, setRows] = useState(initialRows)
  const [query, setQuery] = useState("")
  const [status, setStatus] = useState<(typeof STATUS_FILTERS)[number]>("all")
  const [busyId, setBusyId] = useState<string | null>(null)

  async function retry(row: AuditRow) {
    if (busyId) return
    setBusyId(row.id)
    const tier = TIER_FROM_PLAN[row.planName] ?? "community"
    try {
      const res = await fetch(`/api/admin/deals/${row.dealId}/invite-to-mighty`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier, resend: true }),
      })
      const body = await res.json()
      if (!res.ok) {
        toast.error(body.error ?? "Retry failed")
        // Update the error message inline so the admin sees why
        if (body.invite?.errorMessage) {
          setRows((prev) =>
            prev.map((r) =>
              r.id === row.id ? { ...r, errorMessage: body.invite.errorMessage, status: "failed" } : r
            )
          )
        }
        return
      }
      toast.success(`Invite re-sent to ${row.contactName}`)
      setRows((prev) =>
        prev.map((r) =>
          r.id === body.invite.id
            ? {
                ...r,
                status: body.invite.status,
                errorMessage: body.invite.errorMessage ?? null,
                resentAt: body.invite.resentAt ?? new Date().toISOString(),
                mightyInviteId: body.invite.mightyInviteId ?? r.mightyInviteId,
              }
            : r
        )
      )
    } catch {
      toast.error("Network error")
    } finally {
      setBusyId(null)
    }
  }

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
          <thead className="bg-muted/40 border-b border-border">
            <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
              <th className="px-4 py-3 font-medium">Contact</th>
              <th className="px-4 py-3 font-medium">Plan</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Sent</th>
              <th className="px-4 py-3 font-medium">Outcome</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr
                key={r.id}
                className="border-b border-border last:border-0 hover:bg-muted/40 transition-colors"
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
                    <span className="text-emerald-700 font-medium">
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
                <td className="px-4 py-3 text-right">
                  {r.status !== "accepted" && (
                    <button
                      onClick={() => retry(r)}
                      disabled={busyId === r.id}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg border border-border bg-card text-foreground hover:bg-primary/5 hover:border-primary/40 hover:text-primary disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      title={r.status === "failed" ? "Re-run invite with latest data" : "Re-send invite email"}
                    >
                      <RefreshCw className={cn("w-3 h-3", busyId === r.id && "animate-spin")} />
                      {busyId === r.id ? "Retrying…" : "Retry"}
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground text-sm">
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
