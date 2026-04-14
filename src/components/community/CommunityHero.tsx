import { ArrowRight } from "lucide-react"

const TYPEFORM_URL = "#apply"

export function CommunityHero() {
  return (
    <section className="relative overflow-hidden pt-16 pb-20 sm:pt-24 sm:pb-28">
      {/* Background gradient */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-ink via-deep to-ink" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] rounded-full bg-aims-gold/10 blur-[120px]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-20%,rgba(196,151,42,0.18),transparent_60%)]" />
      </div>

      <div className="mx-auto max-w-5xl px-4 text-center">
        <p className="text-xs sm:text-sm font-mono uppercase tracking-[0.3em] text-aims-gold mb-6">
          For Burnt-Out W-2 Professionals &amp; Corporate Operators
        </p>

        <h1 className="font-serif text-5xl sm:text-6xl md:text-7xl lg:text-[88px] leading-[1.1] pb-2 tracking-tight text-cream">
          AI didn&apos;t take your job.
          <span className="block text-aims-gold italic">It just created a market</span>
          <span className="block text-aims-gold italic">for your new business.</span>
        </h1>

        <p className="mt-8 text-lg sm:text-xl text-cream/75 max-w-3xl mx-auto leading-relaxed">
          Local businesses everywhere are desperate for AI guidance, and they&apos;re not
          calling software companies. They&apos;re calling trusted advisors with real-world
          domain experience. We give you the entire business-out-of-a-box playbook that aligns
          with AI coaching frameworks to become an AI specialist, build a consulting flywheel,
          and replace your 9-to-5.
        </p>

        {/* CTA */}
        <div className="mt-10 flex flex-col items-center gap-4">
          <a
            href={TYPEFORM_URL}
            className="group inline-flex items-center justify-center gap-2 rounded-sm bg-aims-gold text-ink px-7 py-4 text-sm font-bold uppercase tracking-wider hover:bg-aims-gold-light transition-all shadow-[0_0_50px_rgba(196,151,42,0.35)] hover:shadow-[0_0_70px_rgba(196,151,42,0.5)]"
          >
            Apply Now
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </a>
        </div>

        <p className="mt-5 text-xs sm:text-sm text-cream/70 font-mono uppercase tracking-wider">
          No payment to apply · Application-only · Alpha cohort capped
        </p>
      </div>
    </section>
  )
}
