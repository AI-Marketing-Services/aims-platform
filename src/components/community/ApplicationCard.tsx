import { Check, Zap } from "lucide-react"
import { LeadCaptureForm } from "./LeadCaptureForm"

const INCLUDED = [
  "The AI Operator Playbook Vault (instant email)",
  "Cold email sequences and outreach scripts",
  "Pricing calculator and client ROI model",
  "Discovery, qualification, and proposal frameworks",
  "Founding cohort waitlist priority",
]

export function ApplicationCard() {
  return (
    <section
      id="apply"
      className="relative py-24 sm:py-32 border-t border-line bg-gradient-to-b from-deep to-ink"
    >
      <div className="mx-auto max-w-4xl px-4">
        <div className="text-center mx-auto">
          <p className="text-xs font-mono uppercase tracking-[0.2em] text-aims-gold mb-4">
            Free Download
          </p>
          <h2 className="font-serif text-4xl sm:text-5xl md:text-6xl text-ink leading-[1.25] pb-2">
            Get Our{" "}
            <span className="block text-aims-gold italic">AI Playbook</span>
          </h2>
          <p className="mt-6 text-lg text-ink/65 max-w-2xl mx-auto">
            Drop your name and email. The AI Operator Playbook Vault hits your inbox
            immediately — the same frameworks, scripts, and pricing models we use internally.
          </p>
        </div>

        <div className="mt-12 relative">
          <div className="absolute -inset-4 bg-gradient-to-r from-aims-gold/0 via-aims-gold/15 to-aims-gold/0 blur-2xl" />

          <div className="relative rounded-md border border-aims-gold/30 bg-gradient-to-b from-panel to-surface p-8 sm:p-10 shadow-[0_0_60px_rgba(196,151,42,0.15)]">
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 rounded-full border border-aims-gold/40 bg-aims-gold/10 px-4 py-1.5 text-[10px] sm:text-xs font-mono uppercase tracking-[0.15em] text-aims-gold mb-4">
                <Zap className="w-3.5 h-3.5" />
                Free Resource + Application
              </div>
              <p className="font-serif text-3xl sm:text-4xl text-ink leading-tight">
                The AI Operator Playbook Vault
              </p>
              <p className="mt-2 text-sm text-ink/75">
                Delivered to your inbox the moment you submit
              </p>
            </div>

            <ul className="space-y-3 mb-8 w-fit mx-auto">
              {INCLUDED.map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-ink/80">
                  <Check className="w-4 h-4 text-aims-gold mt-0.5 flex-shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <LeadCaptureForm
              variant="stacked"
              source="application_card"
              ctaLabel="Send Me the Vault"
            />

            <p className="mt-5 text-center text-xs text-ink/70 font-mono uppercase tracking-wider">
              No payment to apply. No credit card. Unsubscribe any time.
            </p>

            <p className="mt-3 text-center text-[11px] text-ink/60 leading-relaxed max-w-sm mx-auto">
              The Collective makes no income claims. Individual results vary and depend on
              the work each operator puts in. See full disclosures below.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
