"use client"

import { Bell, Users, DollarSign, BarChart2, LifeBuoy, Zap, Activity, X, CheckCheck } from "lucide-react"
import { cn } from "@/lib/utils"

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
  new_lead: "bg-red-50 text-[#DC2626]",
  chatbot_lead_captured: "bg-red-50 text-[#DC2626]",
  new_purchase: "bg-red-50 text-[#DC2626]",
  lead_magnet_completed: "bg-red-50 text-[#B91C1C]",
  support_ticket: "bg-red-50 text-[#DC2626]",
  support_reply: "bg-red-50 text-[#DC2626]",
  fulfillment_overdue: "bg-red-100 text-red-800",
  fulfillment_update: "bg-red-50 text-[#DC2626]",
  churn_risk: "bg-red-100 text-red-800",
  deal_stage_change: "bg-gray-100 text-gray-600",
  eod_submitted: "bg-gray-100 text-gray-600",
  billing_alert: "bg-red-100 text-red-800",
  marketing_digest: "bg-gray-100 text-gray-600",
  daily_digest: "bg-gray-100 text-gray-600",
  api_cost_spike: "bg-red-100 text-red-800",
  missed_eod: "bg-red-100 text-red-800",
}

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return `${Math.floor(days / 7)}w ago`
}

function truncate(str: string, maxLen: number) {
  if (str.length <= maxLen) return str
  return str.slice(0, maxLen).trimEnd() + "..."
}

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
    <div className="absolute right-0 top-full mt-2 w-96 rounded-xl border border-gray-200 bg-white shadow-lg z-50 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-900">Notifications</span>
          {unreadCount > 0 && (
            <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#DC2626] px-1.5 text-[10px] font-bold text-white">
              {unreadCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={onMarkAllRead}
              className="flex items-center gap-1 text-xs text-[#DC2626] hover:underline"
            >
              <CheckCheck className="h-3 w-3" />
              Mark all read
            </button>
          )}
          <button
            onClick={onClose}
            className="p-0.5 rounded text-gray-400 hover:text-gray-700 transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Notification list */}
      <div className="max-h-[28rem] overflow-y-auto custom-scrollbar">
        {loading && notifications.length === 0 ? (
          <div className="py-12 text-center">
            <div className="text-xs text-gray-400">Loading notifications...</div>
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-12 text-center">
            <Bell className="h-8 w-8 mx-auto mb-3 text-gray-200" />
            <p className="text-sm font-medium text-gray-400">No notifications yet</p>
            <p className="text-xs text-gray-300 mt-1">
              You will see updates here when something happens.
            </p>
          </div>
        ) : (
          notifications.map((n) => {
            const Icon = TYPE_ICON[n.type] ?? Bell
            const colorClass = TYPE_COLOR[n.type] ?? "bg-gray-100 text-gray-600"
            return (
              <button
                key={n.id}
                onClick={() => {
                  if (!n.read) onMarkRead(n.id)
                }}
                className={cn(
                  "flex items-start gap-3 px-4 py-3 w-full text-left transition-colors border-b border-gray-100 last:border-0",
                  !n.read
                    ? "border-l-[3px] border-l-[#DC2626] bg-red-50/30 hover:bg-red-50/50"
                    : "border-l-[3px] border-l-transparent hover:bg-gray-50",
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
                        !n.read ? "font-semibold text-gray-900" : "font-medium text-gray-700"
                      )}
                    >
                      {n.title}
                    </p>
                    {!n.read && (
                      <div className="h-2 w-2 rounded-full bg-[#DC2626] flex-shrink-0 mt-1.5" />
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-2 leading-relaxed">
                    {truncate(n.message, 120)}
                  </p>
                  <p className="text-[10px] text-gray-400 mt-1">{timeAgo(n.sentAt)}</p>
                </div>
              </button>
            )
          })
        )}
      </div>
    </div>
  )
}
