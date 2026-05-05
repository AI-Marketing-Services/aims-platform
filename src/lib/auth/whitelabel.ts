import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { getOrCreateDbUserByClerkId } from "@/lib/auth/ensure-user"

export type WhitelabelAccessResult =
  | { ok: true; clerkId: string; dbUserId: string; role: string }
  | { ok: false; status: 401 | 403; error: string; reason: WhitelabelDenyReason }

export type WhitelabelDenyReason =
  | "unauthenticated"
  | "no_role"
  | "client_onboarding_incomplete"

/**
 * Authorization helper for whitelabel features (custom branding +
 * custom domains).
 *
 * Whitelabel is available to:
 *   - SUPER_ADMIN / ADMIN — always (full access for support and ops)
 *   - RESELLER — always (this is core to the partner program)
 *   - CLIENT — ONLY if their member onboarding is 100% complete
 *     (`MemberProfile.onboardingCompletedAt IS NOT NULL`)
 *
 * Rationale: opening whitelabel to every CLIENT today reduces support
 * load (people who haven't even finished setup shouldn't be configuring
 * DNS), while keeping the door open for power users who've shown they
 * can run the platform end-to-end.
 *
 * When we eventually monetize whitelabel as an a-la-carte add-on, the
 * gate moves here — swap the onboarding check for a Stripe entitlement
 * check and every consumer keeps working.
 */
export async function checkWhitelabelAccess(): Promise<WhitelabelAccessResult> {
  const { userId, sessionClaims } = await auth()
  if (!userId) {
    return {
      ok: false,
      status: 401,
      error: "Sign in required",
      reason: "unauthenticated",
    }
  }

  const role = (sessionClaims?.metadata as { role?: string })?.role
  if (!role) {
    return {
      ok: false,
      status: 403,
      error: "Forbidden",
      reason: "no_role",
    }
  }

  // Admins and resellers always pass.
  if (role === "ADMIN" || role === "SUPER_ADMIN" || role === "RESELLER") {
    const dbUser = await getOrCreateDbUserByClerkId(userId)
    return { ok: true, clerkId: userId, dbUserId: dbUser.id, role }
  }

  // CLIENT users must have completed onboarding to get whitelabel.
  if (role === "CLIENT") {
    const dbUser = await getOrCreateDbUserByClerkId(userId)
    const profile = await db.memberProfile.findUnique({
      where: { userId: dbUser.id },
      select: { onboardingCompletedAt: true },
    })
    if (!profile?.onboardingCompletedAt) {
      return {
        ok: false,
        status: 403,
        error:
          "Whitelabel unlocks once you complete onboarding. Finish your Getting Started checklist to enable custom branding and domains.",
        reason: "client_onboarding_incomplete",
      }
    }
    return { ok: true, clerkId: userId, dbUserId: dbUser.id, role }
  }

  return {
    ok: false,
    status: 403,
    error: "Forbidden",
    reason: "no_role",
  }
}
