import Link from "next/link"
import { ArrowRight } from "lucide-react"

export function FinalCTA() {
  return (
    <section className="bg-[#DC2626] py-24">
      <div className="container mx-auto max-w-4xl px-4 text-center">
        <h2 className="text-4xl font-bold text-white sm:text-5xl">
          Ready to fill your pipeline?
        </h2>
        <p className="mt-4 text-lg text-red-100">
          Join 500+ businesses using AIMS to generate qualified meetings on autopilot.
        </p>
        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Link
            href="/get-started"
            className="inline-flex items-center gap-2 rounded-lg bg-card px-8 py-3.5 text-base font-semibold text-[#DC2626] shadow-sm transition hover:bg-red-50"
          >
            Book a Strategy Call <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/marketplace"
            className="inline-flex items-center gap-2 rounded-lg border border-white/30 px-8 py-3.5 text-base font-semibold text-white transition hover:bg-card/10"
          >
            Browse Services
          </Link>
        </div>
        <p className="mt-4 text-sm text-red-200">No credit card required &middot; Cancel anytime</p>
      </div>
    </section>
  )
}
