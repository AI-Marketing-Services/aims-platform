import { clerkClient, clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

const isPublicRoute = createRouteMatcher([
  "/",
  "/marketplace(.*)",
  "/services(.*)",
  "/industries(.*)",
  "/tools(.*)",
  "/partners(.*)",
  "/for/(.*)",
  "/case-studies(.*)",
  "/careers(.*)",
  "/pricing(.*)",
  "/about(.*)",
  "/why-aims(.*)",
  "/blog(.*)",
  "/get-started(.*)",
  "/crm-onboarding(.*)",
  "/solutions(.*)",
  "/features(.*)",
  "/privacy(.*)",
  "/terms(.*)",
  "/disclosures(.*)",
  "/unsubscribe(.*)",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/webhooks(.*)",
  // Bootstrap endpoint authenticates with a shared secret, not Clerk.
  // Leaving it out of the public list would force Clerk auth ahead of
  // the route's own secret check, making it impossible to promote the
  // first admin on a fresh instance.
  "/api/admin/bootstrap(.*)",
  "/api/lead-magnets/submit(.*)",
  "/api/lead-magnets/ai-playbook(.*)",
  "/api/referrals/track(.*)",
  "/api/services(.*)",
  "/api/ai/chat(.*)",
  "/api/ai/intake-chat(.*)",
  "/api/ai/onboarding-chat(.*)",
  "/api/ai/audit(.*)",
  "/api/ai/opportunity-audit(.*)",
  "/api/intake(.*)",
  "/api/health(.*)",
  "/apply(.*)",
  "/api/community/lead(.*)",
  "/api/community/apply(.*)",
  "/api/unsubscribe(.*)",
])

const isAdminRoute = createRouteMatcher(["/admin(.*)"])
const isInternRoute = createRouteMatcher(["/intern(.*)"])
const isResellerRoute = createRouteMatcher(["/reseller(.*)"])
const isPortalRoute = createRouteMatcher(["/portal(.*)"])

// API route matchers for defense-in-depth protection
const isAdminApiRoute = createRouteMatcher(["/api/admin(.*)"])
const isInternApiRoute = createRouteMatcher(["/api/intern(.*)"])
const isResellerApiRoute = createRouteMatcher(["/api/reseller(.*)"])
const isPortalApiRoute = createRouteMatcher(["/api/portal(.*)"])

/**
 * Resolve a user's role from the Clerk session claim, with a fallback to
 * the Clerk backend API when the claim is absent.
 *
 * Why: by default Clerk's session token does NOT include publicMetadata.
 * To get the `metadata.role` claim the session token template has to be
 * customised in the Clerk dashboard (Sessions → Customize session token
 * → `{"metadata": "{{user.public_metadata}}"}`). Until someone does
 * that, every request would see role = undefined → CLIENT → admins
 * bounced to /portal/dashboard. The fallback queries Clerk for the user's
 * publicMetadata so role-gated routes keep working regardless of the
 * session template config. Only pays the extra round-trip when the claim
 * is missing.
 */
async function resolveRole(
  sessionClaims: { metadata?: { role?: string }; publicMetadata?: { role?: string } } | null,
  userId: string
): Promise<string | null> {
  const claimRole =
    sessionClaims?.metadata?.role ?? sessionClaims?.publicMetadata?.role
  if (claimRole) return claimRole
  try {
    const user = await (await clerkClient()).users.getUser(userId)
    return (user.publicMetadata as { role?: string })?.role ?? null
  } catch {
    return null
  }
}

const VALID_PORTAL_ROLES = new Set([
  "CLIENT",
  "RESELLER",
  "INTERN",
  "ADMIN",
  "SUPER_ADMIN",
])

export default clerkMiddleware(async (auth, req) => {
  // Apex -> www canonical-host redirect.
  //
  // The same rule exists in next.config.ts, but in practice it doesn't
  // always fire on Vercel — likely because edge-level host handling
  // rewrites the Host header before Next's redirect matcher sees it.
  // Doing it here in middleware is 100% reliable because we read the
  // x-forwarded-host header (which Vercel always sets to the original
  // hostname the user typed) directly, and the redirect happens before
  // any Clerk/auth logic runs.
  const forwardedHost = req.headers.get("x-forwarded-host") ?? req.headers.get("host")
  if (forwardedHost === "aioperatorcollective.com") {
    const url = new URL(req.url)
    url.host = "www.aioperatorcollective.com"
    url.protocol = "https:"
    url.port = ""
    return NextResponse.redirect(url, 308)
  }

  if (isPublicRoute(req)) return NextResponse.next()

  const { userId, sessionClaims } = await auth()

  if (!userId) {
    const signInUrl = new URL("/sign-in", req.url)
    signInUrl.searchParams.set("redirect_url", req.url)
    return NextResponse.redirect(signInUrl)
  }

  // Every authenticated surface (portal/admin/intern/reseller + their
  // API equivalents) is invitation-only: the user must have an explicit
  // role baked into publicMetadata by either the Clerk invite flow
  // (see /api/admin/users/invite) or a manual admin action. Self-signups
  // that somehow land a Clerk account with no role are denied here.
  const needsRoleCheck =
    isPortalRoute(req) ||
    isAdminRoute(req) ||
    isInternRoute(req) ||
    isResellerRoute(req) ||
    isPortalApiRoute(req) ||
    isAdminApiRoute(req) ||
    isInternApiRoute(req) ||
    isResellerApiRoute(req)

  if (!needsRoleCheck) return NextResponse.next()

  const role = await resolveRole(
    sessionClaims as { metadata?: { role?: string }; publicMetadata?: { role?: string } } | null,
    userId
  )

  const isUiRoute =
    isPortalRoute(req) || isAdminRoute(req) || isInternRoute(req) || isResellerRoute(req)
  const denyUi = () => NextResponse.redirect(new URL("/apply?no_access=1", req.url))
  const denyApi = () => NextResponse.json({ error: "Forbidden" }, { status: 403 })

  if (!role || !VALID_PORTAL_ROLES.has(role)) {
    return isUiRoute ? denyUi() : denyApi()
  }

  if (isAdminRoute(req) && !["ADMIN", "SUPER_ADMIN"].includes(role)) {
    return NextResponse.redirect(new URL("/portal/dashboard", req.url))
  }
  if (isInternRoute(req) && !["INTERN", "ADMIN", "SUPER_ADMIN"].includes(role)) {
    return NextResponse.redirect(new URL("/portal/dashboard", req.url))
  }
  if (isResellerRoute(req) && !["RESELLER", "ADMIN", "SUPER_ADMIN"].includes(role)) {
    return NextResponse.redirect(new URL("/portal/dashboard", req.url))
  }

  if (isAdminApiRoute(req) && !["ADMIN", "SUPER_ADMIN"].includes(role)) {
    return denyApi()
  }
  if (isInternApiRoute(req) && !["INTERN", "ADMIN", "SUPER_ADMIN"].includes(role)) {
    return denyApi()
  }
  if (isResellerApiRoute(req) && !["RESELLER", "ADMIN", "SUPER_ADMIN"].includes(role)) {
    return denyApi()
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
}
