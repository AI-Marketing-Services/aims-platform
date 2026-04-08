import type { Metadata } from "next"
import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { UserButton } from "@clerk/nextjs"
import { PortalSidebar } from "@/components/portal/Sidebar"
import { MobilePortalNav } from "@/components/portal/MobilePortalNav"
import { PortalChatWidget } from "@/components/portal/PortalChatWidget"
import { ReferralClaimHandler } from "@/components/portal/ReferralClaimHandler"
import { PageTransition } from "@/components/shared/PageTransition"
import { db } from "@/lib/db"

export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { userId } = await auth()
  if (!userId) redirect("/sign-in")

  // Single DB query for sidebar data + chat widget context
  const dbUser = await db.user.findUnique({
    where: { clerkId: userId },
    select: {
      id: true,
      name: true,
      subscriptions: {
        where: { status: "ACTIVE" },
        select: { monthlyAmount: true },
      },
    },
  })

  const totalMrr = dbUser?.subscriptions.reduce((sum, s) => sum + s.monthlyAmount, 0) ?? 0
  const serviceCount = dbUser?.subscriptions.length ?? 0

  const unreadCount = dbUser
    ? await db.notification.count({
        where: { userId: dbUser.id, read: false },
      })
    : 0

  const firstName = dbUser?.name?.split(" ")[0] ?? "there"

  return (
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
        <PortalSidebar totalMrr={totalMrr} hasUnread={unreadCount > 0} />
        <main className="flex-1 overflow-y-auto custom-scrollbar">
          <PageTransition>
            <div className="p-4 pb-20 lg:p-6 lg:pb-8 xl:p-8">{children}</div>
          </PageTransition>
        </main>
      </div>

      {/* Mobile bottom nav */}
      <MobilePortalNav hasUnread={unreadCount > 0} />

      <PortalChatWidget firstName={firstName} serviceCount={serviceCount} />
      <ReferralClaimHandler />
    </div>
  )
}
