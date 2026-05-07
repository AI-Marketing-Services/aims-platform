import { EntitlementGate } from "@/components/quests/EntitlementGate"
import { FEATURE_ENTITLEMENTS } from "@/lib/plans/registry"

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <EntitlementGate
      feature={FEATURE_ENTITLEMENTS.AUDITS}
      blurb="Whitelabel lead magnets — host any of the 7 free tools on your own subdomain or custom domain. Every submission lands in your CRM as a Deal, and we generate a branded PDF for the prospect."
    >
      {children}
    </EntitlementGate>
  )
}
