import { EntitlementGate } from "@/components/quests/EntitlementGate"
import { FEATURE_ENTITLEMENTS } from "@/lib/plans/registry"

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <EntitlementGate
      feature={FEATURE_ENTITLEMENTS.CONTENT}
      blurb="Spin up branded social posts, blog drafts, and email blasts with one prompt."
    >
      {children}
    </EntitlementGate>
  )
}
