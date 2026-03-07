import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { Mail, Phone, BarChart2, Calendar, TrendingUp } from "lucide-react"

export const metadata = { title: "Campaigns" }

export default async function CampaignsPage() {
  const { userId } = await auth()
  if (!userId) redirect("/sign-in")

  const dbUser = await db.user.findUnique({ where: { clerkId: userId } })
  if (!dbUser) redirect("/sign-in")

  const activeCampaignSubs = await db.subscription.findMany({
    where: {
      userId: dbUser.id,
      status: "ACTIVE",
      serviceArm: { slug: { in: ["cold-outbound", "voice-agents", "lead-reactivation", "database-reactivation"] } },
    },
    include: { serviceArm: true },
  })

  const hasCampaigns = activeCampaignSubs.length > 0

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Campaigns</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Track performance across your active outbound and reactivation campaigns.
        </p>
      </div>

      {!hasCampaigns ? (
        <div className="rounded-2xl border border-border bg-card p-12 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
            <Mail className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">No active campaigns</h3>
          <p className="mt-2 text-sm text-muted-foreground max-w-sm mx-auto">
            Your campaigns will appear here once your Outbound, Voice Agent, or Lead Reactivation service is set up.
          </p>
          <a
            href="/portal/marketplace"
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-[#DC2626] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#B91C1C] transition-colors"
          >
            Browse campaign services
          </a>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Active service headers */}
          <div className="flex flex-wrap gap-3">
            {activeCampaignSubs.map((sub) => (
              <div key={sub.id} className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5">
                <span className="h-2 w-2 rounded-full bg-green-500" />
                <span className="text-sm font-medium text-foreground">{sub.serviceArm.name}</span>
                <span className="text-xs text-muted-foreground capitalize">{sub.tier}</span>
              </div>
            ))}
          </div>

          {/* Metric cards */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { label: "Emails Sent", value: "—", icon: Mail },
              { label: "Open Rate", value: "—", icon: BarChart2 },
              { label: "Reply Rate", value: "—", icon: TrendingUp },
              { label: "Meetings Booked", value: "—", icon: Calendar },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} className="rounded-xl border border-border bg-card p-5">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-muted">
                    <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-foreground font-mono">{value}</p>
                <p className="text-xs text-muted-foreground mt-1">Connecting data...</p>
              </div>
            ))}
          </div>

          {/* Campaign table skeleton */}
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="px-5 py-4 border-b border-border">
              <h2 className="text-sm font-semibold text-foreground">Campaign List</h2>
            </div>
            <div className="p-8 text-center">
              <p className="text-sm text-muted-foreground">
                Campaign data will sync automatically once your service goes live.
                <br />
                Typical setup time: 7–14 days after kickoff.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
