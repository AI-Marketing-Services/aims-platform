import { ArrowRight } from "lucide-react"

const TYPEFORM_URL = "#apply"

export function FinalCTASection() {
  return (
    <section
      id="apply"
      className="relative py-24 sm:py-32 border-t border-white/10 bg-[#383838] text-white overflow-hidden texture-dark dot-grid-dark"
    >
      <div className="relative z-10 mx-auto max-w-3xl px-6 text-center">
        <h2 className="font-playfair text-4xl sm:text-5xl md:text-6xl text-white leading-[1.25] pb-2">
          Another Quarter of{" "}
          <span className="block text-crimson-light italic">Watching This Pass You By?</span>
        </h2>

        <p className="mt-6 text-lg text-white/70 max-w-2xl mx-auto">
          The tools are only getting better. The layoffs are only getting bigger. The people
          who turn their expertise into an AI practice this year own the next decade.
        </p>

        <div className="mt-10">
          <a
            href={TYPEFORM_URL}
            className="group inline-flex items-center justify-center gap-2 rounded-md bg-crimson text-white px-7 py-4 text-sm font-bold uppercase tracking-wider hover:bg-crimson-dark transition-all shadow-[0_8px_24px_-4px_rgba(153,27,27,0.35)]"
          >
            Apply Now
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </a>
        </div>

        <p className="mt-6 text-xs text-white/50 font-mono uppercase tracking-wider">
          No payment to apply · Application-only · Alpha cohort capped
        </p>
      </div>
    </section>
  )
}
