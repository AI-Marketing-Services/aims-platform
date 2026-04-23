import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { Breadcrumbs } from "@/components/shared/Breadcrumbs"
import { UtmAnalyticsClient } from "./UtmAnalyticsClient"

export const dynamic = "force-dynamic"

export default async function AdminAnalyticsPage() {
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
          { label: "UTM & Analytics" },
        ]}
      />
      <div>
        <h1 className="text-2xl font-bold text-foreground">UTM & Analytics</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Build tracking links for every channel. See which content drives applications, bookings, and members.
        </p>
      </div>
      <UtmAnalyticsClient />
    </div>
  )
}
