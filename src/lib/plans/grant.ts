/**
 * Plan grant helper — applies a plan to a user *without* a Stripe charge.
 *
 * Used by:
 *   - The admin "comp this tester" endpoint at /api/admin/users/[id]/grant-plan
 *   - The grandfather script (scripts/grandfather-plan.ts)
 *
 * The plumbing for paid plan grants lives in the Stripe webhook, NOT here —
 * this is the manual / admin path that bypasses Stripe entirely. Both paths
 * end up in the same final state (User.planSlug set, entitlements granted,
 * monthly credit pack applied) so the rest of the app doesn't care which
 * route created the grant.
 */
import { db } from "@/lib/db"
import { logger } from "@/lib/logger"
import { grantEntitlement, revokeEntitlement } from "@/lib/entitlements"
import { grantCredits } from "@/lib/enrichment/credits/ledger"
import {
  ALL_FEATURE_ENTITLEMENTS,
  getPlan,
  type PlanDef,
} from "./registry"

export interface GrantPlanOptions {
  /** Skip the credit grant — useful for grandfathering testers who already have credits. */
  skipCredits?: boolean
  /** Note attached to ledger + entitlement metadata for audit. */
  note?: string
}

export interface GrantPlanResult {
  ok: true
  userId: string
  planSlug: string
  entitlementsGranted: string[]
  entitlementsRevoked: string[]
  creditsGranted: number
}

/**
 * Apply a plan to a user. Idempotent — safe to re-run with the same plan.
 *
 *   - Sets User.planSlug + creditPlanTier
 *   - Grants all plan entitlements (upserts)
 *   - Revokes any old feature entitlements that the new plan doesn't include
 *     (so downgrading from operator → pro pulls the operator-only features)
 *   - Optionally grants the monthly credit pack
 */
export async function grantPlanToUser(
  userId: string,
  planSlug: string,
  options: GrantPlanOptions = {},
): Promise<GrantPlanResult> {
  const plan = getPlan(planSlug)
  if (!plan) {
    throw new Error(`Unknown plan slug: ${planSlug}`)
  }

  const user = await db.user.findUnique({ where: { id: userId } })
  if (!user) throw new Error(`User ${userId} not found`)

  await db.user.update({
    where: { id: userId },
    data: {
      planSlug: plan.slug,
      creditPlanTier: plan.slug,
    },
  })

  // Grant entitlements this plan covers.
  for (const key of plan.entitlements) {
    await grantEntitlement({ userId, key, expiresAt: null })
  }

  // Revoke any feature entitlements the new plan does NOT include. This
  // matters for downgrades (operator → pro removes CRM, Lead Scout, etc.).
  // We only touch keys in ALL_FEATURE_ENTITLEMENTS so we don't accidentally
  // pull legacy entitlements like `chatbot-premium` that came from a
  // separate Purchase.
  const planSet = new Set<string>(plan.entitlements)
  const toRevoke = ALL_FEATURE_ENTITLEMENTS.filter((k) => !planSet.has(k))
  for (const key of toRevoke) {
    await revokeEntitlement(userId, key)
  }

  let creditsGranted = 0
  if (!options.skipCredits && plan.creditsPerMonth > 0) {
    try {
      await grantCredits({
        userId,
        amount: plan.creditsPerMonth,
        reason: "monthly-grant",
        metadata: {
          source: "admin-grant",
          planSlug: plan.slug,
          note: options.note,
        },
      })
      creditsGranted = plan.creditsPerMonth
    } catch (err) {
      logger.error("grantPlanToUser: credit grant failed", err, {
        userId,
        planSlug: plan.slug,
      })
    }
  }

  return {
    ok: true,
    userId,
    planSlug: plan.slug,
    entitlementsGranted: [...plan.entitlements],
    entitlementsRevoked: toRevoke,
    creditsGranted,
  }
}

/**
 * Same as grantPlanToUser but accepts an email — useful for Clerk-invited
 * users who haven't logged in yet (no User row exists). Returns null in
 * that case so the caller can decide how to surface the warning.
 */
export async function grantPlanByEmail(
  email: string,
  planSlug: string,
  options: GrantPlanOptions = {},
): Promise<GrantPlanResult | { ok: false; reason: "user_not_found"; email: string }> {
  const user = await db.user.findUnique({
    where: { email },
    select: { id: true },
  })
  if (!user) return { ok: false, reason: "user_not_found", email }
  return grantPlanToUser(user.id, planSlug, options)
}

/** Read-only plan info for UI/admin pages. */
export function describePlan(planSlug: string): PlanDef | null {
  return getPlan(planSlug)
}
