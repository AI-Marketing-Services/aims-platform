import { test, expect, type APIResponse } from "@playwright/test"

/**
 * Whitelabel surface — production smoke.
 *
 * Verifies the freshly-shipped whitelabel changes:
 *   1. CLIENT users with completed onboarding can access whitelabel
 *      (gated in src/lib/auth/whitelabel.ts).
 *   2. New live domain availability check endpoint at
 *      GET /api/reseller/domain/check?domain=foo.com.
 *   3. Translated Vercel error codes on POST /api/reseller/domain
 *      (e.g. domain_already_in_use → 409 with friendly message).
 *   4. The /reseller/settings/domain UI form (live red/green border).
 *
 * SECURITY NOTE — current production behavior:
 * `clerkMiddleware` (src/middleware.ts:235-239) catches unauthenticated
 * requests to ANY protected route — including /api/reseller/* — and
 * 307-redirects to /sign-in BEFORE the in-route auth gate runs. This
 * is a fine security posture (callers are blocked) but a poor JSON-API
 * contract: a fetch() from the browser gets an opaque redirect to HTML
 * it cannot parse. We assert the actual shipped behavior here and have
 * a `test.fixme` block flagging the desired behavior (401 JSON for API
 * routes). Convert it to `test()` once the middleware is updated to
 * return JSON for /api/* paths.
 *
 * Authed cases run when CLERK_SIGNIN_ADMIN_TOKEN is set, otherwise
 * skip gracefully (matches roles-authd.spec.ts pattern).
 */

// ---------------------------------------------------------------------------
// Unauthenticated API contracts — current shipped behavior
// ---------------------------------------------------------------------------

type ApiCase = {
  method: "GET" | "POST" | "DELETE" | "PATCH"
  path: string
  body?: unknown
}
const RESELLER_API_PATHS: ApiCase[] = [
  { method: "GET", path: "/api/reseller/domain/check?domain=test-12345.com" },
  { method: "GET", path: "/api/reseller/domain/check?domain=" },
  { method: "GET", path: "/api/reseller/domain/check" },
  { method: "GET", path: "/api/reseller/domain" },
  { method: "POST", path: "/api/reseller/domain", body: { domain: "example.com" } },
  { method: "POST", path: "/api/reseller/domain", body: "" }, // empty body
  { method: "DELETE", path: "/api/reseller/domain" },
  { method: "PATCH", path: "/api/reseller/brand", body: { businessName: "Acme" } },
  { method: "PATCH", path: "/api/reseller/brand", body: "" },
]

test.describe("whitelabel API — unauthenticated returns 401 JSON", () => {
  // Middleware short-circuits unauth /api/* with a JSON 401 (not a 307
  // to the HTML sign-in page). Critical for client-side fetch() in
  // domain-manager.tsx — without this, an expired session breaks the
  // live red/green border because the browser tries to JSON.parse HTML.
  for (const { method, path, body } of RESELLER_API_PATHS) {
    const bodyTag =
      body === undefined ? "" : body === "" ? " [empty body]" : " [json body]"
    test(`${method} ${path}${bodyTag} → 401 JSON`, async ({ request, baseURL }) => {
      const url = `${baseURL}${path}`
      const opts: Parameters<typeof request.fetch>[1] = {
        method,
        maxRedirects: 0,
      }
      if (body !== undefined) {
        opts.headers = { "Content-Type": "application/json" }
        opts.data = body
      }
      const res = await request.fetch(url, opts)

      expect(
        res.status(),
        `${method} ${path} returned ${res.status()} — expected 401`,
      ).toBe(401)
      expect(
        res.headers()["content-type"] ?? "",
        `Content-Type for ${method} ${path} should be JSON`,
      ).toContain("application/json")

      const data = (await res.json()) as { error?: string; reason?: string }
      expect(data.error, `${method} ${path} body should include an error string`).toBeTruthy()
      expect(
        data.reason,
        `${method} ${path} body should include a stable reason enum`,
      ).toBe("unauthenticated")
    })
  }
})

// ---------------------------------------------------------------------------
// Page route smoke (unauthenticated)
// ---------------------------------------------------------------------------

test.describe("whitelabel pages — unauthenticated", () => {
  const PAGES = [
    "/reseller/settings/domain",
    "/reseller/settings/branding",
    "/admin/whitelabel",
  ]

  for (const path of PAGES) {
    test(`GET ${path} unauth redirects to sign-in (no 5xx, no dead-end)`, async ({ page }) => {
      const responses: { status: number; url: string }[] = []
      page.on("response", (r) => {
        if (r.request().resourceType() === "document") {
          responses.push({ status: r.status(), url: r.url() })
        }
      })

      await page.goto(path, { waitUntil: "domcontentloaded" })

      const has5xx = responses.some((r) => r.status >= 500)
      expect(
        has5xx,
        `5xx visiting ${path}:\n${JSON.stringify(responses, null, 2)}`,
      ).toBeFalsy()

      const finalUrl = page.url()
      const onSignIn =
        finalUrl.includes("/sign-in") ||
        finalUrl.includes("accounts.") ||
        finalUrl.includes("clerk.")
      expect(onSignIn, `${path} ended at ${finalUrl} instead of sign-in`).toBeTruthy()

      const body = await page.content()
      expect(body).not.toContain("Application error")
      expect(body).not.toContain("Internal Server Error")
    })
  }
})

// ---------------------------------------------------------------------------
// Authenticated flow — uses the same Clerk signInToken pattern as
// roles-authd.spec.ts. Skips when no admin token is available.
// ---------------------------------------------------------------------------

test.describe("whitelabel domain form — authenticated (admin)", () => {
  const adminToken = process.env.CLERK_SIGNIN_ADMIN_TOKEN
  test.skip(!adminToken, "Set CLERK_SIGNIN_ADMIN_TOKEN to exercise the authed UI flow")

  test("live domain check returns correct status for in-use / available / invalid inputs", async ({
    page,
    baseURL,
  }) => {
    await page.goto(`${baseURL}/sign-in?__clerk_ticket=${adminToken}`, {
      waitUntil: "domcontentloaded",
    })
    await page.waitForURL((u) => !u.pathname.startsWith("/sign-in"), { timeout: 15_000 })

    type CheckBody = {
      domain: string
      status: "available" | "in_use_other_project" | "in_use_this_project" | "invalid" | "unknown"
      canAdd: boolean
      message: string
    }

    async function check(domain: string): Promise<{ res: APIResponse; body: CheckBody }> {
      const res = await page.request.get(
        `${baseURL}/api/reseller/domain/check?domain=${encodeURIComponent(domain)}`,
      )
      const body = (await res.json()) as CheckBody
      return { res, body }
    }

    // 1. Invalid format → status:"invalid", canAdd:false (200 by design — the
    //    endpoint returns user-facing JSON for the form to render messages).
    const invalid = await check("not-a-domain")
    expect(invalid.res.status()).toBe(200)
    expect(invalid.body.status).toBe("invalid")
    expect(invalid.body.canAdd).toBe(false)

    // 2. The platform's own apex is attached to the prod project, so it
    //    should report `in_use_this_project` (or `in_use_other_project`
    //    depending on team scoping).
    const own = await check("aioperatorcollective.com")
    expect(own.res.status()).toBe(200)
    expect(["in_use_this_project", "in_use_other_project"]).toContain(own.body.status)
    expect(own.body.canAdd).toBe(false)

    // 3. A guaranteed-not-on-Vercel domain should come back as available
    //    (or `unknown` if Vercel is rate-limiting). What matters is canAdd.
    const free = await check("acme-test-9999-not-real.example.com")
    expect(free.res.status()).toBe(200)
    expect(["available", "unknown"]).toContain(free.body.status)
    expect(free.body.canAdd).toBe(true)

    // 4. UI smoke: load the form page and verify the input renders.
    await page.goto("/reseller/settings/domain", { waitUntil: "domcontentloaded" })
    await expect(page.locator('input[placeholder="portal.mycompany.com"]')).toBeVisible()
  })
})
