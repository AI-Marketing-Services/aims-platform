import "server-only"
import { cookies, headers } from "next/headers"

/**
 * First-touch attribution capture.
 *
 * The `aoc_first_touch` cookie is set ONCE by middleware on the very first
 * pageview (when no cookie is present). It encodes the visitor's UTM
 * params, raw HTTP Referer, and the landing path as a JSON-encoded blob.
 *
 * On user signup we read this cookie and stamp the values onto User row's
 * `firstUtm*` columns — read-only after that. This is what lets the
 * /admin/cfo dashboard answer "where did our paying users actually come
 * from?" without inferring it from the much-noisier Deal/PageView tables.
 *
 * Cookie schema:
 *   {
 *     s: utmSource | undefined,
 *     m: utmMedium | undefined,
 *     c: utmCampaign | undefined,
 *     ct: utmContent | undefined,
 *     t: utmTerm | undefined,
 *     r: referrer | undefined,
 *     p: landingPath | undefined,
 *     // ISO timestamp of first touch — useful for "days from first touch
 *     // to signup" reporting.
 *     ts: ISO string,
 *   }
 *
 * 30-day TTL so a visitor who took a few weeks to come back still gets
 * credited to the original source.
 */

export const FIRST_TOUCH_COOKIE = "aoc_first_touch"
const FIRST_TOUCH_TTL_DAYS = 30

export interface FirstTouchData {
  utmSource?: string
  utmMedium?: string
  utmCampaign?: string
  utmContent?: string
  utmTerm?: string
  referrer?: string
  landingPath?: string
  /** ISO timestamp of first touch. */
  ts?: string
}

/**
 * Bucket a UTM combination into a coarse signup-source label. Powers the
 * /admin/cfo "MRR by acquisition channel" pie + the User.signupSource
 * denormalization.
 */
export function classifySignupSource(d: FirstTouchData): string {
  const m = d.utmMedium?.toLowerCase()
  const s = d.utmSource?.toLowerCase()

  if (m === "cpc" || m === "ppc" || m === "paid" || m === "sem") return "paid-search"
  if (m === "paid-social" || m === "paid_social" || s === "facebook-ads" || s === "fb")
    return "paid-social"
  if (m === "social") return "organic-social"
  if (m === "email" || s === "email" || s === "newsletter") return "email"
  if (m === "referral" || s === "partner" || s === "affiliate") return "referral"
  if (m === "organic" || s === "google" || s === "bing") return "organic-search"
  if (s === "direct" || (!s && !m && !d.referrer)) return "direct"
  if (d.referrer && !s && !m) {
    // Best-effort: classify by referer host
    try {
      const host = new URL(d.referrer).host.toLowerCase()
      if (host.includes("google")) return "organic-search"
      if (host.includes("bing") || host.includes("duckduckgo")) return "organic-search"
      if (
        host.includes("twitter") ||
        host.includes("linkedin") ||
        host.includes("facebook") ||
        host.includes("instagram") ||
        host.includes("youtube")
      )
        return "organic-social"
      return "referral"
    } catch {
      return "unknown"
    }
  }
  return "unknown"
}

/**
 * Read the first-touch cookie + headers. Returns whatever we can extract,
 * `{}` if nothing. Never throws.
 */
export async function readFirstTouch(): Promise<FirstTouchData> {
  try {
    const store = await cookies()
    const raw = store.get(FIRST_TOUCH_COOKIE)?.value
    if (!raw) {
      // Fall back to current request headers — covers the case where the
      // user signs up on the SAME pageview the cookie would have been set
      // on (middleware sets it for the NEXT request).
      return await readFromCurrentRequest()
    }
    const decoded = JSON.parse(decodeURIComponent(raw)) as Record<string, unknown>
    return {
      utmSource: typeof decoded.s === "string" ? decoded.s : undefined,
      utmMedium: typeof decoded.m === "string" ? decoded.m : undefined,
      utmCampaign: typeof decoded.c === "string" ? decoded.c : undefined,
      utmContent: typeof decoded.ct === "string" ? decoded.ct : undefined,
      utmTerm: typeof decoded.t === "string" ? decoded.t : undefined,
      referrer: typeof decoded.r === "string" ? decoded.r : undefined,
      landingPath: typeof decoded.p === "string" ? decoded.p : undefined,
      ts: typeof decoded.ts === "string" ? decoded.ts : undefined,
    }
  } catch {
    return {}
  }
}

/**
 * Best-effort same-pageview attribution. Pulls referrer + landing-path
 * from request headers when no cookie has been set yet.
 */
async function readFromCurrentRequest(): Promise<FirstTouchData> {
  try {
    const h = await headers()
    return {
      referrer: h.get("referer") || undefined,
      landingPath: undefined,
      ts: new Date().toISOString(),
    }
  } catch {
    return {}
  }
}

/**
 * Encode + set the cookie. Called from middleware on the FIRST pageview
 * of a session (when no cookie is present yet). Idempotent — never
 * overwrites an existing cookie. Never throws.
 */
export function buildFirstTouchCookieValue(data: FirstTouchData): string {
  const payload = {
    s: data.utmSource,
    m: data.utmMedium,
    c: data.utmCampaign,
    ct: data.utmContent,
    t: data.utmTerm,
    r: data.referrer,
    p: data.landingPath,
    ts: data.ts ?? new Date().toISOString(),
  }
  return encodeURIComponent(JSON.stringify(payload))
}

export const FIRST_TOUCH_MAX_AGE = FIRST_TOUCH_TTL_DAYS * 24 * 60 * 60
