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
  Trophy,
  Lock,
  Target,
  FileSignature,
  Bot,
  Library,
  Send,
  Mail,
  Mic,
  CalendarDays,
} from "lucide-react"
import type { FeatureKey } from "@/lib/quests/registry"
import { useQuests } from "@/components/quests/QuestContext"
import { useState } from "react"
import { cn } from "@/lib/utils"
import { NotificationBell } from "@/components/shared/NotificationBell"
import { OnboardingProgressWidget } from "@/components/portal/OnboardingProgressWidget"
import { QuestProgressRing } from "@/components/quests/QuestProgressRing"

// Sidebar items grouped logically. Items in `ADMIN_ONLY_ROUTES` below
// are filtered out for non-admin viewers so the portal stays focused
// on what an operator (Katie) actually uses day-to-day.
// `gate`: optional FeatureKey from the quest system. If set, item shows a
// Lock badge (and reduced opacity) until the user unlocks it. The link is
// still clickable so admins/preview can navigate; LockedFeatureCard on the
// destination page handles the empty state.
type NavItem = {
  label: string
  href: string
  icon: typeof LayoutDashboard
  gate?: FeatureKey
  /**
   * When true, the link is dimmed + lock-iconned until the user has
   * `MemberProfile.onboardingCompletedAt` set. Used for whitelabel
   * (Branding + Domain), which we only expose to clients who have
   * finished setting up — avoids untrained users configuring DNS.
   */
  requiresOnboardingComplete?: boolean
}

const PORTAL_NAV: readonly NavItem[] = [
  // Mission control + getting started — never gated
  { label: "Dashboard", href: "/portal/dashboard", icon: LayoutDashboard },
  { label: "Getting Started", href: "/portal/onboard", icon: Rocket },
  { label: "Quests", href: "/portal/quests", icon: Trophy },

  // Daily-driver scorecard sits high — operators land here every morning
  // to set their week, log activity, and track progress vs. target.
  { label: "Scorecard", href: "/portal/scorecard", icon: Target, gate: "crm" },

  // Daily operator work
  { label: "Client CRM", href: "/portal/crm", icon: Briefcase, gate: "crm" },
  { label: "Lead Scout", href: "/portal/crm/scout", icon: MapPin, gate: "lead_scout" },
  { label: "AI Audit", href: "/portal/audits", icon: ClipboardCheck, gate: "audits" },
  { label: "Lead Magnets", href: "/portal/lead-magnets", icon: FileText, gate: "audits" },
  { label: "Email Sequences", href: "/portal/sequences", icon: Send },
  { label: "Booking Page", href: "/portal/booking", icon: CalendarDays },
  { label: "Discovery Recorder", href: "/portal/recordings", icon: Mic },
  { label: "Follow-up Rules", href: "/portal/follow-up-rules", icon: Bell, gate: "follow_up_rules" },

  // Revenue + reporting
  { label: "Proposals", href: "/portal/proposals", icon: FileSignature },
  { label: "Invoices", href: "/portal/invoices", icon: FileText },
  { label: "Client Updates", href: "/portal/client-updates", icon: Mail },
  { label: "Revenue", href: "/portal/revenue", icon: TrendingUp, gate: "revenue" },
  { label: "My Metrics", href: "/portal/metrics", icon: BarChart3 },

  // AI + content tools
  { label: "Deal Assistant", href: "/portal/deal-assistant", icon: Bot },
  { label: "AI Scripts", href: "/portal/scripts", icon: FileCode2, gate: "scripts" },
  { label: "Content Engine", href: "/portal/content", icon: PenLine, gate: "content" },
  { label: "Templates", href: "/portal/templates", icon: Library },
  { label: "Toolkit", href: "/portal/tools", icon: Wrench, gate: "ai_tools" },
  { label: "Playbooks", href: "/portal/playbooks", icon: BookOpen, gate: "playbooks" },
  { label: "Pricing Calc", href: "/portal/calculator", icon: Calculator, gate: "calculator" },

  // Admin-only (filtered out below for clients)
  { label: "Ops Excellence", href: "/portal/ops-excellence", icon: Gauge },
  { label: "My Services", href: "/portal/services", icon: Layers },
  { label: "Marketplace", href: "/portal/marketplace", icon: ShoppingBag },
  { label: "Campaigns", href: "/portal/campaigns", icon: BarChart3 },
  { label: "Signal", href: "/portal/signal", icon: Newspaper, gate: "signal" },

  // Whitelabel — opens once onboarding hits 100%
  { label: "Branding", href: "/reseller/settings/branding", icon: Sparkles, requiresOnboardingComplete: true },
  { label: "Domain", href: "/reseller/settings/domain", icon: Settings, requiresOnboardingComplete: true },

  // Account
  { label: "Billing", href: "/portal/billing", icon: CreditCard },
  { label: "Referrals", href: "/portal/referrals", icon: Users, gate: "referrals" },
  { label: "Support", href: "/portal/support", icon: LifeBuoy },
  { label: "Settings", href: "/portal/settings", icon: Settings },
] as const

// Routes hidden from CLIENT users. Admins (and admins previewing as
// client) still see them so they can manage the wider platform.
//
// Marketplace is now the buy-surface for plans + credit packs, so it
// stays visible to clients. Ops Excellence / My Services / Campaigns /
// Signal remain admin-only — those are platform-management surfaces.
const ADMIN_ONLY_ROUTES: string[] = [
  "/portal/ops-excellence",
  "/portal/services",
  "/portal/campaigns",
  "/portal/signal",
]

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
  const { isFeatureUnlocked, loading: questsLoading } = useQuests()

  const visibleNav = PORTAL_NAV.filter(
    (item) => !ADMIN_ONLY_ROUTES.includes(item.href) || isAdminEmail
  )

  // Pick the single best-matching nav item for the current pathname so that
  // /portal/crm/scout doesn't light up BOTH "Client CRM" (prefix /portal/crm)
  // and "Lead Scout" (prefix /portal/crm/scout). Longest matching prefix wins.
  const activeHref = visibleNav
    .filter((item) => {
      if (pathname === item.href) return true
      // Match nested routes only on a path-segment boundary so /portal/crm
      // doesn't accidentally match /portal/crm-something.
      return pathname.startsWith(`${item.href}/`)
    })
    .reduce<string | null>((best, item) => {
      if (!best || item.href.length > best.length) return item.href
      return best
    }, null)

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

      {/* Navigation. Bumped up from py-1.5/text-xs to py-2/text-[13px]
          for slightly more substance, but stays compact enough that
          even the full nav (~18 items for clients) fits without a
          scrollbar on a ~900px viewport. Icons stay 4×4 (16px). */}
      <nav className="flex-1 py-2 px-2 space-y-0.5 overflow-y-auto custom-scrollbar">
        {visibleNav.map((item) => {
          const isActive = activeHref === item.href
          // Don't dim items while quests are still loading — avoids a flash of
          // "everything is locked" on first paint.
          const isQuestLocked =
            !!item.gate && !questsLoading && !isFeatureUnlocked(item.gate)
          const isOnboardingLocked =
            !!item.requiresOnboardingComplete && !onboardingCompletedAt
          const isLocked = isQuestLocked || isOnboardingLocked
          // Locked whitelabel items send the user to /portal/onboard instead
          // of bouncing them with a 403 — better than a dead-end click.
          const targetHref = isOnboardingLocked
            ? "/portal/onboard?from=whitelabel"
            : item.href
          return (
            <Link
              key={item.href}
              href={targetHref}
              title={
                isOnboardingLocked
                  ? "Finish onboarding to unlock whitelabel"
                  : isQuestLocked
                    ? "Locked — open the Quests map to unlock"
                    : undefined
              }
              className={cn(
                "flex items-center gap-2.5 rounded-lg py-2 text-[13px] font-medium transition-all duration-150",
                isActive
                  ? "bg-primary/10 text-primary border-l-2 border-primary pl-[10px]"
                  : isLocked
                    ? "text-muted-foreground/50 hover:text-muted-foreground hover:bg-surface/40 pl-3"
                    : "text-muted-foreground hover:text-foreground hover:bg-surface/80 pl-3"
              )}
            >
              <item.icon className={cn("h-4 w-4 shrink-0", isActive && "text-primary")} />
              {!collapsed && (
                <span className="flex-1">{item.label}</span>
              )}
              {!collapsed && isLocked && (
                <Lock className="h-3 w-3 shrink-0 text-muted-foreground/50" />
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
              <QuestProgressRing size={26} />
              <NotificationBell variant="light" />
            </>
          )}
        </div>
      </div>
    </aside>
  )
}
