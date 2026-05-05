import { FeatureGate } from "@/components/quests/FeatureGate"

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <FeatureGate
      feature="lead_scout"
      featureName="Lead Scout"
      blurb="Find prospects on autopilot — filter by ICP, enrich, and push winners straight into your CRM."
    >
      {children}
    </FeatureGate>
  )
}
