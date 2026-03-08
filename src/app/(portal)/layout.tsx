import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { PortalSidebar } from "@/components/portal/Sidebar"
import { PortalChatWidget } from "@/components/portal/PortalChatWidget"
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
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <div className="flex h-screen overflow-hidden">
        <PortalSidebar totalMrr={totalMrr} hasUnread={unreadCount > 0} />
        <main className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="p-6 lg:p-8">{children}</div>
        </main>
      </div>
      <PortalChatWidget firstName={firstName} serviceCount={serviceCount} />
    </div>
  )
}
