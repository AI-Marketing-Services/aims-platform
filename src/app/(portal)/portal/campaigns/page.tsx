import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { getWorkspaceDashboard } from "@/lib/emailbison"
import {
  Mail,
  TrendingUp,
  MessageSquare,
  Users,
  ArrowRight,
  BarChart3,
} from "lucide-react"

export const metadata = { title: "Campaigns" }

export default async function CampaignsPage() {
  const { userId } = await auth()
  if (!userId) redirect("/sign-in")

  const dbUser = await db.user.findUnique({
    where: { clerkId: userId },
    include: { emailBisonConnection: true },
  })
  if (!dbUser) redirect("/sign-in")

  const ebConnection = dbUser.emailBisonConnection

  // If no Email Bison connection, show the preview/upsell state
  if (!ebConnection) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Campaigns</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track performance across your active outbound and reactivation campaigns.
          </p>
        </div>

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
          {[
            { label: "Emails Sent", icon: Mail },
            { label: "People Contacted", icon: Users },
            { label: "Reply Rate", icon: MessageSquare },
            { label: "Bounce Rate", icon: TrendingUp },
          ].map(({ label, icon: Icon }) => (
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
                  <p className="text-xs text-muted-foreground mt-0.5">Custom pricing</p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-[#DC2626] transition-colors flex-shrink-0" />
              </a>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Fetch real campaign data from Email Bison
  let dashboard: Awaited<ReturnType<typeof getWorkspaceDashboard>> | null = null
  let fetchError: string | null = null

  try {
    dashboard = await getWorkspaceDashboard(ebConnection.workspaceId)
  } catch (err) {
    console.error("Failed to fetch Email Bison dashboard:", err)
    fetchError = "Failed to load campaign data. Please try again later."
  }

  const totals = dashboard?.totals ?? { emailsSent: 0, peopleContacted: 0, replies: 0, bounced: 0, totalLeads: 0 }
  const replyRate = dashboard?.replyRate ?? "0"
  const bounceRate = dashboard?.bounceRate ?? "0"
  const campaigns = dashboard?.campaigns ?? []

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Campaigns</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Live data from <span className="font-medium text-foreground">{ebConnection.workspaceName}</span> workspace.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-green-200 bg-green-50 px-3 py-1.5">
          <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-xs font-medium text-green-700">Connected</span>
        </div>
      </div>

      {fetchError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {fetchError}
        </div>
      )}

      {/* Metric cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-muted-foreground">Emails Sent</p>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-50">
              <Mail className="h-3.5 w-3.5 text-[#DC2626]" />
            </div>
          </div>
          <p className="text-2xl font-bold text-foreground font-mono">
            {totals.emailsSent.toLocaleString()}
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-muted-foreground">People Contacted</p>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50">
              <Users className="h-3.5 w-3.5 text-blue-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-foreground font-mono">
            {totals.peopleContacted.toLocaleString()}
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-muted-foreground">Reply Rate</p>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-green-50">
              <MessageSquare className="h-3.5 w-3.5 text-green-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-foreground font-mono">
            {replyRate}%
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {totals.replies.toLocaleString()} replies
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-muted-foreground">Bounce Rate</p>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-50">
              <TrendingUp className="h-3.5 w-3.5 text-orange-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-foreground font-mono">
            {bounceRate}%
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {totals.bounced.toLocaleString()} bounced
          </p>
        </div>
      </div>

      {/* Campaign table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold text-foreground">Campaigns</h2>
            <span className="text-xs text-muted-foreground">({campaigns.length})</span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Campaign</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">Leads</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">Sent</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">Replies</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">Bounced</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Progress</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-sm italic text-muted-foreground">
                    No campaigns found in this workspace.
                  </td>
                </tr>
              )}
              {campaigns.map((campaign) => {
                const replyPct = campaign.total_leads_contacted > 0
                  ? ((campaign.unique_replies / campaign.total_leads_contacted) * 100).toFixed(1)
                  : "0"
                return (
                  <tr
                    key={campaign.id}
                    className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground">{campaign.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {campaign.max_emails_per_day > 0 ? `${campaign.max_emails_per_day}/day limit` : ""}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${
                        campaign.status === "active" || campaign.status === "running"
                          ? "border-green-200 bg-green-50 text-green-700"
                          : campaign.status === "paused"
                          ? "border-yellow-200 bg-yellow-50 text-yellow-700"
                          : "border-gray-200 bg-gray-50 text-gray-600"
                      }`}>
                        {campaign.status === "active" || campaign.status === "running" ? (
                          <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                        ) : null}
                        {campaign.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-foreground">
                      {campaign.total_leads.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-foreground">
                      {campaign.emails_sent.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="font-mono text-foreground">{campaign.unique_replies}</span>
                      <span className="text-xs text-muted-foreground ml-1">({replyPct}%)</span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-muted-foreground">
                      {campaign.bounced}
                    </td>
                    <td className="px-4 py-3 w-32">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#DC2626] rounded-full transition-all"
                            style={{ width: `${Math.min(campaign.completion_percentage, 100)}%` }}
                          />
                        </div>
                        <span className="text-xs font-mono text-muted-foreground w-8 text-right">
                          {Math.round(campaign.completion_percentage)}%
                        </span>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Data from Email Bison &middot; {ebConnection.workspaceName} workspace &middot; Refreshes every 5 minutes
      </p>
    </div>
  )
}
