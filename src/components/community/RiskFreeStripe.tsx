import { ShieldCheck, ArrowRight } from "lucide-react"

export function RiskFreeStripe() {
  return (
    <section className="relative py-16 sm:py-20 border-t border-line">
      <div className="mx-auto max-w-3xl px-4">
        <div className="relative rounded-md border border-aims-gold/40 bg-gradient-to-br from-aims-gold/10 via-aims-gold/5 to-transparent p-8 sm:p-10 text-center overflow-hidden">
          <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-aims-gold/10 blur-[80px]" />
          <div className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full bg-aims-gold/10 blur-[80px]" />

          <div className="relative">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-aims-gold/20 border border-aims-gold/40 mb-5">
              <ShieldCheck className="w-7 h-7 text-aims-gold" />
            </div>

            <h3 className="font-serif text-3xl sm:text-4xl text-cream leading-[1.25] pb-2">
              Application-Only.{" "}
              <span className="block text-aims-gold italic">We Vet Every Operator.</span>
            </h3>

            <p className="mt-5 text-cream/70 text-base sm:text-lg max-w-xl mx-auto">
              The Collective is not a course you buy. It is an application-only program
              capped at the founding cohort. Every applicant gets a strategy call so we can
              determine fit before either side commits.
            </p>

            <a
              href="#apply"
              className="mt-8 inline-flex items-center justify-center gap-2 rounded-sm bg-aims-gold text-ink px-7 py-4 text-sm font-bold uppercase tracking-wider hover:bg-aims-gold-light transition-all shadow-[0_0_50px_rgba(196,151,42,0.35)]"
            >
              Submit an Application
              <ArrowRight className="w-4 h-4" />
            </a>

            <p className="mt-4 text-xs text-cream/40 font-mono uppercase tracking-wider">
              No payment required to apply. Pricing reviewed on the call if there is mutual fit.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
