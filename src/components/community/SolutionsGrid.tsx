import { Mail, Headphones, Megaphone, BarChart3 } from "lucide-react"

const SOLUTIONS = [
  {
    icon: Mail,
    title: "AI-Assisted Cold Email",
    body: "Learn the outbound stack the AIMS portfolio uses internally: ICP definition, multi-domain warmup, and AI-assisted sequence building. The skill set, not a guarantee of bookings.",
    tag: "Outbound",
  },
  {
    icon: Headphones,
    title: "CRM, Voice & Chat Agents",
    body: "Build sessions covering voice agents, chat agents, and CRM automation using the same tooling stack used inside the AIMS portfolio. Deployment outcomes depend on the operator and the use case.",
    tag: "Inbound",
  },
  {
    icon: Megaphone,
    title: "Social Content Workflows",
    body: "Frameworks for generating, scheduling, and distributing content across LinkedIn and other platforms using the workflows the AIMS portfolio runs internally.",
    tag: "Brand",
  },
  {
    icon: BarChart3,
    title: "Paid Media Fundamentals",
    body: "How operators inside the AIMS portfolio approach paid campaigns across Meta, Google, and LinkedIn. Creative, budget, and reporting fundamentals that apply across accounts.",
    tag: "Performance",
  },
]

export function SolutionsGrid() {
  return (
    <section className="relative py-24 sm:py-32 border-t border-line">
      <div className="mx-auto max-w-6xl px-4">
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="font-serif text-4xl sm:text-5xl md:text-6xl text-cream leading-[1.25] pb-2">
            Four Solutions.{" "}
            <span className="block text-aims-gold italic">One Operator Stack.</span>
          </h2>
          <p className="mt-6 text-lg text-cream/65">
            The four service lines the AIMS portfolio runs internally. The Collective walks
            members through each one, in proper sequence, after the business fundamentals
            phase is complete.
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-4">
          {SOLUTIONS.map((solution) => {
            const Icon = solution.icon
            return (
              <div
                key={solution.title}
                className="group relative rounded-md border border-line bg-surface/60 p-8 hover:border-aims-gold/40 hover:bg-surface transition-all"
              >
                <div className="flex items-start justify-between mb-5">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-sm bg-aims-gold/10 border border-aims-gold/20">
                    <Icon className="w-6 h-6 text-aims-gold" />
                  </div>
                  <span className="text-[10px] uppercase tracking-wider font-mono text-cream/40 border border-line px-2 py-1 rounded-sm">
                    {solution.tag}
                  </span>
                </div>
                <h3 className="font-serif text-2xl text-cream mb-3 leading-tight">
                  {solution.title}
                </h3>
                <p className="text-sm text-cream/60 leading-relaxed">{solution.body}</p>
              </div>
            )
          })}
        </div>

        <div className="mt-10 rounded-md border border-aims-gold/30 bg-gradient-to-r from-aims-gold/5 via-aims-gold/10 to-aims-gold/5 p-6 sm:p-8 text-center">
          <p className="text-cream font-serif text-xl sm:text-2xl leading-snug">
            Phase 1 is LLC formation, pricing, and pipeline building. AI deployment doesn&apos;t
            start until <span className="text-aims-gold">Week 5</span>. Tools without business
            skills are just expensive hobbies.
          </p>
        </div>
      </div>
    </section>
  )
}
