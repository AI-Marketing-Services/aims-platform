import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"

export const dynamic = "force-dynamic"
export const metadata = { title: "Email performance" }

/**
 * /admin/email-performance — Resend webhook → EmailEvent rollup.
 *
 * Two views:
 *   1. By campaignTag — every Sequence / Drip / Newsletter rolled up
 *      with delivered, opened, clicked, bounced, complained.
 *   2. By templateKey — per-template performance (e.g. how does
 *      `aoc.post-booking-education.day-1` open vs. click?).
 *
 * Powers the "is our send infrastructure healthy?" question + the
 * "which subject lines are working?" question. Open + click rates
 * are the standard CTRs; bounce + complaint rates are the
 * deliverability-health signals.
 */
export default async function EmailPerformancePage() {
  const { userId, sessionClaims } = await auth()
  if (!userId) redirect("/sign-in")
  const role = (sessionClaims?.metadata as { role?: string })?.role
  if (!role || !["ADMIN", "SUPER_ADMIN"].includes(role)) {
    redirect("/portal/dashboard")
  }

  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400 * 1000)

  const events = await db.emailEvent.findMany({
    where: { occurredAt: { gte: thirtyDaysAgo } },
    select: {
      eventType: true,
      campaignTag: true,
      templateKey: true,
    },
    take: 50_000, // soft cap — rollups break beyond this anyway
  })

  // Roll into two pivot tables.
  type Stats = {
    delivered: number
    opened: number
    clicked: number
    bounced: number
    complained: number
  }
  function emptyStats(): Stats {
    return { delivered: 0, opened: 0, clicked: 0, bounced: 0, complained: 0 }
  }

  const byCampaign = new Map<string, Stats>()
  const byTemplate = new Map<string, Stats>()
  for (const e of events) {
    const ck = e.campaignTag ?? "(untagged)"
    const tk = e.templateKey ?? "(no template)"
    if (!byCampaign.has(ck)) byCampaign.set(ck, emptyStats())
    if (!byTemplate.has(tk)) byTemplate.set(tk, emptyStats())
    bumpStat(byCampaign.get(ck)!, e.eventType)
    bumpStat(byTemplate.get(tk)!, e.eventType)
  }

  const campaignRows = Array.from(byCampaign.entries())
    .map(([k, s]) => ({ key: k, ...s }))
    .sort((a, b) => b.delivered - a.delivered)
  const templateRows = Array.from(byTemplate.entries())
    .map(([k, s]) => ({ key: k, ...s }))
    .sort((a, b) => b.delivered - a.delivered)

  return (
    <div className="space-y-8 max-w-[1400px]">
      <header className="flex flex-wrap items-end justify-between gap-4 pb-4 border-b border-border">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Email performance
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Last 30 days · Resend webhook → EmailEvent. Open + click rates are computed
            against delivered, not sent.
          </p>
        </div>
        <a href="/admin/cfo" className="text-xs text-primary hover:underline">
          ← CFO dashboard
        </a>
      </header>

      <Section title="By campaign tag" rows={campaignRows} />
      <Section title="By template key" rows={templateRows} />

      <p className="text-xs text-muted-foreground">
        EmailEvent rows are written by <code>/api/webhooks/resend</code>; configure
        Resend to point at it and set <code>RESEND_WEBHOOK_SECRET</code>.
      </p>
    </div>
  )
}

function bumpStat(s: Record<string, number>, type: string) {
  if (type === "delivered") s.delivered++
  else if (type === "opened") s.opened++
  else if (type === "clicked") s.clicked++
  else if (type === "bounced") s.bounced++
  else if (type === "complained") s.complained++
}

function Section({
  title,
  rows,
}: {
  title: string
  rows: Array<{
    key: string
    delivered: number
    opened: number
    clicked: number
    bounced: number
    complained: number
  }>
}) {
  return (
    <section className="space-y-2">
      <h2 className="text-sm font-semibold">{title}</h2>
      <div className="rounded-md border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-muted-foreground text-xs uppercase tracking-wide">
            <tr>
              <th className="text-left px-3 py-2">Key</th>
              <th className="text-right px-3 py-2">Delivered</th>
              <th className="text-right px-3 py-2">Opened</th>
              <th className="text-right px-3 py-2">Open %</th>
              <th className="text-right px-3 py-2">Clicked</th>
              <th className="text-right px-3 py-2">CTR %</th>
              <th className="text-right px-3 py-2">Bounce</th>
              <th className="text-right px-3 py-2">Spam</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-3 py-6 text-center text-muted-foreground text-xs">
                  No events in the last 30 days for this slice.
                </td>
              </tr>
            ) : (
              rows.map((r) => {
                const openRate = r.delivered > 0 ? (r.opened / r.delivered) * 100 : 0
                const ctr = r.delivered > 0 ? (r.clicked / r.delivered) * 100 : 0
                return (
                  <tr key={r.key} className="border-t border-border">
                    <td className="px-3 py-2 font-mono text-xs">{r.key}</td>
                    <td className="px-3 py-2 text-right">{r.delivered}</td>
                    <td className="px-3 py-2 text-right">{r.opened}</td>
                    <td className="px-3 py-2 text-right">{openRate.toFixed(1)}%</td>
                    <td className="px-3 py-2 text-right">{r.clicked}</td>
                    <td className="px-3 py-2 text-right">{ctr.toFixed(1)}%</td>
                    <td className="px-3 py-2 text-right">{r.bounced}</td>
                    <td className="px-3 py-2 text-right">{r.complained}</td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}
