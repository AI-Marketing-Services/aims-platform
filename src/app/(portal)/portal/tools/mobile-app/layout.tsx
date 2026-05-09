import { AddonGate } from "@/components/quests/AddonGate"
import { ADDON_ENTITLEMENTS } from "@/lib/plans/addons"

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AddonGate
      entitlementKey={ADDON_ENTITLEMENTS.WHITELABEL_MOBILE}
      addonSlug="addon-whitelabel-mobile"
    >
      {children}
    </AddonGate>
  )
}
