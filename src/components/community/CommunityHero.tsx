import { ArrowRight } from "lucide-react"
import { DotGrid } from "@/components/marketing/DotGrid"

const APPLY_URL = "/apply"

export function CommunityHero() {
  return (
    <section className="relative overflow-hidden pt-16 pb-20 sm:pt-24 sm:pb-28 bg-white texture-light">
      <DotGrid />
      <div className="relative z-10 pointer-events-none mx-auto max-w-[1280px] px-6 text-center">
        <p className="text-xs sm:text-sm font-mono uppercase tracking-[0.3em] text-crimson mb-6">
          For Burnt-Out W-2 Professionals &amp; Corporate Operators
        </p>

        <h1 className="font-playfair text-5xl sm:text-6xl md:text-7xl lg:text-[88px] leading-[1.1] pb-2 tracking-tight text-[#1A1A1A]">
          Real Business Problems
          <span className="block text-crimson italic">Solved by Real AI Operators</span>
        </h1>

        <p className="mt-8 text-lg sm:text-xl text-[#737373] max-w-3xl mx-auto leading-relaxed">
          Every business hits the same walls: pipeline dries up, systems break, growth
          stalls. We&apos;ve solved these problems across 100+ collective years of building
          companies. Now we&apos;re packaging that tribal knowledge into a step-by-step
          playbook so you can build an AI advisory practice on a foundation that actually
          works.
        </p>

        {/* CTA */}
        <div className="mt-10 flex flex-col items-center gap-4">
          <a
            href={APPLY_URL}
            className="pointer-events-auto group inline-flex items-center justify-center gap-3 rounded-md bg-crimson text-white px-14 py-4 text-sm font-bold uppercase tracking-wider hover:bg-crimson-dark transition-all shadow-[0_8px_24px_-4px_rgba(153,27,27,0.35)] min-w-[280px]"
          >
            Apply Now
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </a>
        </div>

        <p className="mt-5 text-xs sm:text-sm text-[#737373] font-mono uppercase tracking-wider">
          No payment to apply · Application-only · 10 seats per cohort
        </p>
      </div>
    </section>
  )
}
