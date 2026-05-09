import { AddonGate } from "@/components/quests/AddonGate"
import { ADDON_ENTITLEMENTS } from "@/lib/plans/addons"

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AddonGate
      entitlementKey={ADDON_ENTITLEMENTS.SENDING_DOMAIN}
      addonSlug="addon-sending-domain"
    >
      {children}
    </AddonGate>
  )
}
