import Image from "next/image"
import { ArrowRight, ChevronDown, FileText, Lock, Zap } from "lucide-react"

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
        <p className="text-xs sm:text-sm font-mono uppercase tracking-[0.3em] text-aims-gold mb-6">
          For Displaced W-2 Professionals &amp; Corporate Operators
        </p>

        <h1 className="font-serif text-5xl sm:text-6xl md:text-7xl lg:text-[88px] leading-[1.1] pb-2 tracking-tight text-cream">
          Turn Your Career Experience{" "}
          <span className="block text-aims-gold italic">Into an AI Services Business.</span>
        </h1>

        <p className="mt-8 text-lg sm:text-xl text-cream/75 max-w-3xl mx-auto leading-relaxed">
          A business-in-a-box for professionals who want to build an AI advisory practice — not
          take another job. LLC, pricing, pipeline, and sales process come{" "}
          <span className="text-cream font-semibold">before</span> AI tooling. Same playbooks,
          contracts, and stack the AIMS portfolio runs internally.
        </p>

        {/* Free resource hook */}
        <div className="mt-8 inline-flex items-center gap-2 rounded-full border border-aims-gold/40 bg-aims-gold/10 px-4 py-2 text-xs sm:text-sm font-mono uppercase tracking-wider text-aims-gold">
          <Zap className="w-4 h-4" />
          Free on signup: The AI Operator Playbook Vault
        </div>

        {/* CTA buttons */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
          <a
            href="#apply"
            className="group inline-flex items-center justify-center gap-2 rounded-sm bg-aims-gold text-ink px-7 py-4 text-sm font-bold uppercase tracking-wider hover:bg-aims-gold-light transition-all shadow-[0_0_50px_rgba(196,151,42,0.35)] hover:shadow-[0_0_70px_rgba(196,151,42,0.5)]"
          >
            Get the Playbook Vault + Apply
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </a>
          <a
            href="#what-you-get"
            className="inline-flex items-center justify-center gap-2 rounded-sm border border-line hover:border-aims-gold/40 bg-surface/40 text-cream px-7 py-4 text-sm font-bold uppercase tracking-wider transition-colors"
          >
            See What&apos;s Inside
            <ChevronDown className="w-4 h-4" />
          </a>
        </div>

        <p className="mt-5 text-xs sm:text-sm text-cream/50 font-mono uppercase tracking-wider">
          No payment to apply · Application-only · Alpha cohort capped
        </p>

        {/* Value preview card */}
        <div className="mt-16 relative max-w-4xl mx-auto">
          <div className="absolute -inset-4 bg-gradient-to-r from-aims-gold/0 via-aims-gold/20 to-aims-gold/0 blur-2xl" />
          <div className="relative rounded-md border border-line bg-gradient-to-b from-surface to-deep p-8 sm:p-12 shadow-[0_0_60px_rgba(0,0,0,0.6)]">
            <div className="flex items-center justify-center mb-6">
              <Image
                src="/logo.png"
                alt="AI Operator Collective"
                width={320}
                height={320}
                className="object-contain h-28 w-auto sm:h-32 drop-shadow-[0_0_40px_rgba(196,151,42,0.35)]"
                priority
              />
            </div>

            <p className="text-center text-xs font-mono uppercase tracking-[0.2em] text-cream/50 mb-6">
              What lands in your inbox the second you sign up
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-line pt-6">
              <div className="flex items-start gap-3 text-left rounded-sm border border-line/60 bg-ink/40 p-4">
                <FileText className="w-5 h-5 text-aims-gold flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-cream font-semibold leading-tight">
                    Operator Playbook Vault
                  </p>
                  <p className="mt-1 text-xs text-cream/50 leading-snug">
                    Cold email, discovery, pricing, and delivery plays.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 text-left rounded-sm border border-line/60 bg-ink/40 p-4">
                <Zap className="w-5 h-5 text-aims-gold flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-cream font-semibold leading-tight">
                    Pricing &amp; ROI Calculators
                  </p>
                  <p className="mt-1 text-xs text-cream/50 leading-snug">
                    Same models the AIMS team uses to price and close deals.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 text-left rounded-sm border border-line/60 bg-ink/40 p-4">
                <Lock className="w-5 h-5 text-aims-gold flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-cream font-semibold leading-tight">
                    Cohort Waitlist Priority
                  </p>
                  <p className="mt-1 text-xs text-cream/50 leading-snug">
                    Applications are reviewed by a real operator — no pitch calls, no hoops.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Trust pills */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-cream/50 font-mono uppercase tracking-wider">
          <span className="flex items-center gap-1.5">
            <span className="text-aims-gold">✓</span> Operator-Led
          </span>
          <span className="flex items-center gap-1.5">
            <span className="text-aims-gold">✓</span> Business Fundamentals First
          </span>
          <span className="flex items-center gap-1.5">
            <span className="text-aims-gold">✓</span> Application Only
          </span>
        </div>
      </div>
    </section>
  )
}
