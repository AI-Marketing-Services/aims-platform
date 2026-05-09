import { PhoneCall } from "lucide-react"
import { AddonConfigCard } from "@/components/portal/AddonConfigCard"

export const metadata = { title: "AI Voice Receptionist" }

/**
 * /portal/tools/voice-agent
 *
 * Configure-only at launch — captures everything the services team
 * needs to provision a Vapi/Retell voice agent under the operator's
 * brand. Once we automate provisioning we replace this with the live
 * console (call logs, transcripts, hot-lead routing).
 */
export default function VoiceAgentPage() {
  return (
    <div className="space-y-6">
      <header className="flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
          <PhoneCall className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">AI Voice Receptionist</h1>
          <p className="text-sm text-muted-foreground">
            Configure the voice agent that answers your inbound line. Once you submit,
            our team books a 30-min kickoff and ships within 7 business days.
          </p>
        </div>
      </header>

      <AddonConfigCard
        slug="addon-voice-agent"
        title="Voice agent setup"
        description="Tell us about the line we're answering and how you want hot leads routed."
        fields={[
          {
            name: "businessName",
            label: "Business name (as the agent should say it)",
            required: true,
            placeholder: "Acme HVAC Services",
          },
          {
            name: "phoneNumberToPort",
            label: "Phone number to forward (or leave blank for a new one)",
            type: "tel",
            placeholder: "+1 555 123 4567",
          },
          {
            name: "hoursOfOperation",
            label: "Hours of operation",
            placeholder: "Mon-Fri 8am-6pm ET",
          },
          {
            name: "primaryGoal",
            label: "Primary goal of every call",
            type: "textarea",
            required: true,
            placeholder:
              "Qualify the caller, capture name + email + biggest challenge, then book a 15-min discovery call on my Calendly.",
          },
          {
            name: "bookingUrl",
            label: "Booking page URL",
            type: "url",
            required: true,
            placeholder: "https://calendly.com/yourname/discovery",
          },
          {
            name: "hotLeadRouting",
            label: "Hot-lead routing — where do urgent callers ping you?",
            placeholder: "SMS to +1 555 222 3333; Slack #hot-leads",
          },
          {
            name: "scriptNotes",
            label: "Anything else the agent must know?",
            type: "textarea",
            rows: 4,
            placeholder:
              "Mention our same-day service guarantee. If they ask about pricing, deflect to the discovery call.",
          },
        ]}
      />
    </div>
  )
}
