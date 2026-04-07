import { Mail, Headphones, Megaphone, BarChart3 } from "lucide-react"

const SOLUTIONS = [
  {
    icon: Mail,
    title: "AI Cold Email Infrastructure",
    body: "Multi-domain warmup, ICP targeting, and AI-assisted sequence building. The outbound engine the AIMS team uses internally to fill its own pipeline.",
    tag: "Outbound",
  },
  {
    icon: Headphones,
    title: "Voice & Chat Agents + CRM",
    body: "Live build sessions for voice agents, chat agents, and CRM automation. You deliver real, working systems by the end of the phase — not slides.",
    tag: "Inbound",
  },
  {
    icon: Megaphone,
    title: "Social Content Workflows",
    body: "End-to-end systems for generating, scheduling, and distributing content on LinkedIn and beyond. The same workflows AIMS runs for its portfolio companies.",
    tag: "Brand",
  },
  {
    icon: BarChart3,
    title: "Paid Media Fundamentals",
    body: "Meta, Google, and LinkedIn. Creative, budget, and reporting fundamentals that survive algorithm changes and actually make ad budgets profitable.",
    tag: "Performance",
  },
]

export function SolutionsGrid() {
  return (
    <section className="relative py-24 sm:py-32 border-t border-line">
      <div className="mx-auto max-w-6xl px-4">
        <div className="text-center max-w-3xl mx-auto">
          <p className="text-xs font-mono uppercase tracking-[0.2em] text-aims-gold mb-4">
            Four Service Lines You Can Sell
          </p>
          <h2 className="font-serif text-4xl sm:text-5xl md:text-6xl text-cream leading-[1.25] pb-2">
            One Operator Stack.{" "}
            <span className="block text-aims-gold italic">Four Ways to Get Paid.</span>
          </h2>
          <p className="mt-6 text-lg text-cream/65">
            These are the four service lines AIMS runs internally — and the four you&apos;ll
            be trained to package, price, and deliver to your own clients.
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
      </div>
    </section>
  )
}
