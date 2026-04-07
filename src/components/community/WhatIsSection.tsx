function H({ children }: { children: React.ReactNode }) {
  return <span className="text-aims-gold font-semibold">{children}</span>
}

export function WhatIsSection() {
  return (
    <section id="program" className="relative py-24 sm:py-32 border-t border-line">
      <div className="mx-auto max-w-3xl px-4">
        <h2 className="font-serif text-4xl sm:text-5xl md:text-6xl text-center text-cream leading-[1.25] pb-2">
          What Is the{" "}
          <span className="block text-aims-gold italic">AI Operator Collective?</span>
        </h2>

        <div className="mt-12 space-y-6 text-cream/75 text-lg leading-relaxed">
          <p>
            The AI Operator Collective is an{" "}
            <H>operator-led training and accountability program</H> for white-collar
            professionals who want to build an AI services business. It is operated by the
            team behind the AIMS portfolio and supported by a consortium of YPO operators
            who deploy the same AI systems inside their own companies.
          </p>

          <p>
            Most AI communities jump straight to n8n workflows, prompt packs, and tool
            tutorials. That works if you already know how to run a business. If you
            don&apos;t, you end up with{" "}
            <H>a folder full of automations and zero clients</H>. The AI Operator Collective
            is structured to fix that. <H>Phase 1 is LLC formation, pricing your services,
            and building a real sales pipeline.</H> AI deployment doesn&apos;t start until{" "}
            <H>Week 5</H>, because tools without business skills are just expensive hobbies.
          </p>

          <p>
            The program is designed to combine a structured operator curriculum, live
            coaching with the consortium, hot-seat sessions, and a private community of
            operators who share their work in the open. It is the{" "}
            <H>operator-led path</H> we wish existed when we were building the businesses
            in our portfolio.
          </p>

          <p className="text-sm text-cream/45 italic">
            The founding cohort is forming now. The Collective makes no income claims and
            does not promise client outcomes. Individual results depend entirely on the
            work each member puts in. See the disclosures section below for full terms.
          </p>
        </div>

        {/* Structure strip - describes program structure, not promised outcomes */}
        <div className="mt-14 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-md border border-line bg-surface/60 p-4 text-center">
            <div className="font-serif text-2xl sm:text-3xl text-aims-gold">Phase 1</div>
            <div className="mt-1 text-[10px] uppercase tracking-wider text-cream/50 font-mono">
              Business Setup
            </div>
          </div>
          <div className="rounded-md border border-line bg-surface/60 p-4 text-center">
            <div className="font-serif text-2xl sm:text-3xl text-aims-gold">Week 5</div>
            <div className="mt-1 text-[10px] uppercase tracking-wider text-cream/50 font-mono">
              AI Tools Begin
            </div>
          </div>
          <div className="rounded-md border border-line bg-surface/60 p-4 text-center">
            <div className="font-serif text-2xl sm:text-3xl text-aims-gold">YPO</div>
            <div className="mt-1 text-[10px] uppercase tracking-wider text-cream/50 font-mono">
              Operator Mentors
            </div>
          </div>
          <div className="rounded-md border border-line bg-surface/60 p-4 text-center">
            <div className="font-serif text-2xl sm:text-3xl text-aims-gold">100</div>
            <div className="mt-1 text-[10px] uppercase tracking-wider text-cream/50 font-mono">
              Founding Seats
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
