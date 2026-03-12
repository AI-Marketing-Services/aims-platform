/**
 * Rate Limiting Tests
 * Verifies rate limiters are configured and the getIp helper works correctly.
 */
import { describe, it, expect } from "vitest"
import { getIp } from "@/lib/ratelimit"

describe("getIp()", () => {
  it("extracts IP from x-forwarded-for header", () => {
    const req = new Request("https://example.com", {
      headers: { "x-forwarded-for": "1.2.3.4, 5.6.7.8" },
    })
    expect(getIp(req)).toBe("1.2.3.4")
  })

  it("extracts IP from x-real-ip header", () => {
    const req = new Request("https://example.com", {
      headers: { "x-real-ip": "9.8.7.6" },
    })
    expect(getIp(req)).toBe("9.8.7.6")
  })

  it("returns unknown when no IP headers present", () => {
    const req = new Request("https://example.com")
    expect(getIp(req)).toBe("unknown")
  })

  it("prefers x-forwarded-for over x-real-ip", () => {
    const req = new Request("https://example.com", {
      headers: {
        "x-forwarded-for": "1.1.1.1",
        "x-real-ip": "2.2.2.2",
      },
    })
    expect(getIp(req)).toBe("1.1.1.1")
  })

  it("trims whitespace from IP", () => {
    const req = new Request("https://example.com", {
      headers: { "x-forwarded-for": "  1.2.3.4  , 5.6.7.8" },
    })
    expect(getIp(req)).toBe("1.2.3.4")
  })
})

describe("Rate limiter configuration", () => {
  it("rate limiters are null when env vars missing (graceful degradation)", async () => {
    // Without UPSTASH env vars, createRatelimiter returns null
    const { formRatelimit, auditRatelimit, chatRatelimit, checkoutRatelimit } = await import("@/lib/ratelimit")
    // In test env without UPSTASH_REDIS_REST_URL, these should be null
    if (!process.env.UPSTASH_REDIS_REST_URL) {
      expect(formRatelimit).toBeNull()
      expect(auditRatelimit).toBeNull()
      expect(chatRatelimit).toBeNull()
      expect(checkoutRatelimit).toBeNull()
    }
  })
})
