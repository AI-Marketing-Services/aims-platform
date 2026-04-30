"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Building2, DollarSign, User, Trash2, Sparkles, Flame } from "lucide-react"
import { cn } from "@/lib/utils"

interface ClientDeal {
  id: string
  companyName: string
  contactName: string | null
  contactEmail: string | null
  value: number
  currency: string
  stage: string
  tags: string[]
  leadScore: number | null
  lastEnrichedAt: string | null
  updatedAt: string
  _count: { activities: number }
}

// Tags applied automatically by deriveAutoTags — render with subtle
// styling so operators can distinguish AI-derived signals from their
// own manually-set tags.
const AUTO_TAG_PREFIXES = new Set([
  "high-fit",
  "medium-fit",
  "low-fit",
  "smb",
  "mid-market",
  "enterprise",
  "missing-website",
  "missing-contact",
  "recent",
  "legacy",
])
const AUTO_TAG_INDUSTRY_IDS = new Set([
  "hvac",
  "dental",
  "realestate",
  "restaurants",
  "law",
  "ecommerce",
  "roofing",
  "gym",
  "financial",
  "property",
])

function isAutoTag(tag: string): boolean {
  const normalized = tag.toLowerCase().replace(/\s+/g, "-")
  return (
    AUTO_TAG_PREFIXES.has(normalized) || AUTO_TAG_INDUSTRY_IDS.has(normalized)
  )
}

// Score buckets use a tonal primary scale instead of green/amber/grey
// so the score chip stays on-brand. Higher score = solid primary.
function scoreBucketColor(score: number): string {
  if (score >= 70) return "bg-primary/15 text-primary border-primary/40 font-bold"
  if (score >= 45) return "bg-primary/[0.06] text-primary border-primary/20"
  return "bg-muted text-muted-foreground border-border"
}

interface ClientDealCardProps {
  deal: ClientDeal
  onDelete?: (id: string) => void
  onDragStart?: (dealId: string) => void
  onDragEnd?: () => void
  isDragging?: boolean
}

const CURRENCY_SYMBOLS: Record<string, string> = { USD: "$", EUR: "€", GBP: "£", CAD: "C$" }

function formatValue(value: number, currency: string) {
  if (value === 0) return null
  const sym = CURRENCY_SYMBOLS[currency] ?? currency + " "
  if (value >= 1000) return `${sym}${(value / 1000).toFixed(0)}k`
  return `${sym}${value.toLocaleString()}`
}

export function ClientDealCard({
  deal,
  onDelete,
  onDragStart,
  onDragEnd,
  isDragging,
}: ClientDealCardProps) {
  const router = useRouter()
  const [deleting, setDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const displayValue = formatValue(deal.value, deal.currency)

  async function handleDelete(e: React.MouseEvent) {
    e.stopPropagation()
    if (!confirmDelete) {
      setConfirmDelete(true)
      setTimeout(() => setConfirmDelete(false), 3000)
      return
    }
    setDeleting(true)
    try {
      await fetch(`/api/portal/crm/deals/${deal.id}`, { method: "DELETE" })
      onDelete?.(deal.id)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div
      onClick={() => router.push(`/portal/crm/${deal.id}`)}
      draggable={!!onDragStart}
      onDragStart={(e) => {
        if (!onDragStart) return
        e.dataTransfer.setData("text/plain", deal.id)
        e.dataTransfer.effectAllowed = "move"
        onDragStart(deal.id)
      }}
      onDragEnd={() => onDragEnd?.()}
      className={cn(
        "group relative bg-card border border-border rounded-lg p-3.5 cursor-pointer",
        "hover:border-primary/40 hover:shadow-[0_0_0_1px_rgba(196,151,42,0.15)] transition-all duration-150",
        deleting && "opacity-50 pointer-events-none",
        isDragging && "opacity-30",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="h-7 w-7 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
            <Building2 className="h-3.5 w-3.5 text-primary" />
          </div>
          <p className="text-sm font-semibold text-foreground truncate leading-tight">
            {deal.companyName}
          </p>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {/* Lead score badge — derived from enrichment, surfaces priority. */}
          {typeof deal.leadScore === "number" && (
            <span
              className={cn(
                "inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded border tabular-nums",
                scoreBucketColor(deal.leadScore),
              )}
              title={`AI lead score · auto-derived from enrichment`}
            >
              {deal.leadScore >= 70 && <Flame className="h-2.5 w-2.5" />}
              {deal.leadScore}
            </span>
          )}

          <button
            onClick={handleDelete}
            className={cn(
              "opacity-0 group-hover:opacity-100 p-1 rounded transition-all",
              confirmDelete
                ? "opacity-100 text-red-400 bg-red-400/10"
                : "text-muted-foreground hover:text-red-400 hover:bg-red-400/10"
            )}
            title={confirmDelete ? "Click again to confirm" : "Delete deal"}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {deal.contactName && (
        <div className="flex items-center gap-1.5 mt-2">
          <User className="h-3 w-3 text-muted-foreground shrink-0" />
          <span className="text-xs text-muted-foreground truncate">{deal.contactName}</span>
        </div>
      )}

      <div className="flex items-center justify-between mt-2.5">
        {displayValue ? (
          <div className="flex items-center gap-1">
            <DollarSign className="h-3 w-3 text-primary" />
            <span className="text-xs font-semibold text-foreground">{displayValue}</span>
          </div>
        ) : (
          <span className="text-xs text-muted-foreground/50">No value set</span>
        )}
        <span className="text-[10px] text-muted-foreground/60">
          {deal._count.activities} {deal._count.activities === 1 ? "activity" : "activities"}
        </span>
      </div>

      {deal.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {deal.tags.slice(0, 4).map((tag) => {
            const auto = isAutoTag(tag)
            return (
              <span
                key={tag}
                className={cn(
                  "inline-block text-[10px] px-1.5 py-0.5 rounded font-medium",
                  auto
                    ? "bg-muted/60 text-muted-foreground border border-border/60"
                    : "bg-primary/10 text-primary/80 border border-primary/20",
                )}
                title={auto ? "Auto-tag (from enrichment)" : "Custom tag"}
              >
                {tag}
              </span>
            )
          })}
        </div>
      )}

      {/* Soft enrich-prompt for cards that haven't been enriched yet —
          encourages operators to fire enrichment on stale prospects. */}
      {!deal.lastEnrichedAt && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            router.push(`/portal/crm/${deal.id}`)
          }}
          className="mt-2 w-full inline-flex items-center justify-center gap-1 rounded-md border border-dashed border-primary/30 px-2 py-1 text-[10px] font-semibold text-primary/80 hover:border-primary/60 hover:bg-primary/5 transition-colors"
        >
          <Sparkles className="h-2.5 w-2.5" />
          Enrich for full profile
        </button>
      )}
    </div>
  )
}
