import { describe, expect, it } from "vitest"
import {
  LEAD_MAGNETS,
  MARKETPLACE_LEAD_MAGNETS,
  buildShareUrl,
  getLeadMagnet,
} from "@/lib/tenant/lead-magnet-registry"

describe("LEAD_MAGNETS registry", () => {
  it("has the seven canonical Phase-1 tools", () => {
    expect(LEAD_MAGNETS.map((t) => t.slug).sort()).toEqual(
      [
        "ai-readiness-quiz",
        "business-credit-score",
        "executive-ops-audit",
        "roi-calculator",
        "segment-explorer",
        "stack-configurator",
        "website-audit",
      ].sort(),
    )
  })

  it("each tool maps to a valid LeadMagnetType value", () => {
    const types = new Set(LEAD_MAGNETS.map((t) => t.submissionType))
    expect(types.has("WEBSITE_AUDIT")).toBe(true)
    expect(types.has("ROI_CALCULATOR")).toBe(true)
    expect(types.has("AI_READINESS_QUIZ")).toBe(true)
  })

  it("getLeadMagnet returns null for unknown slug", () => {
    expect(getLeadMagnet("does-not-exist")).toBeNull()
  })
})

describe("MARKETPLACE_LEAD_MAGNETS", () => {
  it("ships exactly five concept SKUs", () => {
    expect(MARKETPLACE_LEAD_MAGNETS).toHaveLength(5)
  })

  it("every SKU has a price and ship estimate", () => {
    for (const sku of MARKETPLACE_LEAD_MAGNETS) {
      expect(sku.price).toBeGreaterThan(0)
      expect(sku.expectedShip).toMatch(/Q[1-4]/)
    }
  })

  it("slugs are unique", () => {
    const slugs = MARKETPLACE_LEAD_MAGNETS.map((s) => s.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
  })
})

describe("buildShareUrl", () => {
  const tool = LEAD_MAGNETS[0]

  it("prefers a verified custom domain when present", () => {
    const url = buildShareUrl(tool, {
      subdomain: "acme",
      customDomain: "audits.acme.com",
      customDomainVerified: true,
    })
    expect(url).toBe(`https://audits.acme.com/tools/${tool.slug}`)
  })

  it("falls back to subdomain when custom domain is not verified", () => {
    const url = buildShareUrl(tool, {
      subdomain: "acme",
      customDomain: "audits.acme.com",
      customDomainVerified: false,
    })
    expect(url).toBe(`https://acme.aioperatorcollective.com/tools/${tool.slug}`)
  })

  it("falls back to platform apex when no operator info exists", () => {
    const url = buildShareUrl(tool, null)
    expect(url).toBe(`https://www.aioperatorcollective.com/tools/${tool.slug}`)
  })
})
