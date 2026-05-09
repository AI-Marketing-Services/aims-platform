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
  Globe,
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
import { FEATURE_ENTITLEMENTS, type FeatureEntitlement } from "@/lib/plans/registry"
import { useMemo, useState } from "react"
import { cn } from "@/lib/utils"
import { NotificationBell } from "@/components/shared/NotificationBell"
import { OnboardingProgressWidget } from "@/components/portal/OnboardingProgressWidget"
import { QuestProgressRing } from "@/components/quests/QuestProgressRing"
import { CollapsibleNavSection } from "@/components/shared/CollapsibleNavSection"

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
  /**
   * Entitlement key that gates the destination page. When the user
   * does NOT have this entitlement active, the sidebar shows a Lock
   * icon next to the label so they know clicking will hit a paywall.
   * Mirrors the EntitlementGate that wraps the destination layout.
   *
   * Distinct from `gate` (which uses the quest system). Items can use
   * either or both; the lock shows if EITHER signal indicates locked.
   */
  entitlement?: FeatureEntitlement
}

/**
 * Sectioned nav structure. Each section has a stable label that doubles
 * as the localStorage key for collapsed-state persistence — don't
 * rename without a migration on the persisted keys.
 *
 * Section order is the operator's daily-driver order: top-of-screen =
 * what they touch first. Collapsibles inside CollapsibleNavSection
 * mean even users who never scroll see "Marketplace" without it
 * pushing the active surface off-screen.
 */
type NavSection = {
  section: string
  items: readonly NavItem[]
}

const PORTAL_NAV_SECTIONS: readonly NavSection[] = [
  {
    section: "Mission control",
    items: [
      { label: "Dashboard", href: "/portal/dashboard", icon: LayoutDashboard },
      { label: "Getting Started", href: "/portal/onboard", icon: Rocket },
      { label: "Quests", href: "/portal/quests", icon: Trophy },
      // Daily-driver scorecard sits in mission control — operators
      // land here every morning to set their week.
      { label: "Scorecard", href: "/portal/scorecard", icon: Target, gate: "crm", entitlement: FEATURE_ENTITLEMENTS.CRM },
    ],
  },
  {
    section: "Pipeline",
    items: [
      { label: "Client CRM", href: "/portal/crm", icon: Briefcase, gate: "crm", entitlement: FEATURE_ENTITLEMENTS.CRM },
      { label: "Lead Scout", href: "/portal/crm/scout", icon: MapPin, gate: "lead_scout", entitlement: FEATURE_ENTITLEMENTS.LEAD_SCOUT },
      { label: "AI Audit", href: "/portal/audits", icon: ClipboardCheck, gate: "audits", entitlement: FEATURE_ENTITLEMENTS.AUDITS },
      { label: "Lead Magnets", href: "/portal/lead-magnets", icon: FileText, gate: "audits", entitlement: FEATURE_ENTITLEMENTS.AUDITS },
      { label: "Email Sequences", href: "/portal/sequences", icon: Send, entitlement: FEATURE_ENTITLEMENTS.SEQUENCES },
      { label: "Booking Page", href: "/portal/booking", icon: CalendarDays, entitlement: FEATURE_ENTITLEMENTS.BOOKING },
      { label: "Discovery Recorder", href: "/portal/recordings", icon: Mic, entitlement: FEATURE_ENTITLEMENTS.RECORDINGS },
      { label: "Follow-up Rules", href: "/portal/follow-up-rules", icon: Bell, gate: "follow_up_rules", entitlement: FEATURE_ENTITLEMENTS.FOLLOW_UP_RULES },
    ],
  },
  {
    section: "Revenue",
    items: [
      { label: "Proposals", href: "/portal/proposals", icon: FileSignature, entitlement: FEATURE_ENTITLEMENTS.PROPOSALS },
      { label: "Invoices", href: "/portal/invoices", icon: FileText, entitlement: FEATURE_ENTITLEMENTS.INVOICES },
      { label: "Client Updates", href: "/portal/client-updates", icon: Mail, entitlement: FEATURE_ENTITLEMENTS.CLIENT_UPDATES },
      { label: "Revenue", href: "/portal/revenue", icon: TrendingUp, gate: "revenue", entitlement: FEATURE_ENTITLEMENTS.REVENUE },
      { label: "My Metrics", href: "/portal/metrics", icon: BarChart3 },
    ],
  },
  {
    section: "AI tools",
    items: [
      { label: "Deal Assistant", href: "/portal/deal-assistant", icon: Bot, entitlement: FEATURE_ENTITLEMENTS.DEAL_ASSISTANT },
      { label: "AI Scripts", href: "/portal/scripts", icon: FileCode2, gate: "scripts", entitlement: FEATURE_ENTITLEMENTS.SCRIPTS },
      { label: "Content Engine", href: "/portal/content", icon: PenLine, gate: "content", entitlement: FEATURE_ENTITLEMENTS.CONTENT },
      { label: "Templates", href: "/portal/templates", icon: Library, entitlement: FEATURE_ENTITLEMENTS.TEMPLATES },
      { label: "Toolkit", href: "/portal/tools", icon: Wrench, gate: "ai_tools" },
      { label: "Playbooks", href: "/portal/playbooks", icon: BookOpen, gate: "playbooks", entitlement: FEATURE_ENTITLEMENTS.PLAYBOOKS },
      { label: "Pricing Calc", href: "/portal/calculator", icon: Calculator, gate: "calculator", entitlement: FEATURE_ENTITLEMENTS.CALCULATOR },
    ],
  },
  {
    // Admin-only items rolled into one section so they group together
    // when a previewing admin scans the sidebar. Filtered entirely
    // out below for non-admins.
    section: "Platform ops",
    items: [
      { label: "Ops Excellence", href: "/portal/ops-excellence", icon: Gauge },
      { label: "My Services", href: "/portal/services", icon: Layers },
      { label: "Campaigns", href: "/portal/campaigns", icon: BarChart3 },
      { label: "Signal", href: "/portal/signal", icon: Newspaper, gate: "signal" },
    ],
  },
  {
    section: "Whitelabel",
    items: [
      // Whitelabel — opens once onboarding hits 100%.
      { label: "Website", href: "/reseller/site", icon: Globe, requiresOnboardingComplete: true },
      { label: "Branding", href: "/reseller/settings/branding", icon: Sparkles, requiresOnboardingComplete: true },
      { label: "Domain", href: "/reseller/settings/domain", icon: Settings, requiresOnboardingComplete: true },
    ],
  },
  {
    section: "Account",
    items: [
      { label: "Marketplace", href: "/portal/marketplace", icon: ShoppingBag },
      { label: "Billing", href: "/portal/billing", icon: CreditCard },
      { label: "Referrals", href: "/portal/referrals", icon: Users, gate: "referrals" },
      { label: "Support", href: "/portal/support", icon: LifeBuoy },
      { label: "Settings", href: "/portal/settings", icon: Settings },
    ],
  },
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
  /** Active entitlement keys for the signed-in user. Used to decide
   *  whether each nav item gets a Lock icon. Empty array = no
   *  entitlements active (free tier). */
  activeEntitlements?: string[]
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
  activeEntitlements = [],
}: PortalSidebarProps) {
  const lowBalance = creditBalance < 50
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const { isFeatureUnlocked, loading: questsLoading } = useQuests()

  // Build the visible nav: filter out admin-only items for non-admins,
  // drop entire empty sections so we never render a header above
  // nothing.
  const visibleSections = useMemo(() => {
    return PORTAL_NAV_SECTIONS.map((s) => ({
      section: s.section,
      items: s.items.filter(
        (item) => !ADMIN_ONLY_ROUTES.includes(item.href) || isAdminEmail,
      ),
    })).filter((s) => s.items.length > 0)
  }, [isAdminEmail])

  // Flat list across all visible sections — used for active-href
  // resolution (longest-prefix wins, same as before).
  const visibleNav = useMemo(
    () => visibleSections.flatMap((s) => s.items),
    [visibleSections],
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

  // Which section contains the active route — used to override any
  // persisted "collapsed" state so users never land on a route whose
  // section is folded shut.
  const activeSectionLabel = useMemo(() => {
    if (!activeHref) return null
    return (
      visibleSections.find((s) => s.items.some((i) => i.href === activeHref))
        ?.section ?? null
    )
  }, [activeHref, visibleSections])

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
          even the full nav (~30 items for admins) fits without a long
          scroll. Icons stay 4×4 (16px). Sections collapse — see
          CollapsibleNavSection for the persistence + auto-expand
          rules. */}
      <nav className="flex-1 py-2 overflow-y-auto custom-scrollbar">
        {visibleSections.map((group, groupIdx) => {
          const isActiveSection = activeSectionLabel === group.section
          // Mission control + the active section default-open. Other
          // sections collapsed-by-default so a fresh user (or an admin
          // previewing as client) sees a tidy spine instead of a wall.
          const defaultCollapsed =
            !isActiveSection && groupIdx > 0
          return (
            <CollapsibleNavSection
              key={group.section}
              storageKey={`aoc.portal-sidebar.${group.section}`}
              label={group.section}
              defaultCollapsed={defaultCollapsed}
              hideLabel={collapsed}
            >
              <div className="px-2 space-y-0.5">
                {group.items.map((item) => {
                  const isActive = activeHref === item.href
                  // Don't dim items while quests are still loading —
                  // avoids a flash of "everything is locked" on first
                  // paint.
                  const isQuestLocked =
                    !!item.gate && !questsLoading && !isFeatureUnlocked(item.gate)
                  const isOnboardingLocked =
                    !!item.requiresOnboardingComplete && !onboardingCompletedAt
                  // Entitlement check — admins / super-admins always
                  // pass (they bypass paywalls in EntitlementGate
                  // too). Non-admins see a Lock icon next to any item
                  // whose destination page is gated by an entitlement
                  // they don't have.
                  const isEntitlementLocked =
                    !isAdminEmail &&
                    !!item.entitlement &&
                    !activeEntitlements.includes(item.entitlement)
                  const isLocked =
                    isQuestLocked || isOnboardingLocked || isEntitlementLocked
                  // Locked whitelabel items send the user to
                  // /portal/onboard instead of bouncing with a 403.
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
                          : isEntitlementLocked
                            ? "Upgrade your plan to unlock"
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
              </div>
            </CollapsibleNavSection>
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
