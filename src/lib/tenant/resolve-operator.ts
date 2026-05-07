import "server-only"

import { db } from "@/lib/db"
import { RESERVED_SUBDOMAINS } from "@/lib/tenant/reserved-subdomains"

/**
 * Operator attribution resolution for lead-magnet submissions and any
 * other public POST endpoints embedded on a tenant page.
 *
 * Why a separate file from `resolve-tenant.ts`:
 * - That module is rendering-side: cached, returns a TenantContext with
 *   branding, and is invoked from layouts/pages.
 * - This module is API-side: it's called from POST handlers, doesn't
 *   need the full branding payload, and must be cheap on every submit.
 *
 * Resolution order (first hit wins):
 *   1. Explicit `operatorSlug` field in the request body (embed override)
 *   2. `x-operator-slug` header (set by trusted internal integrations)
 *   3. `host` / `x-forwarded-host` header — extracts subdomain or treats
 *      a foreign hostname as a verified custom domain
 *   4. Origin / Referer header fallback (when host points at the platform
 *      apex — e.g. an iframe-embed on a third-party site)
 *
 * Returns `null` when the request originates from the platform apex —
 * which is the legacy default and must remain untouched.
 */

const PLATFORM_HOSTS = new Set([
  "aioperatorcollective.com",
  "www.aioperatorcollective.com",
  "localhost",
  "localhost:3000",
])

const BASE_HOST = "aioperatorcollective.com"

export interface ResolvedOperator {
  operatorId: string
  operatorUserId: string
  subdomain: string
  customDomain: string | null
  /** "subdomain" | "custom" | "explicit" — for analytics/telemetry. */
  via: "subdomain" | "custom" | "explicit"
}

/**
 * Normalises a hostname value pulled from a request header. Trims
 * surrounding whitespace and lowercases the entire string so suffix
 * comparisons + Prisma equality lookups become case-insensitive
 * (`Acme.Aioperatorcollective.com` and `acme.aioperatorcollective.com`
 * resolve to the same operator).
 */
function normaliseHost(host: string): string {
  return host.trim().toLowerCase()
}

function stripPort(host: string): string {
  return normaliseHost(host).split(":")[0]
}

function isPlatformHost(host: string): boolean {
  if (!host) return true
  const n = normaliseHost(host)
  if (PLATFORM_HOSTS.has(n) || PLATFORM_HOSTS.has(stripPort(n))) return true
  if (n.endsWith(".vercel.app")) return true
  return false
}

function extractSubdomain(host: string): string | null {
  const clean = stripPort(host)
  if (!clean.endsWith(`.${BASE_HOST}`)) return null
  const slug = clean.slice(0, -(BASE_HOST.length + 1))
  if (!slug || slug.includes(".") || RESERVED_SUBDOMAINS.has(slug)) return null
  return slug
}

function hostFromUrl(raw: string | null): string | null {
  if (!raw) return null
  try {
    return normaliseHost(new URL(raw).host)
  } catch {
    return null
  }
}

async function findBySubdomain(slug: string): Promise<ResolvedOperator | null> {
  const normalised = normaliseHost(slug)
  if (!normalised) return null
  const site = await db.operatorSite
    .findFirst({
      where: { subdomain: normalised, isPublished: true },
      select: { id: true, userId: true, subdomain: true, customDomain: true },
    })
    .catch(() => null)
  if (!site) return null
  return {
    operatorId: site.id,
    operatorUserId: site.userId,
    subdomain: site.subdomain,
    customDomain: site.customDomain,
    via: "subdomain",
  }
}

async function findByCustomDomain(host: string): Promise<ResolvedOperator | null> {
  const customDomain = stripPort(host)
  if (!customDomain) return null
  const site = await db.operatorSite
    .findFirst({
      where: {
        customDomain,
        customDomainVerified: true,
        isPublished: true,
      },
      select: { id: true, userId: true, subdomain: true, customDomain: true },
    })
    .catch(() => null)
  if (!site) return null
  return {
    operatorId: site.id,
    operatorUserId: site.userId,
    subdomain: site.subdomain,
    customDomain: site.customDomain,
    via: "custom",
  }
}

/**
 * Best-effort operator resolution. Never throws — a failed lookup falls
 * back to `null` so the caller can default to platform attribution.
 */
export async function resolveOperatorFromRequest(
  req: Request,
  body?: { operatorSlug?: string | null },
): Promise<ResolvedOperator | null> {
  // 1. Explicit override in request body.
  const bodySlug = body?.operatorSlug?.trim()
  if (bodySlug) {
    const hit = await findBySubdomain(bodySlug)
    if (hit) return { ...hit, via: "explicit" }
  }

  const headers = req.headers

  // 2. Trusted header — used by server-to-server callers and embeds
  //    that authenticate up-front (rate-limited downstream).
  const headerSlug = headers.get("x-operator-slug")?.trim()
  if (headerSlug) {
    const hit = await findBySubdomain(headerSlug)
    if (hit) return { ...hit, via: "explicit" }
  }

  // 3. Host-based resolution: this is the common case for tools
  //    rendered at acme.aioperatorcollective.com or audits.acme.com.
  //    Vercel sets `x-forwarded-host` to the user-typed hostname.
  const forwarded = headers.get("x-forwarded-host") ?? headers.get("host") ?? ""
  if (forwarded && !isPlatformHost(forwarded)) {
    const sub = extractSubdomain(forwarded)
    if (sub) {
      const hit = await findBySubdomain(sub)
      if (hit) return hit
    }
    const custom = await findByCustomDomain(forwarded)
    if (custom) return custom
  }

  // 4. Origin / Referer fallback — handles iframe embeds on third-party
  //    sites where the request hits the platform host directly but the
  //    referring document is on the operator's domain.
  const originHost = hostFromUrl(headers.get("origin"))
  const refererHost = hostFromUrl(headers.get("referer"))
  for (const candidate of [originHost, refererHost]) {
    if (!candidate || isPlatformHost(candidate)) continue
    const sub = extractSubdomain(candidate)
    if (sub) {
      const hit = await findBySubdomain(sub)
      if (hit) return hit
    }
    const custom = await findByCustomDomain(candidate)
    if (custom) return custom
  }

  return null
}
