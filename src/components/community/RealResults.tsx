const PORTFOLIO_RESULTS = [
  {
    metric: "5%",
    label: "SG&A Reduction",
    context:
      "AI deployment inside a national vending conglomerate operated within the AIMS portfolio. Result attributable to AIMS engagement, not cohort members.",
  },
  {
    metric: "20%",
    label: "AI Adoption Lift",
    context:
      "Internal change-management program at a $30M+ medical waste company in the AIMS portfolio. Result attributable to AIMS engagement, not cohort members.",
  },
  {
    metric: "10%",
    label: "Revenue Increase",
    context:
      "Sales operations rebuild at a $10M sales center inside the AIMS portfolio. Result attributable to AIMS engagement, not cohort members.",
  },
]

export function RealResults() {
  return (
    <section className="relative py-24 sm:py-32 border-t border-line bg-gradient-to-b from-ink to-deep">
      <div className="mx-auto max-w-6xl px-4">
        <div className="text-center max-w-3xl mx-auto">
          <p className="text-xs font-mono uppercase tracking-[0.2em] text-aims-gold mb-4">
            From the AIMS Portfolio
          </p>
          <h2 className="font-serif text-4xl sm:text-5xl md:text-6xl text-cream leading-[1.25] pb-2">
            Where the System{" "}
            <span className="block text-aims-gold italic">Comes From</span>
          </h2>
          <p className="mt-6 text-lg text-cream/65">
            The Operator Collective exists because these systems already work inside the
            AIMS portfolio. Below are real, attributable results from{" "}
            <span className="text-cream font-semibold">AIMS client engagements</span>. These
            are not cohort member results. The founding cohort has not launched yet, so we
            do not publish member case studies until they exist.
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 lg:grid-cols-3 gap-4">
          {PORTFOLIO_RESULTS.map((r) => (
            <div
              key={r.label}
              className="rounded-md border border-line bg-surface/60 p-7 flex flex-col"
            >
              <div className="font-serif text-5xl text-aims-gold leading-none">{r.metric}</div>
              <p className="mt-3 text-lg text-cream font-serif">{r.label}</p>
              <div className="mt-4 h-px bg-line w-full" />
              <p className="mt-4 text-xs text-cream/55 leading-relaxed">{r.context}</p>
              <p className="mt-4 text-[10px] uppercase tracking-wider font-mono text-cream/40">
                Source: AIMS portfolio engagement
              </p>
            </div>
          ))}
        </div>

        <div className="mt-10 rounded-md border border-line bg-panel/40 p-6 sm:p-7 text-center">
          <p className="text-xs text-cream/40 font-mono uppercase tracking-wider mb-2">
            Important
          </p>
          <p className="text-sm text-cream/70 leading-relaxed max-w-2xl mx-auto">
            These are AIMS portfolio results, not member income claims. The AI Operator
            Collective does not promise, project, or guarantee any income, client, or
            engagement outcome for any member. Individual results vary and depend entirely
            on the work the operator puts in.
          </p>
        </div>
      </div>
    </section>
  )
}
