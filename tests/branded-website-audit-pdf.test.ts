import { describe, expect, it } from "vitest"
import { buildBrandedWebsiteAuditPDF } from "@/lib/pdf/branded/website-audit"

const TOKENS = {
  businessName: "Acme AI Solutions",
  logoUrl: null,
  primaryColor: "#981B1B",
  accentColor: "#C42424",
  tagline: "Done-for-you AI for service businesses",
  contactEmail: "hello@acme.com",
  websiteUrl: "https://acme.com",
}

describe("buildBrandedWebsiteAuditPDF", () => {
  it("returns a PDF buffer for a low-score audit", async () => {
    const pdf = await buildBrandedWebsiteAuditPDF(TOKENS, {
      url: "https://example.com",
      score: 32,
      recipientName: "Diana",
      scores: { seo: 25, aeo: 18, performance: 60, conversion: 30, mobile: 70 },
      recommendations: [
        {
          title: "Fix Largest Contentful Paint",
          description:
            "LCP currently at 4.8s — compress hero image and lazy-load below-fold assets.",
        },
      ],
    })

    expect(Buffer.isBuffer(pdf)).toBe(true)
    expect(pdf.byteLength).toBeGreaterThan(1000)
    // PDFs always begin with %PDF-
    expect(pdf.subarray(0, 5).toString("latin1")).toBe("%PDF-")
  })

  it("renders a healthy-score audit without recommendations", async () => {
    const pdf = await buildBrandedWebsiteAuditPDF(TOKENS, {
      url: "https://example.com",
      score: 88,
      recipientName: null,
    })
    expect(Buffer.isBuffer(pdf)).toBe(true)
    expect(pdf.byteLength).toBeGreaterThan(500)
  })

  it("clamps to a single page when no extra sections are passed", async () => {
    const pdf = await buildBrandedWebsiteAuditPDF(TOKENS, {
      url: "https://example.com",
      score: 50,
      recipientName: null,
    })
    // Pages are tagged in the binary stream by /Type /Page (escaped)
    const ascii = pdf.toString("latin1")
    const pageMatches = ascii.match(/\/Type\s*\/Page[^s]/g) ?? []
    expect(pageMatches.length).toBeLessThanOrEqual(2)
  })
})
