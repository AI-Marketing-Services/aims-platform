import { EntitlementGate } from "@/components/quests/EntitlementGate"
import { FEATURE_ENTITLEMENTS } from "@/lib/plans/registry"

/**
 * Scorecard sits inside the CRM entitlement — it pivots ClientDeals
 * into a daily-driver weekly tracker, and only operators with the
 * CRM unlocked have deals to track. Same gate the kanban board uses.
 */
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <EntitlementGate
      feature={FEATURE_ENTITLEMENTS.CRM}
      blurb="Weekly prospecting scorecard — auto-tally outreach + activity from your CRM, with manual override always wins. Your single source of truth for how the week is going."
    >
      {children}
    </EntitlementGate>
  )
}
