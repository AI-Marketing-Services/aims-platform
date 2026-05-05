import { EntitlementGate } from "@/components/quests/EntitlementGate"
import { FEATURE_ENTITLEMENTS } from "@/lib/plans/registry"

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <EntitlementGate
      feature={FEATURE_ENTITLEMENTS.CRM}
      blurb="Pipeline, contacts, and deal management for every client you're working with."
    >
      {children}
    </EntitlementGate>
  )
}
