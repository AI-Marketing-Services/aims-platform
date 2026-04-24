import { db } from "@/lib/db"

/**
 * Single source of truth for "is user X allowed to use feature Y?".
 *
 * The Entitlement table is denormalized: there's at most one row per
 * (userId, key). It's kept fresh by the Stripe webhook handler
 * (subscription created/updated/deleted, charge refunded) and by the
 * admin-grant endpoint. Routes never compute entitlements from
 * Purchase rows directly — they just read the table.
 *
 * Three states a row can be in:
 *   1. Active:  revokedAt is null AND (expiresAt is null OR expiresAt > now)
 *   2. Expired: expiresAt < now
 *   3. Revoked: revokedAt is set (cancellation, refund, admin clawback)
 */

export const ENTITLEMENT_KEYS = {
  CHATBOT_PREMIUM: "chatbot-premium",
  VOICE_AGENT: "voice-agent",
  PLAYBOOK_VAULT: "playbook-vault",
  AUDIT_TOOL: "audit-tool",
  WHITELABEL_TOOLS: "whitelabel-tools",
  COMMISSION_TRACKING: "commission-tracking",
  MEMBER_ONLY_CONTENT: "member-only-content",
} as const

export type EntitlementKey = (typeof ENTITLEMENT_KEYS)[keyof typeof ENTITLEMENT_KEYS]

/** Returns true iff the user currently has the entitlement and it isn't expired/revoked. */
export async function hasEntitlement(
  userId: string,
  key: EntitlementKey | string,
): Promise<boolean> {
  if (!userId) return false
  const row = await db.entitlement.findUnique({
    where: { userId_key: { userId, key } },
    select: { revokedAt: true, expiresAt: true },
  })
  if (!row) return false
  if (row.revokedAt) return false
  if (row.expiresAt && row.expiresAt.getTime() < Date.now()) return false
  return true
}

/** Resolve all active entitlement keys for a user — useful for sidebar/UI gating. */
export async function listActiveEntitlements(userId: string): Promise<string[]> {
  if (!userId) return []
  const rows = await db.entitlement.findMany({
    where: {
      userId,
      revokedAt: null,
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
    select: { key: true },
  })
  return rows.map((r) => r.key)
}

/**
 * Throws an EntitlementError if the user lacks the entitlement. Routes
 * catch this and return 402 Payment Required with a structured body so
 * the client can prompt an upgrade flow instead of treating it as auth.
 */
export class EntitlementError extends Error {
  constructor(public readonly key: string) {
    super(`Missing entitlement: ${key}`)
    this.name = "EntitlementError"
  }
}

export async function requireEntitlement(
  userId: string,
  key: EntitlementKey | string,
): Promise<void> {
  const ok = await hasEntitlement(userId, key)
  if (!ok) throw new EntitlementError(key)
}

/**
 * Grant or refresh an entitlement. Used by:
 *   - Stripe webhook on subscription.created / invoice.paid
 *   - Admin manual grant ("comp this user the voice agent")
 *
 * Idempotent: re-granting an existing entitlement just updates expiresAt
 * and grantedByPurchaseId. Revoked entitlements are revived by clearing
 * revokedAt — no new row gets created.
 */
export async function grantEntitlement(params: {
  userId: string
  key: string
  purchaseId?: string | null
  expiresAt?: Date | null
}): Promise<void> {
  const { userId, key, purchaseId = null, expiresAt = null } = params
  await db.entitlement.upsert({
    where: { userId_key: { userId, key } },
    create: {
      userId,
      key,
      grantedByPurchaseId: purchaseId,
      expiresAt,
    },
    update: {
      grantedByPurchaseId: purchaseId,
      expiresAt,
      revokedAt: null,
    },
  })
}

/**
 * Revoke an entitlement (cancel, refund, admin pull). Soft-delete via
 * revokedAt rather than hard-delete so we keep an audit trail and can
 * reactivate cleanly on rebuy.
 */
export async function revokeEntitlement(userId: string, key: string): Promise<void> {
  await db.entitlement
    .update({
      where: { userId_key: { userId, key } },
      data: { revokedAt: new Date() },
    })
    .catch(() => {
      // No matching row — nothing to revoke. Acceptable.
    })
}

/**
 * Reconcile a user's entitlements against their active purchases. Run
 * after any purchase status change to make sure the table reflects
 * truth. Cheap (one query for active purchases, then upserts).
 */
export async function reconcileEntitlementsForUser(userId: string): Promise<void> {
  const activePurchases = await db.purchase.findMany({
    where: {
      userId,
      status: { in: ["active", "trialing"] },
    },
    include: { product: { select: { entitlements: true } } },
  })

  // Union of all entitlement keys this user should currently have.
  const shouldHave = new Set<string>()
  const purchaseByKey = new Map<string, string>() // key → purchaseId
  for (const p of activePurchases) {
    for (const k of p.product.entitlements) {
      shouldHave.add(k)
      // Most-recent purchase wins as the source.
      purchaseByKey.set(k, p.id)
    }
  }

  // Grant or refresh each key the user should have.
  for (const key of shouldHave) {
    await db.entitlement.upsert({
      where: { userId_key: { userId, key } },
      create: { userId, key, grantedByPurchaseId: purchaseByKey.get(key) ?? null },
      update: { grantedByPurchaseId: purchaseByKey.get(key) ?? null, revokedAt: null },
    })
  }

  // Revoke anything the user has but shouldn't.
  const existing = await db.entitlement.findMany({
    where: { userId, revokedAt: null },
    select: { key: true },
  })
  for (const e of existing) {
    if (!shouldHave.has(e.key)) {
      await db.entitlement.update({
        where: { userId_key: { userId, key: e.key } },
        data: { revokedAt: new Date() },
      })
    }
  }
}
