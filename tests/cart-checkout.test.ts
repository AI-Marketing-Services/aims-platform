/**
 * Cart & Checkout Validation Tests
 * Tests the Zod schemas and business logic used in checkout.
 */
import { describe, it, expect } from "vitest"
import { z } from "zod"

// Mirror the cart schema from checkout route
const cartSchema = z.object({
  items: z.array(
    z.object({
      slug: z.string().min(1).max(100),
      tierId: z.string().optional(),
    })
  ).min(1).max(10),
  successUrl: z.string().url().optional(),
  cancelUrl: z.string().url().optional(),
})

describe("Cart schema validation", () => {
  it("accepts valid cart with single item", () => {
    const result = cartSchema.safeParse({
      items: [{ slug: "cold-outbound" }],
    })
    expect(result.success).toBe(true)
  })

  it("accepts valid cart with tier", () => {
    const result = cartSchema.safeParse({
      items: [{ slug: "website-crm-chatbot", tierId: "pro" }],
    })
    expect(result.success).toBe(true)
  })

  it("accepts valid cart with multiple items", () => {
    const result = cartSchema.safeParse({
      items: [
        { slug: "cold-outbound" },
        { slug: "seo-aeo" },
        { slug: "voice-agents" },
      ],
    })
    expect(result.success).toBe(true)
  })

  it("rejects empty items array", () => {
    const result = cartSchema.safeParse({ items: [] })
    expect(result.success).toBe(false)
  })

  it("rejects more than 10 items", () => {
    const items = Array.from({ length: 11 }, (_, i) => ({ slug: `svc-${i}` }))
    const result = cartSchema.safeParse({ items })
    expect(result.success).toBe(false)
  })

  it("rejects empty slug", () => {
    const result = cartSchema.safeParse({
      items: [{ slug: "" }],
    })
    expect(result.success).toBe(false)
  })

  it("rejects slug over 100 chars", () => {
    const result = cartSchema.safeParse({
      items: [{ slug: "a".repeat(101) }],
    })
    expect(result.success).toBe(false)
  })

  it("rejects invalid successUrl", () => {
    const result = cartSchema.safeParse({
      items: [{ slug: "cold-outbound" }],
      successUrl: "not-a-url",
    })
    expect(result.success).toBe(false)
  })

  it("accepts valid URLs", () => {
    const result = cartSchema.safeParse({
      items: [{ slug: "cold-outbound" }],
      successUrl: "https://aimseos.com/portal/dashboard?checkout=success",
      cancelUrl: "https://aimseos.com/marketplace",
    })
    expect(result.success).toBe(true)
  })

  it("rejects missing items entirely", () => {
    const result = cartSchema.safeParse({})
    expect(result.success).toBe(false)
  })

  it("rejects non-array items", () => {
    const result = cartSchema.safeParse({ items: "cold-outbound" })
    expect(result.success).toBe(false)
  })
})

describe("Email Bison upsert schema", () => {
  const upsertSchema = z.object({
    userId: z.string().min(1),
    workspaceId: z.coerce.number().int().positive(),
    workspaceName: z.string().min(1),
  })

  it("accepts valid connection data", () => {
    const result = upsertSchema.safeParse({
      userId: "user_abc123",
      workspaceId: 2,
      workspaceName: "MedPro Workspace",
    })
    expect(result.success).toBe(true)
  })

  it("coerces string workspaceId to number", () => {
    const result = upsertSchema.safeParse({
      userId: "user_abc123",
      workspaceId: "2",
      workspaceName: "MedPro Workspace",
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.workspaceId).toBe(2)
    }
  })

  it("rejects empty userId", () => {
    const result = upsertSchema.safeParse({
      userId: "",
      workspaceId: 2,
      workspaceName: "MedPro Workspace",
    })
    expect(result.success).toBe(false)
  })

  it("rejects negative workspaceId", () => {
    const result = upsertSchema.safeParse({
      userId: "user_abc123",
      workspaceId: -1,
      workspaceName: "MedPro Workspace",
    })
    expect(result.success).toBe(false)
  })

  it("rejects zero workspaceId", () => {
    const result = upsertSchema.safeParse({
      userId: "user_abc123",
      workspaceId: 0,
      workspaceName: "MedPro Workspace",
    })
    expect(result.success).toBe(false)
  })

  it("rejects empty workspaceName", () => {
    const result = upsertSchema.safeParse({
      userId: "user_abc123",
      workspaceId: 2,
      workspaceName: "",
    })
    expect(result.success).toBe(false)
  })

  it("rejects missing fields", () => {
    expect(upsertSchema.safeParse({}).success).toBe(false)
    expect(upsertSchema.safeParse({ userId: "abc" }).success).toBe(false)
  })
})

describe("Redirect URL validation logic", () => {
  it("validates allowed hosts correctly", () => {
    const appUrl = "https://aimseos.com"
    const allowedHost = new URL(appUrl).hostname

    // Valid URLs
    expect(new URL("https://aimseos.com/portal").hostname).toBe(allowedHost)
    expect(new URL("https://aimseos.com/marketplace?x=1").hostname).toBe(allowedHost)

    // Invalid URLs (different hosts)
    expect(new URL("https://evil.com/portal").hostname).not.toBe(allowedHost)
    expect(new URL("https://aimseos.com.evil.com/portal").hostname).not.toBe(allowedHost)
  })
})
