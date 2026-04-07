import { Check } from "lucide-react"
import { LeadCaptureForm } from "./LeadCaptureForm"

const INCLUDED = [
  "Structured operator curriculum",
  "Live coaching with portfolio operators",
  "Cold email infrastructure walkthroughs",
  "Voice and chat agent build sessions",
  "Hot-seat sales and pipeline reviews",
  "Outreach templates and scope frameworks",
  "Private founding member community",
  "Strategy call before any commitment",
]

export function ApplicationCard() {
  return (
    <section
      id="apply"
      className="relative py-24 sm:py-32 border-t border-line bg-gradient-to-b from-deep to-ink"
    >
      <div className="mx-auto max-w-2xl px-4">
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="font-serif text-4xl sm:text-5xl md:text-6xl text-cream leading-[1.25] pb-2">
            Apply for the{" "}
            <span className="block text-aims-gold italic">Founding Cohort</span>
          </h2>
          <p className="mt-6 text-lg text-cream/65">
            Drop your name and email. If there is mutual fit, we&apos;ll send your
            application link and book a strategy call to walk you through the program in
            detail.
          </p>
        </div>

        <div className="mt-12 relative">
          <div className="absolute -inset-4 bg-gradient-to-r from-aims-gold/0 via-aims-gold/15 to-aims-gold/0 blur-2xl" />

          <div className="relative rounded-md border border-aims-gold/30 bg-gradient-to-b from-panel to-surface p-8 sm:p-10 shadow-[0_0_60px_rgba(196,151,42,0.15)]">
            <div className="text-center mb-8">
              <p className="text-xs font-mono uppercase tracking-[0.2em] text-aims-gold mb-3">
                Founding Member Cohort
              </p>
              <p className="font-serif text-3xl sm:text-4xl text-cream leading-tight">
                Application Only
              </p>
              <p className="mt-2 text-sm text-cream/50">
                Limited to 100 founding operators
              </p>
            </div>

            <ul className="space-y-3 mb-8">
              {INCLUDED.map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-cream/80">
                  <Check className="w-4 h-4 text-aims-gold mt-0.5 flex-shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <LeadCaptureForm
              variant="stacked"
              source="application_card"
              ctaLabel="Submit Application"
            />

            <p className="mt-5 text-center text-xs text-cream/40 font-mono uppercase tracking-wider">
              No payment to apply. Pricing only reviewed if there is mutual fit on the call.
            </p>

            <p className="mt-3 text-center text-[10px] text-cream/35 leading-relaxed max-w-sm mx-auto">
              The Collective makes no income claims. Individual results vary and depend on
              the work each operator puts in. See full disclosures below.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
