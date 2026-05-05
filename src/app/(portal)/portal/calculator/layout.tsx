import { EntitlementGate } from "@/components/quests/EntitlementGate"
import { FEATURE_ENTITLEMENTS } from "@/lib/plans/registry"

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <EntitlementGate
      feature={FEATURE_ENTITLEMENTS.CALCULATOR}
      blurb="Build proposals fast — input scope, get instant pricing tailored to your service tier."
    >
      {children}
    </EntitlementGate>
  )
}
