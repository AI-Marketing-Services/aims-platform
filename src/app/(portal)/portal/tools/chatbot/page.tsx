import { MessageSquare } from "lucide-react"
import { AddonConfigCard } from "@/components/portal/AddonConfigCard"

export const metadata = { title: "Branded Site Chatbot" }

/**
 * /portal/tools/chatbot
 *
 * Configure-only at launch — captures branding + KB sources, the
 * services team trains the bot and ships an embed snippet within 7
 * business days. Real "self-serve embed" surface lands once we
 * automate the training pipeline.
 */
export default function ChatbotPage() {
  return (
    <div className="space-y-6">
      <header className="flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
          <MessageSquare className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Branded Site Chatbot</h1>
          <p className="text-sm text-muted-foreground">
            Configure your chatbot, then drop our embed snippet on your site. Captures
            leads, books calls, and pipes everything into your CRM.
          </p>
        </div>
      </header>

      <AddonConfigCard
        slug="addon-chatbot-premium"
        title="Chatbot setup"
        description="Tell us where the bot lives and what it should know."
        fields={[
          {
            name: "siteUrl",
            label: "Site URL where the chatbot will live",
            type: "url",
            required: true,
            placeholder: "https://youragency.com",
          },
          {
            name: "primaryColor",
            label: "Primary color (hex)",
            placeholder: "#0F172A",
          },
          {
            name: "openingMessage",
            label: "Opening message",
            type: "textarea",
            required: true,
            placeholder:
              "Hey! I'm Acme's assistant. What kind of project are you exploring?",
          },
          {
            name: "knowledgeBaseLinks",
            label: "Knowledge sources (URLs, one per line)",
            type: "textarea",
            rows: 4,
            placeholder:
              "https://youragency.com/services\nhttps://youragency.com/pricing\nhttps://youragency.com/case-studies",
          },
          {
            name: "qualificationGoal",
            label: "What's the bot's primary goal?",
            type: "textarea",
            required: true,
            placeholder:
              "Qualify, capture email + company, recommend the right service, then book a discovery call on Calendly.",
          },
          {
            name: "bookingUrl",
            label: "Booking URL the bot should offer",
            type: "url",
            required: true,
          },
        ]}
      />
    </div>
  )
}
