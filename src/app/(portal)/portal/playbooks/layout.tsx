import { FeatureGate } from "@/components/quests/FeatureGate"

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <FeatureGate
      feature="playbooks"
      featureName="Playbooks"
      blurb="Step-by-step workflows for every service track in the Collective."
    >
      {children}
    </FeatureGate>
  )
}
