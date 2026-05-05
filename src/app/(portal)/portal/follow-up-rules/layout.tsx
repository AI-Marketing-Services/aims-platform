import { EntitlementGate } from "@/components/quests/EntitlementGate"
import { FEATURE_ENTITLEMENTS } from "@/lib/plans/registry"

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <EntitlementGate
      feature={FEATURE_ENTITLEMENTS.FOLLOW_UP_RULES}
      blurb="Auto-nudge stale deals — set a stage trigger and let the system handle the chase."
    >
      {children}
    </EntitlementGate>
  )
}
