import { EntitlementGate } from "@/components/quests/EntitlementGate"
import { FEATURE_ENTITLEMENTS } from "@/lib/plans/registry"

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <EntitlementGate
      feature={FEATURE_ENTITLEMENTS.DOMAIN}
      blurb="Run the platform under your own domain so clients see your brand, not ours."
    >
      {children}
    </EntitlementGate>
  )
}
