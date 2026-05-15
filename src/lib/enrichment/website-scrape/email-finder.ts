/**
 * Free, no-API mailto: scraper. Visits homepage + common contact paths,
 * extracts emails from `mailto:` links and plaintext, classifies them
 * (personal beats info beats noreply), respects 1.5MB cap per page.
 *
 * Runs FIRST in the enrichment pipeline because it's free, ground-truth
 * (operator's own contact page), and seeds high-confidence emails for
 * downstream Hunter/Prospeo dedup.
 */

const FETCH_TIMEOUT_MS = 5000
const MAX_BYTES_PER_PAGE = 1_500_000
const COMMON_PATHS = [
  "",
  "/contact",
  "/contact-us",
  "/contact.html",
  "/leasing",
  "/leasing-info",
  "/about",
  "/about-us",
  "/team",
  "/staff",
  "/management",
]

const EMAIL_REGEX = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g
const MAILTO_REGEX = /mailto:([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/gi

// Lower score = preferred. Personal local-parts get 0; named generic
// prefixes get higher numbers; noreply-style get 99 (de-prioritised).
const GENERIC_RANK: Record<string, number> = {
  leasing: 1,
  rentals: 2,
  rental: 2,
  property: 3,
  manager: 3,
  management: 3,
  hello: 4,
  contact: 4,
  info: 5,
  inquiries: 5,
  enquiries: 5,
  enquiry: 5,
  office: 6,
  admin: 7,
  team: 7,
  support: 8,
  billing: 9,
  hr: 9,
  careers: 10,
  jobs: 10,
  noreply: 99,
  "no-reply": 99,
  donotreply: 99,
  dnr: 99,
}

const SKIP_DOMAINS = new Set([
  "sentry.io",
  "wixpress.com",
  "wix.com",
  "godaddy.com",
  "squarespace.com",
  "wordpress.com",
  "shopify.com",
  "cloudflare.com",
  "mailchimp.com",
])

export interface FoundEmail {
  email: string
  isGeneric: boolean
  score: number
  sourcePath: string
}

function normalizeBaseUrl(raw: string | null): string | null {
  if (!raw) return null
  try {
    const cleaned = raw.trim()
    const withProtocol = /^https?:\/\//i.test(cleaned) ? cleaned : `https://${cleaned}`
    const url = new URL(withProtocol)
    return `${url.protocol}//${url.host}`
  } catch {
    return null
  }
}

async function fetchPage(url: string): Promise<string | null> {
  try {
    // SSRF defense — validate hostname resolves to a public IP BEFORE
    // touching fetch(). Block private/loopback/link-local ranges so a
    // malicious deal.website like `http://169.254.169.254/` (AWS meta-
    // data), `http://localhost`, etc. can't exfiltrate internal
    // services. Manual redirect so each hop can be re-validated below.
    const { assertPublicUrl } = await import("@/lib/security/ssrf-guard")
    let nextUrl = await assertPublicUrl(url)
    let hops = 0
    let res: Response
    while (true) {
      res = await fetch(nextUrl, {
        redirect: "manual",
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
        headers: {
          "user-agent": "Mozilla/5.0 (compatible; AIMSEnrichBot/1.0)",
          accept: "text/html,application/xhtml+xml",
        },
      })
      // Manual redirect handling — cap at 5 hops, re-validate each.
      // Without this, a public host could 302 us into a private IP and
      // bypass our pre-flight assertion above.
      if (res.status >= 300 && res.status < 400 && hops < 5) {
        const loc = res.headers.get("location")
        if (!loc) break
        nextUrl = await assertPublicUrl(new URL(loc, nextUrl).toString())
        hops++
        continue
      }
      break
    }
    if (!res.ok) return null
    const ct = res.headers.get("content-type") ?? ""
    if (!ct.includes("text/html") && !ct.includes("application/xhtml+xml")) return null

    const reader = res.body?.getReader()
    if (!reader) {
      const t = await res.text()
      return t.length > MAX_BYTES_PER_PAGE ? t.slice(0, MAX_BYTES_PER_PAGE) : t
    }
    const chunks: Uint8Array[] = []
    let total = 0
    while (true) {
      const { value, done } = await reader.read()
      if (done) break
      if (value) {
        total += value.byteLength
        chunks.push(value)
        if (total >= MAX_BYTES_PER_PAGE) break
      }
    }
    const out = new Uint8Array(chunks.reduce((n, c) => n + c.byteLength, 0))
    let off = 0
    for (const c of chunks) {
      out.set(c, off)
      off += c.byteLength
    }
    return new TextDecoder("utf-8", { fatal: false }).decode(out)
  } catch {
    return null
  }
}

function classifyEmail(email: string, baseDomain: string | null): FoundEmail | null {
  const lower = email.toLowerCase()
  const local = (lower.split("@")[0] ?? "").toLowerCase()
  const domain = (lower.split("@")[1] ?? "").toLowerCase()
  if (!domain || SKIP_DOMAINS.has(domain)) return null
  if (/\.(png|jpe?g|gif|webp|svg|ico|css|js)$/i.test(lower)) return null

  // De-prioritise off-domain emails (e.g. info@gmail.com on a property site).
  const offDomain = baseDomain && !domain.endsWith(baseDomain.toLowerCase()) ? 5 : 0

  if (GENERIC_RANK[local] !== undefined) {
    return {
      email: lower,
      isGeneric: true,
      score: GENERIC_RANK[local] + offDomain,
      sourcePath: "",
    }
  }
  // Catch "info+leasing@..." or "info.team@..." style
  const baseLocal = local.split(/[.+\-_]/)[0] ?? ""
  if (GENERIC_RANK[baseLocal] !== undefined) {
    return {
      email: lower,
      isGeneric: true,
      score: GENERIC_RANK[baseLocal] + 0.5 + offDomain,
      sourcePath: "",
    }
  }
  return { email: lower, isGeneric: false, score: 0 + offDomain, sourcePath: "" }
}

function extractEmailsFromHtml(html: string): string[] {
  const found = new Set<string>()
  for (const m of html.matchAll(MAILTO_REGEX)) if (m[1]) found.add(m[1])
  for (const m of html.matchAll(EMAIL_REGEX)) if (m[1]) found.add(m[1])
  return Array.from(found)
}

export async function findEmailsOnWebsite(args: {
  website: string | null
  limit?: number
}): Promise<FoundEmail[]> {
  const limit = args.limit ?? 5
  const base = normalizeBaseUrl(args.website)
  if (!base) return []
  const baseDomain = (() => {
    try {
      return new URL(base).hostname.replace(/^www\./, "").toLowerCase()
    } catch {
      return null
    }
  })()

  const visited: Array<{ path: string; html: string }> = []
  for (const path of COMMON_PATHS) {
    const html = await fetchPage(`${base}${path}`)
    if (html) visited.push({ path, html })
    if (visited.length >= 5) break // hard ceiling per lead
  }

  const agg = new Map<string, FoundEmail>()
  for (const page of visited) {
    for (const email of extractEmailsFromHtml(page.html)) {
      const c = classifyEmail(email, baseDomain)
      if (!c) continue
      const existing = agg.get(c.email)
      if (!existing || c.score < existing.score) {
        agg.set(c.email, { ...c, sourcePath: page.path || "/" })
      }
    }
  }

  return Array.from(agg.values())
    .sort((a, b) => a.score - b.score)
    .slice(0, limit)
}
