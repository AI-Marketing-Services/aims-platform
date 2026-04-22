/**
 * Delete Close-imported deals that pre-date AOC launch. These are
 * legacy Vendingpreneurs leads that got retroactively mis-tagged as
 * AOC by Stephen's Close automation. They should never have been
 * synced into our CRM.
 *
 *   npx tsx scripts/delete-close-legacy.ts
 */
import { PrismaClient } from "@prisma/client"
import { aocLaunchDate } from "../src/lib/close"

const db = new PrismaClient()

async function main() {
  const launch = aocLaunchDate()
  console.log(`Removing Close-imported deals created before ${launch.toISOString()}.`)

  // NOTE: `createdAt` on Deal reflects when AIMS imported the row, not
  // when the Close lead was created. Any close-import deals currently
  // in AIMS came in before the date guard landed, so they're all
  // candidates. Going forward, listAOCLeads() filters by Close's
  // date_created and only post-launch leads will get imported.
  const candidates = await db.deal.findMany({
    where: {
      source: "close-import",
      closeLeadId: { not: null },
    },
    select: {
      id: true,
      contactName: true,
      contactEmail: true,
      stage: true,
      closeLeadId: true,
      createdAt: true,
    },
    orderBy: { contactName: "asc" },
  })

  if (candidates.length === 0) {
    console.log("Nothing matched. Exiting.")
    return
  }

  console.log(`\nFound ${candidates.length} legacy Close deal(s):`)
  for (const d of candidates) {
    console.log(
      `  • ${(d.contactName ?? "—").padEnd(22)} | ${d.contactEmail.padEnd(34)} | ${d.stage.padEnd(8)} | close=${d.closeLeadId}`
    )
  }

  const ids = candidates.map((d) => d.id)
  const emails = candidates.map((d) => d.contactEmail.toLowerCase())

  const detachedSubs = await db.leadMagnetSubmission.updateMany({
    where: { dealId: { in: ids } },
    data: { dealId: null },
  })
  const detachedPartials = await db.partialApplication.updateMany({
    where: { dealId: { in: ids } },
    data: { dealId: null },
  })

  const deletedQueue = await db.emailQueueItem.deleteMany({
    where: { recipientEmail: { in: emails, mode: "insensitive" } },
  })

  const deletedDeals = await db.deal.deleteMany({
    where: { id: { in: ids } },
  })

  console.log("\nDone.")
  console.log(`  Deals deleted:                 ${deletedDeals.count}`)
  console.log(`  Lead magnet subs detached:     ${detachedSubs.count}`)
  console.log(`  Partial applications detached: ${detachedPartials.count}`)
  console.log(`  Email queue items deleted:     ${deletedQueue.count}`)
  console.log(`  (DealActivity, DealNote, MightyInvite cascade with deal delete.)`)
}

main()
  .catch((err) => {
    console.error("Delete failed:", err)
    process.exit(1)
  })
  .finally(() => db.$disconnect())
