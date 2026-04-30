"use client"

import { useState, useMemo, useDeferredValue } from "react"
import { Search, Download, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, User } from "lucide-react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { cn } from "@/lib/utils"

const STAGE_CONFIG: Record<string, { label: string; class: string }> = {
  APPLICATION_SUBMITTED: { label: "Applied",           class: "text-muted-foreground bg-muted/50 border-border" },
  CONSULT_BOOKED:        { label: "Consult Booked",    class: "text-primary bg-primary/5 border-primary/30" },
  CONSULT_COMPLETED:     { label: "Consult Completed", class: "text-primary bg-primary/10 border-primary/40" },
  MIGHTY_INVITED:        { label: "Mighty Invited",    class: "text-primary bg-primary/15 border-primary/50" },
  MEMBER_JOINED:         { label: "Member Joined",     class: "text-primary bg-primary/5 border-primary/30" },
  LOST:                  { label: "Lost / Ghosted",    class: "text-muted-foreground bg-muted/30 border-border" },
}

const ALL_STAGES = Object.keys(STAGE_CONFIG)

interface ClientRow {
  dealId: string
  userId: string | null
  name: string
  email: string
  company: string
  stage: string
  leadScore: number | null
  mrr: number
  services: string[]
  source: string | null
  createdAt: string
}

interface Props {
  rows: ClientRow[]
}

type SortField = "name" | "company" | "stage" | "leadScore" | "mrr" | "createdAt"
type SortDir = "asc" | "desc"

function relativeDate(isoStr: string): string {
  const diff = Date.now() - new Date(isoStr).getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) return "Today"
  if (days === 1) return "1d ago"
  if (days < 30) return `${days}d ago`
  const months = Math.floor(days / 30)
  if (months < 12) return `${months}mo ago`
  return `${Math.floor(months / 12)}yr ago`
}

function scoreColor(score: number | null): string {
  if (score === null) return "bg-muted-foreground"
  if (score >= 70) return "bg-primary"
  if (score >= 40) return "bg-primary/50"
  return "bg-muted-foreground"
}

const PAGE_SIZE = 25

export function ClientsTable({ rows }: Props) {
  const router = useRouter()
  const [search, setSearch] = useState("")
  const deferredSearch = useDeferredValue(search)
  const [stageFilter, setStageFilter] = useState<string>("all")
  const [sortField, setSortField] = useState<SortField>("createdAt")
  const [sortDir, setSortDir] = useState<SortDir>("desc")
  const [page, setPage] = useState(1)

  function handleSort(field: SortField) {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    } else {
      setSortField(field)
      setSortDir("asc")
    }
    setPage(1)
  }

  const filtered = useMemo(() => {
    const q = deferredSearch.toLowerCase()
    return rows.filter((r) => {
      if (
        q &&
        !r.name.toLowerCase().includes(q) &&
        !r.email.toLowerCase().includes(q) &&
        !r.company.toLowerCase().includes(q)
      ) {
        return false
      }
      if (stageFilter !== "all" && r.stage !== stageFilter) return false
      return true
    })
  }, [rows, deferredSearch, stageFilter])

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let cmp = 0
      if (sortField === "name") cmp = a.name.localeCompare(b.name)
      else if (sortField === "company") cmp = a.company.localeCompare(b.company)
      else if (sortField === "stage") cmp = a.stage.localeCompare(b.stage)
      else if (sortField === "leadScore") cmp = (a.leadScore ?? -1) - (b.leadScore ?? -1)
      else if (sortField === "mrr") cmp = a.mrr - b.mrr
      else if (sortField === "createdAt") cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      return sortDir === "asc" ? cmp : -cmp
    })
  }, [filtered, sortField, sortDir])

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE))
  const paginated = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  function exportCsv() {
    const header = ["Name", "Email", "Company", "Stage", "Lead Score", "MRR", "Services", "Source", "Created"]
    const csvRows = filtered.map((r) => [
      r.name,
      r.email,
      r.company,
      r.stage,
      r.leadScore ?? "",
      r.mrr,
      r.services.join("; "),
      r.source ?? "",
      new Date(r.createdAt).toLocaleDateString(),
    ])
    const csv = [header, ...csvRows]
      .map((row) => row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
      .join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `clients-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  function SortIcon({ field }: { field: SortField }) {
    if (sortField !== field) return <ChevronUp className="w-3 h-3 opacity-20" />
    return sortDir === "asc" ? (
      <ChevronUp className="w-3 h-3 text-foreground" />
    ) : (
      <ChevronDown className="w-3 h-3 text-foreground" />
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-1">Clients</h1>
          <p className="text-muted-foreground text-sm">
            {rows.length} total deal{rows.length !== 1 ? "s" : ""}
            {filtered.length !== rows.length && ` - ${filtered.length} filtered`}
          </p>
        </div>
        <button
          onClick={exportCsv}
          className="inline-flex items-center gap-2 px-4 py-2 bg-card hover:bg-surface border border-border text-foreground text-sm font-medium rounded-lg transition-colors"
        >
          <Download className="w-3.5 h-3.5" />
          Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            placeholder="Search by name, email, or company..."
            data-search
            className="w-full pl-9 pr-4 py-2 bg-card border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-[#981B1B] focus:ring-1 focus:ring-[#981B1B]/20"
          />
        </div>
        <select
          value={stageFilter}
          onChange={(e) => { setStageFilter(e.target.value); setPage(1) }}
          className="px-3 py-2 bg-card border border-border rounded-lg text-sm text-foreground focus:outline-none focus:border-[#981B1B]"
        >
          <option value="all">All Stages</option>
          {ALL_STAGES.map((s) => (
            <option key={s} value={s}>{STAGE_CONFIG[s]?.label ?? s}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      {sorted.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-12 text-center">
          <p className="text-muted-foreground">
            {rows.length === 0 ? "No deals yet." : "No clients match your filters."}
          </p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px]">
              <thead>
                <tr className="border-b border-border">
                  {(
                    [
                      { label: "Name", field: "name" as SortField },
                      { label: "Company", field: "company" as SortField },
                      { label: "Email", field: null },
                      { label: "Stage", field: "stage" as SortField },
                      { label: "Score", field: "leadScore" as SortField },
                      { label: "MRR", field: "mrr" as SortField },
                      { label: "Services", field: null },
                      { label: "Source", field: null },
                      { label: "Created", field: "createdAt" as SortField },
                      { label: "", field: null },
                    ] as { label: string; field: SortField | null }[]
                  ).map(({ label, field }, idx) => (
                    <th
                      key={label || `col-${idx}`}
                      onClick={field ? () => handleSort(field) : undefined}
                      className={cn(
                        "text-left text-xs text-muted-foreground font-medium px-4 py-3 whitespace-nowrap",
                        field && "cursor-pointer hover:text-foreground select-none"
                      )}
                    >
                      <span className="inline-flex items-center gap-1">
                        {label}
                        {field && <SortIcon field={field} />}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {paginated.map((r) => {
                  const sc = STAGE_CONFIG[r.stage] ?? { label: r.stage, class: "text-muted-foreground bg-deep border-border" }
                  return (
                    <tr
                      key={r.dealId}
                      onClick={() => router.push(`/admin/crm/${r.dealId}`)}
                      className="hover:bg-surface transition-colors cursor-pointer"
                    >
                      <td className="px-4 py-3">
                        <span className="text-foreground font-semibold text-sm">{r.name || "--"}</span>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{r.company || "--"}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{r.email}</td>
                      <td className="px-4 py-3">
                        <span className={cn("text-xs px-2 py-0.5 rounded-full border", sc.class)}>
                          {sc.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {r.leadScore !== null ? (
                          <span className="inline-flex items-center gap-1.5 text-sm font-mono text-foreground">
                            <span className={cn("w-2 h-2 rounded-full", scoreColor(r.leadScore))} />
                            {r.leadScore}
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-xs">--</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {r.mrr > 0 ? (
                          <span className="text-foreground font-mono text-sm font-semibold">
                            ${r.mrr.toLocaleString()}
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-xs font-mono">--</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {r.services.length > 0 ? (
                            r.services.map((s) => (
                              <span key={s} className="text-xs px-1.5 py-0.5 bg-deep text-muted-foreground rounded">
                                {s}
                              </span>
                            ))
                          ) : (
                            <span className="text-muted-foreground text-xs">--</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {r.source ? (
                          <span className="text-xs px-2 py-0.5 bg-deep text-muted-foreground rounded border border-border">
                            {r.source}
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-xs">--</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                        {relativeDate(r.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        {r.userId && (
                          <Link
                            href={`/admin/clients/${r.userId}`}
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-[#981B1B] transition-colors"
                            title="View client profile"
                          >
                            <User className="w-3.5 h-3.5" />
                          </Link>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-border">
              <span className="text-xs text-muted-foreground">
                {(page - 1) * PAGE_SIZE + 1}--{Math.min(page * PAGE_SIZE, sorted.length)} of {sorted.length}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-1.5 rounded bg-muted text-muted-foreground hover:bg-surface disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <span className="text-xs text-muted-foreground">{page} / {totalPages}</span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-1.5 rounded bg-muted text-muted-foreground hover:bg-surface disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
