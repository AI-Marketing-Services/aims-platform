import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { LeadScout } from "@/components/portal/crm/LeadScout"
import { MapsDiscovery } from "@/components/portal/crm/MapsDiscovery"

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

      {/* New: Google Maps Places-based discovery — structured data,
          dedups against your CRM, optional auto-enrich on import. */}
      <MapsDiscovery />

      {/* Legacy: Tavily web-search-based scout. Still useful for niche
          industries Maps doesn't cover well — kept behind a collapsible
          to keep the primary surface focused on Maps. */}
      <details className="rounded-2xl border border-border bg-card overflow-hidden">
        <summary className="px-5 py-3 cursor-pointer text-sm font-semibold text-foreground flex items-center justify-between hover:bg-muted/30 transition-colors">
          <span>Search the open web (legacy)</span>
          <span className="text-[11px] text-muted-foreground font-normal">
            Tavily-based — broader but less structured
          </span>
        </summary>
        <div className="border-t border-border h-[600px] overflow-hidden">
          <LeadScout />
        </div>
      </details>
    </div>
  )
}
