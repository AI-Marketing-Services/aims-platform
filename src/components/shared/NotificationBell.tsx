"use client"

import { useState, useEffect, useRef } from "react"
import { Bell, X, Users, DollarSign, BarChart2, LifeBuoy, Zap, Activity } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

interface Notification {
  id: string
  type: string
  title: string
  message: string
  read: boolean
  sentAt: string
  metadata?: Record<string, unknown>
}

const TYPE_ICON: Record<string, React.ElementType> = {
  new_lead: Users,
  chatbot_lead_captured: Users,
  new_purchase: DollarSign,
  lead_magnet_completed: BarChart2,
  support_ticket: LifeBuoy,
  fulfillment_overdue: Zap,
  churn_risk: Activity,
  deal_stage_change: BarChart2,
  eod_submitted: Activity,
}

const TYPE_COLOR: Record<string, string> = {
  new_lead: "bg-red-50 text-[#DC2626]",
  chatbot_lead_captured: "bg-red-50 text-[#DC2626]",
  new_purchase: "bg-red-50 text-[#DC2626]",
  lead_magnet_completed: "bg-red-50 text-[#B91C1C]",
  support_ticket: "bg-red-50 text-[#DC2626]",
  fulfillment_overdue: "bg-red-100 text-red-800",
  churn_risk: "bg-red-100 text-red-800",
  deal_stage_change: "bg-muted text-muted-foreground",
  eod_submitted: "bg-muted text-muted-foreground",
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

export function NotificationBell({ variant = "light" }: { variant?: "light" | "dark" }) {
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unread, setUnread] = useState(0)
  const [loading, setLoading] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)

  const fetchNotifications = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/notifications?limit=15")
      if (res.ok) {
        const data = await res.json()
        setNotifications(data.notifications ?? [])
        setUnread(data.unreadCount ?? 0)
      }
    } catch {}
    setLoading(false)
  }

  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [open])

  const markAllRead = async () => {
    await fetch("/api/notifications/read", { method: "PATCH" })
    setUnread(0)
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }

  const iconClass = variant === "dark" ? "text-white/60 hover:text-white" : "text-muted-foreground hover:text-foreground"

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => setOpen(!open)}
        className={cn("relative p-2 rounded-lg transition-colors", variant === "dark" ? "hover:bg-white/10" : "hover:bg-gray-100")}
        aria-label="Notifications"
      >
        <Bell className={cn("h-4 w-4", iconClass)} />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#DC2626] text-[9px] font-bold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className={cn(
          "absolute right-0 top-full mt-2 w-80 rounded-xl border shadow-xl z-50 overflow-hidden",
          variant === "dark"
            ? "bg-[#0D0F14] border-white/10"
            : "bg-card border-border"
        )}>
          {/* Header */}
          <div className={cn("flex items-center justify-between px-4 py-3 border-b", variant === "dark" ? "border-white/10" : "border-border")}>
            <span className={cn("text-sm font-semibold", variant === "dark" ? "text-white" : "text-foreground")}>Notifications</span>
            <div className="flex items-center gap-2">
              {unread > 0 && (
                <button
                  onClick={markAllRead}
                  className="text-xs text-[#DC2626] hover:underline"
                >
                  Mark all read
                </button>
              )}
              <button onClick={() => setOpen(false)} className={cn("p-0.5 rounded", variant === "dark" ? "text-white/40 hover:text-white/80" : "text-muted-foreground hover:text-foreground")}>
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto custom-scrollbar">
            {loading && notifications.length === 0 ? (
              <div className="py-8 text-center">
                <div className={cn("text-xs", variant === "dark" ? "text-white/40" : "text-muted-foreground")}>Loading...</div>
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-8 text-center">
                <Bell className={cn("h-6 w-6 mx-auto mb-2", variant === "dark" ? "text-white/20" : "text-muted-foreground/40")} />
                <p className={cn("text-xs", variant === "dark" ? "text-white/40" : "text-muted-foreground")}>No notifications</p>
              </div>
            ) : (
              notifications.map((n) => {
                const Icon = TYPE_ICON[n.type] ?? Bell
                const colorClass = TYPE_COLOR[n.type] ?? "bg-muted text-muted-foreground"
                return (
                  <div
                    key={n.id}
                    className={cn(
                      "flex items-start gap-3 px-4 py-3 border-b last:border-0 transition-colors",
                      variant === "dark"
                        ? `border-white/5 ${!n.read ? "bg-white/5" : "hover:bg-white/5"}`
                        : `border-border ${!n.read ? "bg-red-50/30" : "hover:bg-muted/30"}`
                    )}
                  >
                    <div className={cn("flex h-7 w-7 items-center justify-center rounded-lg flex-shrink-0 mt-0.5", colorClass)}>
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn("text-xs font-semibold truncate", variant === "dark" ? "text-white/80" : "text-foreground")}>{n.title}</p>
                      <p className={cn("text-xs mt-0.5 line-clamp-2 leading-relaxed", variant === "dark" ? "text-white/40" : "text-muted-foreground")}>{n.message}</p>
                      <p className={cn("text-[10px] mt-1", variant === "dark" ? "text-white/25" : "text-muted-foreground/60")}>{timeAgo(n.sentAt)}</p>
                    </div>
                    {!n.read && (
                      <div className="h-1.5 w-1.5 rounded-full bg-[#DC2626] flex-shrink-0 mt-2" />
                    )}
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}
