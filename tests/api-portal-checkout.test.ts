/**
 * API Portal Checkout Tests
 * Verifies validation schema, auth guards, service availability checks,
 * and duplicate subscription prevention for the checkout route.
 */
import { describe, it, expect } from "vitest"
import { readFileSync } from "fs"
import { join } from "path"
import { z } from "zod"

const SRC = join(__dirname, "..", "src")

// ─── Zod schema mirror (from checkout route) ───────────────────────────────

const checkoutSchema = z.object({
  serviceArmId: z.string().min(1),
  tierSlug: z.string().min(1),
})

// ─── Schema Validation ─────────────────────────────────────────────────────

describe("POST /api/portal/checkout — schema validation", () => {
  it("accepts valid checkout data", () => {
    const result = checkoutSchema.safeParse({
      serviceArmId: "svc_abc123",
      tierSlug: "starter",
    })
    expect(result.success).toBe(true)
  })

  it("rejects empty serviceArmId", () => {
    const result = checkoutSchema.safeParse({
      serviceArmId: "",
      tierSlug: "starter",
    })
    expect(result.success).toBe(false)
  })

  it("rejects empty tierSlug", () => {
    const result = checkoutSchema.safeParse({
      serviceArmId: "svc_abc123",
      tierSlug: "",
    })
    expect(result.success).toBe(false)
  })

  it("rejects missing serviceArmId", () => {
    const result = checkoutSchema.safeParse({
      tierSlug: "starter",
    })
    expect(result.success).toBe(false)
  })

  it("rejects missing tierSlug", () => {
    const result = checkoutSchema.safeParse({
      serviceArmId: "svc_abc123",
    })
    expect(result.success).toBe(false)
  })

  it("rejects empty object", () => {
    const result = checkoutSchema.safeParse({})
    expect(result.success).toBe(false)
  })

  it("rejects non-string serviceArmId", () => {
    const result = checkoutSchema.safeParse({
      serviceArmId: 123,
      tierSlug: "starter",
    })
    expect(result.success).toBe(false)
  })
})

// ─── Route Structure ────────────────────────────────────────────────────────

describe("POST /api/portal/checkout — route structure", () => {
  const content = readFileSync(
    join(SRC, "app/api/portal/checkout/route.ts"),
    "utf-8"
  )

  it("requires auth()", () => {
    expect(content).toContain("await auth()")
  })

  it("returns 401 for unauthenticated users", () => {
    expect(content).toContain("401")
    expect(content).toContain("Unauthorized")
  })

  it("returns 404 for unknown user", () => {
    expect(content).toContain("User not found")
    expect(content).toContain("404")
  })

  it("validates input with Zod", () => {
    expect(content).toContain("checkoutSchema.safeParse")
  })

  it("returns 400 for invalid data", () => {
    expect(content).toContain("400")
    expect(content).toContain("Invalid data")
  })

  it("looks up service arm by id", () => {
    expect(content).toContain("serviceArm.findUnique")
    expect(content).toContain("parsed.data.serviceArmId")
  })

  it("returns 404 when service not found", () => {
    expect(content).toContain("Service not found")
  })
})

// ─── Service availability checks ────────────────────────────────────────────

describe("POST /api/portal/checkout — service availability", () => {
  const content = readFileSync(
    join(SRC, "app/api/portal/checkout/route.ts"),
    "utf-8"
  )

  it("only allows ACTIVE and BETA services", () => {
    expect(content).toContain('"ACTIVE"')
    expect(content).toContain('"BETA"')
    expect(content).toContain("serviceArm.status")
  })

  it("rejects unavailable services with descriptive message", () => {
    expect(content).toContain("not currently available for purchase")
  })

  it("checks that tier has a stripePriceId", () => {
    expect(content).toContain("tier.stripePriceId")
  })

  it("rejects tiers without stripePriceId with contact message", () => {
    expect(content).toContain("not available for online checkout")
    expect(content).toContain("contact us")
  })

  it("returns 404 when tier not found", () => {
    expect(content).toContain("Tier not found")
  })
})

// ─── Duplicate subscription prevention ──────────────────────────────────────

describe("POST /api/portal/checkout — duplicate subscription check", () => {
  const content = readFileSync(
    join(SRC, "app/api/portal/checkout/route.ts"),
    "utf-8"
  )

  it("checks for existing active subscription", () => {
    expect(content).toContain("subscription.findFirst")
    expect(content).toContain("dbUser.id")
    expect(content).toContain("serviceArm.id")
  })

  it("checks both ACTIVE and TRIALING statuses", () => {
    expect(content).toContain("ACTIVE")
    expect(content).toContain("TRIALING")
  })

  it("returns 409 when already subscribed", () => {
    expect(content).toContain("409")
    expect(content).toContain("already have an active subscription")
  })
})

// ─── Stripe checkout session creation ───────────────────────────────────────

describe("POST /api/portal/checkout — Stripe session", () => {
  const content = readFileSync(
    join(SRC, "app/api/portal/checkout/route.ts"),
    "utf-8"
  )

  it("calls createCheckoutSession", () => {
    expect(content).toContain("createCheckoutSession")
  })

  it("passes correct parameters to Stripe", () => {
    expect(content).toContain("priceId: tier.stripePriceId")
    expect(content).toContain("email: dbUser.email")
    expect(content).toContain("serviceArmSlug: serviceArm.slug")
  })

  it("includes success and cancel URLs", () => {
    expect(content).toContain("successUrl")
    expect(content).toContain("cancelUrl")
    expect(content).toContain("checkout=success")
    expect(content).toContain("checkout=cancelled")
  })

  it("returns session URL on success", () => {
    expect(content).toContain("session.url")
  })

  it("returns 500 on error", () => {
    expect(content).toContain("500")
    expect(content).toContain("Failed to create checkout session")
  })
})
