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
 * Strip protocol, www., paths, and TLD from a URL/domain so the resulting
 * string is the cleanest possible search term.
 *
 * "https://www.agemanagementoptimalwellness.com/contact" →
 * "agemanagementoptimalwellness"
 */
function brandFromWebsite(website: string): string | null {
  try {
    const trimmed = website.trim()
    if (!trimmed) return null
    const withProtocol = trimmed.startsWith("http") ? trimmed : `https://${trimmed}`
    const url = new URL(withProtocol)
    const host = url.hostname.replace(/^www\./i, "")
    const root = host.split(".")[0]
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
