import { Smartphone } from "lucide-react"
import { AddonConfigCard } from "@/components/portal/AddonConfigCard"

export const metadata = { title: "Whitelabel Mobile App" }

/**
 * /portal/tools/mobile-app
 *
 * Configure-only — captures branding + app store account details so
 * our team can build, sign, and submit your iOS + Android shells.
 */
export default function MobileAppPage() {
  return (
    <div className="space-y-6">
      <header className="flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
          <Smartphone className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Whitelabel Mobile App</h1>
          <p className="text-sm text-muted-foreground">
            We build, sign, and submit native iOS + Android apps under your brand.
            Six weeks to first store approval.
          </p>
        </div>
      </header>

      <AddonConfigCard
        slug="addon-whitelabel-mobile"
        title="Mobile app build kickoff"
        description="Give us your brand assets and developer account info — we handle the rest."
        fields={[
          {
            name: "appName",
            label: "App display name",
            required: true,
            placeholder: "Acme Operator",
          },
          {
            name: "bundleId",
            label: "Preferred bundle ID (e.g. com.youragency.operator)",
            required: true,
            placeholder: "com.youragency.operator",
          },
          {
            name: "primaryBrandColor",
            label: "Primary brand color (hex)",
            placeholder: "#C4972A",
          },
          {
            name: "appStoreAccountStatus",
            label: "Apple Developer + Google Play account status",
            type: "textarea",
            required: true,
            placeholder: "Apple: enrolled, team ID ABCD1234. Google: not yet enrolled — please set up under our LLC.",
          },
          {
            name: "logoUrl",
            label: "Link to logo files (Dropbox / Drive / Figma)",
            type: "url",
            placeholder: "https://drive.google.com/...",
          },
          {
            name: "pushNotificationEvents",
            label: "Which events should trigger push notifications?",
            type: "textarea",
            rows: 3,
            placeholder: "New hot lead booked a call, invoice paid, deal moved to Won.",
          },
          {
            name: "launchTarget",
            label: "Target launch date",
            placeholder: "End of Q3",
          },
        ]}
      />
    </div>
  )
}
