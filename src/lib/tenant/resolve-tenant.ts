import 'server-only'

import { unstable_cache, revalidateTag } from 'next/cache'
import { db } from '@/lib/db'
import type { TenantContext } from '@/components/providers/tenant-theme-provider'
import { notFound } from 'next/navigation'

const DEFAULT_BRAND_COLOR = '#C4972A'
const DEFAULT_FONT_HEADING = 'DM Sans'

function mapRowToTenant(site: {
  id: string
  subdomain: string
  customDomain: string | null
  themeId: string
  homepageContent: unknown
  customCss: string | null
  analyticsId: string | null
  seoTitle: string | null
  seoDescription: string | null
  user: {
    memberProfile: {
      businessName: string | null
      logoUrl: string | null
      faviconUrl: string | null
      brandColor: string | null
      accentColor: string | null
      fontHeading: string | null
      tagline: string | null
      oneLiner: string | null
      niche: string | null
      idealClient: string | null
      businessUrl: string | null
    } | null
    email: string
  } | null
}): TenantContext {
  const profile = site.user?.memberProfile ?? null

  return {
    operatorSite: {
      id: site.id,
      subdomain: site.subdomain,
      customDomain: site.customDomain ?? null,
      themeId: site.themeId ?? 'default',
      homepageContent: site.homepageContent ?? {},
      customCss: site.customCss ?? null,
      analyticsId: site.analyticsId ?? null,
      seoTitle: site.seoTitle ?? null,
      seoDescription: site.seoDescription ?? null,
    },
    brand: {
      businessName: profile?.businessName ?? site.subdomain,
      logoUrl: profile?.logoUrl ?? null,
      faviconUrl: profile?.faviconUrl ?? null,
      brandColor: profile?.brandColor ?? DEFAULT_BRAND_COLOR,
      accentColor: profile?.accentColor ?? null,
      fontHeading: profile?.fontHeading ?? DEFAULT_FONT_HEADING,
      tagline: profile?.tagline ?? null,
      oneLiner: profile?.oneLiner ?? null,
      niche: profile?.niche ?? null,
      idealClient: profile?.idealClient ?? null,
      businessUrl: profile?.businessUrl ?? null,
      userEmail: site.user?.email ?? null,
    },
  }
}

async function fetchBySubdomain(slug: string): Promise<TenantContext | null> {
  try {
    const site = await db.operatorSite.findFirst({
      where: { subdomain: slug, isPublished: true },
      include: {
        user: {
          select: {
            email: true,
            memberProfile: true,
          },
        },
      },
    })

    if (!site) return null
    return mapRowToTenant(site)
  } catch {
    return null
  }
}

async function fetchByCustomDomain(hostname: string): Promise<TenantContext | null> {
  try {
    const site = await db.operatorSite.findFirst({
      where: {
        customDomain: hostname,
        customDomainVerified: true,
        isPublished: true,
      },
      include: {
        user: {
          select: {
            email: true,
            memberProfile: true,
          },
        },
      },
    })

    if (!site) return null
    return mapRowToTenant(site)
  } catch {
    return null
  }
}

export async function resolveTenantBySubdomain(
  slug: string
): Promise<TenantContext | null> {
  return unstable_cache(
    () => fetchBySubdomain(slug),
    [`tenantSubdomain:${slug}`],
    {
      revalidate: 60,
      tags: [`tenantSubdomain:${slug}`],
    }
  )()
}

export async function resolveTenantByCustomDomain(
  hostname: string
): Promise<TenantContext | null> {
  return unstable_cache(
    () => fetchByCustomDomain(hostname),
    [`tenantDomain:${hostname}`],
    {
      revalidate: 60,
      tags: [`tenantDomain:${hostname}`],
    }
  )()
}

/** Resolve by subdomain or call notFound(). */
export async function requireTenantBySubdomain(slug: string): Promise<TenantContext> {
  const tenant = await resolveTenantBySubdomain(slug)
  if (!tenant) notFound()
  return tenant
}

/** Resolve by custom domain or call notFound(). */
export async function requireTenantByCustomDomain(hostname: string): Promise<TenantContext> {
  const tenant = await resolveTenantByCustomDomain(hostname)
  if (!tenant) notFound()
  return tenant
}

/**
 * Invalidate tenant cache entries after a write. Pass both the new values
 * AND any old values the caller replaced — e.g. when a reseller renames
 * their subdomain we need to bust both the old and new tag so neither
 * serves stale data.
 */
export function invalidateTenantCache(params: {
  subdomains?: (string | null | undefined)[]
  customDomains?: (string | null | undefined)[]
}): void {
  const subs = (params.subdomains ?? []).filter((s): s is string => !!s)
  const domains = (params.customDomains ?? []).filter((d): d is string => !!d)
  // Next.js 16: revalidateTag takes a cache profile. { expire: 0 } forces
  // immediate invalidation (equivalent to the legacy single-arg behavior).
  const expireNow = { expire: 0 }
  for (const s of subs) revalidateTag(`tenantSubdomain:${s}`, expireNow)
  for (const d of domains) revalidateTag(`tenantDomain:${d}`, expireNow)
}
