import { clerkClient, clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { RESERVED_SUBDOMAINS } from "@/lib/tenant/reserved-subdomains"

// ---------------------------------------------------------------------------
// Hostname-based tenant routing
// ---------------------------------------------------------------------------

// Platform hosts that serve the main AOC app (never rewrite these)
const PLATFORM_HOSTS = new Set([
  'aioperatorcollective.com',
  'www.aioperatorcollective.com',
  'localhost',
  'localhost:3000',
])
// Also allow vercel preview deployments: *.vercel.app
const isPlatformHost = (host: string) =>
  PLATFORM_HOSTS.has(host) || host.endsWith('.vercel.app')

const BASE_HOST = 'aioperatorcollective.com' // subdomain base

function getTenantRouting(
  hostname: string
): { type: 'platform' } | { type: 'subdomain'; slug: string } | { type: 'custom'; hostname: string } {
  // Strip port for localhost dev
  const cleanHost = hostname.split(':')[0]

  if (isPlatformHost(hostname) || isPlatformHost(cleanHost)) return { type: 'platform' }

  // Subdomain of BASE_HOST? e.g. acme.aioperatorcollective.com
  if (cleanHost.endsWith(`.${BASE_HOST}`)) {
    const slug = cleanHost.slice(0, -(BASE_HOST.length + 1))
    if (RESERVED_SUBDOMAINS.has(slug)) return { type: 'platform' }
    // reject deeper subdomains (foo.bar.aioperatorcollective.com) — platform only
    if (slug.includes('.')) return { type: 'platform' }
    return { type: 'subdomain', slug }
  }

  // Foreign hostname → custom domain
  return { type: 'custom', hostname: cleanHost }
}

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
  // Test-email blast — protected by CRON_SECRET, not Clerk
  "/api/admin/test-emails(.*)",
  "/api/lead-magnets/submit(.*)",
  "/api/lead-magnets/ai-playbook(.*)",
  // Whitelabel tenant-page lead capture — public by design.
  "/api/tenant/lead(.*)",
  // Public checkout — self-handles auth (returns 401 with sign-in URL
  // for anonymous visitors). Listing here so middleware doesn't block
  // before our route logic runs.
  "/api/checkout(.*)",
  "/marketplace(.*)",
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
  // Client-facing whitelabel portal — token-authenticated, no Clerk required.
  "/client-portal(.*)",
  "/api/client-portal(.*)",
  // Operator-built public audit funnels — anyone with the link can fill them out.
  "/q(.*)",
  "/api/audits/submit(.*)",
  // TEMP diagnostic — returns Prisma error codes for the prod outage debug.
  "/api/diag(.*)",
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

/**
 * FULL LOCKDOWN MODE
 * When LOCKDOWN_ALLOWLIST is set (comma-separated Clerk user IDs), ONLY those
 * users can authenticate into ANY protected surface (portal/admin/intern/
 * reseller + API equivalents). Everyone else — including other admins —
 * gets bounced to the public site. Public routes remain accessible.
 *
 * Set via env: LOCKDOWN_ALLOWLIST=user_XXXX,user_YYYY
 * Unset or empty → lockdown is off, normal role-based rules apply.
 */
function lockdownAllowlist(): Set<string> {
  const raw = process.env.LOCKDOWN_ALLOWLIST
  if (!raw) return new Set()
  return new Set(raw.split(",").map((s) => s.trim()).filter(Boolean))
}

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

  // Hostname-based tenant routing — runs BEFORE Clerk auth so whitelabel
  // sites are publicly accessible even for unauthenticated visitors.
  // API routes always stay on the platform (resellers' sites call our APIs).
  const routing = getTenantRouting(forwardedHost ?? '')

  if (routing.type === 'subdomain') {
    if (!req.nextUrl.pathname.startsWith('/api/')) {
      const url = req.nextUrl.clone()
      url.pathname = `/sites/${routing.slug}${req.nextUrl.pathname}`
      return NextResponse.rewrite(url)
    }
  }

  if (routing.type === 'custom') {
    if (!req.nextUrl.pathname.startsWith('/api/')) {
      const url = req.nextUrl.clone()
      url.pathname = `/sites/domain/${routing.hostname}${req.nextUrl.pathname}`
      return NextResponse.rewrite(url)
    }
  }

  // type === 'platform' → continue to existing logic

  // Under lockdown, /sign-up is closed — bounce to /sign-in.
  // Public pages stay open so the marketing site + lead-magnet tools
  // continue collecting emails into Close + the LeadMagnetSubmission table.
  if (lockdownAllowlist().size > 0 && req.nextUrl.pathname.startsWith("/sign-up")) {
    return NextResponse.redirect(new URL("/?signups_closed=1", req.url))
  }

  if (isPublicRoute(req)) return NextResponse.next()

  const { userId, sessionClaims } = await auth()

  if (!userId) {
    const signInUrl = new URL("/sign-in", req.url)
    signInUrl.searchParams.set("redirect_url", req.url)
    return NextResponse.redirect(signInUrl)
  }

  // LOCKDOWN: if an allowlist is configured, only those Clerk users can
  // reach any protected surface. Everyone else gets bounced to the public
  // site (UI) or 403 (API).
  const allowlist = lockdownAllowlist()
  if (allowlist.size > 0 && !allowlist.has(userId)) {
    const isUi =
      isPortalRoute(req) || isAdminRoute(req) || isInternRoute(req) || isResellerRoute(req)
    if (isUi) return NextResponse.redirect(new URL("/?locked=1", req.url))
    if (isPortalApiRoute(req) || isAdminApiRoute(req) || isInternApiRoute(req) || isResellerApiRoute(req)) {
      return NextResponse.json({ error: "Service locked" }, { status: 403 })
    }
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
