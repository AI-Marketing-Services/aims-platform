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
            <H>operator-led training and accountability program</H> for white-collar professionals
            who want to build a profitable AI services business. Founded by the team behind a{" "}
            <H>$30M+ EBITDA portfolio</H> and backed by YPO operators with{" "}
            <H>$100M+ in combined exits</H>, it gives you the exact roadmap, mentorship, and
            client pipeline to land your <H>first paying engagement in 90 days or less</H>.
          </p>

          <p>
            Most AI communities jump straight to n8n workflows, prompt packs, and tool tutorials.
            That works if you already know how to run a business. If you don&apos;t, you end up
            with <H>a folder full of automations and zero clients</H>. The AI Operator Collective
            fixes that. <H>Phase 1 is LLC formation, pricing your services, and building a real
            sales pipeline.</H> AI deployment doesn&apos;t start until <H>Week 5</H>, because{" "}
            <H>tools without business skills are just expensive hobbies</H>.
          </p>

          <p>
            The program combines a <H>day-by-day operator curriculum</H>,{" "}
            <H>weekly live coaching with the consortium</H>, hot-seat sessions, and{" "}
            <H>recorded sales calls from real client engagements</H> so you watch the exact
            moves that close $5K-$15K retainers. Plus a private community of operators sharing
            wins, scripts, and strategies every day. It is the{" "}
            <H>fastest, most accountable path from W-2 employee to AI operator with paying clients</H>.
          </p>
        </div>

        {/* Inline impact stats strip */}
        <div className="mt-14 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-md border border-line bg-surface/60 p-4 text-center">
            <div className="font-serif text-2xl sm:text-3xl text-aims-gold">90 Days</div>
            <div className="mt-1 text-[10px] uppercase tracking-wider text-cream/50 font-mono">
              To First Client
            </div>
          </div>
          <div className="rounded-md border border-line bg-surface/60 p-4 text-center">
            <div className="font-serif text-2xl sm:text-3xl text-aims-gold">$5K-$15K</div>
            <div className="mt-1 text-[10px] uppercase tracking-wider text-cream/50 font-mono">
              Avg Retainer
            </div>
          </div>
          <div className="rounded-md border border-line bg-surface/60 p-4 text-center">
            <div className="font-serif text-2xl sm:text-3xl text-aims-gold">$100M+</div>
            <div className="mt-1 text-[10px] uppercase tracking-wider text-cream/50 font-mono">
              Mentor Exits
            </div>
          </div>
          <div className="rounded-md border border-line bg-surface/60 p-4 text-center">
            <div className="font-serif text-2xl sm:text-3xl text-aims-gold">Week 5</div>
            <div className="mt-1 text-[10px] uppercase tracking-wider text-cream/50 font-mono">
              AI Tools Start
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
