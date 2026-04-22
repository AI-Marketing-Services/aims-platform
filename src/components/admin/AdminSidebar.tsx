"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { UserButton } from "@clerk/nextjs"
import {
  LayoutDashboard,
  Kanban,
  Cpu,
  FileBarChart,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  FlaskConical,
  Mail,
  MailOpen,
  Inbox,
  ClipboardCheck,
  Timer,
  MessageSquare,
  LifeBuoy,
  UserPlus,
  ShieldCheck,
  Plug,
  Lightbulb,
  Users,
  Zap,
} from "lucide-react"
import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { NotificationBell } from "@/components/shared/NotificationBell"

// Badge counts keyed by nav href. Fetched from /api/admin/nav-counts on
// mount + every 60s. Misses degrade gracefully — no badge shown.
type NavCounts = {
  applications: number
  crm: number
  mightyInvites: number
  followUps: number
  support: number
}

const HREF_TO_BADGE_KEY: Partial<Record<string, keyof NavCounts>> = {
  "/admin/applications": "applications",
  "/admin/crm": "crm",
  "/admin/mighty-invites": "mightyInvites",
  "/admin/follow-ups": "followUps",
  "/admin/support": "support",
}

function useNavCounts(): NavCounts {
  const [counts, setCounts] = useState<NavCounts>({
    applications: 0,
    crm: 0,
    mightyInvites: 0,
    followUps: 0,
    support: 0,
  })

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const res = await fetch("/api/admin/nav-counts", { cache: "no-store" })
        if (!res.ok) return
        const body = (await res.json()) as { counts?: NavCounts }
        if (!cancelled && body?.counts) setCounts(body.counts)
      } catch {
        // ignore — badges are informational
      }
    }
    load()
    const interval = setInterval(load, 60_000)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [])

  return counts
}

// Sidebar focused on the high-ticket consulting/coaching pipeline:
// Close → Application → Mighty Networks. Future product surfaces
// (Clients SaaS, Reseller program, Intern Ops, CFO Engagements,
// Fulfillment, Lead Magnets, Vendor Savings, etc.) stay routable but
// out of the menu so the daily driver feels lean.
const ADMIN_NAV = [
  {
    section: "Community",
    items: [
      { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
      { label: "CRM Pipeline", href: "/admin/crm", icon: Kanban },
      { label: "Applications", href: "/admin/applications", icon: ClipboardCheck },
      { label: "Follow-ups", href: "/admin/follow-ups", icon: Inbox },
      { label: "Mighty Invites", href: "/admin/mighty-invites", icon: UserPlus },
      { label: "Portal Members", href: "/admin/members", icon: Users },
    ],
  },
  {
    section: "Integrations",
    items: [
      { label: "Close CRM", href: "/admin/close", icon: Plug },
      { label: "Email Campaigns", href: "/admin/email-campaigns", icon: Mail },
      { label: "Community Sequence", href: "/admin/community-sequence", icon: Inbox },
      { label: "Live Funnel", href: "/admin/funnel", icon: FileBarChart },
    ],
  },
  {
    section: "Team",
    items: [
      { label: "Team Access", href: "/admin/users", icon: ShieldCheck },
      { label: "Support Tickets", href: "/admin/support", icon: LifeBuoy },
      { label: "Chat Sessions", href: "/admin/chat-sessions", icon: MessageSquare },
    ],
  },
  {
    section: "Operations",
    items: [
      { label: "Tool & API Spend", href: "/admin/api-costs", icon: Cpu },
      { label: "AI Usage", href: "/admin/usage", icon: Zap },
      { label: "Job Health", href: "/admin/cron-status", icon: Timer },
      { label: "Email Previews", href: "/admin/email-previews", icon: MailOpen },
      { label: "Simulate", href: "/admin/simulate", icon: FlaskConical },
    ],
  },
  {
    section: "Strategy",
    items: [
      { label: "Lead Magnets", href: "/admin/ideas", icon: Lightbulb },
    ],
  },
] as const

export function AdminSidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const counts = useNavCounts()

  return (
    <aside
      className={cn(
        "relative hidden lg:flex flex-col border-r border-border bg-deep transition-all duration-200",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo + Bell */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-border">
        <Link href="/admin/dashboard" className="flex items-center gap-2.5" aria-label="Admin home">
          <Image
            src="/logo.png"
            alt=""
            width={36}
            height={36}
            className="shrink-0 object-contain h-8 w-8"
          />
          {!collapsed && (
            <span className="text-[10px] font-medium text-primary uppercase tracking-wider">
              Admin
            </span>
          )}
        </Link>

        {/* Notification bell in header */}
        {!collapsed && (
          <NotificationBell variant="light" />
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 overflow-y-auto custom-scrollbar">
        {ADMIN_NAV.map((group, groupIdx) => (
          <motion.div
            key={group.section}
            className="mb-4"
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{
              duration: 0.35,
              delay: 0.1 + groupIdx * 0.08,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            {/* Section label divider */}
            {!collapsed && (
              <div className="flex items-center gap-2 px-4 mb-1.5">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                  {group.section}
                </p>
                <div className="flex-1 h-px bg-surface" />
              </div>
            )}

            <div className="px-2 space-y-0.5">
              {group.items.map((item, itemIdx) => {
                const isActive =
                  pathname === item.href ||
                  pathname.startsWith(item.href + "/")
                return (
                  <motion.div
                    key={item.href}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{
                      duration: 0.3,
                      delay: 0.15 + groupIdx * 0.08 + itemIdx * 0.04,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                  >
                    <Link
                      href={item.href}
                      className={cn(
                        "relative flex items-center gap-3 rounded-lg py-2 text-sm font-medium transition-all duration-150",
                        isActive
                          ? "border-l-2 border-primary pl-[10px] pr-3 bg-primary/10 text-primary"
                          : "border-l-2 border-transparent pl-[10px] pr-3 text-muted-foreground hover:text-foreground hover:bg-surface/80 hover:pl-[14px]"
                      )}
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      {!collapsed && <span className="flex-1">{item.label}</span>}
                      {(() => {
                        const badgeKey = HREF_TO_BADGE_KEY[item.href]
                        const badgeCount = badgeKey ? counts[badgeKey] : 0
                        if (!badgeCount || badgeCount <= 0) return null
                        return (
                          <span
                            className={cn(
                              "shrink-0 min-w-[20px] h-[18px] px-1.5 rounded-full text-[10px] font-semibold inline-flex items-center justify-center font-mono",
                              item.href === "/admin/mighty-invites" && badgeCount > 0
                                ? "bg-primary text-white"
                                : "bg-primary/15 text-primary",
                              collapsed && "absolute top-1 right-1 min-w-[14px] h-[14px] px-0.5 text-[9px]"
                            )}
                            aria-label={`${badgeCount} pending`}
                          >
                            {badgeCount > 99 ? "99+" : badgeCount}
                          </span>
                        )
                      })()}
                    </Link>
                  </motion.div>
                )
              })}
            </div>
          </motion.div>
        ))}
      </nav>

      {/* Quick link to public site */}
      {!collapsed && (
        <div className="px-4 py-2">
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <ExternalLink className="h-3 w-3" />
            View public site
          </a>
        </div>
      )}

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 flex h-6 w-6 items-center justify-center rounded-full border border-border bg-card shadow-sm hover:bg-surface transition-colors"
      >
        {collapsed ? (
          <ChevronRight className="h-3 w-3" />
        ) : (
          <ChevronLeft className="h-3 w-3" />
        )}
      </button>

      {/* User */}
      <div className="border-t border-border p-4">
        <div className="flex items-center gap-2">
          <UserButton />
          {!collapsed && (
            <span className="text-sm text-muted-foreground truncate flex-1">
              Admin
            </span>
          )}
        </div>
      </div>
    </aside>
  )
}
