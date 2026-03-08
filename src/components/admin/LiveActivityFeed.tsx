"use client"

import { useState, useEffect } from "react"
import { Users, DollarSign, BarChart2, LifeBuoy, Zap, Activity, Bell, ArrowUpRight } from "lucide-react"
import Link from "next/link"

interface FeedItem {
  id: string
  type: string
  title: string
  message: string
  sentAt: string
  metadata?: Record<string, unknown>
}

const TYPE_CONFIG: Record<string, { icon: React.ElementType; dot: string; label: string }> = {
  new_lead: { icon: Users, dot: "bg-[#DC2626]", label: "Lead" },
  chatbot_lead_captured: { icon: Users, dot: "bg-[#DC2626]", label: "Chat Lead" },
  new_purchase: { icon: DollarSign, dot: "bg-[#DC2626]", label: "Purchase" },
  lead_magnet_completed: { icon: BarChart2, dot: "bg-[#991B1B]", label: "Lead Magnet" },
  support_ticket: { icon: LifeBuoy, dot: "bg-[#F87171]", label: "Ticket" },
  fulfillment_overdue: { icon: Zap, dot: "bg-red-800", label: "Overdue" },
  churn_risk: { icon: Activity, dot: "bg-red-900", label: "Churn Risk" },
  deal_stage_change: { icon: BarChart2, dot: "bg-gray-400", label: "Stage Change" },
  eod_submitted: { icon: Activity, dot: "bg-gray-400", label: "EOD" },
}

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

export function LiveActivityFeed() {
  const [items, setItems] = useState<FeedItem[]>([])
  const [loading, setLoading] = useState(true)

  const fetch30 = async () => {
    try {
      const res = await fetch("/api/notifications?limit=20")
      if (res.ok) {
        const data = await res.json()
        setItems(data.notifications ?? [])
      }
    } catch {}
    setLoading(false)
  }

  useEffect(() => {
    fetch30()
    const interval = setInterval(fetch30, 30000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-foreground">Live Activity</h2>
          <span className="flex items-center gap-1 rounded-full bg-red-50 px-1.5 py-0.5 text-[10px] font-medium text-[#DC2626]">
            <span className="h-1 w-1 rounded-full bg-[#DC2626] animate-pulse" />
            Live
          </span>
        </div>
        <Link href="/admin/crm" className="flex items-center gap-1 text-xs font-medium text-[#DC2626] hover:underline">
          View all <ArrowUpRight className="h-3 w-3" />
        </Link>
      </div>

      <div className="divide-y divide-border">
        {loading ? (
          [...Array(5)].map((_, i) => (
            <div key={i} className="flex items-start gap-3 px-5 py-3.5 animate-pulse">
              <div className="h-2 w-2 rounded-full bg-gray-200 mt-1.5 flex-shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-2.5 bg-gray-200 rounded w-2/3" />
                <div className="h-2 bg-gray-100 rounded w-full" />
              </div>
              <div className="h-2 bg-gray-100 rounded w-10" />
            </div>
          ))
        ) : items.length === 0 ? (
          <div className="py-8 text-center">
            <Bell className="h-5 w-5 text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">No activity yet</p>
          </div>
        ) : (
          items.map((item) => {
            const config = TYPE_CONFIG[item.type] ?? { icon: Bell, dot: "bg-gray-300", label: item.type }
            const Icon = config.icon
            return (
              <div key={item.id} className="flex items-start gap-3 px-5 py-3 hover:bg-muted/20 transition-colors">
                <div className="flex items-center gap-2 flex-shrink-0 mt-1">
                  <div className={`h-2 w-2 rounded-full ${config.dot}`} />
                  <div className="flex h-6 w-6 items-center justify-center rounded-md bg-muted">
                    <Icon className="h-3 w-3 text-muted-foreground" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-foreground truncate">{item.title}</p>
                  <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-1 mt-0.5">{item.message}</p>
                </div>
                <span className="text-[10px] text-muted-foreground flex-shrink-0 mt-0.5">{timeAgo(item.sentAt)}</span>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
