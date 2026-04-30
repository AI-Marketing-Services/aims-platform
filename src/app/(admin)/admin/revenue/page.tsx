import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { RevenueCharts } from "./RevenueChart"

export const dynamic = "force-dynamic"

export const metadata = { title: "Revenue" }

const MRR_TARGET = 100_000

export default async function AdminRevenuePage() {
  const { userId, sessionClaims } = await auth()
  if (!userId) redirect("/sign-in")
  const role = (sessionClaims?.metadata as { role?: string })?.role
  if (!role || !["ADMIN", "SUPER_ADMIN"].includes(role)) redirect("/portal/dashboard")

  // Fire all three independent queries in parallel
  const [subsResult, serviceArmsResult, dealsResult] = await Promise.allSettled([
    db.subscription.findMany({
      where: { status: { in: ["ACTIVE", "TRIALING"] } },
      select: {
        monthlyAmount: true,
        createdAt: true,
        serviceArm: { select: { slug: true, name: true } },
      },
    }),
    db.serviceArm.findMany({
      select: { slug: true, name: true, deliveryCost: true },
    }),
    db.deal.findMany({
      where: { stage: "MEMBER_JOINED" },
      select: { channelTag: true },
    }),
  ])

  const activeSubs = subsResult.status === "fulfilled" ? subsResult.value : []
  const serviceArms = serviceArmsResult.status === "fulfilled" ? serviceArmsResult.value : []
  const serviceCostMap = new Map(serviceArms.map(s => [s.slug, { label: s.name, cost: s.deliveryCost ?? 0 }]))
  const activeDeals = dealsResult.status === "fulfilled" ? dealsResult.value : []

  // ── Compute current MRR ────────────────────────────────────────────────────
  const currentMRR = activeSubs.reduce((s, sub) => s + sub.monthlyAmount, 0)
  const arr = currentMRR * 12
  const mrrProgress = Math.min(100, (currentMRR / MRR_TARGET) * 100)

  // ── MRR over time: group by YYYY-MM ───────────────────────────────────────
  const mrrByMonth: Record<string, number> = {}
  for (const sub of activeSubs) {
    const key = sub.createdAt.toISOString().slice(0, 7) // "2024-12"
    mrrByMonth[key] = (mrrByMonth[key] ?? 0) + sub.monthlyAmount
  }
  // Build running cumulative MRR per month
  const sortedMonthKeys = Object.keys(mrrByMonth).sort()
  let running = 0
  const mrrOverTime = sortedMonthKeys.map((k) => {
    running += mrrByMonth[k]
    const [year, month] = k.split("-")
    const label = new Date(Number(year), Number(month) - 1).toLocaleString("en-US", {
      month: "short",
      year: "2-digit",
    })
    return { month: label, mrr: running }
  })

  // ── Revenue by service arm ─────────────────────────────────────────────────
  const byService: Record<string, { name: string; revenue: number }> = {}
  for (const sub of activeSubs) {
    const slug = sub.serviceArm.slug
    if (!byService[slug]) byService[slug] = { name: sub.serviceArm.name, revenue: 0 }
    byService[slug].revenue += sub.monthlyAmount
  }
  const revenueByService = Object.entries(byService)
    .map(([slug, v]) => ({ slug, name: v.name, revenue: v.revenue }))
    .sort((a, b) => b.revenue - a.revenue)

  // ── Revenue by channel tag ─────────────────────────────────────────────────
  const byChannel: Record<string, number> = {}
  for (const deal of activeDeals) {
    const ch = deal.channelTag ?? "Direct"
    byChannel[ch] = (byChannel[ch] ?? 0) + 1
  }
  const revenueByChannel = Object.entries(byChannel).map(([name, value]) => ({ name, value }))

  // ── 10x Margin tracker ────────────────────────────────────────────────────
  const marginRows = revenueByService
    .filter((s) => serviceCostMap.has(s.slug) && (serviceCostMap.get(s.slug)?.cost ?? 0) > 0)
    .map((s) => {
      const cost = serviceCostMap.get(s.slug)!.cost
      const margin = s.revenue > 0 ? s.revenue / cost : 0
      return {
        slug: s.slug,
        label: serviceCostMap.get(s.slug)!.label,
        revenue: s.revenue,
        cost,
        margin,
      }
    })

  return (
    <div className="max-w-6xl">
      {/* ── MRR Hero ──────────────────────────────────────────────────────── */}
      <div className="bg-card border border-border rounded-2xl p-8 mb-8">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-4">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Monthly Recurring Revenue</p>
            <p className="text-3xl sm:text-5xl font-mono font-bold text-foreground">
              ${currentMRR.toLocaleString()}
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              ARR projection:{" "}
              <span className="text-foreground font-mono font-semibold">
                ${arr.toLocaleString()}
              </span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground mb-1">Target: $100,000/mo</p>
            <p className="text-2xl font-mono font-bold text-[#981B1B]">
              {mrrProgress.toFixed(1)}%
            </p>
          </div>
        </div>
        {/* Progress bar */}
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-2 bg-[#981B1B] rounded-full transition-all"
            style={{ width: `${mrrProgress}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          ${(MRR_TARGET - currentMRR).toLocaleString()} remaining to target
        </p>
      </div>

      {/* ── Charts ────────────────────────────────────────────────────────── */}
      <RevenueCharts
        mrrOverTime={mrrOverTime}
        revenueByService={revenueByService}
        revenueByChannel={revenueByChannel}
      />

      {/* ── 10x Margin Tracker ────────────────────────────────────────────── */}
      <div className="bg-card border border-border rounded-xl p-6 mt-8">
        <h3 className="font-semibold text-foreground mb-1">10x Margin Tracker</h3>
        <p className="text-xs text-muted-foreground mb-5">
          Service revenue vs estimated delivery cost. Green = 10x+, Yellow = 5-10x, Red = below 5x.
        </p>
        {marginRows.length === 0 ? (
          <p className="text-muted-foreground text-sm">No matched service data yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  {["Service", "Revenue", "Est. Cost", "Margin", "Multiple"].map((h) => (
                    <th key={h} className="text-left text-xs text-muted-foreground font-medium px-3 py-2">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {marginRows.map((row) => {
                  const bg =
                    row.margin >= 10
                      ? "bg-emerald-50"
                      : row.margin >= 5
                      ? "bg-primary/5"
                      : "bg-primary/10"
                  const multipleColor =
                    row.margin >= 10
                      ? "text-emerald-700"
                      : row.margin >= 5
                      ? "text-primary/70"
                      : "text-primary"
                  return (
                    <tr key={row.slug} className={bg}>
                      <td className="px-3 py-3 text-foreground font-medium">{row.label}</td>
                      <td className="px-3 py-3 font-mono text-foreground">
                        ${row.revenue.toLocaleString()}/mo
                      </td>
                      <td className="px-3 py-3 font-mono text-muted-foreground">
                        ${row.cost}/mo
                      </td>
                      <td className="px-3 py-3 font-mono text-foreground">
                        {row.revenue > 0
                          ? `${((row.revenue - row.cost) / row.revenue * 100).toFixed(0)}%`
                          : "-"}
                      </td>
                      <td className={`px-3 py-3 font-mono font-bold ${multipleColor}`}>
                        {row.revenue > 0 ? `${row.margin.toFixed(1)}x` : "-"}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Services not yet in the tracker */}
        {Array.from(serviceCostMap.entries())
          .filter(([slug, { cost }]) => cost > 0 && !marginRows.find((r) => r.slug === slug))
          .length > 0 && (
          <div className="mt-4 pt-4 border-t border-border">
            <p className="text-xs text-muted-foreground mb-2">Services with no active subscriptions:</p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <tbody className="divide-y divide-border">
                  {Array.from(serviceCostMap.entries())
                    .filter(([slug, { cost }]) => cost > 0 && !marginRows.find((r) => r.slug === slug))
                    .map(([slug, { label, cost }]) => (
                      <tr key={slug} className="bg-deep">
                        <td className="px-3 py-2 text-muted-foreground">{label}</td>
                        <td className="px-3 py-2 font-mono text-muted-foreground">$0/mo</td>
                        <td className="px-3 py-2 font-mono text-muted-foreground">${cost}/mo</td>
                        <td className="px-3 py-2 text-muted-foreground">-</td>
                        <td className="px-3 py-2 text-muted-foreground">-</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
