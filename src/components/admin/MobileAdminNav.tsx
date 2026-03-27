"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard, Kanban, Users, DollarSign, Gauge, FlaskConical
} from "lucide-react"
import { cn } from "@/lib/utils"

const MOBILE_ADMIN_NAV = [
  { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { label: "CRM", href: "/admin/crm", icon: Kanban },
  { label: "Clients", href: "/admin/clients", icon: Users },
  { label: "Ops Score", href: "/admin/ops-excellence", icon: Gauge },
  { label: "Revenue", href: "/admin/revenue", icon: DollarSign },
  { label: "Simulate", href: "/admin/simulate", icon: FlaskConical },
]

export function MobileAdminNav() {
  const pathname = usePathname()

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border flex items-center justify-around h-16 px-2 safe-area-pb">
      {MOBILE_ADMIN_NAV.map((item) => {
        const isActive =
          pathname === item.href || pathname.startsWith(item.href + "/")
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg min-w-0 flex-1 transition-colors",
              isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <item.icon className="h-5 w-5" />
            <span className="text-[10px] font-medium truncate">{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
