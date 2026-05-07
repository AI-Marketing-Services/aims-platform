/**
 * Brand tokens used across all branded lead-magnet PDFs. Resolved per
 * submission so an operator's logo, colors, and contact line all flow
 * through the same template.
 *
 * Defaults to AIOC values when an operator hasn't customized branding;
 * this guarantees every PDF is always renderable, even for legacy
 * platform-funnel submissions.
 */
export interface BrandTokens {
  /** Display name in the header + footer. */
  businessName: string
  /** Optional URL to the operator's logo (PNG/JPG/SVG). */
  logoUrl: string | null
  /** Primary brand color, hex `#RRGGBB`. */
  primaryColor: string
  /** Optional accent color, falls back to primary. */
  accentColor: string
  /** One-liner under the business name in the header. */
  tagline: string | null
  /** Reply-to email shown on the cover/footer. */
  contactEmail: string | null
  /** Public website URL — clickable in the footer. */
  websiteUrl: string | null
}

/**
 * Input for the Website Audit branded PDF. Mirrors the shape produced
 * by /api/ai/audit so we can hand the audit results straight in.
 */
export interface WebsiteAuditPDFInput {
  /** The site that was audited. */
  url: string
  /** 0-100 overall score. */
  score: number
  /** Recipient name (when known) — personalizes the cover. */
  recipientName: string | null
  /** Per-category 0-100 sub-scores. */
  scores?: {
    seo?: number
    aeo?: number
    performance?: number
    conversion?: number
    mobile?: number
  }
  /** Top recommendations to surface on page 2. */
  recommendations?: Array<{
    title: string
    description: string
    impact?: "high" | "medium" | "low"
  }>
}
