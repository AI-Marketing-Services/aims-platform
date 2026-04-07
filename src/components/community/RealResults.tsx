const RESULTS = [
  {
    question: "Will AI services actually pay?",
    quote: "Closed a 5% SG&A reduction across the board and locked in a recurring monthly retainer.",
    attribution: "National Vending Conglomerate",
    tag: "Win",
  },
  {
    question: "Can a non-technical operator deliver?",
    quote: "20% increase in AI adoption inside a $30M+ medical waste company. Zero engineers on the project.",
    attribution: "Medical Waste Operator",
    tag: "Win",
  },
  {
    question: "How fast does revenue actually move?",
    quote: "10% revenue increase inside a $10M sales center within the first 90 days of deployment.",
    attribution: "$10M Sales Center",
    tag: "Win",
  },
]

const QUICK_WINS = [
  { name: "Cohort Operator", win: "$6,000 recurring closed in week one" },
  { name: "Cohort Operator", win: "$4,400 retainer signed within seven days" },
  { name: "Cohort Operator", win: "$25K project + $5.5K monthly retainer by Day 28" },
  { name: "Cohort Operator", win: "$2,600 closed in first 10 days" },
  { name: "Cohort Operator", win: "$3,500 plus revenue share locked in" },
  { name: "Cohort Operator", win: "Five pilot clients secured pre-launch" },
]

export function RealResults() {
  return (
    <section className="relative py-24 sm:py-32 border-t border-line bg-gradient-to-b from-ink to-deep">
      <div className="mx-auto max-w-6xl px-4">
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="font-serif text-4xl sm:text-5xl md:text-6xl text-cream leading-[1.25] pb-2">
            Real Results From{" "}
            <span className="block text-aims-gold italic">Real Operators</span>
          </h2>
          <p className="mt-6 text-lg text-cream/65">
            Engagement results from inside the AIMS portfolio. As cohort members graduate,
            their wins replace these.
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 lg:grid-cols-3 gap-4">
          {RESULTS.map((r) => (
            <div
              key={r.question}
              className="rounded-md border border-line bg-surface/60 p-7 flex flex-col"
            >
              <p className="text-sm text-aims-gold font-mono uppercase tracking-wider">
                &ldquo;{r.question}&rdquo;
              </p>
              <div className="mt-3 h-px bg-aims-gold/30 w-12" />
              <p className="mt-5 text-cream font-serif text-xl leading-snug flex-1">
                &ldquo;{r.quote}&rdquo;
              </p>
              <div className="mt-6 pt-4 border-t border-line flex items-center justify-between">
                <p className="text-xs text-cream/50 uppercase tracking-wider font-mono">
                  {r.attribution}
                </p>
                <span className="text-[10px] text-aims-gold uppercase tracking-wider font-mono border border-aims-gold/30 bg-aims-gold/5 px-2 py-1 rounded-sm">
                  {r.tag}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 rounded-md border border-line bg-panel/40 p-7">
          <p className="text-xs text-cream/40 font-mono uppercase tracking-wider mb-4 text-center">
            Founding Cohort Quick Wins
          </p>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2.5">
            {QUICK_WINS.map((w, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <span className="text-aims-gold mt-1">✓</span>
                <span className="text-cream/70">
                  <span className="text-cream font-semibold">{w.name}:</span> {w.win}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
