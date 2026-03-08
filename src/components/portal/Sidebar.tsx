"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { UserButton } from "@clerk/nextjs"
import {
  LayoutDashboard,
  Layers,
  ShoppingBag,
  CreditCard,
  BarChart3,
  Users,
  LifeBuoy,
  Settings,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { useState } from "react"
import { cn } from "@/lib/utils"
import { NotificationBell } from "@/components/shared/NotificationBell"

const PORTAL_NAV = [
  { label: "Dashboard", href: "/portal/dashboard", icon: LayoutDashboard },
  { label: "My Services", href: "/portal/services", icon: Layers },
  { label: "Marketplace", href: "/portal/marketplace", icon: ShoppingBag },
  { label: "Campaigns", href: "/portal/campaigns", icon: BarChart3 },
  { label: "Billing", href: "/portal/billing", icon: CreditCard },
  { label: "Referrals", href: "/portal/referrals", icon: Users },
  { label: "Support", href: "/portal/support", icon: LifeBuoy },
  { label: "Settings", href: "/portal/settings", icon: Settings },
] as const

interface PortalSidebarProps {
  totalMrr?: number
  hasUnread?: boolean
}

export function PortalSidebar({ totalMrr = 0, hasUnread = false }: PortalSidebarProps) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  return (
    <aside
      className={cn(
        "relative hidden lg:flex flex-col border-r border-gray-200 bg-white transition-all duration-200",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center px-4 border-b border-gray-200">
        <Link href="/" className="flex items-center gap-2.5">
          <Image src="/logo.png" alt="AIMS" width={32} height={32} className="shrink-0 object-contain" />
          {!collapsed && <span className="text-lg font-bold tracking-tight">AIMS</span>}
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto custom-scrollbar">
        {PORTAL_NAV.map((item) => {
          const isActive = pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-red-50 text-[#DC2626] border-l-2 border-[#DC2626] pl-[10px]"
                  : "text-gray-500 hover:text-gray-900 hover:bg-gray-100 pl-3"
              )}
            >
              <item.icon className={cn("h-4.5 w-4.5 shrink-0", isActive && "text-red-500")} />
              {!collapsed && (
                <span className="flex-1">{item.label}</span>
              )}
              {!collapsed && item.label === "Dashboard" && hasUnread && (
                <span className="ml-auto h-2 w-2 rounded-full bg-[#DC2626]" />
              )}
            </Link>
          )
        })}
      </nav>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 flex h-6 w-6 items-center justify-center rounded-full border border-gray-200 bg-white shadow-sm hover:bg-gray-100 transition-colors"
      >
        {collapsed ? (
          <ChevronRight className="h-3 w-3" />
        ) : (
          <ChevronLeft className="h-3 w-3" />
        )}
      </button>

      {/* Monthly Investment */}
      {!collapsed && totalMrr > 0 && (
        <div className="px-4 pb-2">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Monthly Investment</p>
          <p className="text-sm font-bold text-foreground">${totalMrr}/mo</p>
        </div>
      )}

      {/* User */}
      <div className="border-t border-gray-200 p-4">
        <div className="flex items-center gap-2">
          <UserButton afterSignOutUrl="/" />
          {!collapsed && (
            <>
              <span className="text-sm text-gray-500 truncate flex-1">My Account</span>
              <NotificationBell variant="light" />
            </>
          )}
        </div>
      </div>
    </aside>
  )
}
