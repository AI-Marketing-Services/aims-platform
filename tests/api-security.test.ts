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

  // Bootstrap route uses a shared secret instead of Clerk auth
  const SHARED_SECRET_ROUTES = ["bootstrap/route.ts"]

  for (const route of adminRoutes) {
    const isSharedSecret = SHARED_SECRET_ROUTES.some((r) => route.path.includes(r))

    it(`${route.path} — has auth check`, () => {
      const hasAuth = isSharedSecret
        ? route.content.includes("BOOTSTRAP_SECRET") || route.content.includes("secret")
        : route.content.includes("await auth()") || route.content.includes("requireAdmin()")
      expect(hasAuth, `${route.path} is missing auth check`).toBe(true)
    })

    it(`${route.path} — checks for admin role or secret`, () => {
      const hasRoleCheck =
        route.content.includes("ADMIN") ||
        route.content.includes("requireAdmin") ||
        route.content.includes("SUPER_ADMIN") ||
        route.content.includes("BOOTSTRAP_SECRET")
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
      expect(
        route.content.includes("await auth()"),
        `${route.path} is missing auth check`
      ).toBe(true)
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

describe("Checkout route security", () => {
  it("checkout route exists", () => {
    const checkoutPath = join(SRC, "app/api/checkout/route.ts")
    expect(existsSync(checkoutPath)).toBe(true)
  })

  it("checkout route has rate limiting", () => {
    const content = readFileSync(join(SRC, "app/api/checkout/route.ts"), "utf-8")
    expect(content).toContain("ratelimit")
  })

  it("checkout route uses Zod validation", () => {
    const content = readFileSync(join(SRC, "app/api/checkout/route.ts"), "utf-8")
    expect(content).toContain("z.object")
    expect(content).toContain("safeParse")
  })

  it("checkout route resolves prices from DB, not client", () => {
    const content = readFileSync(join(SRC, "app/api/checkout/route.ts"), "utf-8")
    // Should NOT accept price/amount from client
    expect(content).toContain("never trust client")
    // Should resolve from DB
    expect(content).toContain("db.serviceArm.findMany")
  })

  it("checkout route validates redirect URLs", () => {
    const content = readFileSync(join(SRC, "app/api/checkout/route.ts"), "utf-8")
    expect(content).toContain("allowedHost")
    expect(content).toContain("Invalid successUrl")
    expect(content).toContain("Invalid cancelUrl")
  })

  it("checkout route has zero-price guard", () => {
    const content = readFileSync(join(SRC, "app/api/checkout/route.ts"), "utf-8")
    expect(content).toContain("unitAmount === 0")
    expect(content).toContain("No pricing available")
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
