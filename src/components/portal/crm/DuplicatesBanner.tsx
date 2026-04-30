"use client"

import { useEffect, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import {
  AlertTriangle,
  Merge,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  Loader2,
  Star,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface DuplicateDeal {
  id: string
  companyName: string
  contactEmail: string | null
  stage: string
  value: number
  currency: string
  leadScore: number | null
  lastEnrichedAt: string | null
  updatedAt: string
  contactCount: number
  activityCount: number
}

interface DuplicateCluster {
  matchType: "companyName" | "contactEmail"
  matchValue: string
  deals: DuplicateDeal[]
}

/**
 * DuplicatesBanner detects clusters of likely-duplicate ClientDeals
 * (same companyName or contactEmail) on the CRM index page. Self-fetches
 * on mount; renders nothing if there are no duplicates.
 *
 * Operator picks a canonical deal per cluster; the rest are merged into
 * it. Merge moves contacts/activities/notes/proposals/invoices over and
 * deletes the source deal.
 */
export function DuplicatesBanner() {
  const router = useRouter()
  const [clusters, setClusters] = useState<DuplicateCluster[] | null>(null)
  const [expandedKey, setExpandedKey] = useState<string | null>(null)
  const [merging, setMerging] = useState<string | null>(null) // cluster key being merged
  const [error, setError] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  useEffect(() => {
    let cancelled = false
    fetch("/api/portal/crm/duplicates")
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return
        if (Array.isArray(d.clusters)) setClusters(d.clusters)
        else setClusters([])
      })
      .catch(() => !cancelled && setClusters([]))
    return () => {
      cancelled = true
    }
  }, [])

  if (clusters === null) return null
  if (clusters.length === 0) return null

  const dupCount = clusters.reduce(
    (sum, c) => sum + Math.max(0, c.deals.length - 1),
    0,
  )

  async function handleMergeAllInto(
    cluster: DuplicateCluster,
    targetId: string,
  ) {
    const clusterKey = `${cluster.matchType}:${cluster.matchValue}`
    setMerging(clusterKey)
    setError(null)
    try {
      const others = cluster.deals.filter((d) => d.id !== targetId)
      for (const other of others) {
        const res = await fetch(`/api/portal/crm/deals/${targetId}/merge`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sourceDealId: other.id }),
        })
        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          throw new Error(data.error ?? "Merge failed")
        }
      }
      // Remove this cluster from local state on success
      setClusters((cs) =>
        (cs ?? []).filter(
          (c) =>
            !(
              c.matchType === cluster.matchType &&
              c.matchValue === cluster.matchValue
            ),
        ),
      )
      startTransition(() => router.refresh())
    } catch (err) {
      setError(err instanceof Error ? err.message : "Merge failed")
    } finally {
      setMerging(null)
    }
  }

  return (
    <div className="mb-4 rounded-xl border border-amber-500/30 bg-amber-500/5 px-4 py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2 min-w-0">
          <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground">
              {dupCount} duplicate {dupCount === 1 ? "deal" : "deals"} detected
            </p>
            <p className="text-[11px] text-muted-foreground">
              Same company name or contact email. Pick a canonical deal in each
              cluster; the rest get merged in (contacts, notes, proposals,
              invoices all move over).
            </p>
          </div>
        </div>
      </div>

      <ul className="mt-3 space-y-2">
        {clusters.map((cluster) => {
          const clusterKey = `${cluster.matchType}:${cluster.matchValue}`
          const isExpanded = expandedKey === clusterKey
          const isMerging = merging === clusterKey
          const sortedDeals = [...cluster.deals].sort((a, b) => {
            // Suggest the deal with the highest signal (enriched, more
            // contacts, more activities, higher score) as the canonical.
            const aScore =
              (a.leadScore ?? 0) +
              (a.lastEnrichedAt ? 30 : 0) +
              a.contactCount * 5 +
              a.activityCount
            const bScore =
              (b.leadScore ?? 0) +
              (b.lastEnrichedAt ? 30 : 0) +
              b.contactCount * 5 +
              b.activityCount
            return bScore - aScore
          })
          const recommended = sortedDeals[0]
          return (
            <li
              key={clusterKey}
              className="rounded-lg border border-amber-500/20 bg-background overflow-hidden"
            >
              <button
                type="button"
                onClick={() => setExpandedKey(isExpanded ? null : clusterKey)}
                className="w-full px-3 py-2 flex items-center gap-2 hover:bg-muted/30 transition-colors"
              >
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-sm font-medium text-foreground truncate">
                    {cluster.matchType === "companyName"
                      ? `Company: ${cluster.matchValue}`
                      : `Email: ${cluster.matchValue}`}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {cluster.deals.length} duplicate entries
                  </p>
                </div>
                {isExpanded ? (
                  <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                )}
              </button>

              {isExpanded && (
                <div className="border-t border-border divide-y divide-border">
                  {sortedDeals.map((d) => {
                    const isRecommended = d.id === recommended.id
                    return (
                      <div
                        key={d.id}
                        className={cn(
                          "px-3 py-2.5 flex items-center gap-3",
                          isRecommended && "bg-primary/5",
                        )}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            {isRecommended && (
                              <Star className="h-3 w-3 text-primary fill-primary" />
                            )}
                            <p className="text-sm font-medium text-foreground truncate">
                              {d.companyName}
                            </p>
                            <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                              {d.stage}
                            </span>
                            {typeof d.leadScore === "number" && (
                              <span className="text-[10px] font-bold tabular-nums text-primary">
                                {d.leadScore}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-muted-foreground truncate">
                            {[
                              d.contactEmail,
                              `${d.contactCount} contact${d.contactCount === 1 ? "" : "s"}`,
                              `${d.activityCount} activit${d.activityCount === 1 ? "y" : "ies"}`,
                              d.lastEnrichedAt ? "enriched" : "not enriched",
                            ]
                              .filter(Boolean)
                              .join(" · ")}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleMergeAllInto(cluster, d.id)}
                          disabled={isMerging}
                          className={cn(
                            "shrink-0 inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
                            isRecommended
                              ? "bg-primary text-primary-foreground hover:bg-primary/90"
                              : "border border-border bg-background text-foreground hover:border-primary hover:text-primary",
                          )}
                        >
                          {isMerging ? (
                            <>
                              <Loader2 className="h-3 w-3 animate-spin" />
                              Merging...
                            </>
                          ) : isRecommended ? (
                            <>
                              <Merge className="h-3 w-3" />
                              Keep this, merge others in
                            </>
                          ) : (
                            <>
                              <Merge className="h-3 w-3" />
                              Use as canonical
                            </>
                          )}
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}
            </li>
          )
        })}
      </ul>

      {error && (
        <div className="mt-2 inline-flex items-start gap-2 text-xs text-destructive">
          <X className="h-3.5 w-3.5 shrink-0 mt-0.5" />
          {error}
        </div>
      )}
    </div>
  )
}
