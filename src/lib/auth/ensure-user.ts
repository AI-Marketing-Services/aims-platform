import { auth, currentUser } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { logger } from "@/lib/logger"
import type { User } from "@prisma/client"

/**
 * Trial credit grant given to every brand-new user. Mirrored as the User
 * row default in `prisma/schema.prisma` (`creditBalance @default(1000)`),
 * but we also write an explicit CreditTransaction ledger entry so the audit
 * trail / billing UI history both show "+1000 trial-grant" instead of a
 * mystery starting balance.
 */
const SIGNUP_TRIAL_CREDITS = 1000

/**
 * Resolve (or lazily create) the DB User row for the signed-in Clerk user.
 *
 * Why: every portal page/API used to do
 *   `db.user.findUnique(...); if (!dbUser) redirect("/sign-in")`
 *   `db.user.findUnique(...); if (!dbUser) return 404 "User not found"`
 * which silently kicked any client whose Clerk webhook hadn't yet landed.
 * That caused the "all sidebar links bounce me to admin" symptom (the /sign-in
 * redirect re-runs auth and hands an admin back to /admin/dashboard) and the
 * "User not found" Lead-Scout error.
 *
 * Single source of truth: if the Clerk session is valid, we always end up
 * with a real User row.
 */
export async function getOrCreateDbUserByClerkId(clerkId: string): Promise<User> {
  const existing = await db.user.findUnique({ where: { clerkId } })
  if (existing) return existing

  const cu = await currentUser()
  const email = cu?.emailAddresses?.[0]?.emailAddress ?? ""
  const name =
    [cu?.firstName, cu?.lastName].filter(Boolean).join(" ") ||
    cu?.fullName ||
    null

  // If a User row already exists for this email but under a stale clerkId
  // (Clerk re-creation, second sign-up with the same address, manual seed,
  // etc.) we must rebind it instead of inserting a new row — both clerkId
  // and email are @unique, so a naïve upsert with create:{...} would throw
  // P2002 and 500 every page that calls ensureDbUser.
  if (email) {
    const byEmail = await db.user.findUnique({ where: { email } })
    if (byEmail) {
      return db.user.update({
        where: { id: byEmail.id },
        data: {
          clerkId,
          ...(name && { name }),
          ...(cu?.imageUrl && { avatarUrl: cu.imageUrl }),
        },
      })
    }
  }

  const created = await db.user.upsert({
    where: { clerkId },
    update: {
      ...(email && { email }),
      ...(name && { name }),
      ...(cu?.imageUrl && { avatarUrl: cu.imageUrl }),
    },
    create: {
      clerkId,
      email: email || `${clerkId}@placeholder.local`,
      name,
      avatarUrl: cu?.imageUrl ?? null,
      // creditBalance is set via @default(1000) in schema. We also stamp
      // the grant timestamp so the monthly-grant cron knows we just gave
      // them their starter pack and shouldn't double-grant on the 1st.
      creditGrantedAt: new Date(),
    },
  })

  // Best-effort ledger entry so the billing UI shows "+1000 trial-grant"
  // and admins can audit who got the bonus. Idempotent: an unique
  // (userId, reason="trial-grant") guard isn't enforced at the DB level —
  // we instead skip if a row already exists for safety on re-runs.
  try {
    const alreadyGranted = await db.creditTransaction.findFirst({
      where: { userId: created.id, reason: "trial-grant" },
      select: { id: true },
    })
    if (!alreadyGranted) {
      await db.creditTransaction.create({
        data: {
          userId: created.id,
          amount: SIGNUP_TRIAL_CREDITS,
          balanceAfter: created.creditBalance,
          reason: "trial-grant",
          metadata: { source: "ensureDbUser", grantedAt: new Date().toISOString() },
        },
      })
    }
  } catch (err) {
    // Don't let a ledger failure block the user from logging in. The
    // creditBalance default already applied; we just lose the audit row.
    logger.error("Failed to write signup trial-grant ledger entry", err, {
      userId: created.id,
    })
  }

  return created
}

/** Page-friendly: redirects to /sign-in if there is no Clerk session. */
export async function ensureDbUser(): Promise<User> {
  const { userId: clerkId } = await auth()
  if (!clerkId) redirect("/sign-in")
  return getOrCreateDbUserByClerkId(clerkId)
}

/**
 * API-friendly: returns the User id (auto-creating the row if needed) for the
 * current Clerk session, or null if there is no signed-in user. Drop-in
 * replacement for the ad-hoc `getDbUserId` helpers that lived in ~40 routes.
 */
export async function ensureDbUserIdForApi(): Promise<string | null> {
  const { userId: clerkId } = await auth()
  if (!clerkId) return null
  const user = await getOrCreateDbUserByClerkId(clerkId)
  return user.id
}
