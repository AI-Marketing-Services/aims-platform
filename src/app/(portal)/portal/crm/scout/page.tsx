import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { MapsDiscovery } from "@/components/portal/crm/MapsDiscovery"

export const dynamic = "force-dynamic"

/**
 * Lead Scout — single discovery surface backed by Google Places API.
 *
 * Historical note: this page used to host TWO tabs (Google Maps +
 * Open Web/Tavily). Operators found the choice confusing — both tabs
 * looked equivalent but Open Web returned text-blob results that
 * required a follow-up enrichment step, while Maps returned structured
 * rows ready for import. On 2026-05-14 we collapsed to Maps-only.
 *
 * The Tavily code path (`/api/portal/crm/lead-scout`,
 * `lib/crm/lead-scout.ts`, the `LeadScout` and `ScoutTabs` components)
 * is kept in the repo so we can restore it as a power-user feature
 * later — but the default UX is one map, one search.
 */
export default async function LeadScoutPage() {
  const { userId } = await auth()
  if (!userId) redirect("/sign-in")

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-foreground mb-1">Lead Scout</h1>
        <p className="text-sm text-muted-foreground">
          Search Google Maps for prospects, import them into your CRM, and
          enrich on demand.
        </p>
      </div>

      <MapsDiscovery />
    </div>
  )
}
