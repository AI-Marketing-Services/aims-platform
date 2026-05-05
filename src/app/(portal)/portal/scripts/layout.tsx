import { FeatureGate } from "@/components/quests/FeatureGate"

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <FeatureGate
      feature="scripts"
      featureName="AI Scripts"
      blurb="Generate and store AI-powered cold emails, discovery scripts, and follow-ups."
    >
      {children}
    </FeatureGate>
  )
}
