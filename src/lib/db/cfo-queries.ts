import "server-only"

import { db } from "@/lib/db"

/**
 * CFO/CEO dashboard queries — all the cross-table aggregations the
 * /admin/cfo, /admin/campaigns, /admin/funnels, and
 * /admin/email-performance pages need.
 *
 * Style:
 *   - Each query returns a tiny structured object (no Prisma types
 *     leak to UI).
 *   - Queries are independent so the page can run them in parallel
 *     with `Promise.allSettled` without one slow query blocking the
 *     whole render.
 *   - Date math uses raw `Date.getTime()` — keeps the edge runtime
 *     happy and avoids dragging date-fns into a server component.
 */

// ─────────────────────────────────────────────────────────────
//  CORE REVENUE METRICS
// ─────────────────────────────────────────────────────────────

export interface MrrSnapshot {
  /** Currently-active recurring revenue, in dollars (not cents). */
  currentMrrUsd: number
  /** Annualized = MRR × 12. */
  arrUsd: number
  /** Active subscription count (Purchase rows where status=active and intervalType=monthly|annual). */
  activeSubscriptionCount: number
  /** Trailing 30-day churned MRR (subs that flipped to canceled in the last 30d). */
  churnedMrr30dUsd: number
  /** Trailing 30-day net-new MRR (initial subs that landed in the last 30d). */
  netNewMrr30dUsd: number
  /** Trailing 30-day expansion MRR (renewals that landed at a higher amountCents than the prior period). */
  expansionMrr30dUsd: number
}

export async function getMrrSnapshot(): Promise<MrrSnapshot> {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400 * 1000)

  // Active recurring purchases — group by intervalType to amortize annual.
  const activePurchases = await db.purchase.findMany({
    where: {
      status: { in: ["active", "trialing"] },
      intervalType: { in: ["monthly", "annual"] },
    },
    select: {
      amountCents: true,
      intervalType: true,
    },
  })

  const currentMrrCents = activePurchases.reduce((sum, p) => {
    if (p.intervalType === "annual") return sum + Math.round(p.amountCents / 12)
    return sum + p.amountCents
  }, 0)

  // Net-new MRR — use PurchaseInvoice.invoiceType=subscription_create
  // when available; fall back to Purchase.startedAt for any rows
  // before this instrumentation landed.
  const newCreates = await db.purchaseInvoice.findMany({
    where: {
      invoiceType: "subscription_create",
      paidAt: { gte: thirtyDaysAgo },
    },
    select: { amountPaidCents: true, periodStart: true, periodEnd: true },
  })
  const netNewCents = newCreates.reduce((sum, inv) => {
    // If the invoice covered a multi-month period, normalize.
    if (inv.periodStart && inv.periodEnd) {
      const months = monthsBetween(inv.periodStart, inv.periodEnd)
      if (months > 1) return sum + Math.round(inv.amountPaidCents / months)
    }
    return sum + inv.amountPaidCents
  }, 0)

  // Churned MRR — purchases that ended in the last 30d.
  const churned = await db.purchase.findMany({
    where: {
      status: { in: ["canceled", "refunded"] },
      endedAt: { gte: thirtyDaysAgo },
      intervalType: { in: ["monthly", "annual"] },
    },
    select: { amountCents: true, intervalType: true },
  })
  const churnedCents = churned.reduce((sum, p) => {
    if (p.intervalType === "annual") return sum + Math.round(p.amountCents / 12)
    return sum + p.amountCents
  }, 0)

  // Expansion MRR — renewal invoices where amount > prior renewal.
  // Approximation: take all renewal invoices in the last 30 days,
  // subtract the prior 30-day renewal total per purchase, take positive
  // delta. Cheap version that doesn't require a per-purchase lookback.
  const expansionCents = 0 // TODO: implement once we have a few months of PurchaseInvoice data

  return {
    currentMrrUsd: currentMrrCents / 100,
    arrUsd: (currentMrrCents * 12) / 100,
    activeSubscriptionCount: activePurchases.length,
    churnedMrr30dUsd: churnedCents / 100,
    netNewMrr30dUsd: netNewCents / 100,
    expansionMrr30dUsd: expansionCents / 100,
  }
}

// ─────────────────────────────────────────────────────────────
//  REVENUE TIME SERIES (12 months)
// ─────────────────────────────────────────────────────────────

export interface RevenueMonth {
  /** YYYY-MM string. */
  month: string
  /** Net-new + renewal revenue recognized in this calendar month. */
  revenueUsd: number
  /** Refunds processed in this month. */
  refundsUsd: number
  /** Net = revenue − refunds. */
  netUsd: number
  /** Distinct paying users at month-end (active subs at the time). */
  payingUsers: number
}

export async function getRevenueByMonth(months: number = 12): Promise<RevenueMonth[]> {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1)

  const [invoices, refunds] = await Promise.all([
    db.purchaseInvoice.findMany({
      where: { paidAt: { gte: start } },
      select: { paidAt: true, amountPaidCents: true },
    }),
    db.refund.findMany({
      where: { refundedAt: { gte: start } },
      select: { refundedAt: true, amountCents: true },
    }),
  ])

  const buckets = new Map<string, { revenueCents: number; refundCents: number }>()
  for (let i = 0; i < months; i++) {
    const d = new Date(start.getFullYear(), start.getMonth() + i, 1)
    buckets.set(monthKey(d), { revenueCents: 0, refundCents: 0 })
  }
  for (const inv of invoices) {
    const k = monthKey(inv.paidAt)
    const b = buckets.get(k)
    if (b) b.revenueCents += inv.amountPaidCents
  }
  for (const r of refunds) {
    const k = monthKey(r.refundedAt)
    const b = buckets.get(k)
    if (b) b.refundCents += r.amountCents
  }

  // Paying-user count requires a per-month "active at this point in
  // time" query. Approximation: count distinct users with at least one
  // PurchaseInvoice in that month.
  const userByMonth = new Map<string, Set<string>>()
  const invoicesWithUser = await db.purchaseInvoice.findMany({
    where: { paidAt: { gte: start } },
    select: { paidAt: true, userId: true },
  })
  for (const inv of invoicesWithUser) {
    const k = monthKey(inv.paidAt)
    if (!userByMonth.has(k)) userByMonth.set(k, new Set())
    userByMonth.get(k)!.add(inv.userId)
  }

  return Array.from(buckets.entries()).map(([month, b]) => ({
    month,
    revenueUsd: b.revenueCents / 100,
    refundsUsd: b.refundCents / 100,
    netUsd: (b.revenueCents - b.refundCents) / 100,
    payingUsers: userByMonth.get(month)?.size ?? 0,
  }))
}

// ─────────────────────────────────────────────────────────────
//  PLAN MIX
// ─────────────────────────────────────────────────────────────

export interface PlanMixRow {
  planSlug: string
  userCount: number
  /** MRR contribution for this plan (active monthly + annual amortized). */
  mrrUsd: number
}

export async function getPlanMix(): Promise<PlanMixRow[]> {
  const grouped = await db.user.groupBy({
    by: ["planSlug"],
    _count: { id: true },
  })

  // Pull active recurring purchases joined with product slug to compute
  // per-plan MRR. Only counting "tier"-type products here.
  const recurring = await db.purchase.findMany({
    where: {
      status: { in: ["active", "trialing"] },
      intervalType: { in: ["monthly", "annual"] },
      product: { type: "tier" },
    },
    select: {
      amountCents: true,
      intervalType: true,
      product: { select: { slug: true } },
    },
  })

  const mrrBySlug = new Map<string, number>()
  for (const p of recurring) {
    const slug = p.product.slug
    const cents = p.intervalType === "annual" ? Math.round(p.amountCents / 12) : p.amountCents
    mrrBySlug.set(slug, (mrrBySlug.get(slug) ?? 0) + cents)
  }

  return grouped
    .map((g) => ({
      planSlug: g.planSlug,
      userCount: g._count.id,
      mrrUsd: (mrrBySlug.get(g.planSlug) ?? 0) / 100,
    }))
    .sort((a, b) => b.mrrUsd - a.mrrUsd)
}

// ─────────────────────────────────────────────────────────────
//  ACQUISITION CHANNEL  (uses User.signupSource)
// ─────────────────────────────────────────────────────────────

export interface AcquisitionRow {
  signupSource: string
  signups: number
  paidUsers: number
  /** Lifetime revenue across all signups in this bucket. */
  lifetimeRevenueUsd: number
  conversionRate: number // paidUsers / signups, 0..1
  /** Cost of customer acquisition: CampaignSpend.spend / paidUsers. */
  cacUsd: number | null
  /** Return on ad spend: revenue / spend. */
  roas: number | null
}

export async function getAcquisitionMix(): Promise<AcquisitionRow[]> {
  const users = await db.user.findMany({
    select: {
      id: true,
      signupSource: true,
      firstUtmSource: true,
      firstUtmCampaign: true,
      purchases: {
        where: { status: { in: ["active", "trialing", "past_due", "canceled", "refunded"] } },
        select: { lifetimeRevenueCents: true, status: true },
      },
    },
  })

  const buckets = new Map<
    string,
    { signups: number; paidUsers: number; revenueCents: number }
  >()

  for (const u of users) {
    const key = u.signupSource ?? "unknown"
    if (!buckets.has(key)) {
      buckets.set(key, { signups: 0, paidUsers: 0, revenueCents: 0 })
    }
    const b = buckets.get(key)!
    b.signups += 1
    const ltv = u.purchases.reduce((s, p) => s + (p.lifetimeRevenueCents ?? 0), 0)
    if (ltv > 0) b.paidUsers += 1
    b.revenueCents += ltv
  }

  // Pull spend keyed by utm_source + utm_campaign. We aggregate spend
  // per first-touch utmSource for the acquisition mix; the more
  // granular per-campaign roll-up lives in /admin/campaigns.
  const spend = await db.campaignSpend.groupBy({
    by: ["utmSource"],
    _sum: { spendCents: true },
  })
  const spendBySource = new Map(
    spend.map((s) => [s.utmSource.toLowerCase(), s._sum.spendCents ?? 0]),
  )

  return Array.from(buckets.entries())
    .map(([signupSource, b]) => {
      // Map signup-source bucket back to a likely UTM source for spend lookup.
      const sourceKey = bucketToSpendKey(signupSource)
      const spendCents = sourceKey ? spendBySource.get(sourceKey) ?? 0 : 0
      const cacUsd = b.paidUsers > 0 && spendCents > 0 ? spendCents / 100 / b.paidUsers : null
      const roas = spendCents > 0 ? b.revenueCents / spendCents : null
      return {
        signupSource,
        signups: b.signups,
        paidUsers: b.paidUsers,
        lifetimeRevenueUsd: b.revenueCents / 100,
        conversionRate: b.signups > 0 ? b.paidUsers / b.signups : 0,
        cacUsd,
        roas,
      }
    })
    .sort((a, b) => b.lifetimeRevenueUsd - a.lifetimeRevenueUsd)
}

function bucketToSpendKey(bucket: string): string | null {
  // Coarse signup-source buckets back to plausible utmSource values
  // admins enter on /admin/campaigns. Imperfect but actionable.
  if (bucket === "paid-search") return "google"
  if (bucket === "paid-social") return "facebook"
  if (bucket === "email") return "email"
  return null
}

// ─────────────────────────────────────────────────────────────
//  API COST PER USER
// ─────────────────────────────────────────────────────────────

export interface ApiCostRow {
  userId: string
  email: string
  totalCostUsd: number
  callCount: number
}

export async function getTopApiCostsByUser(limit: number = 25): Promise<ApiCostRow[]> {
  // ApiCostLog.clientId stores the User.id (when authenticated).
  const grouped = await db.apiCostLog.groupBy({
    by: ["clientId"],
    where: { clientId: { not: null } },
    _sum: { cost: true },
    _count: { id: true },
    orderBy: { _sum: { cost: "desc" } },
    take: limit,
  })

  const userIds = grouped.map((g) => g.clientId).filter((s): s is string => Boolean(s))
  const users = await db.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, email: true },
  })
  const emailById = new Map(users.map((u) => [u.id, u.email]))

  return grouped
    .filter((g) => g.clientId)
    .map((g) => ({
      userId: g.clientId!,
      email: emailById.get(g.clientId!) ?? "(deleted)",
      totalCostUsd: g._sum.cost ?? 0,
      callCount: g._count.id,
    }))
}

// ─────────────────────────────────────────────────────────────
//  COHORT RETENTION (signups by month → still active months later)
// ─────────────────────────────────────────────────────────────

export interface CohortRow {
  cohortMonth: string
  signups: number
  /** Per-month-after retention percentages (0..1). cohortMonth+0 = signups. */
  retention: number[]
}

export async function getCohortRetention(monthsBack: number = 6): Promise<CohortRow[]> {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth() - (monthsBack - 1), 1)

  const users = await db.user.findMany({
    where: { signupAt: { gte: start } },
    select: {
      id: true,
      signupAt: true,
      purchases: {
        select: {
          startedAt: true,
          endedAt: true,
          status: true,
        },
      },
    },
  })

  const cohorts = new Map<string, { signups: number; retained: Map<number, number> }>()

  for (const u of users) {
    if (!u.signupAt) continue
    const cohortKey = monthKey(u.signupAt)
    if (!cohorts.has(cohortKey)) {
      cohorts.set(cohortKey, { signups: 0, retained: new Map() })
    }
    const c = cohorts.get(cohortKey)!
    c.signups += 1

    // For each month-offset 0..monthsBack-1, was the user paying?
    // "Paying" = at least one purchase whose [startedAt, endedAt) overlaps the offset month.
    for (let offset = 0; offset < monthsBack; offset++) {
      const checkDate = new Date(u.signupAt)
      checkDate.setMonth(checkDate.getMonth() + offset)
      if (checkDate > now) continue
      const wasActive = u.purchases.some((p) => {
        const s = p.startedAt.getTime()
        const e = p.endedAt?.getTime() ?? Date.now() + 86400000
        return s <= checkDate.getTime() && e >= checkDate.getTime()
      })
      if (wasActive) c.retained.set(offset, (c.retained.get(offset) ?? 0) + 1)
    }
  }

  return Array.from(cohorts.entries())
    .map(([cohortMonth, c]) => ({
      cohortMonth,
      signups: c.signups,
      retention: Array.from({ length: monthsBack }, (_, i) =>
        c.signups > 0 ? (c.retained.get(i) ?? 0) / c.signups : 0,
      ),
    }))
    .sort((a, b) => a.cohortMonth.localeCompare(b.cohortMonth))
}

// ─────────────────────────────────────────────────────────────
//  REFUND RATE
// ─────────────────────────────────────────────────────────────

export async function getRefundRate30d(): Promise<{
  refundedCents: number
  paidCents: number
  rate: number
}> {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400 * 1000)
  const [refundAgg, invoiceAgg] = await Promise.all([
    db.refund.aggregate({
      where: { refundedAt: { gte: thirtyDaysAgo } },
      _sum: { amountCents: true },
    }),
    db.purchaseInvoice.aggregate({
      where: { paidAt: { gte: thirtyDaysAgo } },
      _sum: { amountPaidCents: true },
    }),
  ])

  const refundedCents = refundAgg._sum.amountCents ?? 0
  const paidCents = invoiceAgg._sum.amountPaidCents ?? 0
  return {
    refundedCents,
    paidCents,
    rate: paidCents > 0 ? refundedCents / paidCents : 0,
  }
}

// ─────────────────────────────────────────────────────────────
//  AT-RISK MRR (dunning)
// ─────────────────────────────────────────────────────────────

export async function getAtRiskMrr(): Promise<{ atRiskMrrUsd: number; subCount: number }> {
  const subs = await db.subscription.findMany({
    where: {
      status: "PAST_DUE",
    },
    select: { monthlyAmount: true },
  })
  return {
    subCount: subs.length,
    atRiskMrrUsd: subs.reduce((s, x) => s + x.monthlyAmount, 0),
  }
}

// ─────────────────────────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────────────────────────

function monthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
}

function monthsBetween(a: Date, b: Date): number {
  return Math.max(
    1,
    (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth()) + 1,
  )
}
