/**
 * Database health audit — runs a battery of consistency checks against
 * the production data. Goal: surface ANY orphan / inconsistency before
 * the beta launches so we go in clean.
 *
 * Read-only by default. Pass --fix to auto-correct safe issues.
 *
 * Usage:
 *   ./node_modules/.bin/tsx --env-file=.env.local scripts/db-health-audit.ts
 *   ./node_modules/.bin/tsx --env-file=.env.local scripts/db-health-audit.ts --fix
 */
import { PrismaClient } from "@prisma/client"

const db = new PrismaClient()
const SHOULD_FIX = process.argv.includes("--fix")

interface Check {
  name: string
  count: number
  severity: "ok" | "warn" | "fail"
  detail?: string
  fixable?: boolean
}
const checks: Check[] = []

function pad(s: string, n: number) {
  return s.length >= n ? s : s + " ".repeat(n - s.length)
}

async function main() {
  console.log("=== AIMS DB health audit ===\n")

  // ─── 1. Plan / entitlement consistency ─────────────────────────
  console.log("─── Plan + entitlements ─────────────────────────────")

  const usersByPlan = await db.user.groupBy({
    by: ["planSlug"],
    _count: { _all: true },
  })
  for (const row of usersByPlan) {
    console.log(`  ${pad(row.planSlug, 12)} ${row._count._all} users`)
  }

  // Users on Operator plan who don't have all 20 entitlements
  const operators = await db.user.findMany({
    where: { planSlug: "operator", role: { in: ["CLIENT", "RESELLER", "INTERN"] } },
    select: {
      id: true,
      email: true,
      _count: {
        select: { userEntitlements: { where: { revokedAt: null } } },
      },
    },
  })
  const underprovisioned = operators.filter((u) => u._count.userEntitlements < 20)
  checks.push({
    name: "Operator users with <20 active entitlements",
    count: underprovisioned.length,
    severity: underprovisioned.length === 0 ? "ok" : "warn",
    detail: underprovisioned.map((u) => `${u.email} (${u._count.userEntitlements})`).join(", "),
    fixable: true,
  })

  // Users on Pro who have feature_crm or feature_lead_scout (Operator-only)
  // — flags accidental over-provisioning from earlier grandfather runs.
  const overProvisionedPro = await db.user.findMany({
    where: {
      planSlug: "pro",
      userEntitlements: {
        some: {
          revokedAt: null,
          key: { in: ["feature_crm", "feature_lead_scout", "feature_audits"] },
        },
      },
    },
    select: { id: true, email: true },
  })
  checks.push({
    name: "Pro users with Operator-only entitlements (over-provisioned)",
    count: overProvisionedPro.length,
    severity: overProvisionedPro.length === 0 ? "ok" : "warn",
    detail: overProvisionedPro.map((u) => u.email).join(", "),
    fixable: true,
  })

  // Free users with active feature entitlements (shouldn't exist)
  const freeWithFeatures = await db.user.findMany({
    where: {
      planSlug: "free",
      role: { in: ["CLIENT", "RESELLER", "INTERN"] },
      userEntitlements: {
        some: {
          revokedAt: null,
          key: { startsWith: "feature_" },
        },
      },
    },
    select: { id: true, email: true },
  })
  checks.push({
    name: "Free users with active feature_* entitlements",
    count: freeWithFeatures.length,
    severity: freeWithFeatures.length === 0 ? "ok" : "warn",
    detail: freeWithFeatures.map((u) => u.email).join(", "),
  })

  // ─── 2. Credit ledger consistency ──────────────────────────────
  console.log("\n─── Credit ledger ────────────────────────────────────")

  // For each user, sum CreditTransaction.amount and compare to
  // creditBalance. They should match within ±1 (rounding).
  const usersForLedger = await db.user.findMany({
    select: { id: true, email: true, creditBalance: true },
  })
  const driftRows: Array<{ email: string; balance: number; ledgerSum: number }> = []
  for (const u of usersForLedger) {
    const agg = await db.creditTransaction.aggregate({
      where: { userId: u.id },
      _sum: { amount: true },
    })
    const ledger = agg._sum.amount ?? 0
    if (Math.abs(ledger - u.creditBalance) > 1) {
      driftRows.push({ email: u.email, balance: u.creditBalance, ledgerSum: ledger })
    }
  }
  checks.push({
    name: "Users with creditBalance != Σ CreditTransaction (ledger drift)",
    count: driftRows.length,
    severity: driftRows.length === 0 ? "ok" : "fail",
    detail: driftRows
      .map((r) => `${r.email}: balance=${r.balance} ledger=${r.ledgerSum}`)
      .join("; "),
  })

  // Users with negative credit balance — shouldn't ever happen if
  // debitCredits guards work.
  const negative = await db.user.count({ where: { creditBalance: { lt: 0 } } })
  checks.push({
    name: "Users with negative creditBalance",
    count: negative,
    severity: negative === 0 ? "ok" : "fail",
  })

  // ─── 3. Subscription / Purchase / Entitlement consistency ──────
  console.log("\n─── Subscriptions + entitlements ─────────────────────")

  // Active Purchases whose user has no matching entitlement for the
  // Product's entitlement keys.
  const activePurchases = await db.purchase.findMany({
    where: { status: { in: ["active", "trialing"] } },
    include: {
      product: { select: { entitlements: true, slug: true } },
      user: { select: { id: true, email: true } },
    },
  })
  let purchaseGap = 0
  const purchaseGapDetails: string[] = []
  for (const p of activePurchases) {
    if (p.product.entitlements.length === 0) continue
    const missing = await db.entitlement.findMany({
      where: {
        userId: p.userId,
        key: { in: p.product.entitlements },
        revokedAt: null,
      },
      select: { key: true },
    })
    const have = new Set(missing.map((e) => e.key))
    const lack = p.product.entitlements.filter((k) => !have.has(k))
    if (lack.length > 0) {
      purchaseGap++
      purchaseGapDetails.push(`${p.user.email} missing ${lack.length} from ${p.product.slug}`)
    }
  }
  checks.push({
    name: "Active Purchases with missing entitlements",
    count: purchaseGap,
    severity: purchaseGap === 0 ? "ok" : "warn",
    detail: purchaseGapDetails.slice(0, 5).join("; "),
    fixable: true,
  })

  // ─── 4. Orphan / dangling row checks ───────────────────────────
  console.log("\n─── Orphans + dangling references ────────────────────")

  // SequenceEnrollment whose sequence was deleted. The relation is FK-
  // cascade, so this should always be 0. We can't use Prisma's
  // `where: { sequence: null }` (it rejects null for required relations
  // at the type level), so we diff distinct sequenceIds against the
  // existing-sequences table — same outcome, type-safe.
  const enrollmentSeqIds = await db.sequenceEnrollment.findMany({
    select: { sequenceId: true },
    distinct: ["sequenceId"],
  })
  const existingSeqIds = await db.emailSequence.findMany({
    where: {
      id: { in: enrollmentSeqIds.map((e) => e.sequenceId) },
    },
    select: { id: true },
  })
  const existingSeqSet = new Set(existingSeqIds.map((s) => s.id))
  const danglingSeqIds = enrollmentSeqIds
    .map((e) => e.sequenceId)
    .filter((id) => !existingSeqSet.has(id))
  const orphanEnrollments =
    danglingSeqIds.length === 0
      ? 0
      : await db.sequenceEnrollment.count({
          where: { sequenceId: { in: danglingSeqIds } },
        })
  checks.push({
    name: "Orphan sequence enrollments",
    count: orphanEnrollments,
    severity: orphanEnrollments === 0 ? "ok" : "warn",
  })

  // Bookings with clientDealId pointing at a non-existent deal.
  const bookings = await db.booking.findMany({
    where: { clientDealId: { not: null } },
    select: { id: true, clientDealId: true },
  })
  const dealIds = bookings
    .map((b) => b.clientDealId)
    .filter((id): id is string => Boolean(id))
  const existingDeals = await db.clientDeal.findMany({
    where: { id: { in: dealIds } },
    select: { id: true },
  })
  const existingDealSet = new Set(existingDeals.map((d) => d.id))
  const orphanBookings = bookings.filter(
    (b) => b.clientDealId && !existingDealSet.has(b.clientDealId),
  )
  checks.push({
    name: "Bookings pointing at deleted deals",
    count: orphanBookings.length,
    severity: orphanBookings.length === 0 ? "ok" : "warn",
    fixable: true,
  })

  // Notifications with userId pointing at a deleted user.
  const notifs = await db.notification.findMany({
    where: { userId: { not: null } },
    select: { id: true, userId: true },
    take: 5000,
  })
  const notifUserIds = [...new Set(notifs.map((n) => n.userId).filter((u): u is string => Boolean(u)))]
  const existingUsers = await db.user.findMany({
    where: { id: { in: notifUserIds } },
    select: { id: true },
  })
  const existingUserSet = new Set(existingUsers.map((u) => u.id))
  const orphanNotifs = notifs.filter((n) => n.userId && !existingUserSet.has(n.userId))
  checks.push({
    name: "Notifications addressed to deleted users",
    count: orphanNotifs.length,
    severity: orphanNotifs.length === 0 ? "ok" : "warn",
    fixable: true,
  })

  // ─── 5. Duplicate clerkId / email anomalies ────────────────────
  console.log("\n─── Duplicates + integrity ───────────────────────────")
  // Both clerkId AND email are @unique so the DB enforces this; we
  // only need to spot-check for "@placeholder.local" stragglers from
  // race-condition rebinds.
  const placeholders = await db.user.count({
    where: { email: { endsWith: "@placeholder.local" } },
  })
  checks.push({
    name: "Users with @placeholder.local emails (Clerk webhook race fallback)",
    count: placeholders,
    severity: placeholders === 0 ? "ok" : "warn",
  })

  // ─── 6. Plan/Stripe sync sanity ────────────────────────────────
  // Users with planSlug != "free" but no active Purchase row and not in
  // the auto-comp list — would indicate a manual grant we lost track of.
  console.log("\n─── Plan / Stripe sync ───────────────────────────────")

  const { PRE_GRANTED_EMAILS } = await import("../src/lib/plans/grant")
  const compEmails = new Set(Object.keys(PRE_GRANTED_EMAILS))
  const paidUsers = await db.user.findMany({
    where: {
      planSlug: { in: ["pro", "operator"] },
      role: { in: ["CLIENT", "RESELLER", "INTERN"] },
    },
    select: {
      email: true,
      planSlug: true,
      _count: {
        select: {
          purchases: { where: { status: { in: ["active", "trialing"] } } },
        },
      },
    },
  })
  const unaccountedFor = paidUsers.filter(
    (u) => u._count.purchases === 0 && !compEmails.has(u.email.toLowerCase()),
  )
  checks.push({
    name: "Paid-plan users with no active Purchase + not on comp list",
    count: unaccountedFor.length,
    severity: unaccountedFor.length === 0 ? "ok" : "warn",
    detail: unaccountedFor.map((u) => `${u.email} (${u.planSlug})`).join(", "),
  })

  // ─── Apply fixes if requested ──────────────────────────────────
  if (SHOULD_FIX) {
    console.log("\n─── Applying fixes (--fix) ───────────────────────────")
    if (orphanBookings.length > 0) {
      await db.booking.updateMany({
        where: { id: { in: orphanBookings.map((b) => b.id) } },
        data: { clientDealId: null },
      })
      console.log(`  cleared clientDealId on ${orphanBookings.length} orphan bookings`)
    }
    if (orphanNotifs.length > 0) {
      await db.notification.deleteMany({
        where: { id: { in: orphanNotifs.map((n) => n.id) } },
      })
      console.log(`  deleted ${orphanNotifs.length} orphan notifications`)
    }
    if (underprovisioned.length > 0) {
      const { grantPlanToUser } = await import("../src/lib/plans/grant")
      for (const u of underprovisioned) {
        await grantPlanToUser(u.id, "operator", { skipCredits: true, note: "db-health-audit fix" })
      }
      console.log(`  re-granted Operator to ${underprovisioned.length} underprovisioned users`)
    }
  }

  // ─── Report ────────────────────────────────────────────────────
  console.log("\n=== Health audit results ===")
  let ok = 0, warn = 0, fail = 0
  for (const c of checks) {
    const sev = c.severity === "ok" ? " ok " : c.severity === "warn" ? "WARN" : "FAIL"
    const fixable = c.fixable ? " [fixable]" : ""
    console.log(`  [${sev}] ${pad(String(c.count), 4)} ${c.name}${fixable}`)
    if (c.detail && c.severity !== "ok") {
      console.log(`         ${c.detail.slice(0, 200)}`)
    }
    if (c.severity === "ok") ok++
    else if (c.severity === "warn") warn++
    else fail++
  }
  console.log(
    `\n  ${ok} ok · ${warn} warnings · ${fail} failures${SHOULD_FIX ? " (fixes applied)" : ""}`,
  )
  if (fail > 0) process.exit(1)
}

main()
  .catch((err) => {
    console.error("DB audit crashed:", err)
    process.exit(1)
  })
  .finally(() => db.$disconnect())
