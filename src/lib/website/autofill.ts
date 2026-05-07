import "server-only"

import { db } from "@/lib/db"

/**
 * Build a content-overrides JSON blob (the same shape as
 * OperatorSite.templateContent) that swaps the canned default copy in
 * a template for the operator's actual business details.
 *
 * Used in two places:
 * 1. The first time an operator picks a template — we pre-seed their
 *    `templateContent` so the published site immediately reads as
 *    "their" site instead of generic placeholder copy.
 * 2. The "Reset to my profile" button in the editor.
 *
 * Anything we don't have a safe value for is omitted, so the renderer's
 * default values shine through.
 */
export async function buildAutofillOverrides(args: {
  userId: string
}): Promise<Record<string, Record<string, unknown>>> {
  const profile = await db.memberProfile.findUnique({
    where: { userId: args.userId },
    select: {
      businessName: true,
      oneLiner: true,
      tagline: true,
      idealClient: true,
      niche: true,
      businessUrl: true,
    },
  })

  if (!profile) return {}

  const overrides: Record<string, Record<string, unknown>> = {}

  // Hero copy → both hero-center and hero-split share field names so a
  // single set of overrides applies to whichever variant the active
  // template uses.
  const headline = profile.oneLiner?.trim() || profile.tagline?.trim()
  const subheadline = profile.idealClient?.trim() || profile.niche?.trim()

  if (headline || subheadline) {
    const heroOverrides: Record<string, unknown> = {}
    if (headline) heroOverrides.headline = headline
    if (subheadline) heroOverrides.subheadline = subheadline
    overrides.hero = heroOverrides
  }

  // Footer — copyright line picks up the business name automatically
  // through the renderer fallback, but we also wire the operator's
  // public website URL into the footer link list when available.
  if (profile.businessUrl) {
    overrides.footer = {
      links: [
        { label: "Visit main site", href: profile.businessUrl },
        { label: "Privacy", href: "/privacy" },
        { label: "Terms", href: "/terms" },
      ],
    }
  }

  // Navbar — keep the canned link list but bind the CTA copy to a
  // booking-driven phrase if we know the niche; otherwise the template
  // default ("Book a call") is fine.
  if (profile.niche?.trim()) {
    overrides.navbar = {
      ctaLabel: "Book a call",
    }
  }

  return overrides
}
