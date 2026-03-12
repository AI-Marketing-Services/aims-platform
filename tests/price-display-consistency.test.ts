/**
 * Price Display Consistency Tests
 * Statically analyzes all UI files that display prices to ensure
 * they all divide by 100 (cents → dollars) before rendering.
 */
import { describe, it, expect } from "vitest"
import { readFileSync } from "fs"
import { join } from "path"

const SRC = join(__dirname, "..", "src")

// Files that display prices to users and must convert cents → dollars
const PRICE_DISPLAY_FILES = [
  "app/(portal)/portal/marketplace/PortalMarketplaceClient.tsx",
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
  it("PortalMarketplaceClient priceLabel divides by 100", () => {
    const content = readFileSync(
      join(SRC, "app/(portal)/portal/marketplace/PortalMarketplaceClient.tsx"),
      "utf-8"
    )
    // The priceLabel function must divide by 100
    const priceLabelBlock = content.match(/function priceLabel[\s\S]*?^}/m)?.[0] ?? ""
    expect(priceLabelBlock).toContain("/ 100")
  })

  it("MarketplaceClient displayPrice divides by 100", () => {
    const content = readFileSync(
      join(SRC, "app/(marketing)/marketplace/MarketplaceClient.tsx"),
      "utf-8"
    )
    // Should contain "/ 100" in price display logic
    expect(content).toContain("/ 100")
  })

  it("Billing page divides monthlyAmount by 100", () => {
    const content = readFileSync(
      join(SRC, "app/(portal)/portal/billing/page.tsx"),
      "utf-8"
    )
    // All monthlyAmount displays should divide by 100
    const monthlyLines = content.split("\n").filter((l) => l.includes("monthlyAmount") && l.includes("$"))
    for (const line of monthlyLines) {
      expect(
        line.includes("/ 100"),
        `Billing page has raw monthlyAmount display: ${line.trim()}`
      ).toBe(true)
    }
  })

  it("Dashboard page divides monthlyAmount by 100", () => {
    const content = readFileSync(
      join(SRC, "app/(portal)/portal/dashboard/page.tsx"),
      "utf-8"
    )
    const monthlyLines = content.split("\n").filter((l) => l.includes("monthlyAmount") && l.includes("$"))
    for (const line of monthlyLines) {
      expect(
        line.includes("/ 100"),
        `Dashboard has raw monthlyAmount display: ${line.trim()}`
      ).toBe(true)
    }
  })

  it("Service detail page divides monthlyAmount by 100", () => {
    const content = readFileSync(
      join(SRC, "app/(portal)/portal/services/[serviceId]/page.tsx"),
      "utf-8"
    )
    const monthlyLines = content.split("\n").filter((l) => l.includes("monthlyAmount") && l.includes("$"))
    for (const line of monthlyLines) {
      expect(
        line.includes("/ 100"),
        `Service detail has raw monthlyAmount display: ${line.trim()}`
      ).toBe(true)
    }
  })

  it("Services list page divides monthlyAmount by 100", () => {
    const content = readFileSync(
      join(SRC, "app/(portal)/portal/services/page.tsx"),
      "utf-8"
    )
    const monthlyLines = content.split("\n").filter((l) => l.includes("monthlyAmount") && l.includes("$"))
    for (const line of monthlyLines) {
      expect(
        line.includes("/ 100"),
        `Services list has raw monthlyAmount display: ${line.trim()}`
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
