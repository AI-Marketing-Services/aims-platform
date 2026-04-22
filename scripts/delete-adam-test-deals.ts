/**
 * Delete the two Adam Wolfe test deals and everything tied to them.
 * Keeps all real applicants and Close-imported leads.
 *
 *   npx tsx scripts/delete-adam-test-deals.ts
 */
import { PrismaClient } from "@prisma/client"

const db = new PrismaClient()

const TEST_EMAILS = ["adamwolfe100@gmail.com", "adamwolfe102@gmail.com"]

async function main() {
  console.log("Deleting test deals for:", TEST_EMAILS.join(", "))

  const deals = await db.deal.findMany({
    where: {
      contactEmail: {
        in: TEST_EMAILS,
        mode: "insensitive",
      },
    },
    select: { id: true, contactName: true, contactEmail: true },
  })

  if (deals.length === 0) {
    console.log("No matching deals found. Nothing to do.")
    return
  }

  console.log(`Found ${deals.length} deal(s) to delete:`)
  for (const d of deals) {
    console.log(`  • ${d.contactName} <${d.contactEmail}> (${d.id})`)
  }

  const dealIds = deals.map((d) => d.id)

  // Detach optional relations that don't cascade.
  const detachedSubs = await db.leadMagnetSubmission.updateMany({
    where: { dealId: { in: dealIds } },
    data: { dealId: null },
  })
  const detachedPartials = await db.partialApplication.updateMany({
    where: { dealId: { in: dealIds } },
    data: { dealId: null },
  })

  // Delete lead magnet submissions + partial applications authored by the test emails.
  const deletedSubs = await db.leadMagnetSubmission.deleteMany({
    where: { email: { in: TEST_EMAILS, mode: "insensitive" } },
  })
  const deletedPartials = await db.partialApplication.deleteMany({
    where: { email: { in: TEST_EMAILS, mode: "insensitive" } },
  })

  // Purge email queue items addressed to the test emails.
  const deletedQueue = await db.emailQueueItem.deleteMany({
    where: { recipientEmail: { in: TEST_EMAILS, mode: "insensitive" } },
  })

  // Cascade deletes DealActivity, DealNote, MightyInvite.
  const deletedDeals = await db.deal.deleteMany({
    where: { id: { in: dealIds } },
  })

  console.log("\nDone.")
  console.log(`  Deals deleted:                  ${deletedDeals.count}`)
  console.log(`  Lead magnet subs detached:      ${detachedSubs.count}`)
  console.log(`  Lead magnet subs deleted:       ${deletedSubs.count}`)
  console.log(`  Partial applications detached:  ${detachedPartials.count}`)
  console.log(`  Partial applications deleted:   ${deletedPartials.count}`)
  console.log(`  Email queue items deleted:      ${deletedQueue.count}`)
  console.log(`  (DealActivity, DealNote, MightyInvite cascade with deal delete.)`)
}

main()
  .catch((err) => {
    console.error("Delete failed:", err)
    process.exit(1)
  })
  .finally(() => db.$disconnect())
