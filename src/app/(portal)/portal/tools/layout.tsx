import { FeatureGate } from "@/components/quests/FeatureGate"

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <FeatureGate
      feature="ai_tools"
      featureName="AI Toolkit"
      blurb="The full library of AI co-pilots — research, outreach, content, ops, and more."
    >
      {children}
    </FeatureGate>
  )
}
