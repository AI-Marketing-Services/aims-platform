import { Video } from "lucide-react"
import { AddonConfigCard } from "@/components/portal/AddonConfigCard"

export const metadata = { title: "AI UGC + Avatar Studio" }

/**
 * /portal/tools/ugc-avatar
 *
 * Configure-only — captures the avatar/voice preferences and primary
 * use case so we can provision the HeyGen workspace + pre-load
 * starter scripts. Promotes to a real generation surface once API
 * credits + script library land.
 */
export default function UgcAvatarPage() {
  return (
    <div className="space-y-6">
      <header className="flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
          <Video className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">AI UGC + Avatar Studio</h1>
          <p className="text-sm text-muted-foreground">
            Pick an AI avatar, drop in a script, and ship 30-second video DMs at scale.
            Tell us how you want it set up.
          </p>
        </div>
      </header>

      <AddonConfigCard
        slug="addon-ugc-avatar"
        title="Avatar studio kickoff"
        description="50 generations / month included. Tell us about your preferred avatars and primary use case."
        fields={[
          {
            name: "primaryUseCase",
            label: "What are you generating videos for?",
            type: "textarea",
            required: true,
            placeholder: "Outbound LinkedIn DMs to mid-market SaaS founders + onboarding welcome videos.",
          },
          {
            name: "avatarPreference",
            label: "Avatar preference (starter avatar, custom upload, or both)",
            placeholder: "Use one of your starters for outbound; clone me for onboarding.",
          },
          {
            name: "voiceStyle",
            label: "Voice style + tone",
            placeholder: "Warm, casual, mid-30s American male.",
          },
          {
            name: "languages",
            label: "Languages required",
            placeholder: "English (US), Spanish (LatAm)",
          },
          {
            name: "scriptStarterUrls",
            label: "Sample scripts or examples to seed the library (optional)",
            type: "url",
            placeholder: "https://docs.google.com/...",
          },
          {
            name: "deliveryTarget",
            label: "Where do videos go after generation?",
            placeholder: "Push to Sequences + download as MP4",
          },
        ]}
      />
    </div>
  )
}
