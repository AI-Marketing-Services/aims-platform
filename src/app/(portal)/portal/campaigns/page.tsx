import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import {
  Mail,
  TrendingUp,
  MessageSquare,
  Calendar,
  ArrowRight,
} from "lucide-react"

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
      serviceArm: {
        slug: {
          in: [
            "cold-outbound",
            "voice-agents",
            "lead-reactivation",
            "database-reactivation",
          ],
        },
      },
    },
    include: { serviceArm: true },
  })

  const hasCampaigns = activeCampaignSubs.length > 0

  const metricCards = [
    { label: "Emails Sent", icon: Mail },
    { label: "Open Rate", icon: TrendingUp },
    { label: "Reply Rate", icon: MessageSquare },
    { label: "Meetings Booked", icon: Calendar },
  ]

  if (!hasCampaigns) {
    return (
      <div className="space-y-8">
        {/* Page header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Campaigns</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track performance across your active outbound and reactivation campaigns.
          </p>
        </div>

        {/* Preview header */}
        <div className="rounded-2xl border border-border bg-card p-6">
          <h2 className="text-lg font-semibold text-foreground">
            Campaign Dashboard Preview
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Activate Cold Outbound, Voice Agents, or Lead Reactivation to unlock
            your live campaign metrics.
          </p>
        </div>

        {/* Mock metric cards */}
        <div
          className="grid grid-cols-2 gap-4 sm:grid-cols-4 opacity-50 pointer-events-none select-none"
          aria-hidden="true"
        >
          {metricCards.map(({ label, icon: Icon }) => (
            <div key={label} className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs text-muted-foreground">{label}</p>
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-muted">
                  <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
              </div>
              <p className="text-2xl font-bold text-muted-foreground font-mono">—</p>
              <p className="text-xs text-muted-foreground mt-1">No data yet</p>
            </div>
          ))}
        </div>

        {/* Mock campaign table */}
        <div
          className="rounded-xl border border-border bg-card overflow-hidden opacity-40 pointer-events-none select-none"
          aria-hidden="true"
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  {["Campaign", "Service", "Status", "Sent", "Opens", "Replies"].map(
                    (h) => (
                      <th
                        key={h}
                        className="px-4 py-3 text-left text-xs font-medium text-muted-foreground"
                      >
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-8 text-center text-sm italic text-muted-foreground"
                  >
                    (Your first campaign will appear here)
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* CTA cards */}
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
            Get started with a campaign service
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {[
              { name: "Cold Outbound Engine", href: "/portal/marketplace" },
              { name: "AI Voice Agents", href: "/portal/marketplace" },
              { name: "Lead Reactivation", href: "/portal/marketplace" },
            ].map(({ name, href }) => (
              <a
                key={name}
                href={href}
                className="rounded-xl border border-border bg-card p-4 hover:border-[#DC2626]/40 transition-all group flex items-center justify-between"
              >
                <div>
                  <p className="text-sm font-semibold text-foreground">{name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Custom pricing
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-[#DC2626] transition-colors flex-shrink-0" />
              </a>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Active campaigns layout
  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Campaigns</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Track performance across your active outbound and reactivation campaigns.
        </p>
      </div>

      {/* Active service pills */}
      <div className="flex flex-wrap gap-3">
        {activeCampaignSubs.map((sub) => (
          <div
            key={sub.id}
            className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5"
          >
            <span className="h-2 w-2 rounded-full bg-green-500" />
            <span className="text-sm font-medium text-foreground">
              {sub.serviceArm.name}
            </span>
            {sub.tier && (
              <span className="text-xs text-muted-foreground capitalize">
                {sub.tier}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {metricCards.map(({ label, icon: Icon }) => (
          <div key={label} className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-muted-foreground">{label}</p>
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-muted">
                <Icon className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
            </div>
            <p className="text-2xl font-bold text-foreground font-mono">—</p>
            <p className="text-xs text-muted-foreground mt-1">Connecting data...</p>
          </div>
        ))}
      </div>

      {/* Campaign table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h2 className="text-sm font-semibold text-foreground">Campaign List</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                {["Campaign", "Service", "Status", "Sent", "Opens", "Replies"].map(
                  (h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-xs font-medium text-muted-foreground"
                    >
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {activeCampaignSubs.map((sub) => (
                <tr
                  key={sub.id}
                  className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors"
                >
                  <td className="px-4 py-3 font-medium text-foreground">
                    {sub.serviceArm.name}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground capitalize">
                    {sub.serviceArm.slug}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1 rounded-full border border-green-200 bg-green-50 px-2 py-0.5 text-xs text-green-700">
                      Active
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground font-mono">—</td>
                  <td className="px-4 py-3 text-muted-foreground font-mono">—</td>
                  <td className="px-4 py-3 text-muted-foreground font-mono">—</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Data sync note */}
      <p className="text-xs text-muted-foreground">
        Live campaign data syncs once your outbound infrastructure is connected.
      </p>
    </div>
  )
}
