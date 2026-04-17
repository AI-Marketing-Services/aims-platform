/**
 * Demo-data wipe.
 *
 * Removes every seeded/test record so the CRM reflects only real funnel
 * activity. Real = anything sourced from the AI Operator Collective apply
 * funnel (source in REAL_SOURCES). Everything else is considered demo.
 *
 * Run:  npx tsx prisma/wipe-demo.ts
 * Dry:  npx tsx prisma/wipe-demo.ts --dry
 */

import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

const REAL_SOURCES = new Set([
  "ai-operator-collective-application",
  "apply-form",
  "application_card",
])

const isDryRun = process.argv.includes("--dry")

async function main() {
  console.log(isDryRun ? "[DRY RUN] nothing will be deleted\n" : "[WIPE] deleting demo data\n")

  const demoUsers = await prisma.user.findMany({
    where: { OR: [{ clerkId: { startsWith: "demo_" } }, { email: { contains: "@example.com" } }] },
    select: { id: true, clerkId: true, email: true },
  })
  const demoUserIds = demoUsers.map((u) => u.id)
  console.log(`Demo users: ${demoUsers.length}`)

  const demoDeals = await prisma.deal.findMany({
    where: {
      OR: [
        { userId: { in: demoUserIds } },
        { AND: [{ source: { not: null } }, { NOT: { source: { in: [...REAL_SOURCES] } } }] },
        { contactEmail: { endsWith: "@example.com" } },
        { contactName: { contains: "test", mode: "insensitive" } },
        { company: { contains: "test", mode: "insensitive" } },
      ],
    },
    select: { id: true, contactName: true, contactEmail: true, source: true, stage: true },
  })
  console.log(`Demo deals: ${demoDeals.length}`)
  for (const d of demoDeals.slice(0, 10)) {
    console.log(`  - ${d.contactName} <${d.contactEmail}> [${d.source ?? "null"}] @ ${d.stage}`)
  }
  if (demoDeals.length > 10) console.log(`  ... and ${demoDeals.length - 10} more`)

  const demoSubs = await prisma.subscription.findMany({
    where: { userId: { in: demoUserIds } },
    select: { id: true },
  })
  console.log(`Demo subscriptions: ${demoSubs.length}`)

  const demoSubmissions = await prisma.leadMagnetSubmission.count({
    where: {
      OR: [
        { userId: { in: demoUserIds } },
        { email: { endsWith: "@example.com" } },
        { dealId: { in: demoDeals.map((d) => d.id) } },
      ],
    },
  })
  console.log(`Demo lead-magnet submissions: ${demoSubmissions}`)

  const demoTickets = await prisma.supportTicket.count({ where: { userId: { in: demoUserIds } } })
  console.log(`Demo support tickets: ${demoTickets}`)

  const demoNotifications = await prisma.notification.count({
    where: { userId: { in: demoUserIds } },
  })
  console.log(`Demo notifications: ${demoNotifications}`)

  const demoReferrals = await prisma.referral.count({
    where: {
      OR: [
        { referrerId: { in: demoUserIds } },
        { referredId: { in: demoUserIds } },
      ],
    },
  })
  console.log(`Demo referrals: ${demoReferrals}`)

  const demoIntern = await prisma.internProfile.count({ where: { userId: { in: demoUserIds } } })
  console.log(`Demo intern profiles: ${demoIntern}`)

  const demoCommissions = await prisma.commission.count({ where: { userId: { in: demoUserIds } } })
  console.log(`Demo commissions: ${demoCommissions}`)

  const demoOpsEngagements = await prisma.opsExcellenceEngagement.count({
    where: { userId: { in: demoUserIds } },
  })
  console.log(`Demo ops-excellence engagements: ${demoOpsEngagements}`)

  const partialAppsTotal = await prisma.partialApplication.count()
  console.log(`Partial applications (all will be cleared): ${partialAppsTotal}`)

  if (isDryRun) {
    console.log("\n[DRY RUN] done. Re-run without --dry to apply.")
    return
  }

  console.log("\nDeleting...")

  // Order matters — no cascades for most User FKs.
  const dealIds = demoDeals.map((d) => d.id)
  const subIds = demoSubs.map((s) => s.id)

  // 1. Fulfillment tasks for demo subs (cascade handles it, but explicit is safer)
  if (subIds.length) {
    await prisma.fulfillmentTask.deleteMany({ where: { subscriptionId: { in: subIds } } })
  }

  // 2. Ops excellence engagements (demo users + any tied to demo subs)
  await prisma.opsExcellenceEngagement.deleteMany({
    where: {
      OR: [
        { userId: { in: demoUserIds } },
        { subscriptionId: { in: subIds } },
      ],
    },
  })

  // 3. Subscriptions
  if (demoUserIds.length) {
    await prisma.subscription.deleteMany({ where: { userId: { in: demoUserIds } } })
  }

  // 4. Support tickets (replies cascade)
  if (demoUserIds.length) {
    await prisma.supportTicket.deleteMany({ where: { userId: { in: demoUserIds } } })
  }

  // 5. Notifications
  if (demoUserIds.length) {
    await prisma.notification.deleteMany({ where: { userId: { in: demoUserIds } } })
  }

  // 6. Referrals + commissions
  await prisma.commission.deleteMany({ where: { userId: { in: demoUserIds } } })
  await prisma.referral.deleteMany({
    where: {
      OR: [
        { referrerId: { in: demoUserIds } },
        { referredId: { in: demoUserIds } },
      ],
    },
  })

  // 7. Intern profiles
  await prisma.internProfile.deleteMany({ where: { userId: { in: demoUserIds } } })

  // 8. Email Bison connections
  await prisma.emailBisonConnection.deleteMany({ where: { userId: { in: demoUserIds } } })

  // 9. Lead magnet submissions attached to demo users, demo deals, or test emails
  await prisma.leadMagnetSubmission.deleteMany({
    where: {
      OR: [
        { userId: { in: demoUserIds } },
        { email: { endsWith: "@example.com" } },
        { dealId: { in: dealIds } },
      ],
    },
  })

  // 10. Partial applications (any step-1 drop-offs from testing) — wipe all
  await prisma.partialApplication.deleteMany({})

  // 11. Deals (DealServiceArm, DealNote, DealActivity, MightyInvite cascade)
  if (dealIds.length) {
    await prisma.deal.deleteMany({ where: { id: { in: dealIds } } })
  }

  // 12. Users
  if (demoUserIds.length) {
    await prisma.user.deleteMany({ where: { id: { in: demoUserIds } } })
  }

  // 13. Deal notes with NOTE_ADDED tied to demo authors — already cascaded via deal delete.

  // 14. Vendor tracker rows from seed (kept — they're operational, not demo).

  console.log("\nWipe complete.")

  const remainingDeals = await prisma.deal.count()
  const remainingUsers = await prisma.user.count()
  const remainingSubs = await prisma.subscription.count()
  console.log(`\nRemaining — deals: ${remainingDeals}, users: ${remainingUsers}, subs: ${remainingSubs}`)
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error("Wipe failed:", e)
    await prisma.$disconnect()
    process.exit(1)
  })
