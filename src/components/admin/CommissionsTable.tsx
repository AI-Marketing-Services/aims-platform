"use client"

import { useState, useMemo, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Search, Check, X, Send } from "lucide-react"
import { cn } from "@/lib/utils"

export type CommissionRow = {
  id: string
  amount: number
  percentage: number
  sourceAmount: number
  status: "PENDING" | "APPROVED" | "PAID" | "REJECTED"
  createdAt: string
  approvedAt: string | null
  paidAt: string | null
  notes: string | null
  referral: {
    code: string
    tier: string
    referrer: {
      name: string | null
      email: string | null
    }
  }
}

const STATUS_STYLES: Record<CommissionRow["status"], string> = {
  PENDING: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  APPROVED: "text-blue-400 bg-blue-500/10 border-blue-500/20",
  PAID: "text-green-400 bg-green-500/10 border-green-500/20",
  REJECTED: "text-red-400 bg-red-500/10 border-red-500/20",
}

const TIER_LABEL: Record<string, string> = {
  AFFILIATE: "Affiliate",
  COMMUNITY_PARTNER: "Community Partner",
  RESELLER: "Reseller",
}

const fmtMoney = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD" })

const fmtDate = (iso: string | null) => {
  if (!iso) return "-"
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

export function CommissionsTable({ rows }: { rows: CommissionRow[] }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<"ALL" | CommissionRow["status"]>("ALL")
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (statusFilter !== "ALL" && r.status !== statusFilter) return false
      if (!search) return true
      const q = search.toLowerCase()
      return (
        r.referral.code.toLowerCase().includes(q) ||
        (r.referral.referrer.name ?? "").toLowerCase().includes(q) ||
        (r.referral.referrer.email ?? "").toLowerCase().includes(q)
      )
    })
  }, [rows, search, statusFilter])

  const handleAction = async (
    commissionId: string,
    action: "approve" | "reject" | "paid"
  ) => {
    setUpdatingId(commissionId)
    setError(null)
    try {
      const res = await fetch("/api/admin/commissions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ commissionId, action }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error ?? "Failed to update commission")
      }
      startTransition(() => {
        router.refresh()
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update commission")
    } finally {
      setUpdatingId(null)
    }
  }

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 p-4 border-b border-border sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by code, name, or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-deep border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <div className="flex gap-1">
          {(["ALL", "PENDING", "APPROVED", "PAID", "REJECTED"] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatusFilter(s)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                statusFilter === s
                  ? "bg-primary/20 text-primary border border-primary/30"
                  : "bg-deep text-muted-foreground hover:text-foreground border border-border"
              )}
            >
              {s === "ALL" ? "All" : s.charAt(0) + s.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="px-4 py-2 bg-red-500/10 border-b border-red-500/20 text-xs text-red-400">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-deep">
            <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
              <th className="px-4 py-3 font-medium">Partner</th>
              <th className="px-4 py-3 font-medium">Code</th>
              <th className="px-4 py-3 font-medium">Tier</th>
              <th className="px-4 py-3 font-medium text-right">Source</th>
              <th className="px-4 py-3 font-medium text-right">Rate</th>
              <th className="px-4 py-3 font-medium text-right">Commission</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Created</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-muted-foreground">
                  No commissions match your filters.
                </td>
              </tr>
            ) : (
              filtered.map((r) => {
                const isUpdating = updatingId === r.id || isPending
                return (
                  <tr
                    key={r.id}
                    className="border-t border-border hover:bg-surface/30 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="text-foreground font-medium truncate max-w-[180px]">
                        {r.referral.referrer.name ?? "—"}
                      </div>
                      <div className="text-xs text-muted-foreground truncate max-w-[180px]">
                        {r.referral.referrer.email ?? ""}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                      {r.referral.code}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {TIER_LABEL[r.referral.tier] ?? r.referral.tier}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-xs text-muted-foreground">
                      {fmtMoney(r.sourceAmount)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-xs text-muted-foreground">
                      {Math.round(r.percentage * 100)}%
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-sm text-foreground font-semibold">
                      {fmtMoney(r.amount)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "inline-flex px-2 py-0.5 rounded border text-[10px] font-semibold uppercase tracking-wider",
                          STATUS_STYLES[r.status]
                        )}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                      {fmtDate(r.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        {r.status === "PENDING" && (
                          <>
                            <button
                              type="button"
                              disabled={isUpdating}
                              onClick={() => handleAction(r.id, "approve")}
                              className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 disabled:opacity-50 transition-colors"
                              title="Approve commission"
                            >
                              <Check className="h-3 w-3" />
                              Approve
                            </button>
                            <button
                              type="button"
                              disabled={isUpdating}
                              onClick={() => handleAction(r.id, "reject")}
                              className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 disabled:opacity-50 transition-colors"
                              title="Reject commission"
                            >
                              <X className="h-3 w-3" />
                              Reject
                            </button>
                          </>
                        )}
                        {r.status === "APPROVED" && (
                          <>
                            <button
                              type="button"
                              disabled={isUpdating}
                              onClick={() => handleAction(r.id, "paid")}
                              className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/20 disabled:opacity-50 transition-colors"
                              title="Mark as paid"
                            >
                              <Send className="h-3 w-3" />
                              Mark Paid
                            </button>
                            <button
                              type="button"
                              disabled={isUpdating}
                              onClick={() => handleAction(r.id, "reject")}
                              className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 disabled:opacity-50 transition-colors"
                              title="Reject commission"
                            >
                              <X className="h-3 w-3" />
                              Reject
                            </button>
                          </>
                        )}
                        {r.status === "PAID" && r.paidAt && (
                          <span className="text-[10px] text-muted-foreground">
                            Paid {fmtDate(r.paidAt)}
                          </span>
                        )}
                        {r.status === "REJECTED" && (
                          <span className="text-[10px] text-muted-foreground">—</span>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
