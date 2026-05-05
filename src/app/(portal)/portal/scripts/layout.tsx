import { EntitlementGate } from "@/components/quests/EntitlementGate"
import { FEATURE_ENTITLEMENTS } from "@/lib/plans/registry"

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <EntitlementGate
      feature={FEATURE_ENTITLEMENTS.SCRIPTS}
      blurb="Generate and store AI-powered cold emails, discovery scripts, and follow-ups."
    >
      {children}
    </EntitlementGate>
  )
}
