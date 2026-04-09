/**
 * Single source of truth for partner commission tiers.
 *
 * Used by:
 * - src/lib/stripe/handlers/handle-invoice.ts — creates commission records on first invoice
 * - src/app/(reseller)/reseller/commissions/page.tsx — displays tier info to partners
 * - Any admin UI that needs to label a referral tier
 *
 * Rates are stored as decimal fractions (0.1 = 10%) for use in math;
 * helpers below format them for display.
 */

export type ReferralTier = "AFFILIATE" | "COMMUNITY_PARTNER" | "RESELLER"

export interface CommissionTierConfig {
  tier: ReferralTier
  label: string
  rate: number
  description: string
}

export const COMMISSION_TIERS: Record<ReferralTier, CommissionTierConfig> = {
  AFFILIATE: {
    tier: "AFFILIATE",
    label: "Affiliate",
    rate: 0.1,
    description: "Open to any AIMS user who shares their referral link",
  },
  COMMUNITY_PARTNER: {
    tier: "COMMUNITY_PARTNER",
    label: "Community Partner",
    rate: 0.15,
    description: "Verified creators and community operators",
  },
  RESELLER: {
    tier: "RESELLER",
    label: "Reseller",
    rate: 0.25,
    description: "Approved agency and consultant partners",
  },
} as const

/** Fallback rate when a tier value is unrecognized. Matches prior behavior. */
export const DEFAULT_COMMISSION_RATE = 0.2

export const TIER_UPGRADE_PATH: Record<ReferralTier, ReferralTier | null> = {
  AFFILIATE: "COMMUNITY_PARTNER",
  COMMUNITY_PARTNER: "RESELLER",
  RESELLER: null,
}

export function getCommissionRate(tier: string): number {
  if (tier in COMMISSION_TIERS) {
    return COMMISSION_TIERS[tier as ReferralTier].rate
  }
  return DEFAULT_COMMISSION_RATE
}

export function getTierLabel(tier: string): string {
  if (tier in COMMISSION_TIERS) {
    return COMMISSION_TIERS[tier as ReferralTier].label
  }
  // Fallback: title-case whatever string we were handed
  return tier
    .toLowerCase()
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ")
}

export function formatCommissionRate(rate: number): string {
  return `${Math.round(rate * 100)}%`
}
