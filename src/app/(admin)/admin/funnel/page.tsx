import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { Breadcrumbs } from "@/components/shared/Breadcrumbs"
import { FunnelDashboardClient } from "./FunnelDashboardClient"

export const dynamic = "force-dynamic"

export default async function AdminFunnelPage() {
  const { userId, sessionClaims } = await auth()
  if (!userId) redirect("/sign-in")
  const role = (sessionClaims?.metadata as { role?: string })?.role
  if (!role || !["ADMIN", "SUPER_ADMIN"].includes(role)) {
    redirect("/portal/dashboard")
  }

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: "Admin", href: "/admin/dashboard" },
          { label: "Funnel" },
        ]}
      />
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Collective Application Funnel
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Live metrics — refreshes every 30 seconds.
        </p>
      </div>
      <FunnelDashboardClient />
    </div>
  )
}
