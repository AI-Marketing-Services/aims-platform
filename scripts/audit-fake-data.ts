/**
 * Audit script — counts what would be deleted by a "wipe test data" pass.
 * Read-only. Does NOT modify anything.
 *
 *   npx tsx scripts/audit-fake-data.ts
 *
 * Identifies:
 *   • Deals with no real Mighty member (mightyMemberId is null) AND
 *     contactEmail matches obvious test patterns OR was created manually
 *     during testing.
 *   • All MightyInvites that failed or are otherwise orphaned.
 *   • PartialApplications with no completion.
 *   • LeadMagnetSubmissions tied to deleted/test deals.
 *   • DealActivities + Notes tied to deleted deals (cascade).
 */
import { PrismaClient } from "@prisma/client"

const db = new PrismaClient()

// Anything matching these patterns is treated as test data.
const TEST_EMAIL_PATTERNS = [
  /^adamwolfe\d+@gmail\.com$/i,
  /^adamwolfe@/i,
  /\+test/i,
  /@example\.(com|test)$/i,
  /@test\./i,
  /^test[._-]/i,
  /^demo[._-]/i,
]

function isTestEmail(email: string | null | undefined): boolean {
  if (!email) return false
  return TEST_EMAIL_PATTERNS.some((rx) => rx.test(email))
}

async function main() {
  console.log("=".repeat(70))
  console.log("AIMS — Test Data Audit (read-only)")
  console.log("=".repeat(70))

  // ─── Real members ─────────────────────────────────────────────────
  const realMembers = await db.deal.findMany({
    where: { mightyMemberId: { not: null } },
    select: {
      id: true,
      contactName: true,
      contactEmail: true,
      mightyMemberId: true,
      stage: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  })

  console.log(`\n✅ REAL Mighty members in CRM: ${realMembers.length}`)
  for (const m of realMembers) {
    console.log(`   • ${m.contactName} <${m.contactEmail}> (member#${m.mightyMemberId}, stage=${m.stage})`)
  }

  // ─── Mighty invites that succeeded (accepted) ─────────────────────
  const acceptedInvites = await db.mightyInvite.count({
    where: { status: "accepted" },
  })
  console.log(`\n✅ Accepted Mighty invites: ${acceptedInvites}`)

  // ─── All deals breakdown ──────────────────────────────────────────
  const allDeals = await db.deal.findMany({
    select: {
      id: true,
      contactName: true,
      contactEmail: true,
      mightyMemberId: true,
      mightyInviteStatus: true,
      stage: true,
      source: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  })

  const testDeals = allDeals.filter(
    (d) => !d.mightyMemberId && isTestEmail(d.contactEmail)
  )
  const realDeals = allDeals.filter((d) => !testDeals.includes(d))

  console.log(`\n📊 Deals total: ${allDeals.length}`)
  console.log(`   → Real (keep): ${realDeals.length}`)
  console.log(`   → Test (DELETE): ${testDeals.length}`)
  if (testDeals.length > 0) {
    console.log("\n   Test deals to delete:")
    for (const d of testDeals.slice(0, 30)) {
      console.log(
        `      • ${d.contactName} <${d.contactEmail}> stage=${d.stage} created=${d.createdAt.toISOString().slice(0, 10)}`
      )
    }
    if (testDeals.length > 30) console.log(`      …and ${testDeals.length - 30} more`)
  }

  // ─── MightyInvite breakdown ───────────────────────────────────────
  const allInvites = await db.mightyInvite.findMany({
    select: { id: true, email: true, status: true, dealId: true },
  })
  const failedInvites = allInvites.filter((i) => i.status === "failed")
  const testDealIdSet = new Set(testDeals.map((d) => d.id))
  const invitesOnTestDeals = allInvites.filter((i) => testDealIdSet.has(i.dealId))

  console.log(`\n📊 MightyInvites total: ${allInvites.length}`)
  console.log(`   → Failed: ${failedInvites.length}`)
  console.log(`   → Tied to test deals (DELETE via cascade): ${invitesOnTestDeals.length}`)

  // ─── Lead magnet submissions ──────────────────────────────────────
  const allSubs = await db.leadMagnetSubmission.findMany({
    select: { id: true, email: true, type: true, dealId: true, createdAt: true },
  })
  const testSubs = allSubs.filter(
    (s) => isTestEmail(s.email) || (s.dealId && testDealIdSet.has(s.dealId))
  )
  console.log(`\n📊 Lead magnet submissions total: ${allSubs.length}`)
  console.log(`   → Test (DELETE): ${testSubs.length}`)

  // ─── Partial applications ─────────────────────────────────────────
  const allPartials = await db.partialApplication.findMany({
    select: { id: true, email: true, completedAt: true, dealId: true },
  })
  const testPartials = allPartials.filter(
    (p) => isTestEmail(p.email) || (p.dealId && testDealIdSet.has(p.dealId))
  )
  console.log(`\n📊 Partial applications total: ${allPartials.length}`)
  console.log(`   → Test (DELETE): ${testPartials.length}`)

  // ─── Email queue items ────────────────────────────────────────────
  const allQueue = await db.emailQueueItem.count()
  const testQueue = await db.emailQueueItem.count({
    where: {
      OR: TEST_EMAIL_PATTERNS.map((rx) => ({
        recipientEmail: { contains: "adamwolfe", mode: "insensitive" as const },
      })),
    },
  })
  console.log(`\n📊 Email queue items total: ${allQueue}`)
  console.log(`   → Recipient adamwolfe* (DELETE): ${testQueue}`)

  // ─── DealActivity / DealNote (cascade with deal delete) ───────────
  const activitiesToDelete = await db.dealActivity.count({
    where: { dealId: { in: testDeals.map((d) => d.id) } },
  })
  const notesToDelete = await db.dealNote.count({
    where: { dealId: { in: testDeals.map((d) => d.id) } },
  })
  console.log(`\n📊 DealActivities tied to test deals: ${activitiesToDelete} (cascade)`)
  console.log(`📊 DealNotes tied to test deals: ${notesToDelete} (cascade)`)

  // ─── KEEP confirmation ────────────────────────────────────────────
  const apiCostCount = await db.apiCostLog.count().catch(() => 0)
  const vendorCount = await db.vendorTracker.count().catch(() => 0)
  const subCount = await db.subscription.count().catch(() => 0)
  const userCount = await db.user.count().catch(() => 0)

  console.log("\n" + "=".repeat(70))
  console.log("PRESERVED (will NOT be touched):")
  console.log("=".repeat(70))
  console.log(`   • API cost logs: ${apiCostCount}`)
  console.log(`   • Vendor trackers (SaaS spend): ${vendorCount}`)
  console.log(`   • Subscriptions: ${subCount}`)
  console.log(`   • Users (Clerk-mirrored): ${userCount}`)
  console.log(`   • Real Mighty members (deals with mightyMemberId): ${realMembers.length}`)
  console.log()
}

main()
  .catch((err) => {
    console.error("Audit failed:", err)
    process.exit(1)
  })
  .finally(() => db.$disconnect())
