/**
 * One-shot: create empty MemberProfile rows for existing CLIENT users who
 * don't have one yet. Does NOT mark any steps complete.
 *
 * Run: DATABASE_URL=... DIRECT_URL=... npx tsx scripts/backfill-onboarding-profiles.ts
 */
import { PrismaClient } from "@prisma/client"

const db = new PrismaClient()

async function main() {
  const clients = await db.user.findMany({
    where: {
      role: "CLIENT",
      memberProfile: null,
    },
    select: { id: true, email: true },
  })

  if (clients.length === 0) {
    process.stdout.write("No CLIENT users missing a MemberProfile — nothing to do.\n")
    return
  }

  process.stdout.write(`Creating MemberProfile for ${clients.length} users…\n`)

  await db.memberProfile.createMany({
    data: clients.map((u) => ({ userId: u.id })),
    skipDuplicates: true,
  })

  for (const u of clients) {
    process.stdout.write(`  ✓ ${u.email}\n`)
  }

  process.stdout.write(`Done. ${clients.length} profiles created.\n`)
}

main()
  .catch((err) => {
    process.stderr.write(`Error: ${err instanceof Error ? err.message : String(err)}\n`)
    process.exit(1)
  })
  .finally(() => db.$disconnect())
