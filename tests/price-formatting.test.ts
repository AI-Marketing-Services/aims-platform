/**
 * Price Formatting Tests
 * Ensures all prices stored in cents are correctly converted to dollars for display.
 * This was a critical bug — prices showed as "$9700/mo" instead of "$97/mo".
 */
import { describe, it, expect } from "vitest"
import { formatPrice, getPricing, SERVICES_PRICING } from "@/lib/services-pricing"

describe("formatPrice()", () => {
  it("converts cents to dollar display for standard amounts", () => {
    expect(formatPrice(9700)).toBe("$97/mo")
    expect(formatPrice(19700)).toBe("$197/mo")
    expect(formatPrice(29700)).toBe("$297/mo")
    expect(formatPrice(39700)).toBe("$397/mo")
    expect(formatPrice(49700)).toBe("$497/mo")
    expect(formatPrice(59700)).toBe("$597/mo")
    expect(formatPrice(69700)).toBe("$697/mo")
    expect(formatPrice(79700)).toBe("$797/mo")
    expect(formatPrice(99700)).toBe("$997/mo")
    expect(formatPrice(100000)).toBe("$1,000/mo")
  })

  it("handles zero cents", () => {
    expect(formatPrice(0)).toBe("$0/mo")
  })

  it("handles small amounts", () => {
    expect(formatPrice(100)).toBe("$1/mo")
    expect(formatPrice(500)).toBe("$5/mo")
    expect(formatPrice(1000)).toBe("$10/mo")
  })
})

describe("SERVICES_PRICING", () => {
  it("has 12 services defined", () => {
    expect(SERVICES_PRICING.length).toBe(12)
  })

  it("all prices are stored in cents (> 100)", () => {
    for (const svc of SERVICES_PRICING) {
      if (svc.priceMonthly) {
        expect(svc.priceMonthly).toBeGreaterThanOrEqual(100)
        // Should be in cents — no service costs less than $1
        expect(svc.priceMonthly).toBeGreaterThan(1000)
      }
      if (svc.tiers) {
        for (const tier of svc.tiers) {
          expect(tier.priceMonthly).toBeGreaterThan(1000)
        }
      }
    }
  })

  it("website-crm-chatbot has 4 tiers at correct cent values", () => {
    const svc = getPricing("website-crm-chatbot")
    expect(svc).toBeDefined()
    expect(svc!.tiers).toHaveLength(4)
    expect(svc!.tiers![0].priceMonthly).toBe(9700)  // $97
    expect(svc!.tiers![1].priceMonthly).toBe(19700) // $197
    expect(svc!.tiers![2].priceMonthly).toBe(29700) // $297
    expect(svc!.tiers![3].priceMonthly).toBe(39700) // $397
  })

  it("cold-outbound is $997/mo = 99700 cents", () => {
    const svc = getPricing("cold-outbound")
    expect(svc?.priceMonthly).toBe(99700)
    expect(formatPrice(svc!.priceMonthly!)).toBe("$997/mo")
  })

  it("finance-automation is $1000/mo = 100000 cents", () => {
    const svc = getPricing("finance-automation")
    expect(svc?.priceMonthly).toBe(100000)
    expect(formatPrice(svc!.priceMonthly!)).toBe("$1,000/mo")
  })

  it("all slugs are unique", () => {
    const slugs = SERVICES_PRICING.map((s) => s.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
  })
})

describe("getPricing()", () => {
  it("returns undefined for unknown slug", () => {
    expect(getPricing("nonexistent")).toBeUndefined()
  })

  it("returns pricing for all defined services", () => {
    const expectedSlugs = [
      "website-crm-chatbot", "cold-outbound", "voice-agents", "seo-aeo",
      "audience-targeting", "pixel-intelligence", "inbound-orchestration",
      "lead-reactivation", "linkedin-outbound", "ai-content-engine",
      "finance-automation", "ai-tool-tracker",
    ]
    for (const slug of expectedSlugs) {
      expect(getPricing(slug)).toBeDefined()
    }
  })
})
