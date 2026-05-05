import { FeatureGate } from "@/components/quests/FeatureGate"

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <FeatureGate
      feature="audits"
      featureName="AI Audits"
      blurb="Branded intake quizzes that capture leads and surface AI-generated buyer summaries."
    >
      {children}
    </FeatureGate>
  )
}
