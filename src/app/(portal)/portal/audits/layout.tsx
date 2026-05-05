import { EntitlementGate } from "@/components/quests/EntitlementGate"
import { FEATURE_ENTITLEMENTS } from "@/lib/plans/registry"

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <EntitlementGate
      feature={FEATURE_ENTITLEMENTS.AUDITS}
      blurb="Branded intake quizzes that capture leads and surface AI-generated buyer summaries."
    >
      {children}
    </EntitlementGate>
  )
}
