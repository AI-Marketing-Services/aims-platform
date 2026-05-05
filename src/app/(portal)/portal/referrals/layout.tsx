import { EntitlementGate } from "@/components/quests/EntitlementGate"
import { FEATURE_ENTITLEMENTS } from "@/lib/plans/registry"

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <EntitlementGate
      feature={FEATURE_ENTITLEMENTS.REFERRALS}
      blurb="Earn 20% commission on every operator you bring into the Collective."
    >
      {children}
    </EntitlementGate>
  )
}
