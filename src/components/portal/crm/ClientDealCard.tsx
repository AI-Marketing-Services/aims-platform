"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Building2, DollarSign, User, Trash2 } from "lucide-react"
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
  updatedAt: string
  _count: { activities: number }
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

        <button
          onClick={handleDelete}
          className={cn(
            "opacity-0 group-hover:opacity-100 p-1 rounded transition-all shrink-0",
            confirmDelete
              ? "opacity-100 text-red-400 bg-red-400/10"
              : "text-muted-foreground hover:text-red-400 hover:bg-red-400/10"
          )}
          title={confirmDelete ? "Click again to confirm" : "Delete deal"}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
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
            <DollarSign className="h-3 w-3 text-emerald-500" />
            <span className="text-xs font-semibold text-emerald-400">{displayValue}</span>
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
          {deal.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="inline-block text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary/80 font-medium"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
