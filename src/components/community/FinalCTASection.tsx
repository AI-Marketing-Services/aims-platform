import { ArrowRight } from "lucide-react"

const APPLY_URL = "/apply"

export function FinalCTASection() {
  return (
    <section
      id="apply"
      className="relative py-24 sm:py-32 border-t border-[#E3E3E3] bg-[#F5F5F5] overflow-hidden texture-light dot-grid-light"
    >
      <div className="relative z-10 mx-auto max-w-3xl px-6 text-center">
        <h2 className="font-playfair text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-[#1A1A1A] leading-[1.15] tracking-tight text-balance pb-2">
          If this is the practical path{" "}
          <span className="md:block text-crimson italic">
            you have been looking for, start here.
          </span>
        </h2>

        <div className="mt-8 max-w-2xl mx-auto space-y-3 text-base sm:text-lg text-[#737373] leading-relaxed">
          <p>The AI Operator path is not just about tools.</p>
          <p>It is not just about sales.</p>
          <p>It is not just about delivery.</p>
          <p className="text-[#1A1A1A] font-medium">
            It is the motion that connects all three.
          </p>
          <p className="pt-2">
            Finding the right businesses. Running the right conversations.
            Diagnosing the right problems. Scoping the right solution. Then using
            AI where it actually creates leverage.
          </p>
          <p className="text-[#1A1A1A]">
            Apply for the next cohort. We&apos;ll see if there is a fit.
          </p>
        </div>

        <div className="mt-10">
          <a
            href={APPLY_URL}
            className="group inline-flex items-center justify-center gap-2 rounded-md bg-crimson text-white px-7 py-4 text-sm font-bold uppercase tracking-wider hover:bg-crimson-dark transition-all shadow-[0_8px_24px_-4px_rgba(153,27,27,0.35)]"
          >
            Apply Now
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </a>
        </div>

        <p className="mt-6 text-xs text-[#737373] font-mono uppercase tracking-wider">
          No payment to apply · Application-only · 10 seats per cohort
        </p>
      </div>
    </section>
  )
}
