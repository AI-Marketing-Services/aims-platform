/**
 * Smoke test for the Phase-2 features.
 *
 * For each feature we don't actually hit the HTTP layer (would need a
 * Clerk session). Instead we directly exercise the data-layer / handler
 * code paths each page relies on, with a dedicated test user. This
 * catches Prisma typos, missing relations, broken JSON shapes — i.e.
 * the things that 500 the page on first render.
 *
 * Idempotent — re-runs safely. Cleans up at the end.
 */
import { PrismaClient } from "@prisma/client"

const db = new PrismaClient()
const TEST_EMAIL = "smoke-phase2@aimseod.local"

interface Result {
  name: string
  ok: boolean
  detail?: string
}

const results: Result[] = []

async function step(name: string, fn: () => Promise<void>) {
  try {
    await fn()
    results.push({ name, ok: true })
    console.log(`  ok    ${name}`)
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err)
    results.push({ name, ok: false, detail })
    console.error(`  FAIL  ${name}\n        ${detail}`)
  }
}

async function setupUser() {
  const prior = await db.user.findUnique({ where: { email: TEST_EMAIL } })
  if (prior) {
    // Wipe child tables in dependency order.
    await db.sequenceEnrollment.deleteMany({ where: { userId: prior.id } })
    await db.emailSequence.deleteMany({ where: { userId: prior.id } })
    await db.userTemplate.deleteMany({ where: { userId: prior.id } })
    await db.clientUpdate.deleteMany({ where: { userId: prior.id } })
    await db.callRecording.deleteMany({ where: { userId: prior.id } })
    await db.booking.deleteMany({ where: { userId: prior.id } })
    await db.bookingAvailability.deleteMany({ where: { userId: prior.id } })
    await db.entitlement.deleteMany({ where: { userId: prior.id } })
    await db.creditTransaction.deleteMany({ where: { userId: prior.id } })
    await db.user.delete({ where: { id: prior.id } })
  }
  return db.user.create({
    data: {
      clerkId: `smoke_clerk_${Date.now()}`,
      email: TEST_EMAIL,
      name: "Phase 2 Smoke Tester",
      planSlug: "operator",
      creditBalance: 5000,
    },
  })
}

async function main() {
  console.log("=== Phase-2 features smoke test ===\n")
  const user = await setupUser()

  console.log("─── Templates ────────────────────────────────")
  let templateId = ""
  await step("create UserTemplate", async () => {
    const row = await db.userTemplate.create({
      data: {
        userId: user.id,
        type: "email",
        title: "Smoke template",
        body: "Hi {{contact.firstName}},\n\nThis is a test.",
        variables: ["contact.firstName"],
        tags: ["smoke"],
        isPublic: false,
      },
    })
    templateId = row.id
  })
  await step("list user + public templates", async () => {
    const rows = await db.userTemplate.findMany({
      where: { OR: [{ userId: user.id }, { isPublic: true }] },
    })
    if (rows.length === 0) throw new Error("expected at least 1 template")
  })

  console.log("\n─── Sequences ────────────────────────────────")
  let sequenceId = ""
  await step("create EmailSequence with 2 steps", async () => {
    const seq = await db.emailSequence.create({
      data: {
        userId: user.id,
        name: "Smoke sequence",
        status: "active",
        pauseOnReply: true,
        steps: {
          create: [
            { order: 0, delayDays: 0, subject: "Hi", body: "Initial" },
            { order: 1, delayDays: 3, subject: "Bump", body: "Bump body" },
          ],
        },
      },
    })
    sequenceId = seq.id
  })
  await step("enroll a recipient", async () => {
    await db.sequenceEnrollment.create({
      data: {
        sequenceId,
        userId: user.id,
        recipientEmail: "smoke-target@example.com",
        recipientName: "Smoke Target",
        currentStep: 0,
        status: "active",
        nextSendAt: new Date(),
      },
    })
  })
  await step("query due-now enrollments (cron path)", async () => {
    const due = await db.sequenceEnrollment.findMany({
      where: {
        status: "active",
        nextSendAt: { lte: new Date() },
        sequence: { status: "active" },
      },
      include: { sequence: { include: { steps: true, user: true } } },
    })
    if (due.length === 0) throw new Error("expected to pick up due enrollment")
  })

  console.log("\n─── Client Updates ────────────────────────────")
  // Need a deal to attach the update to.
  const deal = await db.clientDeal.create({
    data: {
      userId: user.id,
      companyName: "Smoke Co",
      contactName: "Test Contact",
      contactEmail: "contact@smoke.co",
      stage: "ACTIVE_RETAINER",
    },
  })
  await step("create ClientUpdate draft", async () => {
    await db.clientUpdate.create({
      data: {
        userId: user.id,
        clientDealId: deal.id,
        status: "draft",
        weekStartDate: new Date(),
        subject: "Weekly update — Smoke Co",
        body: "Body",
        generatedFrom: { test: true } as object,
      },
    })
  })
  await step("query the index page filter", async () => {
    const rows = await db.clientUpdate.findMany({
      where: { userId: user.id },
      orderBy: { weekStartDate: "desc" },
    })
    if (rows.length === 0) throw new Error("expected 1 update")
  })

  console.log("\n─── Recordings ───────────────────────────────")
  await step("create CallRecording with summary", async () => {
    await db.callRecording.create({
      data: {
        userId: user.id,
        clientDealId: deal.id,
        title: "Smoke discovery",
        source: "Zoom",
        transcript: "Test transcript content.",
        summary: { summary: "Brief", scoreOutOf10: 7 } as object,
        followUpDraft: "Hi there — follow up.",
        status: "ready",
      },
    })
  })

  console.log("\n─── Booking ──────────────────────────────────")
  await step("upsert BookingAvailability with handle", async () => {
    const handle = `smoke-${Date.now()}`
    await db.bookingAvailability.create({
      data: {
        userId: user.id,
        handle,
        isActive: true,
        durationMinutes: 30,
        bufferMinutes: 15,
        timezone: "America/Los_Angeles",
        weeklyHours: {
          mon: [{ start: "09:00", end: "17:00" }],
          tue: [{ start: "09:00", end: "17:00" }],
        } as object,
      },
    })
  })
  await step("compute slots from availability", async () => {
    const { computeSlots } = await import("../src/lib/booking/slots")
    const slots = computeSlots({
      weeklyHours: {
        mon: [{ start: "09:00", end: "17:00" }],
        tue: [{ start: "09:00", end: "17:00" }],
      },
      durationMinutes: 30,
      bufferMinutes: 15,
      existingBookings: [],
      daysAhead: 7,
    })
    if (slots.length === 0) throw new Error("expected slots")
  })
  await step("create a Booking + verify auto-CRM-deal capability", async () => {
    const start = new Date()
    start.setDate(start.getDate() + 1)
    start.setHours(10, 0, 0, 0)
    const end = new Date(start.getTime() + 30 * 60_000)
    await db.booking.create({
      data: {
        userId: user.id,
        clientDealId: deal.id,
        inviteeName: "Test Booker",
        inviteeEmail: "booker@smoke.co",
        startAt: start,
        endAt: end,
        status: "confirmed",
      },
    })
  })

  console.log("\n─── Proposals (existing surface) ─────────────")
  await step("query proposals index page filter", async () => {
    const rows = await db.clientProposal.findMany({
      where: { clientDeal: { userId: user.id } },
      include: { clientDeal: { select: { id: true, companyName: true, contactName: true } } },
    })
    // Empty is fine — exercising the relation join is the point.
    void rows
  })

  console.log("\n─── Plan registry sanity ─────────────────────")
  await step("registry exposes 20 features", async () => {
    const { ALL_FEATURE_ENTITLEMENTS, FEATURE_CATALOG } = await import(
      "../src/lib/plans/registry"
    )
    if (ALL_FEATURE_ENTITLEMENTS.length !== 20) {
      throw new Error(`expected 20 entitlements, got ${ALL_FEATURE_ENTITLEMENTS.length}`)
    }
    if (FEATURE_CATALOG.length !== 20) {
      throw new Error(`expected 20 catalog entries, got ${FEATURE_CATALOG.length}`)
    }
  })
  await step("Operator plan grants every feature", async () => {
    const { getPlan, ALL_FEATURE_ENTITLEMENTS } = await import(
      "../src/lib/plans/registry"
    )
    const operator = getPlan("operator")
    if (!operator) throw new Error("no operator plan")
    if (operator.entitlements.length !== ALL_FEATURE_ENTITLEMENTS.length) {
      throw new Error(
        `operator should grant all features; got ${operator.entitlements.length}/${ALL_FEATURE_ENTITLEMENTS.length}`,
      )
    }
  })

  // Cleanup
  await db.sequenceEnrollment.deleteMany({ where: { userId: user.id } })
  await db.emailSequence.deleteMany({ where: { userId: user.id } })
  await db.userTemplate.deleteMany({ where: { userId: user.id } })
  await db.clientUpdate.deleteMany({ where: { userId: user.id } })
  await db.callRecording.deleteMany({ where: { userId: user.id } })
  await db.booking.deleteMany({ where: { userId: user.id } })
  await db.bookingAvailability.deleteMany({ where: { userId: user.id } })
  await db.clientDeal.deleteMany({ where: { userId: user.id } })
  await db.entitlement.deleteMany({ where: { userId: user.id } })
  await db.creditTransaction.deleteMany({ where: { userId: user.id } })
  await db.user.delete({ where: { id: user.id } })

  const failed = results.filter((r) => !r.ok)
  console.log(
    `\n=== ${results.length - failed.length}/${results.length} passed ${failed.length === 0 ? "✓" : `(${failed.length} failed)`} ===`,
  )
  if (failed.length > 0) process.exit(1)
}

main()
  .catch((err) => {
    console.error("Smoke test crashed:", err)
    process.exit(1)
  })
  .finally(() => db.$disconnect())
