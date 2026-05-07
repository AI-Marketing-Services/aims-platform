import "server-only"

import { db } from "@/lib/db"
import type { BrandTokens } from "./types"

const DEFAULT_TOKENS: BrandTokens = {
  businessName: "AI Operator Collective",
  logoUrl: null,
  primaryColor: "#981B1B",
  accentColor: "#C42424",
  tagline: "Done-for-you AI workflows for service businesses",
  contactEmail: "hello@aioperatorcollective.com",
  websiteUrl: "https://www.aioperatorcollective.com",
}

/**
 * Resolve the brand tokens for a given operator userId. Falls back to
 * the AIOC default tokens when the operator hasn't customized branding
 * yet (or when called for a platform-funnel submission with no operator).
 */
export async function loadBrandTokensForOperator(
  operatorUserId: string | null | undefined,
): Promise<BrandTokens> {
  if (!operatorUserId) return DEFAULT_TOKENS

  const profile = await db.memberProfile
    .findUnique({
      where: { userId: operatorUserId },
      select: {
        businessName: true,
        logoUrl: true,
        brandColor: true,
        accentColor: true,
        tagline: true,
        oneLiner: true,
        businessUrl: true,
        user: { select: { email: true } },
      },
    })
    .catch(() => null)

  if (!profile) return DEFAULT_TOKENS

  const primary = isHex(profile.brandColor) ? profile.brandColor! : DEFAULT_TOKENS.primaryColor
  const accent = isHex(profile.accentColor) ? profile.accentColor! : primary

  return {
    businessName: profile.businessName?.trim() || DEFAULT_TOKENS.businessName,
    logoUrl: profile.logoUrl ?? null,
    primaryColor: primary,
    accentColor: accent,
    tagline: profile.tagline?.trim() || profile.oneLiner?.trim() || null,
    contactEmail: profile.user?.email ?? null,
    websiteUrl: profile.businessUrl ?? null,
  }
}

function isHex(value: string | null | undefined): boolean {
  return !!value && /^#[0-9a-fA-F]{6}$/.test(value)
}
