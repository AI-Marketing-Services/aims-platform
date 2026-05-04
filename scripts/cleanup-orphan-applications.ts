/**
 * Targeted local cleanup for the AIMS Collective Applications surface.
 *
 * Goal: leave only the two real applicants (Joe Tadduni + Katie Kinkead)
 * in the AIMS admin (`/admin/applications` and `/admin/crm`). Everything
 * else — test seeds, duplicate adam-wolfe rows, orphans whose Deal was
 * already deleted — gets removed locally.
 *
 * !!! DOES NOT TOUCH CLOSE CRM !!!
 *
 * This script writes directly to Prisma. It bypasses the API DELETE
 * handlers entirely, so it cannot trigger a Close cascade — even if a
 * Deal we delete has a `closeLeadId` set, the corresponding Close lead
 * stays put. Stephen's shared Vendingpreneurs workspace is the source of
 * truth for sales activity and we must not nuke its data from this
 * script. If a Close-side cleanup is ever needed it must happen via
 * the Close UI or a separately-authored, separately-confirmed script.
 *
 * Usage:
 *   DRY_RUN=1 npx tsx --env-file=.env.local scripts/cleanup-orphan-applications.ts
 *   npx tsx --env-file=.env.local scripts/cleanup-orphan-applications.ts
 */
import { PrismaClient } from "@prisma/client"

const db = new PrismaClient()
const DRY_RUN = process.env.DRY_RUN === "1"

// The two emails that should remain after cleanup. Anything not in this
// list gets purged from LeadMagnetSubmission, PartialApplication, and
// any Deal sourced from `ai-operator-collective-application`.
//
// We intentionally do NOT touch Deals from other sources (e.g. Close
// imports, manual admin adds for unrelated business lines) — those are
// not part of the Collective funnel surface this script cleans.
const KEEP_EMAILS = new Set<string>([
  "jtadduni10@gmail.com",
  "katierkinkead@gmail.com",
])

const AOC_SOURCE = "ai-operator-collective-application"

function isKept(email: string | null | undefined) {
  if (!email) return false
  return KEEP_EMAILS.has(email.trim().toLowerCase())
}

async function main() {
  console.log(
    `\n${DRY_RUN ? "[DRY RUN] " : ""}Targeted cleanup of /admin/applications + AOC Kanban`,
  )
  console.log("KEEPING:", Array.from(KEEP_EMAILS).join(", "))
  console.log("CLOSE CRM: untouched. Local AIMS only.\n")

  // --- 1. Find every Collective Application submission and check which
  //         do NOT belong to a kept email.
  const submissions = await db.leadMagnetSubmission.findMany({
    where: { type: "COLLECTIVE_APPLICATION" },
    select: {
      id: true,
      email: true,
      name: true,
      dealId: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  })

  const subsToDelete = submissions.filter((s) => !isKept(s.email))
  const subsToKeep = submissions.filter((s) => isKept(s.email))

  // --- 2. Find every AOC-sourced Deal and bucket the same way.
  const allAocDeals = await db.deal.findMany({
    where: { source: AOC_SOURCE },
    select: {
      id: true,
      contactName: true,
      contactEmail: true,
      stage: true,
      closeLeadId: true,
    },
  })
  const dealsToDelete = allAocDeals.filter((d) => !isKept(d.contactEmail))
  const dealsToKeep = allAocDeals.filter((d) => isKept(d.contactEmail))

  // Surface a warning if any deal slated for deletion has a Close link.
  // We're not going to touch Close — but the user should know that the
  // AIMS-side deletion will create a one-way drift for those leads.
  const dealsWithCloseLink = dealsToDelete.filter((d) => d.closeLeadId)

  // --- 3. Find PartialApplications belonging to non-kept emails.
  const partialsToDelete = await db.partialApplication.findMany({
    where: { email: { notIn: Array.from(KEEP_EMAILS), mode: "insensitive" } },
    select: { id: true, email: true, firstName: true, lastName: true },
  })

  console.log(`Submissions total:      ${submissions.length}`)
  console.log(`  Keeping (Joe/Katie):  ${subsToKeep.length}`)
  console.log(`  To delete:            ${subsToDelete.length}`)
  console.log("")
  console.log(`AOC Deals total:        ${allAocDeals.length}`)
  console.log(`  Keeping (Joe/Katie):  ${dealsToKeep.length}`)
  console.log(`  To delete (AIMS):     ${dealsToDelete.length}`)
  console.log(`  ↳ with Close link:    ${dealsWithCloseLink.length}  (Close NOT touched)`)
  console.log("")
  console.log(`PartialApplications to delete: ${partialsToDelete.length}`)

  if (subsToDelete.length > 0) {
    console.log("\nSubmissions to delete:")
    for (const s of subsToDelete) {
      console.log(
        `  • ${s.name ?? "(no name)"} <${s.email}>  ${s.createdAt.toISOString().slice(0, 10)}  dealId=${s.dealId ?? "—"}`,
      )
    }
  }
  if (dealsToDelete.length > 0) {
    console.log("\nDeals to delete (LOCAL ONLY — Close untouched):")
    for (const d of dealsToDelete) {
      console.log(
        `  • ${d.contactName} <${d.contactEmail}>  stage=${d.stage}  closeLeadId=${d.closeLeadId ?? "—"}`,
      )
    }
  }
  if (dealsToKeep.length > 0) {
    console.log("\nDeals KEPT:")
    for (const d of dealsToKeep) {
      console.log(`  • ${d.contactName} <${d.contactEmail}>  stage=${d.stage}`)
    }
  }

  if (DRY_RUN) {
    console.log(
      "\n[DRY RUN] No changes made. Re-run without DRY_RUN=1 to commit.",
    )
    console.log("Reminder: Close CRM is NEVER modified by this script.\n")
    return
  }

  if (
    subsToDelete.length === 0 &&
    dealsToDelete.length === 0 &&
    partialsToDelete.length === 0
  ) {
    console.log("\nAlready clean. Nothing to do.\n")
    return
  }

  // --- 4. Wipe in dependency-safe order. Direct Prisma — no API calls,
  //         no Close cascade. The DealActivity / DealNote / DealServiceArm
  //         / MightyInvite tables cascade via FK on Deal so they go with it.
  const subIds = subsToDelete.map((s) => s.id)
  const dealIds = dealsToDelete.map((d) => d.id)
  const partialIds = partialsToDelete.map((p) => p.id)

  // Detach any submissions or partials that point at the deals we're
  // about to delete (no FK, soft pointer). We're deleting them anyway
  // but better safe than orphaning if the order ever shifts.
  if (dealIds.length > 0) {
    await db.leadMagnetSubmission.updateMany({
      where: { dealId: { in: dealIds } },
      data: { dealId: null },
    })
    await db.partialApplication.updateMany({
      where: { dealId: { in: dealIds } },
      data: { dealId: null },
    })
  }

  let deletedSubs = 0
  let deletedPartials = 0
  let deletedDeals = 0

  if (subIds.length > 0) {
    const r = await db.leadMagnetSubmission.deleteMany({
      where: { id: { in: subIds } },
    })
    deletedSubs = r.count
  }
  if (partialIds.length > 0) {
    const r = await db.partialApplication.deleteMany({
      where: { id: { in: partialIds } },
    })
    deletedPartials = r.count
  }
  if (dealIds.length > 0) {
    const r = await db.deal.deleteMany({ where: { id: { in: dealIds } } })
    deletedDeals = r.count
  }

  // --- 5. Verify
  const after = await db.leadMagnetSubmission.findMany({
    where: { type: "COLLECTIVE_APPLICATION" },
    select: { email: true, name: true },
  })
  const afterDeals = await db.deal.findMany({
    where: { source: AOC_SOURCE },
    select: { contactEmail: true, contactName: true, stage: true },
  })

  console.log("\nDone.")
  console.log(`  Submissions deleted: ${deletedSubs}`)
  console.log(`  Partials deleted:    ${deletedPartials}`)
  console.log(`  Deals deleted:       ${deletedDeals}  (Close NOT touched)`)
  console.log("")
  console.log(`Submissions remaining (${after.length}):`)
  for (const s of after) {
    console.log(`  • ${s.name ?? "(no name)"} <${s.email}>`)
  }
  console.log(`AOC Deals remaining (${afterDeals.length}):`)
  for (const d of afterDeals) {
    console.log(
      `  • ${d.contactName} <${d.contactEmail}>  stage=${d.stage}`,
    )
  }
}

main()
  .catch((err) => {
    console.error("Cleanup failed:", err)
    process.exit(1)
  })
  .finally(() => db.$disconnect())
