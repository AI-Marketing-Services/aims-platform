const LOGOS = [
  { name: "HubSpot", text: "HubSpot" },
  { name: "Salesforce", text: "Salesforce" },
  { name: "Instantly", text: "Instantly.ai" },
  { name: "GoHighLevel", text: "GoHighLevel" },
  { name: "Slack", text: "Slack" },
  { name: "Apollo", text: "Apollo.io" },
  { name: "Clay", text: "Clay" },
  { name: "Notion", text: "Notion" },
  { name: "Zapier", text: "Zapier" },
  { name: "OpenAI", text: "OpenAI" },
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
          <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-24 bg-gradient-to-r from-secondary/30 to-transparent" />
          <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-24 bg-gradient-to-l from-secondary/30 to-transparent" />

          <div className="flex animate-ticker whitespace-nowrap">
            {doubled.map((logo, i) => (
              <div
                key={i}
                className="mx-8 inline-flex items-center gap-2 text-muted-foreground grayscale hover:grayscale-0 transition-all"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-md border border-border bg-white shadow-sm text-xs font-bold text-foreground">
                  {logo.name.charAt(0)}
                </div>
                <span className="text-sm font-medium">{logo.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
