import { ChevronDown } from "lucide-react"

const STEPS = [
  {
    n: "01",
    title: "Foundation",
    body: "Form your LLC, define your services, and set your pricing. Build the legal and financial structure of a real business before any tools enter the picture.",
  },
  {
    n: "02",
    title: "Pipeline",
    body: "Learn how businesses actually buy. Build a sales process. Get the language you need to talk to operators about marketing, sales, and operations problems.",
  },
  {
    n: "03",
    title: "Sales Practice",
    body: "Hot-seat sessions and live deal reviews with the consortium. Walk through real-world discovery, qualification, and proposal frameworks the AIMS portfolio uses.",
  },
  {
    n: "04",
    title: "Deploy",
    body: "Build sessions for the four core AI service lines: cold email infrastructure, voice and chat agents, social funnels, and paid media. Same stack the AIMS portfolio runs internally.",
  },
  {
    n: "05",
    title: "Graduate",
    body: "Members who complete the program and build their own pipeline are evaluated for graduation pathways. Future referrals and partnerships are reviewed case by case and not guaranteed.",
  },
]

export function HowItWorksSteps() {
  return (
    <section className="relative py-24 sm:py-32 border-t border-line">
      <div className="mx-auto max-w-4xl px-4">
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="font-serif text-4xl sm:text-5xl md:text-6xl text-cream leading-[1.25] pb-2">
            Your Path From W-2 to{" "}
            <span className="block text-aims-gold italic">AI Operator</span>
          </h2>
          <p className="mt-6 text-lg text-cream/65">
            Five steps. Built to be the fastest path from zero to your first paying client.
          </p>
        </div>

        <div className="mt-16">
          {STEPS.map((step, idx) => {
            const isLast = idx === STEPS.length - 1
            return (
              <div key={step.n}>
                <div className="group flex items-start gap-5 sm:gap-7 rounded-md border border-line bg-surface/40 p-6 sm:p-8 hover:border-aims-gold/40 hover:bg-surface transition-all">
                  <div className="flex-shrink-0 inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-sm bg-gradient-to-br from-aims-gold to-aims-gold-dark text-ink font-mono font-bold text-lg sm:text-xl shadow-[0_0_30px_rgba(196,151,42,0.25)]">
                    {step.n}
                  </div>
                  <div className="flex-1 pt-1">
                    <h3 className="font-serif text-2xl text-cream mb-2">{step.title}</h3>
                    <p className="text-cream/60 leading-relaxed">{step.body}</p>
                  </div>
                </div>

                {!isLast && (
                  <div
                    className="flex flex-col items-center justify-center py-4"
                    aria-hidden="true"
                  >
                    <div className="h-6 w-px bg-gradient-to-b from-aims-gold/0 via-aims-gold/60 to-aims-gold" />
                    <div className="flex items-center justify-center w-9 h-9 rounded-full border border-aims-gold/40 bg-aims-gold/10 shadow-[0_0_25px_rgba(196,151,42,0.25)]">
                      <ChevronDown className="w-5 h-5 text-aims-gold" />
                    </div>
                    <div className="h-6 w-px bg-gradient-to-b from-aims-gold via-aims-gold/60 to-aims-gold/0" />
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <p className="mt-12 text-center text-sm text-cream/50 italic font-serif">
          Built to be the fastest, most accountable path from zero to your first paying client.
        </p>
      </div>
    </section>
  )
}
