import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { PortalSidebar } from "@/components/portal/Sidebar"

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { userId } = await auth()
  if (!userId) redirect("/sign-in")

  return (
    <div className="dark min-h-screen bg-background text-foreground">
      <div className="flex h-screen overflow-hidden">
        <PortalSidebar />
        <main className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="p-6 lg:p-8">{children}</div>
        </main>
      </div>
    </div>
  )
}
