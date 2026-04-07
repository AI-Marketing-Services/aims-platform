import { Mail, Headphones, Megaphone, BarChart3 } from "lucide-react"

const SOLUTIONS = [
  {
    icon: Mail,
    title: "AI-Powered Cold Email",
    body: "Build outbound engines for your clients. ICP targeting, multi-domain warmup infrastructure, AI-personalized sequences. Your clients get booked meetings. You get paid retainers.",
    tag: "Outbound",
  },
  {
    icon: Headphones,
    title: "CRM, Voice & Chat Agents",
    body: "Deploy voice agents that answer phones, qualify leads, and book appointments. Set up CRM systems that run sales operations. Built on the same stack we use in our portfolio.",
    tag: "Inbound",
  },
  {
    icon: Megaphone,
    title: "Social Media Funnels",
    body: "Build content engines that generate, schedule, and distribute social content across LinkedIn, Instagram, X, and TikTok. Your clients get reach. You get a recurring fee.",
    tag: "Brand",
  },
  {
    icon: BarChart3,
    title: "Paid Media Management",
    body: "Run and optimize ad campaigns across Meta, Google, and LinkedIn. From creative generation to budget optimization to weekly reporting. The full media buyer skillset.",
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
            Master the four AI services your clients are already paying for. We give you the
            playbooks, the infrastructure, and the live deal coaching to deploy them.
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
