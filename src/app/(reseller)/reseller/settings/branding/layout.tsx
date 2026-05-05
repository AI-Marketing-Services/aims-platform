import { EntitlementGate } from "@/components/quests/EntitlementGate"
import { FEATURE_ENTITLEMENTS } from "@/lib/plans/registry"

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <EntitlementGate
      feature={FEATURE_ENTITLEMENTS.BRANDING}
      blurb="White-label the entire portal with your logo, brand colors, and copy."
    >
      {children}
    </EntitlementGate>
  )
}
