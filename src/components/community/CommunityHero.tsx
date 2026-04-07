import Image from "next/image"
import { ArrowRight, ChevronDown, Sparkles, Users, TrendingUp } from "lucide-react"
import { LiveSignupTicker } from "./LiveSignupTicker"

export function CommunityHero() {
  return (
    <section className="relative overflow-hidden pt-16 pb-24 sm:pt-24 sm:pb-32">
      {/* Background gradient */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-ink via-deep to-ink" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] rounded-full bg-aims-gold/10 blur-[120px]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-20%,rgba(196,151,42,0.18),transparent_60%)]" />
      </div>

      <div className="mx-auto max-w-5xl px-4 text-center">
        <p className="text-xs sm:text-sm font-mono uppercase tracking-[0.3em] text-aims-gold mb-8">
          The AI Operator Collective
        </p>

        <h1 className="font-serif text-5xl sm:text-6xl md:text-7xl lg:text-[88px] leading-[1.1] pb-2 tracking-tight text-cream">
          AI Won&apos;t Replace You.{" "}
          <span className="block text-aims-gold italic">Someone Using AI Will.</span>
        </h1>

        <p className="mt-8 text-lg sm:text-xl text-cream/70 max-w-3xl mx-auto leading-relaxed">
          Join the operator community that teaches you how to build a real AI services business
          starting with <span className="text-cream font-semibold">business fundamentals</span>, not code.
          Backed by founders running $30M+ companies.
        </p>

        {/* CTA buttons */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <a
            href="#apply"
            className="group inline-flex items-center justify-center gap-2 rounded-sm bg-aims-gold text-ink px-7 py-4 text-sm font-bold uppercase tracking-wider hover:bg-aims-gold-light transition-all shadow-[0_0_50px_rgba(196,151,42,0.35)] hover:shadow-[0_0_70px_rgba(196,151,42,0.5)]"
          >
            Apply for Next Cohort
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </a>
          <a
            href="#program"
            className="inline-flex items-center justify-center gap-2 rounded-sm border border-line hover:border-aims-gold/40 bg-surface/40 text-cream px-7 py-4 text-sm font-bold uppercase tracking-wider transition-colors"
          >
            See What&apos;s Inside
            <ChevronDown className="w-4 h-4" />
          </a>
        </div>

        <LiveSignupTicker />

        {/* Hero visual card (replaces video) */}
        <div className="mt-16 relative max-w-4xl mx-auto">
          <div className="absolute -inset-4 bg-gradient-to-r from-aims-gold/0 via-aims-gold/20 to-aims-gold/0 blur-2xl" />
          <div className="relative rounded-md border border-line bg-gradient-to-b from-surface to-deep p-8 sm:p-12 shadow-[0_0_60px_rgba(0,0,0,0.6)]">
            <div className="flex items-center justify-center mb-8">
              <Image
                src="/logo.png"
                alt="AI Operator Collective"
                width={320}
                height={320}
                className="object-contain h-40 w-auto sm:h-48 drop-shadow-[0_0_40px_rgba(196,151,42,0.35)]"
                priority
              />
            </div>

            <div className="grid grid-cols-3 gap-4 sm:gap-8 border-t border-line pt-8">
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <TrendingUp className="w-5 h-5 text-aims-gold" />
                </div>
                <div className="font-serif text-3xl sm:text-4xl text-cream">$100M+</div>
                <div className="mt-1 text-[10px] sm:text-xs uppercase tracking-wider text-cream/50 font-mono">
                  Operator Exits
                </div>
              </div>
              <div className="text-center border-x border-line">
                <div className="flex items-center justify-center mb-2">
                  <Users className="w-5 h-5 text-aims-gold" />
                </div>
                <div className="font-serif text-3xl sm:text-4xl text-cream">1,400+</div>
                <div className="mt-1 text-[10px] sm:text-xs uppercase tracking-wider text-cream/50 font-mono">
                  Members Built
                </div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <Sparkles className="w-5 h-5 text-aims-gold" />
                </div>
                <div className="font-serif text-3xl sm:text-4xl text-cream">$30M</div>
                <div className="mt-1 text-[10px] sm:text-xs uppercase tracking-wider text-cream/50 font-mono">
                  EBITDA Portfolio
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Trust pills */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-cream/50 font-mono uppercase tracking-wider">
          <span className="flex items-center gap-1.5">
            <span className="text-aims-gold">✓</span> YPO-Led Mentors
          </span>
          <span className="flex items-center gap-1.5">
            <span className="text-aims-gold">✓</span> Business-First Curriculum
          </span>
          <span className="flex items-center gap-1.5">
            <span className="text-aims-gold">✓</span> Live Client Pipeline
          </span>
        </div>
      </div>
    </section>
  )
}
