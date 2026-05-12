import { auth, clerkClient } from "@clerk/nextjs/server"
import { cookies } from "next/headers"
import { db } from "@/lib/db"

// ---------------------------------------------------------------------------
// Shared types + constants
// ---------------------------------------------------------------------------

export const VIEW_AS_COOKIE = "__aims_view_as"

export type Role = "CLIENT" | "RESELLER" | "INTERN" | "ADMIN" | "SUPER_ADMIN"

const ALL_ROLES = ["CLIENT", "RESELLER", "INTERN", "ADMIN", "SUPER_ADMIN"] as const
const PREVIEWABLE_ROLES = ["CLIENT", "RESELLER", "INTERN"] as const

type RoleClaims = {
  metadata?: { role?: string }
  publicMetadata?: { role?: string }
} | null

// ---------------------------------------------------------------------------
// Real role resolution — claim → Clerk backend → DB fallback
// ---------------------------------------------------------------------------

async function resolveRole(claims: RoleClaims, userId: string): Promise<Role | null> {
  const claimRole = claims?.metadata?.role ?? claims?.publicMetadata?.role
  if (claimRole && (ALL_ROLES as readonly string[]).includes(claimRole)) {
    return claimRole as Role
  }

  try {
    const clerkUser = await (await clerkClient()).users.getUser(userId)
    const clerkRole = (clerkUser.publicMetadata as { role?: string })?.role
    if (clerkRole && (ALL_ROLES as readonly string[]).includes(clerkRole)) {
      return clerkRole as Role
    }
  } catch {
    // fall through to DB
  }

  try {
    const dbUser = await db.user.findUnique({
      where: { clerkId: userId },
      select: { role: true },
    })
    if (dbUser?.role && (ALL_ROLES as readonly string[]).includes(dbUser.role)) {
      return dbUser.role as Role
    }
  } catch {
    // nothing left
  }
  return null
}

// ---------------------------------------------------------------------------
// Legacy admin gate (kept for callers that only need "is this an admin?")
// ---------------------------------------------------------------------------

/**
 * Returns the Clerk userId if the caller is an ADMIN or SUPER_ADMIN,
 * otherwise null. Does NOT honour the view-as cookie — this is about
 * "can this user DO admin things?" not "what UI should we show?".
 */
export async function requireAdmin(): Promise<string | null> {
  const { userId, sessionClaims } = await auth()
  if (!userId) return null
  const role = await resolveRole(sessionClaims as RoleClaims, userId)
  if (!role || !["ADMIN", "SUPER_ADMIN"].includes(role)) return null
  return userId
}

// ---------------------------------------------------------------------------
// Effective role (role + view-as cookie) — used by every gated layout so
// preview mode behaves consistently across portal / reseller / intern.
// ---------------------------------------------------------------------------

export type EffectiveRoleResult = {
  userId: string
  realRole: Role
  effectiveRole: Role
  isPreviewing: boolean
}

/**
 * Resolve the effective role for the current request. Non-admins can
 * never elevate via the cookie — only ADMIN/SUPER_ADMIN picks up the
 * preview override.
 */
export async function getEffectiveRole(): Promise<EffectiveRoleResult | null> {
  const { userId, sessionClaims } = await auth()
  if (!userId) return null

  const realRole = await resolveRole(sessionClaims as RoleClaims, userId)
  if (!realRole) return null

  const isAdminish = realRole === "ADMIN" || realRole === "SUPER_ADMIN"
  if (!isAdminish) {
    return { userId, realRole, effectiveRole: realRole, isPreviewing: false }
  }

  const store = await cookies()
  const cookieRole = store.get(VIEW_AS_COOKIE)?.value
  if (cookieRole && (PREVIEWABLE_ROLES as readonly string[]).includes(cookieRole)) {
    return {
      userId,
      realRole,
      effectiveRole: cookieRole as Role,
      isPreviewing: true,
    }
  }

  return { userId, realRole, effectiveRole: realRole, isPreviewing: false }
}

/**
 * Convenience for layouts: returns the result if the effective role is
 * allowed, otherwise null so the caller can redirect. Using this helper
 * instead of ad-hoc role arrays in each layout stops the allowlists
 * from drifting as we add new roles.
 */
export async function requireEffectiveRole(
  allowed: readonly Role[],
): Promise<EffectiveRoleResult | null> {
  const result = await getEffectiveRole()
  if (!result) return null
  if (!allowed.includes(result.effectiveRole)) return null
  return result
}

/** Where to land a given role when they have no specific destination. */
export function dashboardForRole(role: Role): string {
  switch (role) {
    case "ADMIN":
    case "SUPER_ADMIN":
      return "/admin/dashboard"
    case "INTERN":
      return "/intern/dashboard"
    case "RESELLER":
    case "CLIENT":
    default:
      // Reseller-portal pages were consolidated into the client portal
      // on 2026-05-12. RESELLER role remains for commission attribution
      // + access gating to whitelabel features, but lands on the same
      // dashboard as CLIENT. The "Whitelabel" sidebar section is shown
      // conditionally based on plan tier / entitlement, not URL.
      return "/portal/dashboard"
  }
}
