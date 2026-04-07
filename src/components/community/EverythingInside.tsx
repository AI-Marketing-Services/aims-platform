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
    title: "Structured Operator Curriculum",
    body: "A phased program that walks you through forming your LLC, defining your offer, pricing your services, and building a sales process before any AI tooling is introduced.",
  },
  {
    icon: Wrench,
    title: "Cold Email Infrastructure Walkthroughs",
    body: "Step-by-step guidance on multi-domain warmup, ICP targeting, and AI-assisted sequence building. Built around the same approach used inside the AIMS portfolio.",
  },
  {
    icon: Phone,
    title: "Voice & Chat Agent Build Sessions",
    body: "Live build sessions covering voice agents, chat agents, and CRM automation using the same tooling stack the AIMS portfolio deploys internally.",
  },
  {
    icon: MessageSquare,
    title: "Live Coaching With Operators",
    body: "Scheduled coaching with the consortium and hot-seat sessions where members get direct feedback on their offer, pricing, and pipeline. Session cadence is published before each cohort.",
  },
  {
    icon: Target,
    title: "Sales Process Frameworks",
    body: "The discovery, qualification, and proposal frameworks AIMS uses with its own clients, broken down so members can adapt them to their own offer.",
  },
  {
    icon: Mail,
    title: "Outreach Templates & Scopes",
    body: "Starting-point templates for cold email, LinkedIn outreach, follow-ups, scopes of work, and proposals. These are starting points, not magic. Members customize for their own market.",
  },
  {
    icon: PiggyBank,
    title: "Tooling Recommendations",
    body: "The actual stack the AIMS portfolio uses across outbound, voice, CRM, and reporting, with notes on what works for which use case. Where founder discounts are available, they are passed through.",
  },
  {
    icon: Trophy,
    title: "Graduation Pathway",
    body: "An aspirational track for members who complete the program and build their own pipeline. Future graduation opportunities (referrals, partnerships) are reviewed case by case and not guaranteed.",
  },
  {
    icon: Users,
    title: "Founding Member Community",
    body: "A private network where founding cohort members share their work, ask questions, and review each other's offers. Active participation is expected.",
  },
]

export function EverythingInside() {
  return (
    <section className="relative py-24 sm:py-32 border-t border-line bg-gradient-to-b from-ink to-deep">
      <div className="mx-auto max-w-6xl px-4">
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="font-serif text-4xl sm:text-5xl md:text-6xl text-cream leading-[1.25] pb-2">
            What&apos;s Inside the{" "}
            <span className="block text-aims-gold italic">Collective</span>
          </h2>
          <p className="mt-6 text-lg text-cream/65">
            Nine pillars built around the way the AIMS portfolio actually operates.
            Some sessions are pre-built, some are run live each cohort. We will not list
            anything here that does not exist or is not scheduled.
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
