import Image from "next/image"

const LOGOS = [
  { name: "HubSpot", src: "/integrations/hubspot-svgrepo-com.svg" },
  { name: "Salesforce", src: "/integrations/salesforce.svg" },
  { name: "Instantly", src: "/integrations/instantly.webp" },
  { name: "Slack", src: "/integrations/slack.svg" },
  { name: "Apollo", src: "/integrations/apollo.svg" },
  { name: "Notion", src: "/integrations/notion.svg" },
  { name: "OpenAI", src: "/integrations/openai-svgrepo-com.svg" },
  { name: "LinkedIn", src: "/integrations/linkedin.svg" },
  { name: "Google Ads", src: "/integrations/google-ads-svgrepo-com.svg" },
  { name: "Shopify", src: "/integrations/shopify.svg" },
  { name: "Calendly", src: "/integrations/calendly.svg" },
  { name: "Airtable", src: "/integrations/airtable-svgrepo-com.svg" },
]

export function LogoTicker() {
  const doubled = [...LOGOS, ...LOGOS]

  return (
    <section className="border-y border-border bg-secondary/30 py-8">
      <div className="container mx-auto max-w-6xl px-4">
        <p className="mb-6 text-center text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Integrated with the tools your team already uses
        </p>
        <div className="relative overflow-hidden">
          {/* Fade edges */}
          <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-24 bg-gradient-to-r from-[#FAFAFA] to-transparent" />
          <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-24 bg-gradient-to-l from-[#FAFAFA] to-transparent" />

          <div className="flex animate-ticker whitespace-nowrap">
            {doubled.map((logo, i) => (
              <div
                key={i}
                className="mx-8 inline-flex items-center gap-2.5 text-muted-foreground hover:text-foreground transition-all grayscale hover:grayscale-0"
              >
                <div className="relative w-6 h-6 flex-shrink-0">
                  <Image
                    src={logo.src}
                    alt={logo.name}
                    fill
                    className="object-contain"
                    sizes="24px"
                  />
                </div>
                <span className="text-sm font-semibold">{logo.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
