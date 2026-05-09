import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import CampaignsClient from "./CampaignsClient"

export const dynamic = "force-dynamic"
export const metadata = { title: "Campaigns" }

/**
 * /admin/campaigns
 *
 * Single-page workflow for admins to:
 *   1. Enter weekly marketing spend by utm_source / utm_campaign.
 *   2. See per-campaign ROAS — spend → signups → paid users → revenue.
 *
 * Spend rows live in CampaignSpend; the ROAS table joins those against
 * User.firstUtmSource/firstUtmCampaign + Purchase.lifetimeRevenueCents.
 *
 * Why split from /admin/cfo: granular UTM-level data is too much for
 * the Monday-morning view; this page is the per-channel tactical drill
 * down. They link to each other.
 */
export default async function CampaignsPage() {
  const { userId, sessionClaims } = await auth()
  if (!userId) redirect("/sign-in")
  const role = (sessionClaims?.metadata as { role?: string })?.role
  if (!role || !["ADMIN", "SUPER_ADMIN"].includes(role)) {
    redirect("/portal/dashboard")
  }

  // Spend rows ordered by most-recent first.
  const spend = await db.campaignSpend.findMany({
    orderBy: [{ periodEnd: "desc" }, { periodStart: "desc" }],
    take: 200,
  })

  // Pull ALL users with their lifetime revenue + first-touch UTM. We
  // group in memory because the dataset is small (we expect <10K users
  // for a long time) and the UTM matching needs case-insensitive
  // comparison the DB layer doesn't easily express.
  const users = await db.user.findMany({
    where: { firstUtmSource: { not: null } },
    select: {
      id: true,
      firstUtmSource: true,
      firstUtmCampaign: true,
      purchases: {
        select: { lifetimeRevenueCents: true },
      },
    },
  })

  // Roll up per (utm_source, utm_campaign) — sum signups, paid users, revenue.
  type Row = {
    utmSource: string
    utmCampaign: string | null
    signups: number
    paidUsers: number
    revenueUsd: number
    spendUsd: number
    cacUsd: number | null
    roas: number | null
  }
  const rows = new Map<string, Row>()
  const key = (s: string, c: string | null) => `${s.toLowerCase()}::${(c ?? "").toLowerCase()}`

  for (const u of users) {
    const k = key(u.firstUtmSource ?? "unknown", u.firstUtmCampaign ?? null)
    if (!rows.has(k)) {
      rows.set(k, {
        utmSource: u.firstUtmSource ?? "unknown",
        utmCampaign: u.firstUtmCampaign ?? null,
        signups: 0,
        paidUsers: 0,
        revenueUsd: 0,
        spendUsd: 0,
        cacUsd: null,
        roas: null,
      })
    }
    const r = rows.get(k)!
    r.signups += 1
    const ltv = u.purchases.reduce((s, p) => s + (p.lifetimeRevenueCents ?? 0), 0)
    if (ltv > 0) r.paidUsers += 1
    r.revenueUsd += ltv / 100
  }

  // Layer spend on top.
  for (const s of spend) {
    const k = key(s.utmSource, s.utmCampaign)
    if (!rows.has(k)) {
      rows.set(k, {
        utmSource: s.utmSource,
        utmCampaign: s.utmCampaign,
        signups: 0,
        paidUsers: 0,
        revenueUsd: 0,
        spendUsd: 0,
        cacUsd: null,
        roas: null,
      })
    }
    const r = rows.get(k)!
    r.spendUsd += s.spendCents / 100
  }

  // Compute CAC + ROAS once everything is rolled up.
  const rolled = Array.from(rows.values()).map((r) => ({
    ...r,
    cacUsd: r.paidUsers > 0 && r.spendUsd > 0 ? r.spendUsd / r.paidUsers : null,
    roas: r.spendUsd > 0 ? r.revenueUsd / r.spendUsd : null,
  }))
  rolled.sort((a, b) => b.revenueUsd - a.revenueUsd)

  return (
    <div className="space-y-8 max-w-[1400px]">
      <header className="flex flex-wrap items-end justify-between gap-4 pb-4 border-b border-border">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Campaigns
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Per-UTM ROAS — log weekly spend below, see how each channel converted to paid revenue.
          </p>
        </div>
        <a href="/admin/cfo" className="text-xs text-primary hover:underline">
          ← Back to CFO dashboard
        </a>
      </header>

      <CampaignsClient
        rolled={rolled}
        spendRows={spend.map((s) => ({
          id: s.id,
          utmSource: s.utmSource,
          utmMedium: s.utmMedium,
          utmCampaign: s.utmCampaign,
          periodStart: s.periodStart.toISOString(),
          periodEnd: s.periodEnd.toISOString(),
          spendUsd: s.spendCents / 100,
          channel: s.channel,
          notes: s.notes,
        }))}
      />
    </div>
  )
}
