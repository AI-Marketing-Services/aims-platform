import { EntitlementGate } from "@/components/quests/EntitlementGate"
import { FEATURE_ENTITLEMENTS } from "@/lib/plans/registry"

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <EntitlementGate
      feature={FEATURE_ENTITLEMENTS.REVENUE}
      blurb="Track MRR, paid invoices, and outstanding balance across every client."
    >
      {children}
    </EntitlementGate>
  )
}
