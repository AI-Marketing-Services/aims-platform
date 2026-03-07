"use client"

import Link from "next/link"
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
  Package,
  Share2,
  FileBarChart,
  Settings,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
} from "lucide-react"
import { useState } from "react"
import { cn } from "@/lib/utils"

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
      { label: "Pipeline", href: "/admin/crm", icon: Kanban },
      { label: "Clients", href: "/admin/clients", icon: Users },
    ],
  },
  {
    section: "Revenue",
    items: [
      { label: "Revenue", href: "/admin/revenue", icon: DollarSign },
      { label: "API Costs", href: "/admin/api-costs", icon: Cpu },
      { label: "Vendor Savings", href: "/admin/vendor-savings", icon: PiggyBank },
    ],
  },
  {
    section: "Operations",
    items: [
      { label: "Products", href: "/admin/products", icon: Package },
      { label: "Intern Ops", href: "/admin/intern-ops", icon: GraduationCap },
      { label: "Referrals", href: "/admin/referrals", icon: Share2 },
      { label: "Lead Magnets", href: "/admin/lead-magnets", icon: FileBarChart },
    ],
  },
  {
    section: "System",
    items: [
      { label: "Settings", href: "/admin/settings", icon: Settings },
    ],
  },
] as const

export function AdminSidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  return (
    <aside
      className={cn(
        "relative flex flex-col border-r border-border bg-card transition-all duration-200",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-border">
        <Link href="/admin/dashboard" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-600">
            <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 text-white" stroke="currentColor" strokeWidth={2.5}>
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
            </svg>
          </div>
          {!collapsed && (
            <div>
              <span className="text-lg font-bold tracking-tight">AIMS</span>
              <span className="ml-1.5 text-[10px] font-medium text-red-500 uppercase tracking-wider">Admin</span>
            </div>
          )}
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 overflow-y-auto custom-scrollbar">
        {ADMIN_NAV.map((group) => (
          <div key={group.section} className="mb-4">
            {!collapsed && (
              <p className="px-4 mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                {group.section}
              </p>
            )}
            <div className="px-2 space-y-0.5">
              {group.items.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-red-600/10 text-red-500"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent"
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
        {collapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
      </button>

      {/* User */}
      <div className="border-t border-border p-4">
        <div className="flex items-center gap-3">
          <UserButton afterSignOutUrl="/" />
          {!collapsed && <span className="text-sm text-muted-foreground truncate">Admin</span>}
        </div>
      </div>
    </aside>
  )
}
