import { EntitlementGate } from "@/components/quests/EntitlementGate"
import { FEATURE_ENTITLEMENTS } from "@/lib/plans/registry"

/**
 * Website builder is a paid add-on. Gate on `feature_website` so the
 * editor isn't visible to operators on the Free tier or operators who
 * haven't unlocked the add-on. Same EntitlementGate pattern used by
 * the Branding and Domain layouts so the paywall UX is consistent.
 */
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <EntitlementGate
      feature={FEATURE_ENTITLEMENTS.WEBSITE}
      blurb="Pick a SaaS-grade template, edit your copy in plain forms, and publish under your subdomain or custom domain. Lead form auto-feeds your CRM."
    >
      {children}
    </EntitlementGate>
  )
}
