import { EntitlementGate } from "@/components/quests/EntitlementGate"
import { FEATURE_ENTITLEMENTS } from "@/lib/plans/registry"

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <EntitlementGate
      feature={FEATURE_ENTITLEMENTS.PLAYBOOKS}
      blurb="Step-by-step workflows for every service track in the Collective."
    >
      {children}
    </EntitlementGate>
  )
}
