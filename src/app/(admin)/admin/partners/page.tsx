import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { Users, DollarSign, TrendingUp, UserPlus } from "lucide-react"
import { PartnersTable, type PartnerRow } from "@/components/admin/PartnersTable"
import { getTierLabel } from "@/lib/referrals/commission-config"

export const metadata = { title: "Partners" }

export default async function AdminPartnersPage() {
  const { userId, sessionClaims } = await auth()
  if (!userId) redirect("/sign-in")
  const role = (sessionClaims?.metadata as { role?: string })?.role
  if (!role || !["ADMIN", "SUPER_ADMIN"].includes(role)) redirect("/portal/dashboard")

  const referrals = await db.referral.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      referrer: {
        select: { id: true, name: true, email: true, company: true },
      },
      _count: { select: { commissions: true } },
    },
  })

  const totalPartners = referrals.length
  const totalEarned = referrals.reduce((sum, r) => sum + r.totalEarned, 0)
  const totalPending = referrals.reduce((sum, r) => sum + r.pendingPayout, 0)
  const dubConnected = referrals.filter((r) => !!r.dubPartnerId).length

  const rows: PartnerRow[] = referrals.map((r) => ({
    id: r.id,
    referrerId: r.referrerId,
    code: r.code,
    tier: r.tier,
    tierLabel: getTierLabel(r.tier),
    clicks: r.clicks,
    signups: r.signups,
    conversions: r.conversions,
    totalEarned: r.totalEarned,
    pendingPayout: r.pendingPayout,
    dubPartnerId: r.dubPartnerId,
    commissionCount: r._count.commissions,
    createdAt: r.createdAt.toISOString(),
    referrer: {
      name: r.referrer.name,
      email: r.referrer.email,
      company: r.referrer.company,
    },
  }))

  const fmt = (n: number) =>
    n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 })

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Partner Management</h1>
        <p className="text-sm text-muted-foreground mt-1">
          All referral partners, their tiers, performance, and Dub.co connection status.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 stagger-in">
        {[
          { label: "Total Partners", value: totalPartners, icon: Users, tone: "text-blue-400 bg-blue-500/10" },
          { label: "Total Earned (all)", value: fmt(totalEarned), icon: DollarSign, tone: "text-green-400 bg-green-500/10" },
          { label: "Pending Payouts", value: fmt(totalPending), icon: TrendingUp, tone: "text-amber-400 bg-amber-500/10" },
          { label: "Dub.co Connected", value: `${dubConnected} / ${totalPartners}`, icon: UserPlus, tone: "text-purple-400 bg-purple-500/10" },
        ].map(({ label, value, icon: Icon, tone }) => (
          <div key={label} className="rounded-xl border border-border bg-card p-5 micro-card">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-muted-foreground">{label}</p>
              <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${tone}`}>
                <Icon className="h-3.5 w-3.5" />
              </div>
            </div>
            <p className="text-xl font-bold text-foreground font-mono">{value}</p>
          </div>
        ))}
      </div>

      <PartnersTable rows={rows} />

      {rows.length === 0 && (
        <div className="rounded-xl border border-border bg-card p-8 text-center">
          <Users className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
          <p className="text-sm text-foreground font-medium">No partners yet</p>
          <p className="text-xs text-muted-foreground mt-1">
            Partners are created when users register via /api/partners/register or share referral links.
          </p>
        </div>
      )}
    </div>
  )
}
