"use client"

import { useState, useMemo } from "react"
import { Search, ExternalLink } from "lucide-react"
import { cn } from "@/lib/utils"

export type PartnerRow = {
  id: string
  referrerId: string
  code: string
  tier: string
  tierLabel: string
  clicks: number
  signups: number
  conversions: number
  totalEarned: number
  pendingPayout: number
  dubPartnerId: string | null
  commissionCount: number
  createdAt: string
  referrer: {
    name: string | null
    email: string | null
    company: string | null
  }
}

const TIER_STYLES: Record<string, string> = {
  AFFILIATE: "text-blue-400 bg-blue-500/10 border-blue-500/20",
  COMMUNITY_PARTNER: "text-purple-400 bg-purple-500/10 border-purple-500/20",
  RESELLER: "text-[#C4972A] bg-[#C4972A]/10 border-[#C4972A]/30",
}

const fmtMoney = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD" })

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })

export function PartnersTable({ rows }: { rows: PartnerRow[] }) {
  const [search, setSearch] = useState("")
  const [tierFilter, setTierFilter] = useState<string>("ALL")

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (tierFilter !== "ALL" && r.tier !== tierFilter) return false
      if (!search) return true
      const q = search.toLowerCase()
      return (
        r.code.toLowerCase().includes(q) ||
        (r.referrer.name ?? "").toLowerCase().includes(q) ||
        (r.referrer.email ?? "").toLowerCase().includes(q) ||
        (r.referrer.company ?? "").toLowerCase().includes(q)
      )
    })
  }, [rows, search, tierFilter])

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="flex flex-col gap-3 p-4 border-b border-border sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by name, email, company, or code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-deep border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <div className="flex gap-1">
          {["ALL", "AFFILIATE", "COMMUNITY_PARTNER", "RESELLER"].map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTierFilter(t)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                tierFilter === t
                  ? "bg-primary/20 text-primary border border-primary/30"
                  : "bg-deep text-muted-foreground hover:text-foreground border border-border"
              )}
            >
              {t === "ALL" ? "All" : t === "COMMUNITY_PARTNER" ? "Community" : t.charAt(0) + t.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-deep">
            <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
              <th className="px-4 py-3 font-medium">Partner</th>
              <th className="px-4 py-3 font-medium">Code</th>
              <th className="px-4 py-3 font-medium">Tier</th>
              <th className="px-4 py-3 font-medium text-right">Clicks</th>
              <th className="px-4 py-3 font-medium text-right">Signups</th>
              <th className="px-4 py-3 font-medium text-right">Conv.</th>
              <th className="px-4 py-3 font-medium text-right">Earned</th>
              <th className="px-4 py-3 font-medium text-right">Pending</th>
              <th className="px-4 py-3 font-medium">Dub</th>
              <th className="px-4 py-3 font-medium">Joined</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-4 py-8 text-center text-muted-foreground">
                  No partners match your filters.
                </td>
              </tr>
            ) : (
              filtered.map((r) => (
                <tr key={r.id} className="border-t border-border hover:bg-surface/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="text-foreground font-medium truncate max-w-[180px]">
                      {r.referrer.name ?? "—"}
                    </div>
                    <div className="text-xs text-muted-foreground truncate max-w-[180px]">
                      {r.referrer.email ?? ""}{r.referrer.company ? ` · ${r.referrer.company}` : ""}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{r.code}</td>
                  <td className="px-4 py-3">
                    <span className={cn(
                      "inline-flex px-2 py-0.5 rounded border text-[10px] font-semibold uppercase tracking-wider",
                      TIER_STYLES[r.tier] ?? "text-muted-foreground bg-muted border-border"
                    )}>
                      {r.tierLabel}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-xs text-muted-foreground">{r.clicks}</td>
                  <td className="px-4 py-3 text-right font-mono text-xs text-muted-foreground">{r.signups}</td>
                  <td className="px-4 py-3 text-right font-mono text-xs text-foreground font-semibold">{r.conversions}</td>
                  <td className="px-4 py-3 text-right font-mono text-xs text-green-400">{fmtMoney(r.totalEarned)}</td>
                  <td className="px-4 py-3 text-right font-mono text-xs text-amber-400">{fmtMoney(r.pendingPayout)}</td>
                  <td className="px-4 py-3">
                    {r.dubPartnerId ? (
                      <span className="inline-flex items-center gap-1 text-[10px] text-green-400">
                        <ExternalLink className="h-3 w-3" />
                        Connected
                      </span>
                    ) : (
                      <span className="text-[10px] text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">{fmtDate(r.createdAt)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
