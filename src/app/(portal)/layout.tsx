import type { Metadata } from "next"
import { redirect } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { UserButton } from "@clerk/nextjs"
import { PortalSidebar } from "@/components/portal/Sidebar"
import { MobilePortalNav } from "@/components/portal/MobilePortalNav"
import { getProgressForUser } from "@/lib/onboarding/progress"
import { PortalChatWidget } from "@/components/portal/PortalChatWidget"
import { QuickAddFab } from "@/components/portal/QuickAddFab"
import { ReferralClaimHandler } from "@/components/portal/ReferralClaimHandler"
import { BugReportWidget } from "@/components/portal/BugReportWidget"
import { QuestProvider } from "@/components/quests/QuestContext"
import { UnlockModal } from "@/components/quests/UnlockModal"
import { PageTransition } from "@/components/shared/PageTransition"
import { AdminPreviewBanner } from "@/components/shared/AdminPreviewBanner"
import { WelcomeWizardBanner } from "@/components/portal/WelcomeWizardBanner"
import { db } from "@/lib/db"
import { getEffectiveRole, dashboardForRole } from "@/lib/auth"
import { ensureDbUser } from "@/lib/auth/ensure-user"
import { listActiveEntitlements } from "@/lib/entitlements"
import { logger } from "@/lib/logger"

export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const effective = await getEffectiveRole()
  if (!effective) redirect("/sign-in")

  // An admin who hasn't activated preview mode shouldn't get silently
  // dropped into the client portal — bounce to their own dashboard.
  const { userId, realRole, effectiveRole, isPreviewing } = effective
  const isAdminish = realRole === "ADMIN" || realRole === "SUPER_ADMIN"
  if (isAdminish && !isPreviewing) {
    redirect("/admin/dashboard")
  }

  // Clients (the normal case) + admins previewing-as-client both land here.
  if (effectiveRole !== "CLIENT") {
    redirect(dashboardForRole(effectiveRole))
  }

  // Single DB query for sidebar data + chat widget context. We log Prisma
  // errors with full code + meta, then degrade gracefully — a transient Neon
  // hiccup should NOT crash the entire portal for every signed-in user.
  // dbUser=null is already handled downstream (every read uses `?.`), so
  // the failure mode just shows the shell with empty defaults until the
  // user refreshes.
  let dbUser: {
    id: string
    name: string | null
    creditBalance: number
    creditPlanTier: string
    subscriptions: { monthlyAmount: number }[]
    firstRunCompletedAt: Date | null
    firstRunSkippedAt: Date | null
  } | null = null
  try {
    dbUser = await db.user.findUnique({
      where: { clerkId: userId },
      select: {
        id: true,
        name: true,
        creditBalance: true,
        creditPlanTier: true,
        firstRunCompletedAt: true,
        firstRunSkippedAt: true,
        subscriptions: {
          where: { status: "ACTIVE" },
          select: { monthlyAmount: true },
        },
      },
    })
  } catch (err) {
    logger.error("portal layout: db.user.findUnique failed", err, {
      endpoint: "(portal)/layout",
      userId,
    })
    // Fall through with dbUser=null so the layout still renders.
  }

  const totalMrr = dbUser?.subscriptions.reduce((sum, s) => sum + s.monthlyAmount, 0) ?? 0
  const serviceCount = dbUser?.subscriptions.length ?? 0
  // First-run wizard banner is rendered below for users who haven't
  // completed or explicitly skipped the welcome tour. A banner is less
  // aggressive than an auto-redirect (no loop risk, no surprise) but
  // still gives the new operator a single highly-visible call-to-action
  // to walk through the full setup flow. Suppressed during admin
  // preview because admins testing the dashboard already know what
  // they're doing.
  const showWelcomeBanner =
    !!dbUser &&
    !dbUser.firstRunCompletedAt &&
    !dbUser.firstRunSkippedAt

  const [unreadCount, onboardingProgress, activeEntitlements] = await Promise.all([
    dbUser
      ? db.notification
          .count({ where: { userId: dbUser.id, read: false } })
          .catch((err) => {
            logger.error("portal layout: notification.count failed", err, {
              endpoint: "(portal)/layout",
              userId: dbUser.id,
            })
            return 0
          })
      : Promise.resolve(0),
    dbUser
      ? getProgressForUser(dbUser.id).catch((err) => {
          logger.error("portal layout: getProgressForUser failed", err, {
            endpoint: "(portal)/layout",
            userId: dbUser.id,
          })
          return null
        })
      : Promise.resolve(null),
    // Active entitlement keys — fed to the sidebar so locked features
    // get a Lock icon next to their nav label, mirroring how
    // EntitlementGate paywalls them on click. Without this, items like
    // Proposals/Invoices/Sequences had no lock indicator even though
    // their pages 402/paywall on access. James flagged this on first
    // dogfood as "some things that should be locked don't show locks".
    dbUser
      ? listActiveEntitlements(dbUser.id).catch((err) => {
          logger.error("portal layout: listActiveEntitlements failed", err, {
            endpoint: "(portal)/layout",
            userId: dbUser.id,
          })
          return [] as string[]
        })
      : Promise.resolve([] as string[]),
  ])

  const firstName = dbUser?.name?.split(" ")[0] ?? "there"

  return (
    <QuestProvider>
      <div className="min-h-screen bg-background text-foreground">
      {/* Mobile top header - only visible on mobile */}
      <div className="lg:hidden flex items-center justify-between h-14 px-4 bg-deep border-b border-border sticky top-0 z-40">
        <Link href="/" className="flex items-center" aria-label="Home">
          <Image src="/logo.png" alt="" width={32} height={32} className="object-contain h-7 w-7" />
        </Link>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && <span className="h-2 w-2 rounded-full bg-primary" />}
          <UserButton />
        </div>
      </div>

      <div className="flex h-[calc(100dvh-3.5rem)] lg:h-screen overflow-hidden">
        <PortalSidebar
          totalMrr={totalMrr}
          hasUnread={unreadCount > 0}
          onboardingCompletedCount={onboardingProgress?.completedCount ?? 0}
          onboardingPercent={onboardingProgress?.percent ?? 0}
          onboardingCompletedAt={onboardingProgress?.onboardingCompletedAt?.toISOString() ?? null}
          creditBalance={dbUser?.creditBalance ?? 0}
          creditPlanTier={dbUser?.creditPlanTier ?? "trial"}
          isAdminEmail={isAdminish && !isPreviewing}
          activeEntitlements={activeEntitlements}
        />
        <main id="main-content" className="flex-1 overflow-y-auto custom-scrollbar">
          {isPreviewing && <AdminPreviewBanner viewingAs={effectiveRole} />}
          {showWelcomeBanner && <WelcomeWizardBanner />}
          <PageTransition>
            <div className="p-4 pb-20 lg:p-6 lg:pb-8 xl:p-8">{children}</div>
          </PageTransition>
        </main>
      </div>

      {/* Mobile bottom nav */}
      <MobilePortalNav hasUnread={unreadCount > 0} isAdminEmail={isAdminish && !isPreviewing} />

      <PortalChatWidget firstName={firstName} serviceCount={serviceCount} />
      <QuickAddFab />
      <ReferralClaimHandler />
      <BugReportWidget variant="pill" />
      <UnlockModal />
      </div>
    </QuestProvider>
  )
}
