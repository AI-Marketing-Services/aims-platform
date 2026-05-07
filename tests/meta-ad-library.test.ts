import { describe, expect, it } from "vitest"
import { buildMetaAdLibraryUrl } from "@/lib/crm/meta-ad-library"

describe("buildMetaAdLibraryUrl", () => {
  it("returns null when no company name and no website are provided", () => {
    expect(buildMetaAdLibraryUrl({})).toBeNull()
    expect(buildMetaAdLibraryUrl({ companyName: "", website: "" })).toBeNull()
  })

  it("uses the company name as the search term when present", () => {
    const url = buildMetaAdLibraryUrl({
      companyName: "Lakeshore Realty Partners",
    })
    expect(url).not.toBeNull()
    const parsed = new URL(url!)
    expect(parsed.origin + parsed.pathname).toBe(
      "https://www.facebook.com/ads/library/",
    )
    expect(parsed.searchParams.get("q")).toBe("Lakeshore Realty Partners")
    expect(parsed.searchParams.get("active_status")).toBe("all")
    expect(parsed.searchParams.get("ad_type")).toBe("all")
    expect(parsed.searchParams.get("country")).toBe("ALL")
    expect(parsed.searchParams.get("search_type")).toBe("keyword_unordered")
    expect(parsed.searchParams.get("media_type")).toBe("all")
  })

  it("falls back to the brand portion of the website when no company name", () => {
    const url = buildMetaAdLibraryUrl({
      website: "https://www.agemanagementoptimalwellness.com/contact",
    })
    expect(url).not.toBeNull()
    const parsed = new URL(url!)
    expect(parsed.searchParams.get("q")).toBe("agemanagementoptimalwellness")
  })

  it("handles bare hostnames without a protocol", () => {
    const url = buildMetaAdLibraryUrl({ website: "agemanagementoptimalwellness.com" })
    expect(url).not.toBeNull()
    const parsed = new URL(url!)
    expect(parsed.searchParams.get("q")).toBe("agemanagementoptimalwellness")
  })

  it("respects an explicit country override", () => {
    const url = buildMetaAdLibraryUrl({
      companyName: "Acme Co",
      country: "US",
    })
    expect(url).not.toBeNull()
    const parsed = new URL(url!)
    expect(parsed.searchParams.get("country")).toBe("US")
  })

  it("URL-encodes special characters in the company name", () => {
    const url = buildMetaAdLibraryUrl({ companyName: "Foo & Bar, LLC" })
    expect(url).not.toBeNull()
    expect(url).toContain("q=Foo+%26+Bar%2C+LLC")
  })

  it("returns null when website is malformed and no company name is provided", () => {
    expect(buildMetaAdLibraryUrl({ website: "::::" })).toBeNull()
  })
})
