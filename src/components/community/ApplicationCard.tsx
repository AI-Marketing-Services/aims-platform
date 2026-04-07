import { Check, ShieldCheck } from "lucide-react"
import { LeadCaptureForm } from "./LeadCaptureForm"

const INCLUDED = [
  "Day-by-day operator curriculum",
  "Live coaching with the consortium",
  "Cold email infrastructure templates",
  "Voice and chat agent playbooks",
  "Sales module from real recorded calls",
  "Outreach scripts, proposals, and contracts",
  "Founding member software discounts",
  "Certified operator pathway",
  "Founding member community access",
]

export function ApplicationCard() {
  return (
    <section
      id="apply"
      className="relative py-24 sm:py-32 border-t border-line bg-gradient-to-b from-deep to-ink"
    >
      <div className="mx-auto max-w-2xl px-4">
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="font-serif text-4xl sm:text-5xl md:text-6xl text-cream leading-[1.1]">
            Apply for the{" "}
            <span className="text-aims-gold italic">Founding Cohort</span>
          </h2>
          <p className="mt-6 text-lg text-cream/65">
            Drop your name and email. We&apos;ll send your application link and book a strategy
            call to walk you through the program.
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

            <div className="rounded-sm border border-aims-gold/20 bg-aims-gold/5 p-4 mb-8 text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <ShieldCheck className="w-4 h-4 text-aims-gold" />
                <p className="text-sm font-bold text-cream">90-Day Execution Guarantee</p>
              </div>
              <p className="text-xs text-cream/60">
                Land your first paying engagement in 90 days or get coached free until you do.
              </p>
            </div>

            <LeadCaptureForm
              variant="stacked"
              source="application_card"
              ctaLabel="Submit Application"
            />

            <p className="mt-5 text-center text-xs text-cream/40 font-mono uppercase tracking-wider">
              Pricing reviewed on your strategy call. No payment today.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
