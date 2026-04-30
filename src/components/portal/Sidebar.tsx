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
  Gauge,
  Newspaper,
  Rocket,
  Briefcase,
  Wrench,
  TrendingUp,
  MapPin,
  BookOpen,
  Calculator,
  FileCode2,
  FileText,
  Bell,
  PenLine,
  ClipboardCheck,
  Sparkles,
} from "lucide-react"
import { useState } from "react"
import { cn } from "@/lib/utils"
import { NotificationBell } from "@/components/shared/NotificationBell"
import { OnboardingProgressWidget } from "@/components/portal/OnboardingProgressWidget"

const PORTAL_NAV = [
  { label: "Dashboard", href: "/portal/dashboard", icon: LayoutDashboard },
  { label: "Getting Started", href: "/portal/onboard", icon: Rocket },
  { label: "Client CRM", href: "/portal/crm", icon: Briefcase },
  { label: "Follow-up Rules", href: "/portal/follow-up-rules", icon: Bell },
  { label: "Invoices", href: "/portal/invoices", icon: FileText },
  { label: "Revenue", href: "/portal/revenue", icon: TrendingUp },
  { label: "Lead Scout", href: "/portal/crm/scout", icon: MapPin },
  { label: "AI Audit", href: "/portal/audits", icon: ClipboardCheck },
  { label: "AI Scripts", href: "/portal/scripts", icon: FileCode2 },
  { label: "Content Engine", href: "/portal/content", icon: PenLine },
  { label: "Toolkit", href: "/portal/tools", icon: Wrench },
  { label: "My Metrics", href: "/portal/metrics", icon: TrendingUp },
  { label: "Playbooks", href: "/portal/playbooks", icon: BookOpen },
  { label: "Pricing Calc", href: "/portal/calculator", icon: Calculator },
  { label: "Ops Excellence", href: "/portal/ops-excellence", icon: Gauge },
  { label: "My Services", href: "/portal/services", icon: Layers },
  { label: "Marketplace", href: "/portal/marketplace", icon: ShoppingBag },
  { label: "Campaigns", href: "/portal/campaigns", icon: BarChart3 },
  { label: "Signal", href: "/portal/signal", icon: Newspaper },
  { label: "Billing", href: "/portal/billing", icon: CreditCard },
  { label: "Referrals", href: "/portal/referrals", icon: Users },
  { label: "Support", href: "/portal/support", icon: LifeBuoy },
  { label: "Settings", href: "/portal/settings", icon: Settings },
] as const

// Admin-only items in the client sidebar. (Currently empty — services /
// marketplace / campaigns / ops-excellence are now visible to all clients
// so Katie + future testers can fully exercise the portal.)
const ADMIN_ONLY_ROUTES: string[] = []

interface PortalSidebarProps {
  totalMrr?: number
  hasUnread?: boolean
  onboardingCompletedCount?: number
  onboardingPercent?: number
  onboardingCompletedAt?: string | null
  isAdminEmail?: boolean
  creditBalance?: number
  creditPlanTier?: string
}

export function PortalSidebar({
  totalMrr = 0,
  hasUnread = false,
  onboardingCompletedCount = 0,
  onboardingPercent = 0,
  onboardingCompletedAt = null,
  isAdminEmail = false,
  creditBalance = 0,
  creditPlanTier = "trial",
}: PortalSidebarProps) {
  const lowBalance = creditBalance < 50
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  const visibleNav = PORTAL_NAV.filter(
    (item) => !ADMIN_ONLY_ROUTES.includes(item.href) || isAdminEmail
  )

  return (
    <aside
      className={cn(
        "relative hidden lg:flex flex-col border-r border-border bg-deep transition-all duration-200",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="flex h-12 items-center px-4 border-b border-border">
        <Link href="/" className="flex items-center gap-2.5" aria-label="Home">
          <Image src="/logo.png" alt="" width={28} height={28} className="shrink-0 object-contain h-7 w-7" />
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-2 px-2 space-y-0.5 overflow-y-auto custom-scrollbar">
        {visibleNav.map((item) => {
          const isActive = pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2.5 rounded-lg py-1.5 text-xs font-medium transition-all duration-150",
                isActive
                  ? "bg-primary/10 text-primary border-l-2 border-primary pl-[10px]"
                  : "text-muted-foreground hover:text-foreground hover:bg-surface/80 pl-3"
              )}
            >
              <item.icon className={cn("h-4 w-4 shrink-0", isActive && "text-primary")} />
              {!collapsed && (
                <span className="flex-1">{item.label}</span>
              )}
              {!collapsed && item.label === "Dashboard" && hasUnread && (
                <span className="ml-auto h-2 w-2 rounded-full bg-primary" />
              )}
              {!collapsed && item.label === "Getting Started" && onboardingPercent < 100 && onboardingPercent > 0 && (
                <span className="ml-auto text-[10px] font-bold text-primary/80 bg-primary/10 px-1.5 py-0.5 rounded-full">
                  {onboardingPercent}%
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-16 flex h-6 w-6 items-center justify-center rounded-full border border-border bg-card shadow-sm hover:bg-surface transition-colors"
      >
        {collapsed ? (
          <ChevronRight className="h-3 w-3" />
        ) : (
          <ChevronLeft className="h-3 w-3" />
        )}
      </button>

      {/* Onboarding progress widget */}
      <OnboardingProgressWidget
        completedCount={onboardingCompletedCount}
        percent={onboardingPercent}
        onboardingCompletedAt={onboardingCompletedAt}
        collapsed={collapsed}
      />

      {/* Enrichment credits — shown on every page so operators always
          know their balance before spending on Enrich / Scout. */}
      {!collapsed && (
        <Link
          href="/portal/billing"
          className={cn(
            "mx-3 mb-2 flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-xs transition-colors",
            lowBalance
              ? "border border-primary/40 bg-primary/5 hover:bg-primary/10"
              : "border border-border bg-surface/40 hover:bg-surface",
          )}
        >
          <div className="flex items-center gap-2">
            <Sparkles className={cn("h-3.5 w-3.5", lowBalance ? "text-primary" : "text-primary")} />
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold leading-none">
                Credits
              </p>
              <p className={cn("text-sm font-bold leading-tight mt-0.5", lowBalance ? "text-primary" : "text-foreground")}>
                {creditBalance.toLocaleString()}
              </p>
            </div>
          </div>
          <span className="text-[9px] text-muted-foreground uppercase tracking-wider">
            {creditPlanTier}
          </span>
        </Link>
      )}

      {/* Monthly Investment */}
      {!collapsed && totalMrr > 0 && (
        <div className="px-4 pb-2">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Monthly Investment</p>
          <p className="text-sm font-bold text-foreground">${totalMrr}/mo</p>
        </div>
      )}

      {/* User */}
      <div className="border-t border-border p-3">
        <div className="flex items-center gap-2">
          <UserButton />
          {!collapsed && (
            <>
              <span className="text-sm text-muted-foreground truncate flex-1">My Account</span>
              <NotificationBell variant="light" />
            </>
          )}
        </div>
      </div>
    </aside>
  )
}
