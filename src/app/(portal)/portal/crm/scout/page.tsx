import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { LeadScout } from "@/components/portal/crm/LeadScout"
import { MapsDiscovery } from "@/components/portal/crm/MapsDiscovery"
import { ScoutTabs } from "@/components/portal/crm/ScoutTabs"

export const dynamic = "force-dynamic"

export default async function LeadScoutPage() {
  const { userId } = await auth()
  if (!userId) redirect("/sign-in")

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-foreground mb-1">Lead Scout</h1>
        <p className="text-sm text-muted-foreground">
          Discover prospects, import them into your CRM, and enrich on demand.
        </p>
      </div>

      <ScoutTabs
        mapsContent={<MapsDiscovery />}
        webContent={<LeadScout />}
      />
    </div>
  )
}
