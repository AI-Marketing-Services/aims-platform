import { ArrowRight } from "lucide-react"

const APPLY_URL = "/apply"

const STEPS = [
  {
    n: "01",
    title: "Apply",
    body: "start with the application so AIOC can understand your background, goals, and available time.",
  },
  {
    n: "02",
    title: "Join a cohort",
    body: "if there is a fit, enter a small cohort with monthly intake and shared progression.",
  },
  {
    n: "03",
    title: "Build the operator motion",
    body: "practice prospecting, discovery, scoping, setup, and AI-enabled delivery with structure around you.",
  },
]

const JUDGEMENT = [
  "Who to talk to.",
  "What to look for.",
  "What to ask.",
  "What to ignore.",
  "How to explain the value.",
  "How to choose the next move.",
]

export function HowItWorksPlan() {
  return (
    <section
      id="how-it-works"
      className="relative py-24 sm:py-32 border-t border-[#E3E3E3] bg-white texture-light dot-grid-light"
    >
      <div className="relative z-10 mx-auto max-w-[1280px] px-6">
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="font-playfair text-4xl sm:text-5xl md:text-6xl text-[#1A1A1A] leading-[1.2] pb-2">
            Small cohort. Practical reps.{" "}
            <span className="block text-crimson italic">Operator standards.</span>
          </h2>
          <p className="mt-6 text-base sm:text-lg text-[#737373] leading-relaxed">
            AIOC runs through monthly cohort intake. Each cohort is limited to 10
            people so members can progress together, bring real questions into the
            room, and practice both sides of the work: finding the opportunity and
            solving the problem.
          </p>
          <p className="mt-4 text-base sm:text-lg text-[#737373] leading-relaxed">
            This is an apprenticeship, not a passive course library. You will not be
            asked to memorize every tool. You will be asked to build judgment:
          </p>
        </div>

        <div className="mt-8 max-w-2xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-2">
          {JUDGEMENT.map((line) => (
            <div
              key={line}
              className="rounded-md border border-[#E3E3E3] bg-[#F5F5F5] px-4 py-3 text-sm text-[#383838]"
            >
              {line}
            </div>
          ))}
        </div>

        {/* Simple plan */}
        <div className="mt-16 max-w-4xl mx-auto">
          <p className="text-center text-xs font-mono uppercase tracking-[0.3em] text-crimson mb-8">
            Simple Plan
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {STEPS.map((s) => (
              <div
                key={s.n}
                className="rounded-md border border-[#E3E3E3] bg-white p-6 hover:border-crimson/30 hover:shadow-sm transition-all"
              >
                <p className="text-xs font-mono uppercase tracking-wider text-crimson">
                  {s.n}
                </p>
                <h3 className="mt-3 font-playfair text-2xl text-[#1A1A1A]">
                  {s.title}
                </h3>
                <p className="mt-3 text-sm text-[#737373] leading-relaxed">{s.body}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center gap-3">
          <a
            href={APPLY_URL}
            className="group inline-flex items-center justify-center gap-3 rounded-md bg-crimson text-white px-10 py-3.5 text-sm font-bold uppercase tracking-wider hover:bg-crimson-dark transition-all shadow-[0_8px_24px_-4px_rgba(153,27,27,0.35)]"
          >
            Apply for the Next Cohort
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </a>
          <p className="text-xs text-[#737373] font-mono uppercase tracking-wider">
            No payment to apply · Application-only · 10 seats per cohort
          </p>
        </div>
      </div>
    </section>
  )
}
