import { FeatureGate } from "@/components/quests/FeatureGate"

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <FeatureGate
      feature="revenue"
      featureName="Revenue Dashboard"
      blurb="Track MRR, paid invoices, and outstanding balance across every client."
    >
      {children}
    </FeatureGate>
  )
}
