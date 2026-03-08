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
  Bell,
} from "lucide-react"
import { useState } from "react"
import { cn } from "@/lib/utils"
import { NotificationBell } from "@/components/shared/NotificationBell"

const ADMIN_NAV = [
  {
    section: "Overview",
    items: [
      { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
    ],
  },
  {
    section: "CRM",
    items: [
      { label: "CRM Pipeline", href: "/admin/crm", icon: Kanban },
      { label: "Clients", href: "/admin/clients", icon: Users },
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
    ],
  },
  {
    section: "Dev Tools",
    items: [
      { label: "Simulate", href: "/admin/simulate", icon: FlaskConical },
    ],
  },
] as const

export function AdminSidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  return (
    <aside
      className={cn(
        "relative hidden lg:flex flex-col border-r border-border bg-card transition-all duration-200",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo + Bell */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-border">
        <Link href="/admin/dashboard" className="flex items-center gap-2.5">
          <Image
            src="/logo.png"
            alt="AIMS"
            width={32}
            height={32}
            className="shrink-0 object-contain"
          />
          {!collapsed && (
            <div>
              <span className="text-lg font-bold tracking-tight">AIMS</span>
              <span className="ml-1.5 text-[10px] font-medium text-red-500 uppercase tracking-wider">
                Admin
              </span>
            </div>
          )}
        </Link>

        {/* Notification bell in header */}
        {!collapsed && (
          <button
            className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            aria-label="Notifications"
          >
            <Bell className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 overflow-y-auto custom-scrollbar">
        {ADMIN_NAV.map((group) => (
          <div key={group.section} className="mb-4">
            {/* Section label divider */}
            {!collapsed && (
              <div className="flex items-center gap-2 px-4 mb-1.5">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">
                  {group.section}
                </p>
                <div className="flex-1 h-px bg-border/50" />
              </div>
            )}

            <div className="px-2 space-y-0.5">
              {group.items.map((item) => {
                const isActive =
                  pathname === item.href ||
                  pathname.startsWith(item.href + "/")
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg py-2 text-sm font-medium transition-colors",
                      isActive
                        ? "border-l-2 border-red-500 pl-[10px] pr-3 bg-red-600/10 text-red-500"
                        : "border-l-2 border-transparent pl-[10px] pr-3 text-muted-foreground hover:text-foreground hover:bg-accent"
                    )}
                  >
                    <item.icon className="h-4 w-4 shrink-0" />
                    {!collapsed && <span>{item.label}</span>}
                  </Link>
                )
              })}
            </div>
          </div>
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
        className="absolute -right-3 top-20 flex h-6 w-6 items-center justify-center rounded-full border border-border bg-card shadow-sm hover:bg-accent transition-colors"
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
          <UserButton afterSignOutUrl="/" />
          {!collapsed && (
            <>
              <span className="text-sm text-muted-foreground truncate flex-1">
                Admin
              </span>
              <NotificationBell variant="light" />
            </>
          )}
        </div>
      </div>
    </aside>
  )
}
