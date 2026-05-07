import "server-only"

import { cookies } from "next/headers"

/**
 * Attribution cookie set when a visitor lands on a reseller's tenant
 * page (subdomain OR custom domain). If the visitor later converts
 * on the main platform (e.g. /tools/ai-playbook, /apply), the lead
 * still gets credited to the reseller who drove them — the Dub.co
 * pattern.
 *
 * Scope: set on the apex domain (aioperatorcollective.com) so it
 * travels with the visitor across platform pages. Custom-domain
 * visitors won't share cookies with the platform host, so for those
 * we tag the Deal at submit-time on the tenant page itself.
 */
export const ATTRIBUTION_COOKIE = "aoc_ref"
const ATTRIBUTION_TTL_DAYS = 30

/**
 * Set the attribution cookie for the given reseller. Called from tenant
 * page layouts.
 *
 * Next.js 16 throws when `cookies().set()` is called from a Server
 * Component (it's only valid in Server Actions and Route Handlers).
 * Tenant page layouts ARE Server Components, so calling this function
 * the obvious way crashes the entire page with "Cookies can only be
 * modified in a Server Action or Route Handler", and the visitor sees
 * the global error.tsx instead of the operator's branded landing.
 *
 * We swallow the failure with a warn-level log because attribution is
 * a nice-to-have, not a correctness boundary. Cross-domain attribution
 * for custom-domain visitors is handled at form-submit time anyway
 * (see /api/tenant/lead). The attribution cookie is only valuable when
 * the visitor lands on a subdomain on the platform apex AND later
 * converts on the platform apex itself — a narrow case.
 *
 * Long-term cleanup: move this into the platform middleware so cookies
 * are set on the response object directly, where Next.js permits it.
 */
export async function setAttributionCookie(resellerId: string): Promise<void> {
  if (!resellerId) return

  try {
    const store = await cookies()
    // Don't overwrite an existing attribution if present. First-touch wins —
    // matches how most affiliate networks handle repeat visitors to avoid
    // credit-war churn between two resellers.
    if (store.get(ATTRIBUTION_COOKIE)?.value) return

    store.set({
      name: ATTRIBUTION_COOKIE,
      value: resellerId,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: ATTRIBUTION_TTL_DAYS * 24 * 60 * 60,
      // No `domain` — default scopes to the apex the visitor is on. On a
      // custom domain the cookie doesn't leak; on the platform apex it
      // travels across subdomains naturally.
    })
  } catch (err) {
    // In Next.js 16, calling cookies().set() from a Server Component
    // throws. Tenant layouts are Server Components, so this branch is
    // hit on every tenant page render. Log + continue — the alternative
    // (re-throwing) crashes the whole landing page with a generic
    // "Something went wrong" for first-time visitors.
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        "[attribution] cookies().set failed in tenant layout — non-fatal",
        err instanceof Error ? err.message : err,
      )
    }
  }
}

/** Read the attribution cookie. Returns null if absent. */
export async function getAttributionResellerId(): Promise<string | null> {
  const store = await cookies()
  const raw = store.get(ATTRIBUTION_COOKIE)?.value
  if (!raw) return null
  // Guard against garbage. Reseller ids are cuids (25 chars alnum).
  if (!/^[a-z0-9]{10,40}$/.test(raw)) return null
  return raw
}

/**
 * Read the cookie and verify the user still exists and is an eligible
 * reseller with a published site. Returns null for any failed check so
 * a stale/bogus cookie never taints a real conversion.
 */
export async function getValidatedAttributionResellerId(
  db: typeof import("@/lib/db").db,
): Promise<string | null> {
  const id = await getAttributionResellerId()
  if (!id) return null
  try {
    const user = await db.user.findUnique({
      where: { id },
      select: {
        role: true,
        operatorSite: { select: { isPublished: true } },
      },
    })
    const ok =
      user &&
      (user.role === "RESELLER" || user.role === "ADMIN" || user.role === "SUPER_ADMIN") &&
      user.operatorSite?.isPublished
    return ok ? id : null
  } catch {
    return null
  }
}

export async function clearAttributionCookie(): Promise<void> {
  const store = await cookies()
  store.delete(ATTRIBUTION_COOKIE)
}
