import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { DollarSign, Clock, CheckCircle2, TrendingUp } from "lucide-react"

export const metadata = { title: "Commissions" }

export default async function ResellerCommissionsPage() {
  const { userId } = await auth()
  if (!userId) redirect("/sign-in")

  const dbUser = await db.user.findUnique({ where: { clerkId: userId } })
  if (!dbUser) redirect("/sign-in")

  const referral = await db.referral.findFirst({
    where: { referrerId: dbUser.id },
  })

  const tier = referral?.tier ?? "AFFILIATE"
  const commissionRate = tier === "RESELLER" ? "25%" : tier === "COMMUNITY_PARTNER" ? "15%" : "10%"
  const nextTier = tier === "AFFILIATE" ? "COMMUNITY_PARTNER" : tier === "COMMUNITY_PARTNER" ? "RESELLER" : null

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Commissions</h1>
        <p className="text-sm text-muted-foreground mt-1">Your earnings, payout history, and commission tier</p>
      </div>

      {/* Tier card */}
      <div className="rounded-xl border border-[#DC2626]/20 bg-gradient-to-r from-[#DC2626]/10 to-[#DC2626]/5 p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold text-[#DC2626] uppercase tracking-wider mb-1">Your Tier</p>
            <p className="text-2xl font-bold text-foreground capitalize">{tier.replace(/_/g, " ")}</p>
            <p className="text-sm text-muted-foreground mt-1">
              Earn <span className="text-foreground font-semibold">{commissionRate}</span> on every client you refer
            </p>
          </div>
          {nextTier && (
            <div className="text-right">
              <p className="text-xs text-muted-foreground mb-1">Next tier</p>
              <p className="text-sm font-medium text-foreground capitalize">{nextTier.replace(/_/g, " ")}</p>
            </div>
          )}
        </div>
      </div>

      {/* Earnings summary */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Total Earned", value: `$${(referral?.totalEarned ?? 0).toLocaleString()}`, icon: DollarSign },
          { label: "Pending Payout", value: `$${(referral?.pendingPayout ?? 0).toLocaleString()}`, icon: Clock },
          { label: "Conversions", value: referral?.conversions ?? 0, icon: CheckCircle2 },
          { label: "Est. Monthly", value: `$${Math.round((referral?.totalEarned ?? 0) / 12)}/mo`, icon: TrendingUp },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-muted-foreground">{label}</p>
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-muted">
                <Icon className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
            </div>
            <p className="text-xl font-bold text-foreground font-mono">{value}</p>
          </div>
        ))}
      </div>

      {/* Payout info */}
      <div className="rounded-xl border border-border bg-card p-6">
        <h2 className="text-sm font-semibold text-foreground mb-4">Payout Information</h2>
        <div className="space-y-3 text-sm">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
            <p className="text-muted-foreground">Commissions are paid monthly, on the 15th of each month</p>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
            <p className="text-muted-foreground">Minimum payout threshold: $50</p>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
            <p className="text-muted-foreground">Payments via ACH or Stripe Connect</p>
          </div>
          {!referral?.stripeConnectId && (
            <div className="mt-4 rounded-lg border border-amber-300/30 bg-amber-50 p-4">
              <p className="text-sm text-amber-800 font-medium">Stripe Connect setup required for direct payouts</p>
              <p className="text-xs text-amber-700/80 mt-1">
                Once your account reaches the $50 minimum, our team will send you a Stripe Connect
                onboarding link. After connecting, payouts are processed automatically on the 15th of
                each month via ACH direct deposit. Until then, you can request a manual payout by
                emailing <a href="mailto:partners@aimseos.com" className="underline font-medium">partners@aimseos.com</a>.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
