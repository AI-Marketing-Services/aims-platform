/**
 * Reconcile Σ CreditTransaction.amount with User.creditBalance for every
 * user. When they differ, the BALANCE is the source of truth (it's
 * actually decremented during enrichment) — so we synthesize a
 * "ledger-reconcile" CreditTransaction for the difference, with a clear
 * audit-trail metadata blob.
 *
 * The drift is caused by historical users created before the trial-grant
 * ledger entry existed (when the schema's `@default(50)` was the only
 * source of starting credits and nothing was written to
 * CreditTransaction). New signups already get a "+1000 trial-grant" row
 * via ensureDbUser, so this only affects pre-existing accounts.
 *
 * Idempotent: if a previous "ledger-reconcile" row exists, the next run
 * will see balance == ledger and do nothing.
 */
import { PrismaClient } from "@prisma/client"

const db = new PrismaClient()

async function main() {
  const dryRun = process.argv.includes("--dry")

  const users = await db.user.findMany({
    select: { id: true, email: true, creditBalance: true },
  })

  let drifted = 0
  let fixed = 0

  for (const u of users) {
    const agg = await db.creditTransaction.aggregate({
      where: { userId: u.id },
      _sum: { amount: true },
    })
    const ledger = agg._sum.amount ?? 0
    const diff = u.creditBalance - ledger

    if (Math.abs(diff) <= 1) continue
    drifted++

    console.log(
      `  ${u.email.padEnd(38)}  balance=${u.creditBalance}  ledger=${ledger}  diff=${diff > 0 ? "+" : ""}${diff}`,
    )

    if (dryRun) continue

    await db.creditTransaction.create({
      data: {
        userId: u.id,
        amount: diff,
        balanceAfter: u.creditBalance,
        reason: "admin-adjustment",
        metadata: {
          source: "reconcile-credit-ledger",
          note: "Pre-ledger signup credits — synthesized for audit trail.",
          previousLedgerSum: ledger,
        },
      },
    })
    fixed++
  }

  console.log(
    `\n${drifted} drifted user(s) found · ${fixed} reconciled${dryRun ? " (dry — no writes)" : ""}`,
  )
}

main()
  .catch((err) => {
    console.error("Reconcile failed:", err)
    process.exit(1)
  })
  .finally(() => db.$disconnect())
