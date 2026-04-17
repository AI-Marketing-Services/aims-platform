"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Bell } from "lucide-react"
import { cn } from "@/lib/utils"
import { NotificationCenter, type NotificationItem } from "./NotificationCenter"

export function NotificationBell({ variant = "light" }: { variant?: "light" | "dark" }) {
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [unread, setUnread] = useState(0)
  const [loading, setLoading] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)

  const fetchNotifications = useCallback(async (signal?: AbortSignal) => {
    setLoading(true)
    try {
      const res = await fetch("/api/notifications?limit=20", { signal })
      if (res.ok) {
        const data = await res.json()
        if (signal?.aborted) return
        setNotifications(data.notifications ?? [])
        setUnread(data.unreadCount ?? 0)
      }
    } catch (err) {
      if ((err as { name?: string })?.name === "AbortError") return
    } finally {
      if (!signal?.aborted) setLoading(false)
    }
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    fetchNotifications(controller.signal)
    const interval = setInterval(() => {
      fetchNotifications(controller.signal)
    }, 30000)
    return () => {
      controller.abort()
      clearInterval(interval)
    }
  }, [fetchNotifications])

  // Close on click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [open])

  const markRead = async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}/read`, { method: "PATCH" })
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      )
      setUnread((prev) => Math.max(0, prev - 1))
    } catch {
      // Silently fail
    }
  }

  const markAllRead = async () => {
    try {
      await fetch("/api/notifications/mark-all-read", { method: "PATCH" })
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
      setUnread(0)
    } catch {
      // Silently fail
    }
  }

  const iconClass = "text-muted-foreground hover:text-foreground"

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "relative p-2 rounded-lg transition-colors",
          "hover:bg-surface"
        )}
        aria-label="Notifications"
      >
        <Bell className={cn("h-4 w-4", iconClass)} />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <NotificationCenter
          notifications={notifications}
          unreadCount={unread}
          loading={loading}
          onMarkRead={markRead}
          onMarkAllRead={markAllRead}
          onClose={() => setOpen(false)}
        />
      )}
    </div>
  )
}
