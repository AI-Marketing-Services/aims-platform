/**
 * Grant all known entitlements to a user (admin override).
 *
 * Usage:
 *   source .env.local && npx tsx scripts/grant-all-entitlements.ts <email>
 *
 * Default email if none passed: adamwolfe102@gmail.com (so Adam can
 * test gated tools end-to-end as a power user without going through
 * Stripe checkout).
 *
 * The granted entitlements are admin-comp (no purchaseId), never
 * expire, and won't be auto-revoked by reconcileEntitlementsForUser
 * — they sit in the table looking like a legitimate grant from a
 * non-existent purchase. To revoke later, use
 * `db.entitlement.update({ where: { userId_key }, data: { revokedAt: new Date() } })`.
 */

import { PrismaClient } from "@prisma/client"

const ALL_KEYS = [
  "chatbot-premium",
  "voice-agent",
  "playbook-vault",
  "audit-tool",
  "whitelabel-tools",
  "commission-tracking",
  "member-only-content",
] as const

async function main() {
  const email = process.argv[2] ?? "adamwolfe102@gmail.com"

  if (!process.env.DATABASE_URL) {
    console.error("[FAIL] DATABASE_URL not set — source .env.local first")
    process.exit(1)
  }

  const db = new PrismaClient()
  try {
    const user = await db.user.findUnique({
      where: { email },
      select: { id: true, email: true, name: true, role: true },
    })
    if (!user) {
      console.error(`[FAIL] No user with email ${email}`)
      process.exit(1)
    }

    console.log(`[OK] Found ${user.email} (role: ${user.role})`)

    for (const key of ALL_KEYS) {
      await db.entitlement.upsert({
        where: { userId_key: { userId: user.id, key } },
        create: {
          userId: user.id,
          key,
          grantedByPurchaseId: null,
        },
        update: {
          revokedAt: null,
          grantedByPurchaseId: null,
        },
      })
      console.log(`[GRANT] ${key}`)
    }
    console.log(`\n[DONE] ${user.email} now has all ${ALL_KEYS.length} entitlements.`)
  } finally {
    await db.$disconnect()
  }
}

main().catch((err) => {
  console.error("[FAIL]", err)
  process.exit(1)
})
