import { FeatureGate } from "@/components/quests/FeatureGate"

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <FeatureGate
      feature="referrals"
      featureName="Referrals"
      blurb="Earn 20% commission on every operator you bring into the Collective."
    >
      {children}
    </FeatureGate>
  )
}
