/**
 * Promote Adam's accounts to SUPER_ADMIN.
 *
 * Updates BOTH:
 *   - Clerk publicMetadata.role → SUPER_ADMIN (middleware reads this)
 *   - Neon User.role → SUPER_ADMIN (server components trust this)
 *
 * Run: tsx scripts/promote-me.ts
 * Requires CLERK_SECRET_KEY + DATABASE_URL in env.
 */

import { createClerkClient } from "@clerk/backend"
import { db } from "../src/lib/db"

const ADAM_EMAILS = ["adamwolfe102@gmail.com"]

async function main() {
  if (!process.env.CLERK_SECRET_KEY) {
    console.error("[promote-me] CLERK_SECRET_KEY not set. Aborting.")
    process.exit(1)
  }

  const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY })

  for (const email of ADAM_EMAILS) {
    console.log(`\n[promote-me] Processing ${email}…`)

    const row = await db.user.findUnique({
      where: { email },
      select: { id: true, email: true, clerkId: true, role: true },
    })
    if (!row) {
      console.log(`  [-] No DB row for ${email} — skipping.`)
      continue
    }

    // 1. Clerk side — middleware reads publicMetadata.role per request
    try {
      await clerk.users.updateUserMetadata(row.clerkId, {
        publicMetadata: { role: "SUPER_ADMIN" },
      })
      console.log(`  [+] Clerk publicMetadata updated for ${row.clerkId}`)
    } catch (e) {
      console.error(`  [!] Clerk update FAILED for ${row.clerkId}:`, e instanceof Error ? e.message : e)
      continue
    }

    // 2. DB side — server components read this
    await db.user.update({
      where: { id: row.id },
      data: { role: "SUPER_ADMIN" },
    })
    console.log(`  [+] DB role updated for ${email}`)
  }

  console.log("\n[promote-me] Done. Log out and back in to pick up the new role.")
  await db.$disconnect()
}

main().catch(async (e) => {
  console.error("[promote-me] Failed:", e)
  await db.$disconnect()
  process.exit(1)
})
