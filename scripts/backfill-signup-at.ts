/**
 * One-shot: backfill User.signupAt = createdAt for users created before
 * the column was introduced. Without this, the cohort retention chart on
 * /admin/cfo can't group legacy users into their signup month.
 *
 * Safe to re-run — only touches rows where signupAt IS NULL.
 *
 * Run: DATABASE_URL=... DIRECT_URL=... npx tsx scripts/backfill-signup-at.ts
 */
import { PrismaClient } from "@prisma/client"

const db = new PrismaClient()

async function main() {
  // Updating directly via raw SQL avoids fetching every row into memory
  // and keeps the operation atomic. Prisma's updateMany doesn't support
  // referencing another column on the same row, so we drop to raw SQL.
  const result = await db.$executeRaw`
    UPDATE "User"
    SET "signupAt" = "createdAt"
    WHERE "signupAt" IS NULL
  `

  process.stdout.write(`Backfilled signupAt on ${result} User row(s).\n`)

  const nullCount = await db.user.count({ where: { signupAt: null } })
  if (nullCount > 0) {
    process.stderr.write(
      `WARNING: ${nullCount} users still have NULL signupAt after backfill.\n`
    )
    process.exit(1)
  }

  process.stdout.write("Verified: zero NULL signupAt rows remaining.\n")
}

main()
  .catch((err) => {
    process.stderr.write(
      `Error: ${err instanceof Error ? err.message : String(err)}\n`
    )
    process.exit(1)
  })
  .finally(() => db.$disconnect())
