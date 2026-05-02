import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { AdminSidebar } from "@/components/admin/AdminSidebar"
import { MobileAdminNav } from "@/components/admin/MobileAdminNav"
import { PageTransition } from "@/components/shared/PageTransition"
import { KeyboardShortcuts } from "@/components/shared/KeyboardShortcuts"
import { BugReportWidget } from "@/components/portal/BugReportWidget"
import { getEffectiveRole, dashboardForRole } from "@/lib/auth"

export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Gate on the REAL role, not the effective role — an admin who has
  // a preview cookie set should still be able to access /admin/* by
  // typing the URL (equivalent to an "exit preview" action).
  const effective = await getEffectiveRole()
  if (!effective) redirect("/sign-in")

  const isAdminish = effective.realRole === "ADMIN" || effective.realRole === "SUPER_ADMIN"
  if (!isAdminish) {
    redirect(dashboardForRole(effective.realRole))
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Mobile top header - only visible on mobile */}
      <div className="lg:hidden flex items-center justify-between h-14 px-4 bg-deep border-b border-border sticky top-0 z-40">
        <span className="text-base font-bold tracking-tight text-foreground">AIMS Admin</span>
        <div className="flex items-center gap-2">
          {/* Notification bell or user avatar can go here */}
        </div>
      </div>

      <div className="flex h-[calc(100dvh-3.5rem)] lg:h-screen overflow-hidden">
        <AdminSidebar />
        <main id="main-content" className="flex-1 overflow-y-auto custom-scrollbar">
          <PageTransition>
            <div className="p-4 pb-20 lg:p-6 lg:pb-8 xl:p-8">{children}</div>
          </PageTransition>
        </main>
      </div>

      {/* Mobile bottom nav */}
      <MobileAdminNav />
      <KeyboardShortcuts />
      <BugReportWidget variant="pill" />
    </div>
  )
}
