"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { UserButton } from "@clerk/nextjs"
import {
  LayoutDashboard,
  Kanban,
  Users,
  DollarSign,
  Cpu,
  GraduationCap,
  PiggyBank,
  FileBarChart,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  FlaskConical,
  Settings,
  Mail,
  MailOpen,
  ClipboardCheck,
  Timer,
  MessageSquare,
  LifeBuoy,
} from "lucide-react"
import { useState } from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { NotificationBell } from "@/components/shared/NotificationBell"

const ADMIN_NAV = [
  {
    section: "Overview",
    items: [
      { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
      { label: "Services", href: "/admin/services", icon: Settings },
    ],
  },
  {
    section: "CRM",
    items: [
      { label: "CRM Pipeline", href: "/admin/crm", icon: Kanban },
      { label: "Clients", href: "/admin/clients", icon: Users },
      { label: "Fulfillment", href: "/admin/fulfillment", icon: ClipboardCheck },
      { label: "Email Campaigns", href: "/admin/email-campaigns", icon: Mail },
      { label: "Support Tickets", href: "/admin/support", icon: LifeBuoy },
      { label: "Chat Sessions", href: "/admin/chat-sessions", icon: MessageSquare },
    ],
  },
  {
    section: "Revenue",
    items: [
      { label: "Revenue", href: "/admin/revenue", icon: DollarSign },
      { label: "Lead Magnets", href: "/admin/lead-magnets", icon: FileBarChart },
    ],
  },
  {
    section: "Operations",
    items: [
      { label: "Intern Ops", href: "/admin/intern-ops", icon: GraduationCap },
      { label: "Vendor Savings", href: "/admin/vendor-savings", icon: PiggyBank },
      { label: "API Costs", href: "/admin/api-costs", icon: Cpu },
      { label: "Cron Status", href: "/admin/cron-status", icon: Timer },
    ],
  },
  {
    section: "Dev Tools",
    items: [
      { label: "Simulate", href: "/admin/simulate", icon: FlaskConical },
      { label: "Email Previews", href: "/admin/email-previews", icon: MailOpen },
    ],
  },
] as const

export function AdminSidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  return (
    <aside
      className={cn(
        "relative hidden lg:flex flex-col border-r border-border bg-deep transition-all duration-200",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo + Bell */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-border">
        <Link href="/admin/dashboard" className="flex items-center gap-2.5">
          <Image
            src="/logo.png"
            alt="AIMS"
            width={collapsed ? 32 : 100}
            height={40}
            className={`shrink-0 object-contain ${collapsed ? "h-8 w-8" : "h-8 w-auto"}`}
          />
          {!collapsed && (
            <div>
              <span className="text-[10px] font-medium text-primary uppercase tracking-wider">
                Admin
              </span>
            </div>
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
                        "flex items-center gap-3 rounded-lg py-2 text-sm font-medium transition-all duration-150",
                        isActive
                          ? "border-l-2 border-primary pl-[10px] pr-3 bg-primary/10 text-primary"
                          : "border-l-2 border-transparent pl-[10px] pr-3 text-muted-foreground hover:text-foreground hover:bg-surface/80 hover:pl-[14px]"
                      )}
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      {!collapsed && <span>{item.label}</span>}
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
