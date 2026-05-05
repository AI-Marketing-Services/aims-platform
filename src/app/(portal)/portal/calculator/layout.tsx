import { FeatureGate } from "@/components/quests/FeatureGate"

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <FeatureGate
      feature="calculator"
      featureName="Pricing Calculator"
      blurb="Build proposals fast — input scope, get instant pricing tailored to your service tier."
    >
      {children}
    </FeatureGate>
  )
}
