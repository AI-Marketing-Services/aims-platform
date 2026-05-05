/**
 * Backfill: top up every user who never received the trial-credit grant.
 *
 * Selection: users who have NO `trial-grant` ledger entry yet AND whose
 * current creditBalance is below the new starting balance (1000). Anyone
 * who has spent into negative is left alone — manual admin adjustment.
 *
 * Idempotent: re-running is a no-op for anyone who already has a
 * `trial-grant` ledger row.
 *
 * Usage:
 *   ./node_modules/.bin/tsx --env-file=.env.local scripts/backfill-trial-credits.ts
 *   ./node_modules/.bin/tsx --env-file=.env.local scripts/backfill-trial-credits.ts --dry
 */
import { PrismaClient } from "@prisma/client"

const db = new PrismaClient()

const TRIAL_CREDITS = 1000

async function main() {
  const dryRun = process.argv.includes("--dry")

  // Pull every user that has no trial-grant ledger row yet.
  const usersWithoutGrant = await db.user.findMany({
    where: {
      creditTransactions: {
        none: { reason: "trial-grant" },
      },
    },
    select: {
      id: true,
      email: true,
      role: true,
      creditBalance: true,
      creditPlanTier: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  })

  console.log(`Found ${usersWithoutGrant.length} user(s) without a trial-grant ledger entry.\n`)

  let granted = 0
  let skipped = 0

  for (const user of usersWithoutGrant) {
    // Skip users who already have a healthy balance — they probably got
    // bumped up via a different path (paid plan, admin grant). Topping
    // them up again would over-credit.
    if (user.creditBalance >= TRIAL_CREDITS) {
      console.log(
        `  skip  ${user.email}  role=${user.role}  balance=${user.creditBalance} (already ≥ ${TRIAL_CREDITS})`,
      )
      skipped++
      continue
    }

    const topUp = TRIAL_CREDITS - user.creditBalance
    const newBalance = TRIAL_CREDITS

    if (dryRun) {
      console.log(
        `  [dry] grant +${topUp}  ${user.email}  role=${user.role}  ${user.creditBalance} → ${newBalance}`,
      )
      granted++
      continue
    }

    await db.$transaction([
      db.user.update({
        where: { id: user.id },
        data: {
          creditBalance: newBalance,
          creditGrantedAt: new Date(),
        },
      }),
      db.creditTransaction.create({
        data: {
          userId: user.id,
          amount: topUp,
          balanceAfter: newBalance,
          reason: "trial-grant",
          metadata: {
            source: "backfill-trial-credits",
            previousBalance: user.creditBalance,
            grantedAt: new Date().toISOString(),
          },
        },
      }),
    ])

    console.log(
      `  ok    ${user.email}  role=${user.role}  +${topUp}  → ${newBalance}`,
    )
    granted++
  }

  console.log(`\nDone. Granted: ${granted}  Skipped: ${skipped}  ${dryRun ? "(dry run — no writes)" : ""}`)
}

main()
  .catch((err) => {
    console.error("Backfill failed:", err)
    process.exit(1)
  })
  .finally(() => db.$disconnect())
