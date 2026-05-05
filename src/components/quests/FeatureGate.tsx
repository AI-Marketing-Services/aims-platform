import { ensureDbUser } from "@/lib/auth/ensure-user"
import { isFeatureUnlocked } from "@/lib/quests"
import { QUESTS, type FeatureKey } from "@/lib/quests/registry"
import { LockedOverlay } from "./LockedOverlay"

interface Props {
  feature: FeatureKey
  /** Friendly feature label, e.g. "Lead Scout" */
  featureName: string
  /** One-liner that explains what the feature does (shown while locked). */
  blurb?: string
  children: React.ReactNode
}

/**
 * Server-side feature gate. Checks `isFeatureUnlocked(userId, feature)` —
 * which auto-unlocks for ADMIN / SUPER_ADMIN — and either renders children
 * straight through, or wraps them in a blurred <LockedOverlay> with the
 * gating quest hint.
 *
 * Mount via a per-route `layout.tsx`:
 *
 *   export default function Layout({ children }) {
 *     return (
 *       <FeatureGate feature="audits" featureName="AI Audits">
 *         {children}
 *       </FeatureGate>
 *     )
 *   }
 */
export async function FeatureGate({ feature, featureName, blurb, children }: Props) {
  const user = await ensureDbUser()
  const unlocked = await isFeatureUnlocked(user.id, feature)
  if (unlocked) return <>{children}</>

  // Find the (typically single) gating quest so we can show the user
  // exactly what to do to unlock — better than a vague "do more stuff."
  const gating = QUESTS.find((q) => q.unlocksFeatureKey === feature) ?? null

  return (
    <LockedOverlay
      featureKey={feature}
      featureName={featureName}
      blurb={blurb}
      gatingTitle={gating?.title ?? null}
      gatingHint={gating?.shortHint ?? gating?.description ?? null}
    >
      {children}
    </LockedOverlay>
  )
}
