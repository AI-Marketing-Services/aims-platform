import { MessageCircle } from "lucide-react"
import { AddonConfigCard } from "@/components/portal/AddonConfigCard"

export const metadata = { title: "Outbound SMS Pack" }

/**
 * /portal/tools/sms
 *
 * Configure-only at launch — captures the info our compliance team
 * needs to register a 10DLC number and stand up the 2-way inbox.
 * Promotes to a real inbox surface once volume picks up.
 */
export default function SmsPackPage() {
  return (
    <div className="space-y-6">
      <header className="flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
          <MessageCircle className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Outbound SMS Pack</h1>
          <p className="text-sm text-muted-foreground">
            10DLC-compliant outbound SMS plus a 2-way inbox threaded into your CRM.
            Tell us how you want it provisioned and we&apos;ll have you sending in 5-7 days.
          </p>
        </div>
      </header>

      <AddonConfigCard
        slug="addon-sms-pack"
        title="SMS provisioning"
        description="We register a 10DLC number under your business + wire 2-way replies into the deal it belongs to."
        fields={[
          {
            name: "businessLegalName",
            label: "Business legal name (for 10DLC registration)",
            required: true,
            placeholder: "Acme Operators LLC",
          },
          {
            name: "preferredAreaCode",
            label: "Preferred area code (we'll find a number)",
            placeholder: "415",
          },
          {
            name: "primaryUseCase",
            label: "Primary use case",
            type: "textarea",
            required: true,
            placeholder: "Follow-ups after discovery calls + appointment reminders for booked demos.",
          },
          {
            name: "optOutLanguage",
            label: "Opt-out language to append (defaults to 'Reply STOP to opt out')",
            placeholder: "Reply STOP to opt out, HELP for help.",
          },
          {
            name: "twoWayHandlerUrl",
            label: "2-way reply webhook URL (optional — we route to inbox by default)",
            type: "url",
            placeholder: "https://hooks.youragency.com/sms",
          },
          {
            name: "estimatedMonthlyVolume",
            label: "Estimated monthly outbound volume",
            placeholder: "750 messages / mo",
          },
          {
            name: "complianceNotes",
            label: "Compliance notes (HIPAA, financial, regulated industries)",
            type: "textarea",
            rows: 3,
            placeholder: "We sell mortgage refinance leads — need TCPA consent capture before any send.",
          },
        ]}
      />
    </div>
  )
}
