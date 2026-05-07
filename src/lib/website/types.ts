/**
 * Type system for the Website feature — operator-facing template-driven
 * landing pages rendered on their subdomain or verified custom domain.
 *
 * The contract:
 *
 * 1. Each `Template` declares an ordered list of `SectionInstance`s.
 * 2. Each `SectionInstance` references a `SectionType` from the registry
 *    (`src/lib/website/sections/registry.ts`) and carries default content
 *    that the operator can override via the editor.
 * 3. Operator overrides land in `OperatorSite.templateContent` keyed by
 *    section instance id. The renderer merges defaults <- overrides.
 * 4. Content for every section type is validated against a Zod schema
 *    server-side before render so a malformed JSON blob (manual edit,
 *    bug, etc.) renders the section's fallback rather than crashing
 *    the whole page.
 *
 * Anything that touches user-controlled strings (headline, body copy,
 * link text, image alt) flows through this pipeline — operators never
 * inject HTML/CSS/JS directly.
 */
import type { z } from "zod"

/** All known section types. Adding a new section means adding an entry here AND in the registry. */
export type SectionType =
  | "navbar"
  | "hero-center"
  | "hero-split"
  | "logo-bar"
  | "feature-grid-3"
  | "feature-grid-6"
  | "feature-split"
  | "how-it-works"
  | "testimonial-grid"
  | "testimonial-single"
  | "pricing-3"
  | "faq"
  | "cta-form"
  | "footer"

/**
 * One section in a template. `id` is stable per-template so operator
 * content overrides survive template-version bumps.
 */
export interface SectionInstance<T = unknown> {
  /** Stable unique id per template. */
  id: string
  type: SectionType
  /** Default content rendered when the operator hasn't overridden. */
  defaults: T
}

/**
 * Template manifest — ordered list of sections, plus metadata used by
 * the editor's template picker.
 */
export interface Template {
  id: string
  name: string
  /** Short marketing tagline shown on the picker card. */
  tagline: string
  /** Best-fit operator type — drives the picker's filter chips. */
  bestFor: string
  /** Preview thumbnail rendered on the picker card. */
  thumbnailUrl: string
  /** Visual mode hint — renderer applies this to the body wrapper. */
  mode: "light" | "dark"
  sections: SectionInstance[]
}

/** Section content schemas, exported by the registry, used for validation. */
export type SectionSchema<T> = z.ZodType<T>

/**
 * Brand context handed to every section component. Wraps the existing
 * TenantContext.brand fields plus operator-resolved utility values
 * (e.g. computed CTA URLs) so each section is self-contained.
 */
export interface SectionBrand {
  /** OperatorSite-owning user id — used by sections that submit leads
   *  back to the operator's CRM (e.g. CtaForm). */
  operatorUserId: string
  businessName: string
  logoUrl: string | null
  primaryColor: string
  accentColor: string
  fontHeading: string
  contactEmail: string | null
  websiteUrl: string | null
  /** Pre-built link to the operator-owned booking page on the platform. */
  bookingUrl: string
  /** Subdomain or custom-domain-prefixed share URL for the site root. */
  siteUrl: string
}
