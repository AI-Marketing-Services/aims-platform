import { FeatureGate } from "@/components/quests/FeatureGate"

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <FeatureGate
      feature="follow_up_rules"
      featureName="Follow-up Rules"
      blurb="Auto-nudge stale deals — set a stage trigger and let the system handle the chase."
    >
      {children}
    </FeatureGate>
  )
}
