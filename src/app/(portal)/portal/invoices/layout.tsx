import { EntitlementGate } from "@/components/quests/EntitlementGate"
import { FEATURE_ENTITLEMENTS } from "@/lib/plans/registry"

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <EntitlementGate
      feature={FEATURE_ENTITLEMENTS.INVOICES}
      blurb="Send branded invoices to your clients and track every dollar in motion."
    >
      {children}
    </EntitlementGate>
  )
}
