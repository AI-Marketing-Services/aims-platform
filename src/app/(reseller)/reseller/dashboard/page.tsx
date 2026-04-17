import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { Users, DollarSign, TrendingUp, Gift } from "lucide-react"
import Link from "next/link"
import { getDubClient } from "@/lib/dub"

export const metadata = { title: "Partner Dashboard" }

export default async function ResellerDashboardPage() {
  const { userId } = await auth()
  if (!userId) redirect("/sign-in")

  const dbUser = await db.user.findUnique({ where: { clerkId: userId } })
  if (!dbUser) redirect("/sign-in")

  const referral = await db.referral.findFirst({
    where: { referrerId: dbUser.id },
  })

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
    </div>
  )
}
