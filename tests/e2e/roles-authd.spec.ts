import { test, expect } from "@playwright/test"

/**
 * Authenticated per-role smoke.
 *
 * Skipped by default. Enable by setting one or more of:
 *   CLERK_SIGNIN_ADMIN_TOKEN     — admin user sign-in token from Clerk
 *   CLERK_SIGNIN_RESELLER_TOKEN  — reseller user sign-in token
 *   CLERK_SIGNIN_INTERN_TOKEN    — intern user sign-in token
 *   CLERK_SIGNIN_CLIENT_TOKEN    — client user sign-in token
 *
 * How to generate tokens:
 *   https://clerk.com/docs/testing/overview → "signInToken" flow
 *   Each token is one-time-use; issue a fresh one per CI run.
 *
 * What this test asserts, per role:
 *   1. Sign-in with the token lands on the role's dashboard.
 *   2. Every sidebar link navigates without redirecting the user OUT
 *      of their own environment (catches the cross-env bounces Adam
 *      reported — e.g. "click Getting Started, end up on admin").
 *   3. No 5xx / "Application error" page appears on any nav.
 *
 * If a token env var is missing, the role's tests skip. Safe to
 * commit with no tokens configured.
 */

type RolePlan = {
  name: "admin" | "reseller" | "intern" | "client"
  tokenEnv: string
  expectedDashboard: string
  sidebarLinks: string[]
}

const ROLE_PLANS: RolePlan[] = [
  {
    name: "admin",
    tokenEnv: "CLERK_SIGNIN_ADMIN_TOKEN",
    expectedDashboard: "/admin/dashboard",
    sidebarLinks: [
      "/admin/crm",
      "/admin/applications",
      "/admin/follow-ups",
      "/admin/members",
      "/admin/invoices",
      "/admin/support",
      "/admin/chat-sessions",
      "/admin/whitelabel",
      "/admin/knowledge",
      "/admin/ideas",
    ],
  },
  {
    name: "reseller",
    tokenEnv: "CLERK_SIGNIN_RESELLER_TOKEN",
    expectedDashboard: "/reseller/dashboard",
    sidebarLinks: [
      "/reseller/clients",
      "/reseller/commissions",
      "/reseller/resources",
      "/reseller/settings/branding",
      "/reseller/settings/domain",
    ],
  },
  {
    name: "intern",
    tokenEnv: "CLERK_SIGNIN_INTERN_TOKEN",
    expectedDashboard: "/intern/dashboard",
    sidebarLinks: ["/intern/tasks", "/intern/sprints", "/intern/eod-report", "/intern/portfolio"],
  },
  {
    name: "client",
    tokenEnv: "CLERK_SIGNIN_CLIENT_TOKEN",
    expectedDashboard: "/portal/dashboard",
    sidebarLinks: [
      "/portal/onboard",
      "/portal/support",
      "/portal/billing",
      "/portal/settings",
    ],
  },
]

for (const plan of ROLE_PLANS) {
  test.describe(`${plan.name} — authenticated role walk`, () => {
    const signInToken = process.env[plan.tokenEnv]

    test.skip(!signInToken, `Set ${plan.tokenEnv} to run`)

    test("lands on own dashboard and walks sidebar without cross-env bounces", async ({
      page,
      baseURL,
    }) => {
      // Sign in via Clerk's signInToken flow. Clerk docs:
      //   https://clerk.com/docs/testing/overview
      await page.goto(`${baseURL}/sign-in?__clerk_ticket=${signInToken}`, {
        waitUntil: "domcontentloaded",
      })

      // Wait for Clerk to process the ticket + redirect.
      await page.waitForURL((url) => !url.pathname.startsWith("/sign-in"), {
        timeout: 15_000,
      })

      // Each role's layout redirects any user with the wrong role to
      // their own dashboard. If we land anywhere else, the role gating
      // is broken.
      const landingPath = new URL(page.url()).pathname
      expect(
        landingPath,
        `${plan.name} signed in but landed at ${landingPath} instead of ${plan.expectedDashboard}`,
      ).toContain(plan.expectedDashboard.split("/")[1] ?? "")

      // Explicitly navigate to the expected dashboard (in case Clerk's
      // default afterSignIn is different from the role's home).
      await page.goto(plan.expectedDashboard, { waitUntil: "domcontentloaded" })

      for (const link of plan.sidebarLinks) {
        await test.step(`navigate to ${link}`, async () => {
          const responses: { status: number; url: string }[] = []
          page.on("response", (r) => {
            if (r.request().resourceType() === "document") {
              responses.push({ status: r.status(), url: r.url() })
            }
          })

          await page.goto(link, { waitUntil: "domcontentloaded" })

          // No server errors.
          const has5xx = responses.some((r) => r.status >= 500)
          expect(has5xx, `5xx on ${link}`).toBeFalsy()

          // Must stay inside our environment or hit the expected target.
          const currentPath = new URL(page.url()).pathname
          const envRoot = link.split("/")[1] // "admin" | "reseller" | "intern" | "portal"
          expect(
            currentPath,
            `visiting ${link} as ${plan.name} bounced to ${currentPath}`,
          ).toContain(envRoot)

          // Page must not be an error boundary.
          const body = await page.content()
          expect(body, `error boundary visible on ${link}`).not.toContain(
            "Application error",
          )
          expect(body).not.toContain("Internal Server Error")
        })
      }
    })
  })
}
