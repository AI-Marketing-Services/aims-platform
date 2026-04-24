import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { Users, DollarSign, TrendingUp, Gift, Globe2, ExternalLink } from "lucide-react"
import Link from "next/link"
import { getDubClient } from "@/lib/dub"

export const metadata = { title: "Partner Dashboard" }

export default async function ResellerDashboardPage() {
  const { userId } = await auth()
  if (!userId) redirect("/sign-in")

  const dbUser = await db.user.findUnique({
    where: { clerkId: userId },
    include: { operatorSite: { select: { subdomain: true, isPublished: true, customDomain: true } } },
  })
  if (!dbUser) redirect("/sign-in")

  const referral = await db.referral.findFirst({
    where: { referrerId: dbUser.id },
  })

  // Whitelabel attribution — every Deal whose referringResellerId points
  // to this user (cookie-attributed or form-attributed).
  const attributedDeals = await db.deal.findMany({
    where: { referringResellerId: dbUser.id },
    orderBy: { createdAt: "desc" },
    take: 10,
    select: {
      id: true,
      contactName: true,
      contactEmail: true,
      company: true,
      stage: true,
      leadScoreTier: true,
      value: true,
      source: true,
      createdAt: true,
    },
  })

  const attributionStats = await db.deal.groupBy({
    by: ["stage"],
    where: { referringResellerId: dbUser.id },
    _count: { _all: true },
    _sum: { value: true },
  })
  const totalAttributed = attributionStats.reduce((s, g) => s + g._count._all, 0)
  const attributedByStage = Object.fromEntries(attributionStats.map((g) => [g.stage, g._count._all]))
  const wonCount =
    (attributedByStage.MEMBER_JOINED ?? 0) + (attributedByStage.CONSULT_COMPLETED ?? 0)

  const conversionRate = referral && referral.clicks > 0
    ? Math.round((referral.conversions / referral.clicks) * 100)
    : 0

  // Resolve Dub.co short link or fall back to legacy
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.aioperatorcollective.com"
  let refLink = referral
    ? `${baseUrl}/for/${referral.landingPageSlug ?? referral.code}?ref=${referral.code}`
    : ""
  const dub = await getDubClient()
  if (dub && referral?.dubPartnerId) {
    try {
      const links = await dub.partners.retrieveLinks({ partnerId: referral.dubPartnerId })
      if (links.length > 0) refLink = links[0].shortLink
    } catch {
      // keep legacy link
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Partner Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Your referral performance and commission overview
        </p>
      </div>

      {/* Referral link */}
      {referral && (
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wider">Your Referral Link</p>
          <div className="flex items-center gap-3">
            <code className="flex-1 text-sm font-mono text-[#981B1B] bg-muted px-3 py-2 rounded-lg overflow-x-auto">
              {refLink}
            </code>
            <Link
              href="/reseller/resources"
              className="px-4 py-2 bg-[#981B1B] text-white text-sm font-medium rounded-lg hover:bg-[#791515] transition-colors whitespace-nowrap"
            >
              Copy &amp; Share
            </Link>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 stagger-in">
        {[
          { label: "Total Clicks", value: referral?.clicks ?? 0, icon: TrendingUp },
          { label: "Signups", value: referral?.signups ?? 0, icon: Users },
          { label: "Conversions", value: referral?.conversions ?? 0, icon: Gift },
          { label: "Total Earned", value: `$${(referral?.totalEarned ?? 0).toLocaleString()}`, icon: DollarSign, isMoney: true },
        ].map(({ label, value, icon: Icon, isMoney }) => (
          <div key={label} className="rounded-xl border border-border bg-card p-5 micro-card">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-muted-foreground">{label}</p>
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-muted">
                <Icon className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
            </div>
            <p className="text-xl font-bold text-foreground font-mono">{value}</p>
            {label === "Conversions" && referral && (
              <p className="text-xs text-muted-foreground mt-1">{conversionRate}% conversion</p>
            )}
          </div>
        ))}
      </div>

      {/* Pending payout */}
      {referral && referral.pendingPayout > 0 && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-foreground">Pending Payout</p>
            <p className="text-2xl font-bold text-emerald-700 font-mono mt-1">
              ${referral.pendingPayout.toLocaleString()}
            </p>
          </div>
          <Link
            href="/reseller/commissions"
            className="px-4 py-2 bg-emerald-100 border border-emerald-200 text-emerald-700 text-sm font-medium rounded-lg hover:bg-emerald-100/70 transition-colors"
          >
            View Details
          </Link>
        </div>
      )}

      {/* No referral state */}
      {!referral && (
        <div className="rounded-xl border border-border bg-card p-8 text-center">
          <Gift className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm font-medium text-foreground">No referral account set up</p>
          <p className="text-xs text-muted-foreground mt-1">Contact your account manager to activate your partner account.</p>
        </div>
      )}

      {/* Whitelabel attribution */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Globe2 className="h-4 w-4 text-primary" />
            <h2 className="text-base font-semibold text-foreground">Whitelabel Leads</h2>
          </div>
          {dbUser.operatorSite?.isPublished && (
            <a
              href={dbUser.operatorSite.customDomain
                ? `https://${dbUser.operatorSite.customDomain}`
                : `https://${dbUser.operatorSite.subdomain}.aioperatorcollective.com`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
            >
              View my site <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>

        {!dbUser.operatorSite && (
          <div className="rounded-xl border border-border bg-card p-8 text-center">
            <Globe2 className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm font-medium text-foreground">No whitelabel site yet</p>
            <p className="text-xs text-muted-foreground mt-1 mb-4">
              Set up your branded tenant page to start capturing attributed leads.
            </p>
            <Link
              href="/reseller/settings/domain"
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors"
            >
              Configure site
            </Link>
          </div>
        )}

        {dbUser.operatorSite && dbUser.operatorSite.isPublished === false && (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-5">
            <p className="text-sm font-semibold text-foreground">Your site is in draft</p>
            <p className="text-xs text-muted-foreground mt-1">
              Publish it from the Domain settings page to start capturing leads.
            </p>
            <Link
              href="/reseller/settings/domain"
              className="inline-block mt-3 px-3 py-1.5 bg-primary text-white text-xs font-medium rounded hover:bg-primary/90 transition-colors"
            >
              Go to Domain settings
            </Link>
          </div>
        )}

        {dbUser.operatorSite?.isPublished && (
          <>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-4">
              <StatBlock label="Total attributed" value={totalAttributed} />
              <StatBlock label="Applications" value={attributedByStage.APPLICATION_SUBMITTED ?? 0} />
              <StatBlock label="Consults booked" value={attributedByStage.CONSULT_BOOKED ?? 0} />
              <StatBlock label="Closed won" value={wonCount} tone={wonCount > 0 ? "good" : "neutral"} />
            </div>

            {attributedDeals.length === 0 ? (
              <div className="rounded-xl border border-border bg-card p-6 text-center">
                <p className="text-sm text-muted-foreground">
                  No attributed leads yet. Share your site — every visitor gets a 30-day attribution cookie.
                </p>
              </div>
            ) : (
              <div className="rounded-xl border border-border bg-card overflow-hidden">
                <div className="px-5 py-3 border-b border-border bg-muted/20">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Recent Attributed Leads</p>
                </div>
                <table className="w-full text-sm">
                  <thead className="text-left text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                    <tr>
                      <th className="px-5 py-2">Contact</th>
                      <th className="px-5 py-2">Source</th>
                      <th className="px-5 py-2">Stage</th>
                      <th className="px-5 py-2 text-right">When</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {attributedDeals.map((d) => (
                      <tr key={d.id}>
                        <td className="px-5 py-3">
                          <div className="font-medium text-foreground">{d.contactName}</div>
                          <div className="text-xs text-muted-foreground">
                            {d.company ? `${d.company} · ` : ""}{d.contactEmail}
                          </div>
                        </td>
                        <td className="px-5 py-3 text-xs text-muted-foreground">{d.source ?? "—"}</td>
                        <td className="px-5 py-3">
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-medium bg-muted text-foreground">
                            {d.stage.replace(/_/g, " ")}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-right text-xs text-muted-foreground">
                          {new Date(d.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function StatBlock({
  label,
  value,
  tone = "neutral",
}: {
  label: string
  value: number
  tone?: "good" | "neutral"
}) {
  const toneCls = tone === "good" ? "text-emerald-700" : "text-foreground"
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`text-xl font-bold ${toneCls} font-mono mt-1`}>{value}</p>
    </div>
  )
}
