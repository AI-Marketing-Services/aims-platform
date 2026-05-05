import { ensureDbUser } from "@/lib/auth/ensure-user"
import { hasEntitlement } from "@/lib/entitlements"
import {
  cheapestPlanFor,
  FEATURE_LABELS,
  type FeatureEntitlement,
} from "@/lib/plans/registry"
import { db } from "@/lib/db"
import { PaywallOverlay } from "./PaywallOverlay"

interface Props {
  /** Feature entitlement key — see FEATURE_ENTITLEMENTS in lib/plans/registry. */
  feature: FeatureEntitlement
  /** Friendly headline override; defaults to FEATURE_LABELS[feature]. */
  featureName?: string
  /** Sub-headline. Optional — paywall card stays clean without it. */
  blurb?: string
  children: React.ReactNode
}

/**
 * Server-side feature gate driven by the Stripe entitlement system.
 *
 * Flow:
 *   1. Resolve the DB user (lazy-creates on first hit; gives them planSlug=free).
 *   2. ADMIN / SUPER_ADMIN bypass entirely — they're always unlocked so we
 *      can support customers without paying our own subscription.
 *   3. Lookup `hasEntitlement(userId, feature)`. Granted → render children.
 *   4. Otherwise wrap children in <PaywallOverlay> with the cheapest plan
 *      that includes the feature, plus the marketing video URL pulled
 *      from the Product table (set by /portal/admin/products UI later).
 */
export async function EntitlementGate({
  feature,
  featureName,
  blurb,
  children,
}: Props) {
  const user = await ensureDbUser()

  // Admins always pass — we don't paywall the people running the platform.
  if (user.role === "ADMIN" || user.role === "SUPER_ADMIN") {
    return <>{children}</>
  }

  const granted = await hasEntitlement(user.id, feature)
  if (granted) return <>{children}</>

  const plan = cheapestPlanFor(feature)
  // Fall back gracefully if the registry is mid-edit and a feature has no
  // plan that includes it. Show a plain "locked, upgrade your plan" card.
  const planName = plan?.name ?? "Pro"
  const planSlug = plan?.slug ?? "pro"
  const planPriceMonthly = plan?.priceMonthly ?? 97
  const highlights = plan?.highlights

  // Pull the marketing video URL from the Product row (admin-editable
  // without a redeploy). Keep this as a single read; failure → no video.
  let videoUrl: string | null = null
  if (plan) {
    try {
      const product = await db.product.findUnique({
        where: { slug: plan.slug },
        select: { marketingVideoUrl: true },
      })
      videoUrl = product?.marketingVideoUrl ?? null
    } catch {
      // best effort
    }
  }

  const headline = featureName ?? FEATURE_LABELS[feature] ?? "Upgrade required"

  return (
    <PaywallOverlay
      featureKey={feature}
      featureName={headline}
      blurb={blurb}
      planName={planName}
      planSlug={planSlug}
      planPriceMonthly={planPriceMonthly}
      videoUrl={videoUrl}
      highlights={highlights}
    >
      {children}
    </PaywallOverlay>
  )
}
