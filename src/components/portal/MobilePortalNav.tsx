"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard, Layers, ShoppingBag, CreditCard, LifeBuoy, Settings
} from "lucide-react"
import { cn } from "@/lib/utils"

const MOBILE_NAV = [
  { label: "Home", href: "/portal/dashboard", icon: LayoutDashboard },
  { label: "Services", href: "/portal/services", icon: Layers },
  { label: "Shop", href: "/portal/marketplace", icon: ShoppingBag },
  { label: "Billing", href: "/portal/billing", icon: CreditCard },
  { label: "Support", href: "/portal/support", icon: LifeBuoy },
  { label: "Settings", href: "/portal/settings", icon: Settings },
]

interface MobilePortalNavProps {
  hasUnread?: boolean
}

export function MobilePortalNav({ hasUnread }: MobilePortalNavProps) {
  const pathname = usePathname()

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 flex items-center justify-around h-16 px-2 safe-area-pb">
      {MOBILE_NAV.map((item) => {
        const isActive = pathname.startsWith(item.href)
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg min-w-0 flex-1 transition-colors",
              isActive ? "text-[#DC2626]" : "text-gray-400 hover:text-gray-600"
            )}
          >
            <div className="relative">
              <item.icon className="h-5 w-5" />
              {item.label === "Home" && hasUnread && (
                <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-[#DC2626]" />
              )}
            </div>
            <span className="text-[10px] font-medium truncate">{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
