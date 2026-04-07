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

            <h3 className="font-serif text-3xl sm:text-4xl text-cream leading-tight">
              First Paying Client in 90 Days,{" "}
              <span className="text-aims-gold italic">Or You Don&apos;t Pay In Full.</span>
            </h3>

            <p className="mt-5 text-cream/70 text-base sm:text-lg max-w-xl mx-auto">
              We back the program with a 90-day execution guarantee. Show up, do the work, and
              if you don&apos;t land your first paying engagement, we coach you free until you do.
            </p>

            <a
              href="#apply"
              className="mt-8 inline-flex items-center justify-center gap-2 rounded-sm bg-aims-gold text-ink px-7 py-4 text-sm font-bold uppercase tracking-wider hover:bg-aims-gold-light transition-all shadow-[0_0_50px_rgba(196,151,42,0.35)]"
            >
              Apply Risk-Free
              <ArrowRight className="w-4 h-4" />
            </a>

            <p className="mt-4 text-xs text-cream/40 font-mono uppercase tracking-wider">
              Cohort guarantee. Full terms reviewed on your strategy call.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
