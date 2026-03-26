/**
 * Price Formatting Tests
 * Ensures the formatCurrency utility correctly formats amounts for display.
 * Prices in the database are stored as dollar amounts (not cents) after migration
 * from static pricing to DB-driven ServiceTier.price.
 */
import { describe, it, expect } from "vitest"
import { formatCurrency } from "@/lib/utils"

describe("formatCurrency()", () => {
  it("formats standard dollar amounts with no decimals by default", () => {
    expect(formatCurrency(97)).toBe("$97")
    expect(formatCurrency(197)).toBe("$197")
    expect(formatCurrency(297)).toBe("$297")
    expect(formatCurrency(997)).toBe("$997")
    expect(formatCurrency(1000)).toBe("$1,000")
  })

  it("handles zero", () => {
    expect(formatCurrency(0)).toBe("$0")
  })

  it("formats with decimals when requested", () => {
    expect(formatCurrency(97.5, 2)).toBe("$97.50")
    expect(formatCurrency(1234.56, 2)).toBe("$1,234.56")
  })

  it("handles large amounts", () => {
    expect(formatCurrency(10000)).toBe("$10,000")
    expect(formatCurrency(100000)).toBe("$100,000")
    expect(formatCurrency(1000000)).toBe("$1,000,000")
  })

  it("handles negative amounts", () => {
    expect(formatCurrency(-50)).toBe("-$50")
  })
})
