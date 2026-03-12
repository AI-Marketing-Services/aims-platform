/**
 * Seed Data Integrity Tests
 * Validates the seed file has correct prices, Stripe IDs, and structure.
 */
import { describe, it, expect } from "vitest"
import { readFileSync } from "fs"
import { join } from "path"

const seedContent = readFileSync(join(__dirname, "..", "prisma", "seed.ts"), "utf-8")

describe("Seed file integrity", () => {
  it("has all 18 service arms", () => {
    const slugMatches = seedContent.match(/slug:\s*"([^"]+)"/g) ?? []
    // Filter to just the serviceArms array (before vendors)
    const serviceSection = seedContent.split("SAMPLE VENDOR TRACKER")[0]
    const serviceSlugs = serviceSection.match(/slug:\s*"([^"]+)"/g) ?? []
    // At least 18 service slugs (services + tiers have slugs too)
    const armSlugs = serviceSlugs.filter((s) => !["starter", "growth", "pro", "elite", "standard"].some((tier) => s.includes(`"${tier}"`)))
    expect(armSlugs.length).toBeGreaterThanOrEqual(18)
  })

  it("all tier prices are in cents (> 1000)", () => {
    // Match price: XXXX patterns in the tiers
    const priceMatches = seedContent.match(/price:\s*(\d+)/g) ?? []
    for (const match of priceMatches) {
      const value = parseInt(match.replace(/price:\s*/, ""))
      // All prices should be in cents — minimum $10 = 1000 cents
      expect(value, `Price ${value} looks like dollars, not cents`).toBeGreaterThanOrEqual(1000)
    }
  })

  it("website-crm-chatbot tiers are in cents not dollars", () => {
    // Starter should be 9700 (=$97), NOT 97
    expect(seedContent).toContain("price: 9700")
    expect(seedContent).toContain("price: 19700")
    expect(seedContent).toContain("price: 29700")
    expect(seedContent).toContain("price: 39700")
  })

  it("cold-outbound is $997 = 99700 cents", () => {
    expect(seedContent).toContain("price: 99700")
  })

  it("finance-automation is $1000 = 100000 cents", () => {
    expect(seedContent).toContain("price: 100000")
  })

  it("all priced tiers have stripePriceId", () => {
    // Extract tier blocks — each tier with a price should also have stripePriceId
    const tierBlockRegex = /\{\s*name:\s*"[^"]+",\s*slug:\s*"[^"]+",\s*price:\s*\d+[^}]+\}/g
    const tierBlocks = seedContent.match(tierBlockRegex) ?? []
    for (const block of tierBlocks) {
      expect(
        block,
        `Tier block missing stripePriceId: ${block.substring(0, 80)}...`
      ).toContain("stripePriceId")
    }
  })

  it("stripePriceIds follow Stripe format (price_*)", () => {
    const priceIds = seedContent.match(/stripePriceId:\s*"([^"]+)"/g) ?? []
    expect(priceIds.length).toBeGreaterThan(0)
    for (const match of priceIds) {
      const id = match.replace(/stripePriceId:\s*"/, "").replace(/"$/, "")
      expect(id, `Invalid Stripe price ID: ${id}`).toMatch(/^price_/)
    }
  })

  it("no duplicate slugs in service arms", () => {
    const serviceSection = seedContent.split("SAMPLE VENDOR TRACKER")[0]
    // Match slug values that appear after the { at the start of each arm object
    const armSlugs: string[] = []
    const armRegex = /slug:\s*"([^"]+)",\s*\n\s*name:/g
    let match
    while ((match = armRegex.exec(serviceSection)) !== null) {
      armSlugs.push(match[1])
    }
    const uniqueSlugs = new Set(armSlugs)
    expect(uniqueSlugs.size).toBe(armSlugs.length)
  })

  it("all pricingModel values are valid enum values", () => {
    const models = seedContent.match(/pricingModel:\s*"([^"]+)"/g) ?? []
    const validModels = ["MONTHLY", "CUSTOM", "ONE_TIME", "USAGE"]
    for (const match of models) {
      const model = match.replace(/pricingModel:\s*"/, "").replace(/"$/, "")
      expect(validModels, `Invalid pricingModel: ${model}`).toContain(model)
    }
  })

  it("all pillar values are valid", () => {
    const pillars = seedContent.match(/pillar:\s*"([^"]+)"/g) ?? []
    const validPillars = ["MARKETING", "SALES", "OPERATIONS", "FINANCE"]
    for (const match of pillars) {
      const pillar = match.replace(/pillar:\s*"/, "").replace(/"$/, "")
      expect(validPillars, `Invalid pillar: ${pillar}`).toContain(pillar)
    }
  })

  it("all status values are valid", () => {
    const statuses = seedContent.match(/status:\s*"([^"]+)"/g) ?? []
    const validStatuses = ["ACTIVE", "BETA", "COMING_SOON", "DEPRECATED"]
    for (const match of statuses) {
      const status = match.replace(/status:\s*"/, "").replace(/"$/, "")
      expect(validStatuses, `Invalid status: ${status}`).toContain(status)
    }
  })
})
