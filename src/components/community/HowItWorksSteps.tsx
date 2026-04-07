const STEPS = [
  {
    n: "01",
    title: "Foundation",
    body: "Form your LLC, define your services, and set your pricing. Build the legal and financial structure of a real business in your first two weeks.",
  },
  {
    n: "02",
    title: "Pipeline",
    body: "Learn how businesses actually buy. Build your sales process. Understand the marketing, sales, and operations problems your future clients face every day.",
  },
  {
    n: "03",
    title: "First Clients",
    body: "We sell alongside you on real calls. Every conversation gets recorded for the training library so you watch the exact moves that close $5K-$15K engagements.",
  },
  {
    n: "04",
    title: "Deploy",
    body: "Master the four core AI solutions: cold email infrastructure, voice agents, social funnels, and paid media. Deploy them for clients who are already paying you.",
  },
  {
    n: "05",
    title: "Scale",
    body: "Graduate to Certified Operator. Get access to the AIMS client pipeline. Earn revenue share on referrals from our $30M+ portfolio companies.",
  },
]

export function HowItWorksSteps() {
  return (
    <section className="relative py-24 sm:py-32 border-t border-line">
      <div className="mx-auto max-w-4xl px-4">
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="font-serif text-4xl sm:text-5xl md:text-6xl text-cream leading-[1.1]">
            Your Path From W-2 to{" "}
            <span className="text-aims-gold italic">AI Operator</span>
          </h2>
          <p className="mt-6 text-lg text-cream/65">
            Five steps. Built to be the fastest path from zero to your first paying client.
          </p>
        </div>

        <div className="mt-16 space-y-3">
          {STEPS.map((step) => (
            <div
              key={step.n}
              className="group flex items-start gap-5 sm:gap-7 rounded-md border border-line bg-surface/40 p-6 sm:p-8 hover:border-aims-gold/40 hover:bg-surface transition-all"
            >
              <div className="flex-shrink-0 inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-sm bg-gradient-to-br from-aims-gold to-aims-gold-dark text-ink font-mono font-bold text-lg sm:text-xl shadow-[0_0_30px_rgba(196,151,42,0.25)]">
                {step.n}
              </div>
              <div className="flex-1 pt-1">
                <h3 className="font-serif text-2xl text-cream mb-2">{step.title}</h3>
                <p className="text-cream/60 leading-relaxed">{step.body}</p>
              </div>
            </div>
          ))}
        </div>

        <p className="mt-12 text-center text-sm text-cream/50 italic font-serif">
          Built to be the fastest, most accountable path from zero to your first paying client.
        </p>
      </div>
    </section>
  )
}
