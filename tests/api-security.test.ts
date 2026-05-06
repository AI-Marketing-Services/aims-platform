/**
 * API Security Tests
 * Verifies all admin routes have auth guards, no error leaks, proper validation.
 */
import { describe, it, expect } from "vitest"
import { readFileSync, existsSync, readdirSync, statSync } from "fs"
import { join } from "path"

const SRC = join(__dirname, "..", "src")

// Recursively find route.ts files under a directory
function findRoutes(dir: string, base = ""): string[] {
  const results: string[] = []
  if (!existsSync(dir)) return results
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    const rel = base ? `${base}/${entry}` : entry
    if (statSync(full).isDirectory()) {
      results.push(...findRoutes(full, rel))
    } else if (entry === "route.ts") {
      results.push(rel)
    }
  }
  return results
}

// Find all admin API route files
const adminRoutes = findRoutes(join(SRC, "app/api/admin")).map((f) => ({
  path: `app/api/admin/${f}`,
  content: readFileSync(join(SRC, "app/api/admin", f), "utf-8"),
}))

// Find all portal API route files
const portalRoutes = findRoutes(join(SRC, "app/api/portal")).map((f) => ({
  path: `app/api/portal/${f}`,
  content: readFileSync(join(SRC, "app/api/portal", f), "utf-8"),
}))

describe("Admin API auth guards", () => {
  it("found admin routes to test", () => {
    expect(adminRoutes.length).toBeGreaterThan(0)
  })

  // Routes that authenticate with a shared secret (typically CRON_SECRET
  // or BOOTSTRAP_SECRET) instead of Clerk auth. These still need an auth
  // check, just against a header-supplied secret.
  const SHARED_SECRET_ROUTES = [
    "bootstrap/route.ts",
    "test-emails/route.ts",
  ]

  for (const route of adminRoutes) {
    const isSharedSecret = SHARED_SECRET_ROUTES.some((r) => route.path.includes(r))

    it(`${route.path} — has auth check`, () => {
      const hasAuth = isSharedSecret
        ? route.content.includes("BOOTSTRAP_SECRET") ||
          route.content.includes("CRON_SECRET") ||
          /\bsecret\b/i.test(route.content)
        : route.content.includes("await auth()") ||
          route.content.includes("requireAdmin()") ||
          route.content.includes("ensureDbUserIdForApi") ||
          route.content.includes("ensureDbUser(") ||
          route.content.includes("getOrCreateDbUserByClerkId")
      expect(hasAuth, `${route.path} is missing auth check`).toBe(true)
    })

    it(`${route.path} — checks for admin role or secret`, () => {
      const hasRoleCheck =
        route.content.includes("ADMIN") ||
        route.content.includes("requireAdmin") ||
        route.content.includes("SUPER_ADMIN") ||
        route.content.includes("BOOTSTRAP_SECRET") ||
        route.content.includes("CRON_SECRET")
      expect(hasRoleCheck, `${route.path} is missing admin role check`).toBe(true)
    })

    it(`${route.path} — returns 401/403 for unauthorized`, () => {
      const has401or403 =
        route.content.includes("401") ||
        route.content.includes("403") ||
        route.content.includes("Forbidden") ||
        route.content.includes("Unauthorized")
      expect(has401or403, `${route.path} doesn't return 401/403 for unauthorized`).toBe(true)
    })
  }
})

describe("Portal API auth guards", () => {
  for (const route of portalRoutes) {
    it(`${route.path} — has auth() check`, () => {
      // Routes can auth via:
      //   - direct `await auth()` from @clerk/nextjs/server
      //   - `ensureDbUserIdForApi()` (calls auth() internally + returns user id)
      //   - `ensureDbUser()` (server component variant — auth + redirect)
      // All three patterns are equivalent for security purposes; this
      // matcher accepts any of them.
      const hasAuth =
        route.content.includes("await auth()") ||
        route.content.includes("ensureDbUserIdForApi") ||
        route.content.includes("ensureDbUser(") ||
        route.content.includes("getOrCreateDbUserByClerkId")
      expect(hasAuth, `${route.path} is missing auth check`).toBe(true)
    })

    it(`${route.path} — returns 401 for unauthenticated`, () => {
      expect(
        route.content.includes("401") || route.content.includes("Unauthorized"),
        `${route.path} doesn't return 401 for unauthenticated`
      ).toBe(true)
    })
  }
})

describe("No internal error leaking", () => {
  const allRoutes = [...adminRoutes, ...portalRoutes]

  for (const route of allRoutes) {
    it(`${route.path} — doesn't leak error internals to clients`, () => {
      // Check for patterns that leak error details
      const leakPatterns = [
        /NextResponse\.json\(\{[^}]*details:\s*String\(e\)/,
        /NextResponse\.json\(\{[^}]*error:\s*String\(err?\)/,
        /NextResponse\.json\(\{[^}]*error:\s*err?\.message/,
        /NextResponse\.json\(\{[^}]*stack:/,
      ]
      for (const pattern of leakPatterns) {
        expect(
          pattern.test(route.content),
          `${route.path} leaks internal error details to client`
        ).toBe(false)
      }
    })
  }
})

describe("Stripe webhook checkout security", () => {
  // Checkout is handled via Stripe webhooks (checkout.session.completed)
  // rather than a dedicated /api/checkout route.
  it("stripe webhook verifies signature", () => {
    const content = readFileSync(join(SRC, "app/api/webhooks/stripe/route.ts"), "utf-8")
    expect(content).toContain("constructEvent")
    expect(content).toContain("stripe-signature")
    expect(content).toContain("STRIPE_WEBHOOK_SECRET")
  })

  it("stripe webhook has idempotency checks", () => {
    // Idempotency checks live in the decomposed handler modules
    const checkoutHandler = readFileSync(join(SRC, "lib/stripe/handlers/handle-checkout-completed.ts"), "utf-8")
    const lifecycleHandler = readFileSync(join(SRC, "lib/stripe/handlers/handle-subscription-lifecycle.ts"), "utf-8")
    expect(checkoutHandler).toContain("already exists")
    expect(lifecycleHandler).toContain("already exists")
    expect(checkoutHandler).toContain("findFirst")
    expect(lifecycleHandler).toContain("findFirst")
  })
})

describe("Email Bison connection route validation", () => {
  it("connections route has Zod validation", () => {
    const content = readFileSync(
      join(SRC, "app/api/admin/emailbison/connections/route.ts"),
      "utf-8"
    )
    expect(content).toContain("z.object")
    expect(content).toContain("z.string().min(1)")
    expect(content).toContain("z.coerce.number().int().positive()")
  })
})
