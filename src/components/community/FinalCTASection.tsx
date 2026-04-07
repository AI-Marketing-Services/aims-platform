import { ArrowRight } from "lucide-react"

export function FinalCTASection() {
  return (
    <section className="relative py-24 sm:py-32 border-t border-line bg-gradient-to-b from-deep to-ink overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[600px] rounded-full bg-aims-gold/10 blur-[120px]" />
      </div>

      <div className="mx-auto max-w-3xl px-4 text-center">
        <h2 className="font-serif text-4xl sm:text-5xl md:text-6xl text-cream leading-[1.1]">
          The AI Economy Is Here.{" "}
          <span className="text-aims-gold italic">Your Seat Is Waiting.</span>
        </h2>

        <p className="mt-6 text-lg text-cream/70 max-w-2xl mx-auto">
          Every week another professional in your industry figures this out before you. The
          founding cohort is filling now. Apply today and we&apos;ll book a strategy call to
          review your fit.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <a
            href="#apply"
            className="group inline-flex items-center justify-center gap-2 rounded-sm bg-aims-gold text-ink px-7 py-4 text-sm font-bold uppercase tracking-wider hover:bg-aims-gold-light transition-all shadow-[0_0_50px_rgba(196,151,42,0.35)] hover:shadow-[0_0_70px_rgba(196,151,42,0.5)]"
          >
            Apply for the Founding Cohort
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </a>
          <a
            href="#program"
            className="inline-flex items-center justify-center gap-2 rounded-sm border border-line hover:border-aims-gold/40 bg-surface/40 text-cream px-7 py-4 text-sm font-bold uppercase tracking-wider transition-colors"
          >
            See What&apos;s Inside
          </a>
        </div>

        <p className="mt-6 text-xs text-cream/40 font-mono uppercase tracking-wider">
          Limited to 100 founding operators. No payment today.
        </p>
      </div>
    </section>
  )
}
