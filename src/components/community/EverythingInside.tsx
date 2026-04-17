import {
  Briefcase,
  Calculator,
  FileSignature,
  Users,
  Headphones,
  BadgeCheck,
} from "lucide-react"

const FEATURES = [
  {
    icon: Briefcase,
    title: "Done-For-You Business Setup",
    body: "LLC formation, EIN registration, and business banking handled as a service on Day 1. Not a video walkthrough. You're a real operating business before you touch a single tool.",
  },
  {
    icon: FileSignature,
    title: "Pre-Filled Contracts & Proposals",
    body: "MSA, SOW, and AI Readiness Assessment pulled from real AIMS client engagements. You modify them for your offer — you don't draft them from scratch.",
  },
  {
    icon: Calculator,
    title: "Pricing & Client ROI Calculators",
    body: "The pricing calculator kills chronic underpricing. The client ROI calculator is deployed live in prospect meetings to quantify labor hours saved and net return on your fee.",
  },
  {
    icon: Users,
    title: "Live Coaching & Hot-Seat Reviews",
    body: "Weekly sessions with consortium operators. Bring your real deals, pipeline, and objections. Get direct feedback from people who close clients for a living.",
  },
  {
    icon: Headphones,
    title: "Virtual Co-Close Support",
    body: "An operator joins your prospect closing call as a strategic advisor. One session included per year. This is the single highest-leverage asset in the program.",
  },
  {
    icon: BadgeCheck,
    title: "Certified AI Operator Credential",
    body: "Earned after completing the core curriculum and submitting a verified client result. Used on your LinkedIn, your one-pager, and every proposal you send.",
  },
]

export function EverythingInside() {
  return (
    <section
      id="what-you-get"
      className="relative py-24 sm:py-32 border-t border-line bg-gradient-to-b from-ink to-deep"
    >
      <div className="mx-auto max-w-6xl px-4">
        <div className="text-center max-w-3xl mx-auto">
          <p className="text-xs font-mono uppercase tracking-[0.2em] text-aims-gold mb-4">
            What You Get
          </p>
          <h2 className="font-serif text-4xl sm:text-5xl md:text-6xl text-ink leading-[1.25] pb-2">
            Six Assets That Remove{" "}
            <span className="block text-aims-gold italic">Every Excuse to Not Start.</span>
          </h2>
          <p className="mt-6 text-lg text-ink/65">
            Each asset below is the exact thing an AIMS operator uses to win business. You
            don&apos;t build them from scratch — we hand you ours, and you modify them for
            your market.
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
                  <h3 className="font-serif text-xl text-ink mb-2 leading-tight">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-ink/60 leading-relaxed">{feature.body}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
