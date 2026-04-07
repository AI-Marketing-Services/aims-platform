import { ArrowRight } from "lucide-react"

export function FinalCTASection() {
  return (
    <section className="relative py-24 sm:py-32 border-t border-line bg-gradient-to-b from-deep to-ink overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[600px] rounded-full bg-aims-gold/10 blur-[120px]" />
      </div>

      <div className="mx-auto max-w-3xl px-4 text-center">
        <h2 className="font-serif text-4xl sm:text-5xl md:text-6xl text-cream leading-[1.25] pb-2">
          Another Quarter of{" "}
          <span className="block text-aims-gold italic">Watching This Pass You By?</span>
        </h2>

        <p className="mt-6 text-lg text-cream/70 max-w-2xl mx-auto">
          The tools are only getting better. The layoffs are only getting bigger. The people
          who turn their expertise into an AI practice this year own the next decade. Grab
          the Playbook Vault now — even if you never apply, it&apos;s worth the five seconds
          it takes to enter your email.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <a
            href="#apply"
            className="group inline-flex items-center justify-center gap-2 rounded-sm bg-aims-gold text-ink px-7 py-4 text-sm font-bold uppercase tracking-wider hover:bg-aims-gold-light transition-all shadow-[0_0_50px_rgba(196,151,42,0.35)] hover:shadow-[0_0_70px_rgba(196,151,42,0.5)]"
          >
            Send Me the Playbook Vault
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </a>
          <a
            href="#what-you-get"
            className="inline-flex items-center justify-center gap-2 rounded-sm border border-line hover:border-aims-gold/40 bg-surface/40 text-cream px-7 py-4 text-sm font-bold uppercase tracking-wider transition-colors"
          >
            See What&apos;s Inside
          </a>
        </div>

        <p className="mt-6 text-xs text-cream/40 font-mono uppercase tracking-wider">
          Free to start · No payment today · Application reviewed within 24 hours
        </p>
      </div>
    </section>
  )
}
