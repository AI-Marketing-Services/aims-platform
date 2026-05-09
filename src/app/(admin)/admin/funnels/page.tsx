import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"

export const dynamic = "force-dynamic"
export const metadata = { title: "Funnels" }

/**
 * /admin/funnels — page-view → signup → paid conversion funnel.
 *
 * Pulls the top 25 distinct landing paths from PageView (last 30 days)
 * and joins against User.firstLandingPath to compute downstream
 * conversion. This is the "where do our paying customers actually
 * come from on the site?" view — far more actionable than raw
 * pageview rankings because it weights by revenue, not eyeballs.
 *
 * Pure server-rendered table, no chart — the value is the columns.
 */
export default async function FunnelsPage() {
  const { userId, sessionClaims } = await auth()
  if (!userId) redirect("/sign-in")
  const role = (sessionClaims?.metadata as { role?: string })?.role
  if (!role || !["ADMIN", "SUPER_ADMIN"].includes(role)) {
    redirect("/portal/dashboard")
  }

  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400 * 1000)

  // Top landing pages by raw PageView volume. The `path` column is
  // already normalized (no querystring) by the PageView writer.
  const pageViews = await db.pageView.groupBy({
    by: ["path"],
    where: { createdAt: { gte: thirtyDaysAgo } },
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
    take: 25,
  })

  const paths = pageViews.map((p) => p.path)

  // For each path, count: signups whose firstLandingPath === path,
  // then paid users among those.
  const usersByPath = await db.user.findMany({
    where: { firstLandingPath: { in: paths } },
    select: {
      firstLandingPath: true,
      purchases: { select: { lifetimeRevenueCents: true } },
    },
  })

  type Row = {
    path: string
    pageViews: number
    signups: number
    paidUsers: number
    revenueUsd: number
    conversionRate: number
  }
  const rows = new Map<string, Row>()
  for (const p of pageViews) {
    rows.set(p.path, {
      path: p.path,
      pageViews: p._count.id,
      signups: 0,
      paidUsers: 0,
      revenueUsd: 0,
      conversionRate: 0,
    })
  }
  for (const u of usersByPath) {
    if (!u.firstLandingPath) continue
    const r = rows.get(u.firstLandingPath)
    if (!r) continue
    r.signups += 1
    const ltv = u.purchases.reduce((s, p) => s + (p.lifetimeRevenueCents ?? 0), 0)
    if (ltv > 0) r.paidUsers += 1
    r.revenueUsd += ltv / 100
  }

  const out = Array.from(rows.values())
    .map((r) => ({
      ...r,
      conversionRate: r.pageViews > 0 ? r.signups / r.pageViews : 0,
    }))
    .sort((a, b) => b.revenueUsd - a.revenueUsd || b.signups - a.signups)

  return (
    <div className="space-y-6 max-w-[1200px]">
      <header className="flex flex-wrap items-end justify-between gap-4 pb-4 border-b border-border">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Funnels</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Top 25 landing pages (last 30 days) → signups → paying customers.
          </p>
        </div>
        <a href="/admin/cfo" className="text-xs text-primary hover:underline">
          ← CFO dashboard
        </a>
      </header>

      <div className="rounded-md border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-muted-foreground text-xs uppercase tracking-wide">
            <tr>
              <th className="text-left px-3 py-2">Landing path</th>
              <th className="text-right px-3 py-2">Pageviews</th>
              <th className="text-right px-3 py-2">Signups</th>
              <th className="text-right px-3 py-2">PV → Signup</th>
              <th className="text-right px-3 py-2">Paid</th>
              <th className="text-right px-3 py-2">Revenue</th>
            </tr>
          </thead>
          <tbody>
            {out.map((r) => (
              <tr key={r.path} className="border-t border-border">
                <td className="px-3 py-2 font-mono text-xs">{r.path}</td>
                <td className="px-3 py-2 text-right">{r.pageViews}</td>
                <td className="px-3 py-2 text-right">{r.signups}</td>
                <td className="px-3 py-2 text-right">
                  {(r.conversionRate * 100).toFixed(2)}%
                </td>
                <td className="px-3 py-2 text-right">{r.paidUsers}</td>
                <td className="px-3 py-2 text-right">{fmtUsd(r.revenueUsd)}</td>
              </tr>
            ))}
            {out.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-3 py-8 text-center text-muted-foreground text-xs"
                >
                  No pageview data in the last 30 days.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-muted-foreground">
        Signups attribute to a path via <code>User.firstLandingPath</code>, set on
        first signup from the <code>aoc_first_touch</code> cookie. Pre-instrumentation
        users may be missing.
      </p>
    </div>
  )
}

function fmtUsd(n: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n)
}
