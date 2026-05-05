import type { Metadata } from "next"
import { redirect } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { UserButton } from "@clerk/nextjs"
import {
  LayoutDashboard,
  Users,
  DollarSign,
  FolderOpen,
  Settings,
} from "lucide-react"
import { PageTransition } from "@/components/shared/PageTransition"
import { AdminPreviewBanner } from "@/components/shared/AdminPreviewBanner"
import { BugReportWidget } from "@/components/portal/BugReportWidget"
import { headers } from "next/headers"
import { getEffectiveRole, dashboardForRole } from "@/lib/auth"
import { checkWhitelabelAccess } from "@/lib/auth/whitelabel"

export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

// Partner-economics pages — hidden from CLIENT users who only entered
// this layout to whitelabel. They keep all of /portal/* as their main UI.
const RESELLER_ONLY_NAV = [
  { label: "Dashboard", href: "/reseller/dashboard", icon: LayoutDashboard },
  { label: "Clients", href: "/reseller/clients", icon: Users },
  { label: "Commissions", href: "/reseller/commissions", icon: DollarSign },
  { label: "Resources", href: "/reseller/resources", icon: FolderOpen },
]

const WHITELABEL_NAV = [
  { label: "Branding", href: "/reseller/settings/branding", icon: Settings },
  { label: "Domain", href: "/reseller/settings/domain", icon: Settings },
]

const RESELLER_ONLY_PREFIXES = [
  "/reseller/dashboard",
  "/reseller/clients",
  "/reseller/commissions",
  "/reseller/resources",
]

export default async function ResellerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const effective = await getEffectiveRole()
  if (!effective) redirect("/sign-in")

  const { realRole, effectiveRole, isPreviewing } = effective
  // Admins who aren't previewing belong in /admin/*.
  const isAdminish = realRole === "ADMIN" || realRole === "SUPER_ADMIN"
  if (isAdminish && !isPreviewing) {
    redirect("/admin/dashboard")
  }

  // CLIENT users can enter this layout ONLY to access whitelabel pages
  // (branding + domain), and only if their onboarding is complete. They
  // get the slim sidebar (just Branding + Domain) and bounce to /portal
  // if they try a partner-only page.
  let isWhitelabelClient = false
  if (effectiveRole !== "RESELLER") {
    const whitelabel = await checkWhitelabelAccess()
    if (!whitelabel.ok) {
      // No access at all — back to their actual dashboard.
      // CLIENT-with-incomplete-onboarding gets a friendly redirect to
      // /portal/onboard so they can finish unlocking it.
      if (whitelabel.reason === "client_onboarding_incomplete") {
        redirect("/portal/onboard?from=whitelabel")
      }
      redirect(dashboardForRole(effectiveRole))
    }
    if (whitelabel.role === "CLIENT") {
      isWhitelabelClient = true
      // Block CLIENT users from partner-economics pages they shouldn't see.
      const headerList = await headers()
      const pathname =
        headerList.get("x-pathname") ??
        headerList.get("x-invoke-path") ??
        headerList.get("next-url") ??
        ""
      if (RESELLER_ONLY_PREFIXES.some((p) => pathname.startsWith(p))) {
        redirect("/reseller/settings/branding")
      }
    }
  }

  // Sidebar contents depend on whether this is a true partner or a
  // whitelabel-enabled client.
  const visibleNav = isWhitelabelClient
    ? WHITELABEL_NAV
    : [...RESELLER_ONLY_NAV, ...WHITELABEL_NAV]

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Mobile top header */}
      <div className="lg:hidden flex items-center justify-between h-14 px-4 bg-deep border-b border-border sticky top-0 z-40">
        <Link href={isWhitelabelClient ? "/portal/dashboard" : "/reseller/dashboard"} className="flex items-center gap-2">
          <Image src="/logo.png" alt="" width={32} height={32} className="object-contain h-7 w-7" />
          <span className="text-[10px] font-medium text-primary uppercase tracking-wider">Partner</span>
        </Link>
        <UserButton />
      </div>

      <div className="flex h-[calc(100dvh-3.5rem)] lg:h-screen overflow-hidden">
        <aside className="hidden lg:flex w-64 flex-col border-r border-border bg-deep">
          <div className="flex h-16 items-center px-4 border-b border-border">
            <Link href={isWhitelabelClient ? "/portal/dashboard" : "/reseller/dashboard"} className="flex items-center gap-2.5">
              <Image src="/logo.png" alt="" width={36} height={36} className="object-contain h-8 w-8" />
              <span className="text-[10px] font-medium text-primary uppercase tracking-wider">Partner</span>
            </Link>
          </div>
          <nav className="flex-1 py-4 px-2 space-y-0.5">
            {visibleNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-surface transition-colors"
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="border-t border-border p-4">
            <UserButton />
          </div>
        </aside>
        <main id="main-content" className="flex-1 overflow-y-auto custom-scrollbar">
          {isPreviewing && <AdminPreviewBanner viewingAs={effectiveRole} />}
          <PageTransition>
            <div className="p-4 pb-20 lg:p-6 lg:pb-8 xl:p-8">{children}</div>
          </PageTransition>
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav aria-label="Reseller mobile navigation" className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border flex items-center justify-around h-16 px-2 safe-area-pb">
        {visibleNav.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg min-w-0 flex-1 text-muted-foreground hover:text-foreground transition-colors"
          >
            <item.icon className="h-5 w-5" />
            <span className="text-[10px] font-medium truncate">{item.label}</span>
          </Link>
        ))}
      </nav>
      <BugReportWidget variant="pill" />
    </div>
  )
}
