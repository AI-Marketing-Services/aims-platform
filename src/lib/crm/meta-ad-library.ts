/**
 * Meta Ad Library deep-link builder.
 *
 * We deliberately avoid the Meta Ad Library API (it requires an app review,
 * an access token, and rate-limit handling). Instead we build a search URL
 * and let the operator land directly on Meta's hosted Ad Library, which
 * shows whether the business is currently running ads.
 *
 * Reference URL shape (verified live, 2026):
 *   https://www.facebook.com/ads/library/?active_status=all&ad_type=all
 *     &country=ALL&q=<query>&search_type=keyword_unordered&media_type=all
 *
 * - `active_status=all`     → both active + inactive ads
 * - `ad_type=all`           → political + non-political
 * - `country=ALL`           → cross-region; respects whatever Meta surfaces
 * - `search_type=keyword_unordered` → fuzzy keyword match on Page name
 * - `media_type=all`        → image, video, carousel, etc.
 */

const BASE_URL = "https://www.facebook.com/ads/library/"

/**
 * Strip protocol, common admin subdomains, paths, and TLD from a URL or
 * domain so the resulting string is the cleanest possible search term
 * for Meta's keyword-unordered Ad Library search.
 *
 * Examples:
 *   "https://www.agemanagementoptimalwellness.com/contact"
 *     → "agemanagementoptimalwellness"
 *   "app.brand.com"           → "brand"
 *   "staging.acme.co.uk"      → "acme"
 *   "shop.example.co.uk/path" → "example"
 *
 * For multi-label hostnames we drop a leading admin subdomain
 * (`www`, `app`, `m`, `dev`, `staging`, `beta`, `shop`, `api`) and then
 * return the second-from-last label, which is the brand name for
 * standard TLDs (`example.com`) and country-code 2nd-level TLDs
 * (`example.co.uk`) alike. Single-label hosts (rare) return as-is.
 */
const ADMIN_SUBDOMAINS = new Set([
  "www",
  "app",
  "m",
  "mobile",
  "dev",
  "staging",
  "beta",
  "shop",
  "api",
])

function brandFromWebsite(website: string): string | null {
  try {
    const trimmed = website.trim()
    if (!trimmed) return null
    const withProtocol = /^https?:\/\//i.test(trimmed)
      ? trimmed
      : `https://${trimmed}`
    const url = new URL(withProtocol)
    const labels = url.hostname
      .split(".")
      .filter(Boolean)
      .map((s) => s.toLowerCase())
    if (labels.length === 0) return null
    // Drop a leading admin subdomain when present.
    if (labels.length > 1 && ADMIN_SUBDOMAINS.has(labels[0])) {
      labels.shift()
    }
    if (labels.length === 1) return labels[0] || null
    // Detect a 2-label public suffix like `co.uk`, `com.au`, `co.nz`,
    // `ac.uk` so `example.co.uk` → "example" rather than "co".
    const last = labels[labels.length - 1]
    const secondLast = labels[labels.length - 2]
    const looksLike2LabelSuffix =
      last.length === 2 &&
      ["co", "com", "net", "org", "gov", "edu", "ac"].includes(secondLast)
    const brandIdx = looksLike2LabelSuffix
      ? labels.length - 3
      : labels.length - 2
    const root = labels[Math.max(0, brandIdx)]
    return root || null
  } catch {
    return null
  }
}

/**
 * Build a Meta Ad Library search URL for a given business.
 *
 * Prefers the company name (matches Page names well). Falls back to the
 * brand portion of the website (e.g. "agemanagementoptimalwellness")
 * when no name is available.
 */
export function buildMetaAdLibraryUrl(input: {
  companyName?: string | null
  website?: string | null
  /** ISO country code (e.g. "US"). Defaults to "ALL". */
  country?: string | null
}): string | null {
  const candidate =
    (input.companyName?.trim() || "") ||
    (input.website ? brandFromWebsite(input.website) ?? "" : "")

  if (!candidate) return null

  const params = new URLSearchParams({
    active_status: "all",
    ad_type: "all",
    country: input.country?.trim() || "ALL",
    q: candidate,
    search_type: "keyword_unordered",
    media_type: "all",
  })

  return `${BASE_URL}?${params.toString()}`
}
