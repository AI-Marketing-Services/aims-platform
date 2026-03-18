"use client"

import { useState, useMemo, Fragment } from "react"
import { ChevronDown, ChevronUp, Search, ChevronLeft, ChevronRight, Check, X } from "lucide-react"
import { cn } from "@/lib/utils"

const TYPE_LABEL: Record<string, string> = {
  AI_READINESS_QUIZ: "AI Readiness Quiz",
  ROI_CALCULATOR: "ROI Calculator",
  WEBSITE_AUDIT: "Website Audit",
  SEGMENT_EXPLORER: "Segment Explorer",
  STACK_CONFIGURATOR: "Stack Configurator",
}

const TYPE_COLOR: Record<string, string> = {
  AI_READINESS_QUIZ: "text-blue-400 bg-blue-500/10 border-blue-500/20",
  ROI_CALCULATOR: "text-green-400 bg-green-500/10 border-green-500/20",
  WEBSITE_AUDIT: "text-purple-400 bg-purple-500/10 border-purple-500/20",
  SEGMENT_EXPLORER: "text-orange-400 bg-orange-500/10 border-orange-500/20",
  STACK_CONFIGURATOR: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
}

export interface SubmissionRow {
  id: string
  type: string
  email: string
  name: string | null
  score: number | null
  convertedToDeal: boolean
  dealId: string | null
  source: string | null
  data: unknown
  createdAt: string
}

const PAGE_SIZE = 25

type SortKey = "createdAt" | "score"
type SortDir = "asc" | "desc"

export function LeadMagnetTable({
  submissions,
}: {
  submissions: SubmissionRow[]
}) {
  const [search, setSearch] = useState("")
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [sortKey, setSortKey] = useState<SortKey>("createdAt")
  const [sortDir, setSortDir] = useState<SortDir>("desc")
  const [page, setPage] = useState(0)

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    return submissions.filter(
      (s) =>
        !q ||
        s.email.toLowerCase().includes(q) ||
        (s.name ?? "").toLowerCase().includes(q)
    )
  }, [submissions, search])

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let av: number, bv: number
      if (sortKey === "createdAt") {
        av = new Date(a.createdAt).getTime()
        bv = new Date(b.createdAt).getTime()
      } else {
        av = a.score ?? -1
        bv = b.score ?? -1
      }
      return sortDir === "asc" ? av - bv : bv - av
    })
  }, [filtered, sortKey, sortDir])

  const totalPages = Math.ceil(sorted.length / PAGE_SIZE)
  const paged = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    } else {
      setSortKey(key)
      setSortDir("desc")
    }
    setPage(0)
  }

  function SortIcon({ k }: { k: SortKey }) {
    if (sortKey !== k) return <ChevronDown className="h-3 w-3 opacity-30 inline ml-1" />
    return sortDir === "asc" ? (
      <ChevronUp className="h-3 w-3 inline ml-1 text-[#DC2626]" />
    ) : (
      <ChevronDown className="h-3 w-3 inline ml-1 text-[#DC2626]" />
    )
  }

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="px-5 py-4 border-b border-border flex items-center gap-3">
        <h2 className="text-sm font-semibold text-foreground">Recent Submissions</h2>
        <span className="text-xs text-muted-foreground ml-1">{filtered.length} results</span>
        <div className="ml-auto relative">
          <Search className="h-3.5 w-3.5 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search name or email…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0) }}
            className="h-8 pl-8 pr-3 text-xs rounded-lg bg-muted border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-[#DC2626]/50 w-56"
          />
        </div>
      </div>

      {paged.length === 0 ? (
        <div className="p-8 text-center">
          <p className="text-sm text-muted-foreground">No submissions found.</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Contact</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Type</th>
                  <th
                    className="px-4 py-3 text-left text-xs font-medium text-muted-foreground cursor-pointer select-none"
                    onClick={() => toggleSort("score")}
                  >
                    Score <SortIcon k="score" />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Converted</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Source</th>
                  <th
                    className="px-4 py-3 text-left text-xs font-medium text-muted-foreground cursor-pointer select-none"
                    onClick={() => toggleSort("createdAt")}
                  >
                    Date <SortIcon k="createdAt" />
                  </th>
                </tr>
              </thead>
              <tbody>
                {paged.map((sub) => {
                  const isExpanded = expandedId === sub.id
                  const dateStr = new Date(sub.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })
                  return (
                    <Fragment key={sub.id}>
                      <tr
                        className="border-b border-border/50 hover:bg-muted/30 transition-colors cursor-pointer"
                        onClick={() => setExpandedId(isExpanded ? null : sub.id)}
                      >
                        <td className="px-4 py-3">
                          <p className="text-sm font-medium text-foreground">
                            {sub.name ?? sub.email.split("@")[0]}
                          </p>
                          <p className="text-xs text-muted-foreground">{sub.email}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={cn(
                              "text-xs font-medium px-2 py-0.5 rounded-full border",
                              TYPE_COLOR[sub.type] ?? "border-border bg-muted text-muted-foreground"
                            )}
                          >
                            {TYPE_LABEL[sub.type] ?? sub.type}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm font-mono text-foreground">
                            {sub.score != null ? sub.score.toFixed(0) : "—"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={cn(
                              "text-xs font-medium",
                              sub.convertedToDeal ? "text-green-600" : "text-muted-foreground"
                            )}
                          >
                            {sub.convertedToDeal ? <><Check className="inline h-3 w-3" /> Yes</> : <><X className="inline h-3 w-3" /> No</>}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs text-muted-foreground">{sub.source ?? "direct"}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs text-muted-foreground">{dateStr}</span>
                            {isExpanded ? (
                              <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
                            ) : (
                              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                            )}
                          </div>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr key={`${sub.id}-expanded`} className="bg-muted/20 border-b border-border/50">
                          <td colSpan={6} className="px-6 py-4">
                            <div className="space-y-2">
                              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                                Submission Data
                              </p>
                              {sub.dealId && (
                                <p className="text-xs text-muted-foreground mb-2">
                                  Deal:{" "}
                                  <a
                                    href={`/admin/crm/${sub.dealId}`}
                                    className="text-[#DC2626] hover:underline"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    View deal →
                                  </a>
                                </p>
                              )}
                              <pre className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-3 overflow-x-auto max-h-48 font-mono whitespace-pre-wrap break-words">
                                {JSON.stringify(sub.data, null, 2)}
                              </pre>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  )
                })}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="px-5 py-3 border-t border-border flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                Page {page + 1} of {totalPages} &middot; {sorted.length} results
              </span>
              <div className="flex items-center gap-1">
                <button
                  disabled={page === 0}
                  onClick={() => setPage((p) => p - 1)}
                  className="h-7 w-7 flex items-center justify-center rounded-md border border-border hover:bg-muted/50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </button>
                <button
                  disabled={page >= totalPages - 1}
                  onClick={() => setPage((p) => p + 1)}
                  className="h-7 w-7 flex items-center justify-center rounded-md border border-border hover:bg-muted/50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
