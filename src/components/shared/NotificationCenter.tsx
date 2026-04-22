"use client"

import { memo } from "react"
import { Bell, Users, DollarSign, BarChart2, LifeBuoy, Zap, Activity, X, CheckCheck } from "lucide-react"
import { cn, timeAgo } from "@/lib/utils"

export interface NotificationItem {
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
  support_reply: LifeBuoy,
  fulfillment_overdue: Zap,
  fulfillment_update: Zap,
  churn_risk: Activity,
  deal_stage_change: BarChart2,
  eod_submitted: Activity,
  billing_alert: DollarSign,
  marketing_digest: BarChart2,
  daily_digest: BarChart2,
  api_cost_spike: Activity,
  missed_eod: Activity,
}

const TYPE_COLOR: Record<string, string> = {
  new_lead: "bg-primary/10 text-primary",
  chatbot_lead_captured: "bg-primary/10 text-primary",
  new_purchase: "bg-primary/10 text-primary",
  lead_magnet_completed: "bg-primary/15 text-primary",
  support_ticket: "bg-primary/10 text-primary",
  support_reply: "bg-primary/10 text-primary",
  fulfillment_overdue: "bg-primary/15 text-primary",
  fulfillment_update: "bg-primary/10 text-primary",
  churn_risk: "bg-primary/15 text-primary",
  deal_stage_change: "bg-deep text-muted-foreground",
  eod_submitted: "bg-deep text-muted-foreground",
  billing_alert: "bg-primary/15 text-primary",
  marketing_digest: "bg-deep text-muted-foreground",
  daily_digest: "bg-deep text-muted-foreground",
  api_cost_spike: "bg-primary/15 text-primary",
  missed_eod: "bg-primary/15 text-primary",
}


function truncate(str: string, maxLen: number) {
  if (str.length <= maxLen) return str
  return str.slice(0, maxLen).trimEnd() + "..."
}

const NotificationRow = memo(function NotificationRow({
  item: n,
  onMarkRead,
}: {
  item: NotificationItem
  onMarkRead: (id: string) => void
}) {
  const Icon = TYPE_ICON[n.type] ?? Bell
  const colorClass = TYPE_COLOR[n.type] ?? "bg-deep text-muted-foreground"
  return (
    <button
      onClick={() => {
        if (!n.read) onMarkRead(n.id)
      }}
      className={cn(
        "flex items-start gap-3 px-4 py-3 w-full text-left transition-colors border-b border-border last:border-0",
        !n.read
          ? "border-l-[3px] border-l-primary bg-primary/5 hover:bg-primary/10"
          : "border-l-[3px] border-l-transparent hover:bg-surface",
        !n.read ? "cursor-pointer" : "cursor-default"
      )}
    >
      <div
        className={cn(
          "flex h-8 w-8 items-center justify-center rounded-lg flex-shrink-0 mt-0.5",
          colorClass
        )}
      >
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p
            className={cn(
              "text-sm truncate",
              !n.read ? "font-semibold text-foreground" : "font-medium text-foreground"
            )}
          >
            {n.title}
          </p>
          {!n.read && (
            <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0 mt-1.5" />
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">
          {truncate(n.message, 120)}
        </p>
        <p className="text-[10px] text-muted-foreground mt-1">{timeAgo(n.sentAt)}</p>
      </div>
    </button>
  )
})

interface NotificationCenterProps {
  notifications: NotificationItem[]
  unreadCount: number
  loading: boolean
  onMarkRead: (id: string) => void
  onMarkAllRead: () => void
  onClose: () => void
}

export function NotificationCenter({
  notifications,
  unreadCount,
  loading,
  onMarkRead,
  onMarkAllRead,
  onClose,
}: NotificationCenterProps) {
  return (
    <div className="fixed right-4 top-4 w-96 max-w-[calc(100vw-2rem)] rounded-xl border border-border bg-card shadow-lg z-50 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-foreground">Notifications</span>
          {unreadCount > 0 && (
            <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground">
              {unreadCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={onMarkAllRead}
              className="flex items-center gap-1 text-xs text-primary hover:underline"
            >
              <CheckCheck className="h-3 w-3" />
              Mark all read
            </button>
          )}
          <button
            onClick={onClose}
            aria-label="Close notifications"
            className="p-0.5 rounded text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Notification list */}
      <div className="max-h-[28rem] overflow-y-auto custom-scrollbar">
        {loading && notifications.length === 0 ? (
          <div className="py-12 text-center">
            <div className="text-xs text-muted-foreground">Loading notifications...</div>
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-12 text-center">
            <Bell className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
            <p className="text-sm font-medium text-muted-foreground">No notifications yet</p>
            <p className="text-xs text-muted-foreground mt-1">
              You will see updates here when something happens.
            </p>
          </div>
        ) : (
          notifications.map((n) => (
            <NotificationRow key={n.id} item={n} onMarkRead={onMarkRead} />
          ))
        )}
      </div>
    </div>
  )
}
