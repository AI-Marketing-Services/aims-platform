import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server"
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
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/webhooks(.*)",
  "/api/lead-magnets/submit(.*)",
  "/api/referrals/track(.*)",
  "/api/services(.*)",
  "/api/ai(.*)",
  "/api/intake(.*)",
  "/api/admin/bootstrap(.*)",
  "/api/health(.*)",
])

const isAdminRoute = createRouteMatcher(["/admin(.*)"])
const isInternRoute = createRouteMatcher(["/intern(.*)"])
const isResellerRoute = createRouteMatcher(["/reseller(.*)"])
const isPortalRoute = createRouteMatcher(["/portal(.*)"])

// API route matchers for defense-in-depth protection
const isAdminApiRoute = createRouteMatcher(["/api/admin(.*)"])
const isInternApiRoute = createRouteMatcher(["/api/intern(.*)"])
const isPortalApiRoute = createRouteMatcher(["/api/portal(.*)"])

export default clerkMiddleware(async (auth, req) => {
  if (isPublicRoute(req)) return NextResponse.next()

  const { userId, sessionClaims } = await auth()

  if (!userId) {
    const signInUrl = new URL("/sign-in", req.url)
    signInUrl.searchParams.set("redirect_url", req.url)
    return NextResponse.redirect(signInUrl)
  }

  const role = (sessionClaims?.metadata as { role?: string })?.role ?? "CLIENT"

  // Role-based route protection
  if (isAdminRoute(req) && !["ADMIN", "SUPER_ADMIN"].includes(role)) {
    return NextResponse.redirect(new URL("/portal/dashboard", req.url))
  }

  if (isInternRoute(req) && !["INTERN", "ADMIN", "SUPER_ADMIN"].includes(role)) {
    return NextResponse.redirect(new URL("/portal/dashboard", req.url))
  }

  if (isResellerRoute(req) && !["RESELLER", "ADMIN", "SUPER_ADMIN"].includes(role)) {
    return NextResponse.redirect(new URL("/portal/dashboard", req.url))
  }

  // Defense-in-depth: protect API routes by role (routes still check auth internally)
  if (isAdminApiRoute(req) && !["ADMIN", "SUPER_ADMIN"].includes(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  if (isInternApiRoute(req) && !["INTERN", "ADMIN", "SUPER_ADMIN"].includes(role)) {
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
