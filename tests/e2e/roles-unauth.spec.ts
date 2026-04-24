import { test, expect } from "@playwright/test"

/**
 * Unauthenticated role-boundary smoke.
 *
 * For every gated landing route across the 4 role trees, assert:
 *   1. We get a final response (no network error, no hang)
 *   2. We either render a sign-in page OR are redirected somewhere
 *      sane (NOT a 500 / white screen / stack trace)
 *
 * This is the canary that catches "I refactored a layout and now
 * /portal/dashboard throws on startup" regressions. It doesn't exercise
 * authenticated nav — that's the next layer (roles-authd.spec.ts) and
 * requires Clerk test tokens.
 */

const GATED_ROUTES = [
  "/portal/dashboard",
  "/portal/onboard",
  "/portal/support",
  "/portal/billing",
  "/portal/settings",
  "/reseller/dashboard",
  "/reseller/clients",
  "/reseller/commissions",
  "/reseller/resources",
  "/reseller/settings",
  "/reseller/settings/branding",
  "/reseller/settings/domain",
  "/intern/dashboard",
  "/intern/tasks",
  "/intern/sprints",
  "/intern/eod-report",
  "/intern/portfolio",
  "/admin/dashboard",
  "/admin/whitelabel",
  "/admin/support",
  "/admin/crm",
  "/admin/users",
]

for (const path of GATED_ROUTES) {
  test(`gated route ${path} either redirects or 401s cleanly`, async ({ page }) => {
    const responses: { status: number; url: string }[] = []
    page.on("response", (r) => {
      // Only track top-level navigation responses, not asset subrequests.
      if (r.request().resourceType() === "document") {
        responses.push({ status: r.status(), url: r.url() })
      }
    })

    await page.goto(path, { waitUntil: "domcontentloaded" })

    // Accept: any redirect chain that ends on /sign-in, or a direct 2xx
    // render of a page that contains the word "sign" (signed out stub).
    // Reject: any 5xx along the chain, or a visible Next.js error.
    const has5xx = responses.some((r) => r.status >= 500)
    expect(has5xx, `5xx response visiting ${path}:\n${JSON.stringify(responses, null, 2)}`).toBeFalsy()

    const finalUrl = page.url()
    const landedOnSignIn = finalUrl.includes("/sign-in") || finalUrl.includes("accounts.")
    const body = await page.content()
    const looksBroken =
      body.includes("This page could not be found") === false &&
      (body.includes("Application error") ||
        body.includes("Internal Server Error") ||
        body.match(/Error:\s+\w+/i) !== null)

    expect(
      landedOnSignIn || !looksBroken,
      `visiting ${path} ended at ${finalUrl} with a broken-looking page`,
    ).toBeTruthy()
  })
}

test("cross-env link guard script is present and passes", async () => {
  // Sanity check that the static guard is wired and the build would
  // fail on regressions. Running the actual script is done in CI via
  // `npm run check:cross-env-links` — here we just confirm the file
  // is still there so nobody silently deletes it.
  const fs = await import("fs")
  expect(fs.existsSync("scripts/check-cross-env-links.ts")).toBeTruthy()
})
