/**
 * Hunter.io — two endpoints used by the pipeline:
 *
 *   domain-search  — broad sweep, returns up to 10 named contacts on a
 *                    domain. Skips generic mailboxes (info@, support@).
 *   email-finder   — targeted lookup for a specific person by name +
 *                    domain. Used after Perplexity surfaces a name but
 *                    didn't return an email.
 *
 * Both filter to confidence >= 70 and skip generic-prefix locals.
 *
 * Hunter rate-limits aggressively; production callers should cache
 * domain-search results per-domain for at least 30 days.
 */

const HUNTER_BASE = "https://api.hunter.io/v2"
const MIN_CONFIDENCE = 70
const MAX_DOMAIN_CONTACTS = 10

const GENERIC_PREFIXES = new Set([
  "info",
  "contact",
  "hello",
  "support",
  "admin",
  "team",
  "help",
  "noreply",
  "no-reply",
  "enquiries",
  "enquiry",
  "hr",
  "careers",
  "jobs",
  "billing",
  "accounts",
  "office",
  "mail",
])

export interface HunterContact {
  email: string
  firstName: string | null
  lastName: string | null
  title: string | null
  confidence: number
}

function isGeneric(email: string): boolean {
  const local = email.split("@")[0]?.toLowerCase() ?? ""
  if (GENERIC_PREFIXES.has(local)) return true
  const baseLocal = local.split(/[.+]/)[0] ?? ""
  return GENERIC_PREFIXES.has(baseLocal)
}

export async function domainSearch(domain: string): Promise<HunterContact[]> {
  const key = process.env.HUNTER_API_KEY
  if (!key) return []
  try {
    const url = new URL(`${HUNTER_BASE}/domain-search`)
    url.searchParams.set("domain", domain)
    url.searchParams.set("api_key", key)
    url.searchParams.set("limit", String(MAX_DOMAIN_CONTACTS))
    url.searchParams.set("type", "personal")

    const res = await fetch(url.toString(), {
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) return []

    const json = (await res.json()) as {
      data?: {
        emails?: Array<{
          value?: string
          confidence?: number
          first_name?: string
          last_name?: string
          position?: string
        }>
      }
    }
    return (json.data?.emails ?? [])
      .filter(
        (e) =>
          e.value &&
          typeof e.confidence === "number" &&
          e.confidence >= MIN_CONFIDENCE &&
          !isGeneric(e.value),
      )
      .map((e) => ({
        email: e.value!,
        firstName: e.first_name ?? null,
        lastName: e.last_name ?? null,
        title: e.position ?? null,
        confidence: e.confidence!,
      }))
      .slice(0, MAX_DOMAIN_CONTACTS)
  } catch {
    return []
  }
}

export async function emailFinder(args: {
  firstName: string
  lastName: string
  domain: string
}): Promise<HunterContact | null> {
  const key = process.env.HUNTER_API_KEY
  if (!key) return null
  try {
    const url = new URL(`${HUNTER_BASE}/email-finder`)
    url.searchParams.set("domain", args.domain)
    url.searchParams.set("first_name", args.firstName)
    url.searchParams.set("last_name", args.lastName)
    url.searchParams.set("api_key", key)

    const res = await fetch(url.toString(), {
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) return null

    const json = (await res.json()) as {
      data?: {
        email?: string
        score?: number
        first_name?: string
        last_name?: string
        position?: string
      }
    }
    const d = json.data
    if (!d?.email || !d.score || d.score < MIN_CONFIDENCE || isGeneric(d.email)) {
      return null
    }
    return {
      email: d.email,
      firstName: d.first_name ?? args.firstName,
      lastName: d.last_name ?? args.lastName,
      title: d.position ?? null,
      confidence: d.score,
    }
  } catch {
    return null
  }
}
