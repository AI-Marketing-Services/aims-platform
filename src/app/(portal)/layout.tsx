import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { UserButton } from "@clerk/nextjs"
import { PortalSidebar } from "@/components/portal/Sidebar"
import { PortalChatWidget } from "@/components/portal/PortalChatWidget"
import { MobilePortalNav } from "@/components/portal/MobilePortalNav"
import { db } from "@/lib/db"

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { userId } = await auth()
  if (!userId) redirect("/sign-in")

  // Look up DB user for sidebar data
  const dbUser = await db.user.findUnique({
    where: { clerkId: userId },
    select: {
      id: true,
      subscriptions: {
        where: { status: "ACTIVE" },
        select: { monthlyAmount: true },
      },
    },
  })

  const totalMrr = dbUser?.subscriptions.reduce((sum, s) => sum + s.monthlyAmount, 0) ?? 0

  const unreadCount = dbUser
    ? await db.notification.count({
        where: { userId: dbUser.id, read: false },
      })
    : 0

  // Fetch user name for chat widget
  const chatUser = await db.user.findUnique({
    where: { clerkId: userId },
    select: {
      name: true,
      _count: { select: { subscriptions: { where: { status: "ACTIVE" } } } },
    },
  })

  const firstName = chatUser?.name?.split(" ")[0] ?? "there"
  const serviceCount = chatUser?._count?.subscriptions ?? 0

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Mobile top header — only visible on mobile */}
      <div className="lg:hidden flex items-center justify-between h-14 px-4 bg-deep border-b border-border sticky top-0 z-40">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/logo.png" alt="AIMS" width={28} height={28} className="object-contain" />
          <span className="text-base font-bold tracking-tight">AIMS</span>
        </Link>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && <span className="h-2 w-2 rounded-full bg-primary" />}
          <UserButton afterSignOutUrl="/" />
        </div>
      </div>

      <div className="flex h-[calc(100dvh-3.5rem)] lg:h-screen overflow-hidden">
        <PortalSidebar totalMrr={totalMrr} hasUnread={unreadCount > 0} />
        <main className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="p-4 pb-20 lg:p-6 lg:pb-8 xl:p-8">{children}</div>
        </main>
      </div>

      {/* Mobile bottom nav */}
      <MobilePortalNav hasUnread={unreadCount > 0} />

      <PortalChatWidget firstName={firstName} serviceCount={serviceCount} />
    </div>
  )
}
