import { ChevronDown } from "lucide-react"

const STEPS = [
  {
    n: "01",
    weeks: "Weeks 1 – 4",
    title: "Business Setup",
    body: "Done-for-you LLC, EIN, and business banking. Define your offer, ICP, and positioning. Price your services with the member calculator. Insurance, contracts, and invoicing squared away.",
  },
  {
    n: "02",
    weeks: "Weeks 3 – 6",
    title: "Pipeline & Sales Process",
    body: "Cold email infrastructure, LinkedIn outreach, discovery calls, and the exact qualification and proposal frameworks AIMS uses with its own clients. Your pipeline is built before any AI tooling.",
  },
  {
    n: "03",
    weeks: "Weeks 5 – 10",
    title: "AI Deployment",
    body: "Build sessions for the four service lines AIMS runs internally: AI-assisted cold email, voice and chat agents with CRM automation, social content systems, and paid media fundamentals.",
  },
  {
    n: "04",
    weeks: "Ongoing",
    title: "Coaching, Hot Seats & Co-Close",
    body: "Live deal reviews with consortium operators. Virtual co-close support where an operator joins your prospect call as a strategic advisor. Accountability that continues long after the curriculum.",
  },
]

export function HowItWorksSteps() {
  return (
    <section className="relative py-24 sm:py-32 border-t border-line">
      <div className="mx-auto max-w-4xl px-4">
        <div className="text-center max-w-3xl mx-auto">
          <p className="text-xs font-mono uppercase tracking-[0.2em] text-aims-gold mb-4">
            How It Works
          </p>
          <h2 className="font-serif text-4xl sm:text-5xl md:text-6xl text-cream leading-[1.25] pb-2">
            Business Fundamentals First.{" "}
            <span className="block text-aims-gold italic">AI Tooling Second.</span>
          </h2>
          <p className="mt-6 text-lg text-cream/65">
            Four phases. Sequenced the way an operator actually builds a services company.
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
                    <div className="flex items-baseline justify-between gap-4 mb-1">
                      <h3 className="font-serif text-2xl text-cream">{step.title}</h3>
                      <span className="text-[10px] sm:text-xs font-mono uppercase tracking-wider text-aims-gold whitespace-nowrap">
                        {step.weeks}
                      </span>
                    </div>
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
      </div>
    </section>
  )
}
