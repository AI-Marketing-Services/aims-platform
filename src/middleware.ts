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
): Promise<string> {
  const claimRole =
    sessionClaims?.metadata?.role ?? sessionClaims?.publicMetadata?.role
  if (claimRole) return claimRole
  try {
    const user = await (await clerkClient()).users.getUser(userId)
    return (user.publicMetadata as { role?: string })?.role ?? "CLIENT"
  } catch {
    return "CLIENT"
  }
}

export default clerkMiddleware(async (auth, req) => {
  if (isPublicRoute(req)) return NextResponse.next()

  const { userId, sessionClaims } = await auth()

  if (!userId) {
    const signInUrl = new URL("/sign-in", req.url)
    signInUrl.searchParams.set("redirect_url", req.url)
    return NextResponse.redirect(signInUrl)
  }

  // Short-circuit: the portal API is the hot path for logged-in clients.
  // No role check needed beyond "is signed in".
  if (isPortalApiRoute(req)) return NextResponse.next()

  // Only pay the role-resolution cost on role-gated surfaces.
  const needsRoleCheck =
    isAdminRoute(req) ||
    isInternRoute(req) ||
    isResellerRoute(req) ||
    isAdminApiRoute(req) ||
    isInternApiRoute(req) ||
    isResellerApiRoute(req)

  if (!needsRoleCheck) return NextResponse.next()

  const role = await resolveRole(
    sessionClaims as { metadata?: { role?: string }; publicMetadata?: { role?: string } } | null,
    userId
  )

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
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  if (isInternApiRoute(req) && !["INTERN", "ADMIN", "SUPER_ADMIN"].includes(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  if (isResellerApiRoute(req) && !["RESELLER", "ADMIN", "SUPER_ADMIN"].includes(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
}
