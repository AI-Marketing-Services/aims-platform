import {
  BookOpen,
  Wrench,
  Phone,
  MessageSquare,
  Target,
  Mail,
  PiggyBank,
  Trophy,
  Users,
} from "lucide-react"

const FEATURES = [
  {
    icon: BookOpen,
    title: "Operator Curriculum (Week-by-Week)",
    body: "A 90-day, day-by-day roadmap walking you through everything from forming your LLC to closing your first $5K-$15K client engagement.",
  },
  {
    icon: Wrench,
    title: "Cold Email Infrastructure Templates",
    body: "Multi-domain warmup setup, ICP targeting frameworks, and AI-personalized sequences that book real meetings for your clients.",
  },
  {
    icon: Phone,
    title: "Voice & Chat Agent Playbooks",
    body: "Build deployable voice agents that answer phones, qualify leads, and book appointments using the same systems we deploy in our portfolio.",
  },
  {
    icon: MessageSquare,
    title: "Live Coaching With Operators",
    body: "Weekly office hours with the consortium, hot-seat sessions, and direct feedback from founders who built and exited real businesses.",
  },
  {
    icon: Target,
    title: "Sales Module From Real Calls",
    body: "Every client call we run gets recorded and added to the library so you learn exactly how to position, price, and close deals.",
  },
  {
    icon: Mail,
    title: "Outreach Scripts & Proposals",
    body: "Copy-paste templates for cold email, LinkedIn DMs, follow-ups, scopes, contracts, and pricing conversations that actually convert.",
  },
  {
    icon: PiggyBank,
    title: "Software Discounts & Stack",
    body: "Founder-rate access to the tools we use across our $30M+ portfolio: GHL, Retell, Apollo, Smartlead, Anthropic credits, and more.",
  },
  {
    icon: Trophy,
    title: "Certified Operator Pathway",
    body: "Graduate to the AIMS client pipeline. Top-performing operators get fed real paying clients from the consortium portfolio companies.",
  },
  {
    icon: Users,
    title: "Founding Member Community",
    body: "A private network of operators who share wins, deal reviews, hiring tips, and the unglamorous reality of building a services business.",
  },
]

export function EverythingInside() {
  return (
    <section className="relative py-24 sm:py-32 border-t border-line bg-gradient-to-b from-ink to-deep">
      <div className="mx-auto max-w-6xl px-4">
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="font-serif text-4xl sm:text-5xl md:text-6xl text-cream leading-[1.1]">
            Everything You Get Inside the{" "}
            <span className="text-aims-gold italic">Collective</span>
          </h2>
          <p className="mt-6 text-lg text-cream/65">
            Nine pillars built on what actually works inside our $30M+ portfolio.
            No fluff. No theory. No filler videos.
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map((feature) => {
            const Icon = feature.icon
            return (
              <div
                key={feature.title}
                className="group relative rounded-md border border-line bg-surface/60 p-6 hover:border-aims-gold/40 hover:bg-surface transition-all"
              >
                <div className="absolute inset-0 rounded-md bg-gradient-to-br from-aims-gold/0 to-aims-gold/0 group-hover:from-aims-gold/5 group-hover:to-transparent transition-all pointer-events-none" />
                <div className="relative">
                  <div className="inline-flex items-center justify-center w-10 h-10 rounded-sm bg-aims-gold/10 border border-aims-gold/20 mb-4">
                    <Icon className="w-5 h-5 text-aims-gold" />
                  </div>
                  <h3 className="font-serif text-xl text-cream mb-2 leading-tight">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-cream/60 leading-relaxed">{feature.body}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
