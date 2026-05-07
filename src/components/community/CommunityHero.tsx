import { ArrowRight } from "lucide-react"
import { DotGrid } from "@/components/marketing/DotGrid"

const APPLY_URL = "/apply"

export function CommunityHero() {
  return (
    <section className="relative overflow-hidden pt-16 pb-20 sm:pt-24 sm:pb-28 bg-white texture-light">
      <DotGrid />
      <div className="relative z-10 pointer-events-none mx-auto max-w-[1280px] px-6 text-center">
        <p className="text-xs sm:text-sm font-mono uppercase tracking-[0.3em] text-crimson mb-6">
          For people who want to move from AI-curious to AI-capable
        </p>

        <h1 className="font-playfair text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-[88px] leading-[1.1] pb-2 tracking-tight text-neutral-900 text-balance">
          Real Business Problems{" "}
          <span className="md:block text-crimson italic">
            Solved by Real AI Operators
          </span>
        </h1>

        <p className="mt-8 text-lg sm:text-xl text-neutral-500 max-w-3xl mx-auto leading-relaxed">
          The AI Operator Collective is a cohort-based apprenticeship for people who
          want to become useful where AI turns into business value: finding the right
          companies, running better discovery, spotting real operational pain, and
          scoping the right solution before anyone touches a tool.
        </p>

        <p className="mt-6 text-sm sm:text-base text-neutral-700 max-w-2xl mx-auto italic">
          Powered by Problem-First AI: diagnose the fire before pouring gasoline on it.
        </p>

        {/* CTA — single primary button. Removed the duplicate
            "Apply for the Next Cohort" outlined button per landing-copy
            cleanup; both went to the same /apply URL and the doubled
            buttons read as redundant. */}
        <div className="mt-10 flex justify-center">
          <a
            href={APPLY_URL}
            className="pointer-events-auto group inline-flex items-center justify-center gap-3 rounded-md bg-crimson text-white px-14 py-4 text-sm font-bold uppercase tracking-wider hover:bg-crimson-dark transition-all shadow-[0_8px_24px_-4px_rgba(153,27,27,0.35)] min-w-[260px]"
          >
            Apply Now
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </a>
        </div>

        <p className="mt-5 text-xs sm:text-sm text-neutral-500 font-mono uppercase tracking-wider">
          No payment to apply · Application-only · 10 seats per cohort
        </p>
      </div>
    </section>
  )
}
