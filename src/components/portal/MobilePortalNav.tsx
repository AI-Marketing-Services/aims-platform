"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard, Briefcase, MapPin, Settings, Trophy,
} from "lucide-react"
import { cn } from "@/lib/utils"

// 5 slots, daily-flow ordered. Quests sits center as the "compass" of the
// platform — it's the user's map of what to do next. Invoices is reachable
// from CRM rows when needed; it doesn't earn a top-level mobile slot.
const MOBILE_NAV_DEFAULT = [
  { label: "Dashboard", href: "/portal/dashboard", icon: LayoutDashboard },
  { label: "CRM", href: "/portal/crm", icon: Briefcase },
  { label: "Quests", href: "/portal/quests", icon: Trophy },
  { label: "Scout", href: "/portal/crm/scout", icon: MapPin },
  { label: "Settings", href: "/portal/settings", icon: Settings },
]

interface MobilePortalNavProps {
  hasUnread?: boolean
  isAdminEmail?: boolean
}

export function MobilePortalNav({ hasUnread }: MobilePortalNavProps) {
  const pathname = usePathname()

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border flex items-center justify-around h-16 px-2 safe-area-pb">
      {MOBILE_NAV_DEFAULT.map((item) => {
        const isActive = pathname.startsWith(item.href)
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg min-w-0 flex-1 transition-colors",
              isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <div className="relative">
              <item.icon className="h-5 w-5" />
              {item.label === "Dashboard" && hasUnread && (
                <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-primary" />
              )}
            </div>
            <span className="text-[10px] font-medium truncate">{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
