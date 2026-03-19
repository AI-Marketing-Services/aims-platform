import Link from "next/link"
import { ArrowRight } from "lucide-react"

export function FinalCTA() {
  return (
    <section className="bg-gradient-to-r from-[#C4972A] to-[#A17D22] py-20">
      <div className="container mx-auto max-w-3xl px-4 text-center">
        <h2 className="text-4xl font-bold text-ink sm:text-5xl">
          Ready to fill your pipeline?
        </h2>
        <p className="mt-4 text-lg text-ink/80">
          Join 500+ businesses using AIMS to generate qualified meetings on autopilot.
        </p>
        <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/get-started"
            className="inline-flex items-center gap-2 rounded-lg bg-ink px-8 py-3.5 text-base font-semibold text-[#E8C46A] shadow-lg transition hover:bg-ink/90"
          >
            Book a Strategy Call <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/marketplace"
            className="inline-flex items-center gap-2 rounded-lg border border-ink/30 px-8 py-3.5 text-base font-semibold text-ink transition hover:bg-ink/10"
          >
            Browse Services
          </Link>
        </div>
        <p className="mt-5 text-sm text-ink/70">No credit card required &middot; Cancel anytime</p>
      </div>
    </section>
  )
}
