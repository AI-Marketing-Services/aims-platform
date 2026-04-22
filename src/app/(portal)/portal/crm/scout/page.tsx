import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { LeadScout } from "@/components/portal/crm/LeadScout"
import { MapPin, Sparkles } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function LeadScoutPage() {
  const { userId } = await auth()
  if (!userId) redirect("/sign-in")

  return (
    <div className="max-w-4xl mx-auto px-6 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
          <MapPin className="h-4.5 w-4.5 text-primary" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-foreground">Lead Scout</h1>
          <p className="text-xs text-muted-foreground">
            Search local businesses and import them directly into your CRM
          </p>
        </div>
      </div>

      {/* How it works */}
      <div className="flex items-start gap-3 bg-primary/5 border border-primary/20 rounded-xl p-4">
        <Sparkles className="h-4 w-4 text-primary mt-0.5 shrink-0" />
        <div className="text-xs text-muted-foreground space-y-1">
          <p className="font-semibold text-foreground">How it works</p>
          <p>
            Enter a business type (e.g. "HVAC", "dental office", "restaurant") and a city, and Lead
            Scout will search the web and extract real local businesses with contact info. Select any
            you want to pursue and import them to your pipeline as prospects.
          </p>
        </div>
      </div>

      <LeadScout />
    </div>
  )
}
