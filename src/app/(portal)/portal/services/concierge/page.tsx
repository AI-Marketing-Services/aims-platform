import { Sparkles } from "lucide-react"
import { AddonConfigCard } from "@/components/portal/AddonConfigCard"

export const metadata = { title: "Concierge Setup" }

/**
 * /portal/services/concierge
 *
 * One-time DFY package — captures everything our services team needs
 * to fully configure the operator's portal in 7 business days.
 */
export default function ConciergeSetupPage() {
  return (
    <div className="space-y-6">
      <header className="flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
          <Sparkles className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Concierge Setup</h1>
          <p className="text-sm text-muted-foreground">
            Our team configures your portal end-to-end in 7 business days. Submit the
            form below and we&apos;ll book your kickoff call within 1 business day.
          </p>
        </div>
      </header>

      <AddonConfigCard
        slug="addon-dfy-setup"
        title="Concierge intake"
        description="The more detail you give us up front, the faster we ship."
        fields={[
          {
            name: "agencyName",
            label: "Agency / business name",
            required: true,
            placeholder: "Acme Operator Co.",
          },
          {
            name: "primaryDomain",
            label: "Primary domain to wire up",
            type: "url",
            required: true,
            placeholder: "https://youragency.com",
          },
          {
            name: "iclpDescription",
            label: "Ideal client + offer (the audit + first sequence will be built around this)",
            type: "textarea",
            required: true,
            placeholder: "Mid-market HVAC operators in the SE US. Offer: AI receptionist + lead routing for $1,500/mo.",
          },
          {
            name: "brandAssetsUrl",
            label: "Brand asset folder (logo, colors, fonts)",
            type: "url",
            placeholder: "https://drive.google.com/...",
          },
          {
            name: "leadListUrl",
            label: "First 10 leads to import (CSV link or paste)",
            placeholder: "https://drive.google.com/file/d/.../view",
          },
          {
            name: "kickoffAvailability",
            label: "Best 3 windows for the 30-min kickoff call",
            placeholder: "Tue 9am ET, Wed 2pm ET, Fri 11am ET",
          },
          {
            name: "additionalNotes",
            label: "Anything else we should know",
            type: "textarea",
            rows: 4,
            placeholder: "We're already running cold email out of Instantly — would love to migrate sequences over.",
          },
        ]}
      />
    </div>
  )
}
