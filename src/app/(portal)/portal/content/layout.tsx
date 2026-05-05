import { FeatureGate } from "@/components/quests/FeatureGate"

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <FeatureGate
      feature="content"
      featureName="Content Engine"
      blurb="Spin up branded social posts, blog drafts, and email blasts with one prompt."
    >
      {children}
    </FeatureGate>
  )
}
