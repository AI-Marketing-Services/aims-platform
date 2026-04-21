import { auth, clerkClient } from "@clerk/nextjs/server"
import { db } from "@/lib/db"

type RoleClaims = {
  metadata?: { role?: string }
  publicMetadata?: { role?: string }
} | null

/**
 * Resolve a signed-in user's role. Fallback chain:
 * 1. Session claim (fastest, no round-trip)
 * 2. Clerk backend user lookup (publicMetadata)
 * 3. Our own DB User.role (matches admin layout's fallback so both can't disagree)
 */
async function resolveRole(claims: RoleClaims, userId: string): Promise<string | null> {
  const claimRole = claims?.metadata?.role ?? claims?.publicMetadata?.role
  if (claimRole) return claimRole

  try {
    const clerkUser = await (await clerkClient()).users.getUser(userId)
    const clerkRole = (clerkUser.publicMetadata as { role?: string })?.role
    if (clerkRole) return clerkRole
  } catch {
    // fall through to DB
  }

  try {
    const dbUser = await db.user.findUnique({
      where: { clerkId: userId },
      select: { role: true },
    })
    return dbUser?.role ?? null
  } catch {
    return null
  }
}

/**
 * Returns the Clerk userId if the caller is an ADMIN or SUPER_ADMIN,
 * otherwise null. Does NOT touch the DB — mirrors middleware's gate so
 * the two can't disagree if a user's DB row has a stale clerkId.
 */
export async function requireAdmin(): Promise<string | null> {
  const { userId, sessionClaims } = await auth()
  if (!userId) return null
  const role = await resolveRole(sessionClaims as RoleClaims, userId)
  if (!role || !["ADMIN", "SUPER_ADMIN"].includes(role)) return null
  return userId
}
