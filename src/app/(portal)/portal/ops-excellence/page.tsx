import type { Metadata } from "next"
import { auth, currentUser } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { getDashboardData } from "@/lib/ops-excellence/queries"
import ExecutiveDashboard from "@/components/ops-excellence/dashboard/ExecutiveDashboard"

export const metadata: Metadata = {
  title: "Operational Excellence | AIMS Platform",
  description: "Your executive dashboard for operational health and AI readiness.",
  robots: { index: false, follow: false },
}

export default async function OpsExcellencePage() {
  const { userId: clerkId } = await auth()

  if (!clerkId) {
    redirect("/sign-in")
  }

  const clerkUser = await currentUser()
  const userEmail = clerkUser?.emailAddresses?.[0]?.emailAddress ?? ""
  if (userEmail !== "adamwolfe100@gmail.com") {
    redirect("/portal/dashboard")
  }

  const dbUser = await db.user.findUnique({
    where: { clerkId },
    select: { id: true },
  })

  if (!dbUser) {
    redirect("/sign-in")
  }

  const engagement = await db.opsExcellenceEngagement.findFirst({
    where: { userId: dbUser.id },
    orderBy: { createdAt: "desc" },
    select: { id: true },
  })

  if (!engagement) {
    redirect("/portal/ops-excellence/intake")
  }

  const dashboardData = await getDashboardData(engagement.id)

  if (!dashboardData) {
    return (
      <div className="max-w-6xl mx-auto py-12">
        <div className="rounded-2xl border border-border bg-card p-12 text-center">
          <p className="text-lg font-semibold text-foreground mb-2">
            Unable to load dashboard
          </p>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            We could not retrieve your engagement data. Please contact support
            if this issue persists.
          </p>
        </div>
      </div>
    )
  }

  return <ExecutiveDashboard data={dashboardData} />
}
