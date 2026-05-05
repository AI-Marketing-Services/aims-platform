/**
 * End-to-end test of the plan checkout webhook flow.
 *
 * Walks the EXACT code path Stripe will trigger after a real checkout —
 * builds a synthetic Checkout.Session payload, calls
 * `handleProductCheckoutCompleted`, then asserts on the DB:
 *
 *   1. Purchase row exists
 *   2. Entitlement rows for the plan are granted
 *   3. User.planSlug updated
 *   4. CreditTransaction +N "monthly-grant" row exists
 *
 * Tests TWO scenarios:
 *   A. User upgrades free → pro
 *   B. User buys a credit pack
 *
 * Idempotent — re-runs safely (checks existing state, skips dup work,
 * always cleans up at the end).
 *
 * Usage:
 *   ./node_modules/.bin/tsx --env-file=.env.local scripts/test-plan-checkout-flow.ts
 */
import { PrismaClient } from "@prisma/client"
import type Stripe from "stripe"

const db = new PrismaClient()
const TEST_EMAIL = "test-plan-flow@aimseod.local"

async function setupTestUser() {
  // Wipe any prior test artifact so we run from a known starting state.
  const prior = await db.user.findUnique({ where: { email: TEST_EMAIL } })
  if (prior) {
    await db.purchase.deleteMany({ where: { userId: prior.id } })
    await db.entitlement.deleteMany({ where: { userId: prior.id } })
    await db.creditTransaction.deleteMany({ where: { userId: prior.id } })
    await db.user.delete({ where: { id: prior.id } })
  }
  const user = await db.user.create({
    data: {
      clerkId: `test_clerk_${Date.now()}`,
      email: TEST_EMAIL,
      name: "Plan Flow Test",
      planSlug: "free",
      creditBalance: 100,
    },
  })
  console.log(`  Created test user ${user.id}  email=${user.email}\n`)
  return user
}

function makeSyntheticSession(args: {
  productSlug: string
  userId: string
  isSubscription: boolean
  amountCents: number
}): Stripe.Checkout.Session {
  const id = `cs_test_synthetic_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
  return {
    id,
    object: "checkout.session",
    amount_total: args.amountCents,
    currency: "usd",
    customer: `cus_test_${args.userId.slice(0, 8)}`,
    client_reference_id: args.userId,
    mode: args.isSubscription ? "subscription" : "payment",
    subscription: args.isSubscription
      ? `sub_test_${Date.now()}`
      : null,
    metadata: {
      source: "product",
      productSlug: args.productSlug,
      userId: args.userId,
      intervalType: args.isSubscription ? "monthly" : "one_time",
    },
    // The following fields aren't read by our handler but Stripe's TS
    // type insists. Cast down to silence — we only care about above.
    livemode: false,
  } as unknown as Stripe.Checkout.Session
}

async function assert(label: string, cond: boolean, detail?: string) {
  if (cond) {
    console.log(`  ok    ${label}`)
  } else {
    console.error(`  FAIL  ${label}  ${detail ?? ""}`)
    throw new Error(`Assertion failed: ${label}`)
  }
}

async function scenarioPlanUpgrade(userId: string) {
  console.log("\n─── Scenario A: free → pro upgrade ──────────────────")
  const { handleProductCheckoutCompleted } = await import(
    "../src/lib/stripe/handlers/handle-product-purchase"
  )

  const session = makeSyntheticSession({
    productSlug: "pro",
    userId,
    isSubscription: true,
    amountCents: 9700,
  })
  await handleProductCheckoutCompleted(session)

  // Idempotency: run a second time — should be a no-op.
  await handleProductCheckoutCompleted(session)

  const user = await db.user.findUnique({ where: { id: userId } })
  await assert("User.planSlug = pro", user?.planSlug === "pro", `got ${user?.planSlug}`)

  const purchases = await db.purchase.findMany({
    where: { userId, stripeCheckoutSessionId: session.id },
  })
  await assert(
    "Purchase row created exactly once (idempotency)",
    purchases.length === 1,
    `got ${purchases.length}`,
  )

  const ents = await db.entitlement.findMany({
    where: { userId, revokedAt: null },
    select: { key: true },
  })
  const keys = new Set(ents.map((e) => e.key))
  for (const expected of [
    "feature_scripts",
    "feature_content",
    "feature_invoices",
    "feature_follow_up_rules",
    "feature_calculator",
    "feature_playbooks",
    "feature_referrals",
  ]) {
    await assert(`Entitlement granted: ${expected}`, keys.has(expected))
  }

  const creditTxs = await db.creditTransaction.findMany({
    where: { userId, reason: "monthly-grant" },
  })
  await assert(
    "+1000 monthly-grant ledger row created",
    creditTxs.some((t) => t.amount === 1000),
    `tx amounts: ${creditTxs.map((t) => t.amount).join(",")}`,
  )

  const u2 = await db.user.findUnique({
    where: { id: userId },
    select: { creditBalance: true },
  })
  await assert(
    "User.creditBalance = 1100 (100 starting + 1000 plan grant)",
    u2?.creditBalance === 1100,
    `got ${u2?.creditBalance}`,
  )
}

async function scenarioCreditPack(userId: string) {
  console.log("\n─── Scenario B: buy credit pack ─────────────────────")
  const { handleProductCheckoutCompleted } = await import(
    "../src/lib/stripe/handlers/handle-product-purchase"
  )

  const before = await db.user.findUnique({
    where: { id: userId },
    select: { creditBalance: true },
  })

  const session = makeSyntheticSession({
    productSlug: "credits-2000",
    userId,
    isSubscription: false,
    amountCents: 7900,
  })
  await handleProductCheckoutCompleted(session)
  // Idempotency
  await handleProductCheckoutCompleted(session)

  const after = await db.user.findUnique({
    where: { id: userId },
    select: { creditBalance: true },
  })
  await assert(
    "Credit pack added 2000 credits exactly once",
    (after?.creditBalance ?? 0) - (before?.creditBalance ?? 0) === 2000,
    `before=${before?.creditBalance} after=${after?.creditBalance}`,
  )

  const topupTxs = await db.creditTransaction.findMany({
    where: { userId, reason: "topup-purchase" },
  })
  await assert(
    "+2000 topup-purchase ledger row created",
    topupTxs.some((t) => t.amount === 2000),
    `topup tx amounts: ${topupTxs.map((t) => t.amount).join(",")}`,
  )

  // User.planSlug should NOT have changed (credit packs aren't plans).
  const user = await db.user.findUnique({ where: { id: userId } })
  await assert(
    "User.planSlug unchanged after credit pack purchase",
    user?.planSlug === "pro",
    `got ${user?.planSlug}`,
  )
}

async function scenarioCancellation(userId: string) {
  console.log("\n─── Scenario C: subscription canceled (downgrade) ───")
  const { handleProductSubscriptionDeleted } = await import(
    "../src/lib/stripe/handlers/handle-product-purchase"
  )

  const purchase = await db.purchase.findFirst({
    where: { userId, stripeSubscriptionId: { not: null } },
  })
  if (!purchase) {
    console.log("  (no sub purchase to cancel — skipping)")
    return
  }

  const subStub = {
    id: purchase.stripeSubscriptionId!,
    object: "subscription",
    cancel_at: null,
    status: "canceled",
  } as unknown as Stripe.Subscription
  await handleProductSubscriptionDeleted(subStub)

  const user = await db.user.findUnique({ where: { id: userId } })
  await assert(
    "User.planSlug reverted to free after cancel",
    user?.planSlug === "free",
    `got ${user?.planSlug}`,
  )
  const purchaseAfter = await db.purchase.findUnique({ where: { id: purchase.id } })
  await assert(
    "Purchase status = canceled",
    purchaseAfter?.status === "canceled",
    `got ${purchaseAfter?.status}`,
  )
  const stillActiveEnts = await db.entitlement.count({
    where: { userId, revokedAt: null, key: { startsWith: "feature_" } },
  })
  await assert(
    "All feature entitlements revoked after cancel",
    stillActiveEnts === 0,
    `still active: ${stillActiveEnts}`,
  )
}

async function main() {
  console.log("=== End-to-end plan checkout flow test ===\n")
  const user = await setupTestUser()

  try {
    await scenarioPlanUpgrade(user.id)
    await scenarioCreditPack(user.id)
    await scenarioCancellation(user.id)
    console.log("\n=== ALL ASSERTIONS PASSED ===")
  } finally {
    // Clean up test artifacts so the email is reusable next run.
    await db.purchase.deleteMany({ where: { userId: user.id } })
    await db.entitlement.deleteMany({ where: { userId: user.id } })
    await db.creditTransaction.deleteMany({ where: { userId: user.id } })
    await db.user.delete({ where: { id: user.id } }).catch(() => {})
  }
}

main()
  .catch((err) => {
    console.error("\n=== TEST FAILED ===\n", err)
    process.exit(1)
  })
  .finally(() => db.$disconnect())
