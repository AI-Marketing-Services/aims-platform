import "server-only"

import type { TenantContext } from "@/components/providers/tenant-theme-provider"
import { resolveSection } from "./registry"
import type { SectionBrand, Template } from "./types"
import { DEFAULT_TEMPLATE_ID, getTemplate } from "./templates"

/**
 * Resolve the operator's brand context into the SectionBrand shape that
 * every section component receives. Pre-computes the booking + site
 * URLs so individual sections don't need to know about subdomain vs
 * custom-domain routing.
 */
export function buildSectionBrand(tenant: TenantContext): SectionBrand {
  const siteUrl = tenant.operatorSite.customDomain
    ? `https://${tenant.operatorSite.customDomain}`
    : `https://${tenant.operatorSite.subdomain}.aioperatorcollective.com`

  return {
    operatorUserId: tenant.reseller.id,
    businessName: tenant.brand.businessName,
    logoUrl: tenant.brand.logoUrl,
    primaryColor: tenant.brand.brandColor,
    accentColor: tenant.brand.accentColor ?? tenant.brand.brandColor,
    fontHeading: tenant.brand.fontHeading,
    contactEmail: tenant.brand.userEmail,
    websiteUrl: tenant.brand.businessUrl,
    bookingUrl: `${siteUrl}#contact`,
    siteUrl,
  }
}

/**
 * Pick the active template for an operator. Falls back to the default
 * template when the operator hasn't chosen one yet, so EVERY operator
 * gets a polished page from day one.
 */
export function resolveActiveTemplate(
  activeTemplateId: string | null,
): Template {
  const explicit = getTemplate(activeTemplateId)
  if (explicit) return explicit
  const fallback = getTemplate(DEFAULT_TEMPLATE_ID)
  if (!fallback) {
    throw new Error(
      `Default template "${DEFAULT_TEMPLATE_ID}" missing from registry`,
    )
  }
  return fallback
}

/**
 * Merge defaults with operator overrides for a single section. Returns
 * the parsed (and therefore validated) content shape, or the parsed
 * defaults if either side fails validation. Never throws — bad JSON
 * just renders the safe default copy instead of crashing the page.
 */
export function resolveSectionContent<T>(
  sectionId: string,
  sectionType: Parameters<typeof resolveSection>[0],
  defaults: T,
  overrides: unknown,
): unknown {
  const def = resolveSection(sectionType)
  const overrideForSection =
    overrides &&
    typeof overrides === "object" &&
    !Array.isArray(overrides) &&
    sectionId in (overrides as Record<string, unknown>)
      ? (overrides as Record<string, unknown>)[sectionId]
      : undefined

  // Try the override first; fall back to defaults if invalid.
  if (overrideForSection !== undefined) {
    const merged =
      typeof overrideForSection === "object" &&
      overrideForSection !== null &&
      !Array.isArray(overrideForSection)
        ? { ...(defaults as Record<string, unknown>), ...(overrideForSection as Record<string, unknown>) }
        : defaults
    const parsed = def.schema.safeParse(merged)
    if (parsed.success) return parsed.data
  }

  // Defaults must validate (they came from our own template manifest)
  // but we still parse so the renderer always sees the schema's
  // normalized output (e.g. arrays defaulted to []).
  const fallback = def.schema.safeParse(defaults)
  return fallback.success ? fallback.data : {}
}
