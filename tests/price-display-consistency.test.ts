/**
 * Price Display Consistency Tests
 * Statically analyzes all UI files that display prices to ensure
 * they all divide by 100 (cents → dollars) before rendering.
 */
import { describe, it, expect } from "vitest"
import { readFileSync } from "fs"
import { join } from "path"

const SRC = join(__dirname, "..", "src")

// Files that display prices to users and must convert cents → dollars.
// PortalMarketplaceClient was rewritten to consume lib/plans/registry where
// priceMonthly is already in DOLLARS, so it's exempt from the divide-by-100
// rule (covered separately by the "Plan registry stores prices in DOLLARS"
// test below).
const PRICE_DISPLAY_FILES = [
  "app/(portal)/portal/dashboard/page.tsx",
  "app/(portal)/portal/services/page.tsx",
  "app/(portal)/portal/services/[serviceId]/page.tsx",
  "app/(portal)/portal/billing/page.tsx",
  "app/(marketing)/services/[slug]/page.tsx",
  "app/(marketing)/marketplace/MarketplaceClient.tsx",
]

describe("Price display files must divide by 100", () => {
  for (const relPath of PRICE_DISPLAY_FILES) {
    it(`${relPath} — all price displays convert cents to dollars`, () => {
      const fullPath = join(SRC, relPath)
      const content = readFileSync(fullPath, "utf-8")

      // Find all patterns like $${something}/mo or $${something}/yr
      // These should contain "/ 100" somewhere in the expression
      const pricePatterns = content.match(/\$\$\{[^}]+\}\/mo/g) ?? []
      const yearPatterns = content.match(/\$\$\{[^}]+\}\/yr/g) ?? []
      const allPricePatterns = [...pricePatterns, ...yearPatterns]

      for (const pattern of allPricePatterns) {
        // Each price interpolation should contain "/ 100" to convert cents
        // Exception: patterns that already use formatPrice or are referencing a pre-formatted value
        const isPercentageOrRate = pattern.includes("Rate") || pattern.includes("rate")
        if (!isPercentageOrRate) {
          expect(
            pattern.includes("/ 100") || pattern.includes("/100"),
            `Found price display without cent conversion: ${pattern} in ${relPath}`
          ).toBe(true)
        }
      }
    })
  }
})

describe("No raw cent values displayed", () => {
  it("Plan registry stores prices in DOLLARS (not cents)", () => {
    // The marketplace was rewritten: plans + credit packs come from
    // lib/plans/registry.ts where priceMonthly / price are integer
    // dollars. The Stripe sync script multiplies by 100 to create the
    // Stripe Price object. Asserting dollars-not-cents at the source
    // guarantees no display can show a 4-digit price by accident.
    const content = readFileSync(join(SRC, "lib/plans/registry.ts"), "utf-8")
    // Pro should be priceMonthly: 97 (dollars), not 9700 (cents)
    expect(content).toMatch(/priceMonthly:\s*97\b/)
    expect(content).toMatch(/priceMonthly:\s*297\b/)
    // Credit packs should be in dollars too (25, 79, 169 — not 2500/7900/16900)
    expect(content).toMatch(/price:\s*25\b/)
    expect(content).toMatch(/price:\s*79\b/)
    expect(content).toMatch(/price:\s*169\b/)
  })

  // MarketplaceClient no longer has pricing (engagements are custom-scoped)

  // NOTE: Subscription.monthlyAmount is stored in DOLLARS (webhook divides by 100 on write).
  // These pages should display monthlyAmount directly WITHOUT dividing by 100.
  it("Billing page displays monthlyAmount directly (already in dollars)", () => {
    const content = readFileSync(
      join(SRC, "app/(portal)/portal/billing/page.tsx"),
      "utf-8"
    )
    const monthlyLines = content.split("\n").filter((l) => l.includes("monthlyAmount") && l.includes("$"))
    for (const line of monthlyLines) {
      expect(
        !line.includes("/ 100"),
        `Billing page should not divide monthlyAmount by 100 (already dollars): ${line.trim()}`
      ).toBe(true)
    }
  })

  it("Dashboard page displays monthlyAmount directly (already in dollars)", () => {
    const content = readFileSync(
      join(SRC, "app/(portal)/portal/dashboard/page.tsx"),
      "utf-8"
    )
    const monthlyLines = content.split("\n").filter((l) => l.includes("monthlyAmount") && l.includes("$"))
    for (const line of monthlyLines) {
      expect(
        !line.includes("/ 100"),
        `Dashboard should not divide monthlyAmount by 100 (already dollars): ${line.trim()}`
      ).toBe(true)
    }
  })

  it("Service detail page displays monthlyAmount directly (already in dollars)", () => {
    const content = readFileSync(
      join(SRC, "app/(portal)/portal/services/[serviceId]/page.tsx"),
      "utf-8"
    )
    const monthlyLines = content.split("\n").filter((l) => l.includes("monthlyAmount") && l.includes("$"))
    for (const line of monthlyLines) {
      expect(
        !line.includes("/ 100"),
        `Service detail should not divide monthlyAmount by 100 (already dollars): ${line.trim()}`
      ).toBe(true)
    }
  })

  it("Services list page displays monthlyAmount directly (already in dollars)", () => {
    const content = readFileSync(
      join(SRC, "app/(portal)/portal/services/page.tsx"),
      "utf-8"
    )
    const monthlyLines = content.split("\n").filter((l) => l.includes("monthlyAmount") && l.includes("$"))
    for (const line of monthlyLines) {
      expect(
        !line.includes("/ 100"),
        `Services list should not divide monthlyAmount by 100 (already dollars): ${line.trim()}`
      ).toBe(true)
    }
  })

  it("Marketing service detail page divides tier.price by 100", () => {
    const content = readFileSync(
      join(SRC, "app/(marketing)/services/[slug]/page.tsx"),
      "utf-8"
    )
    const priceLines = content.split("\n").filter((l) => l.includes("tier.price") && l.includes("$"))
    for (const line of priceLines) {
      expect(
        line.includes("/ 100"),
        `Marketing service detail has raw tier.price display: ${line.trim()}`
      ).toBe(true)
    }
  })
})
