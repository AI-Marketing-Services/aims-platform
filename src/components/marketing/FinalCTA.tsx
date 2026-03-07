import Link from "next/link"
import { ArrowRight } from "lucide-react"

export function FinalCTA() {
  return (
    <section className="bg-gray-900 py-20">
      <div className="container mx-auto max-w-3xl px-4 text-center">
        <h2 className="text-4xl font-bold text-white sm:text-5xl">
          Ready to fill your pipeline?
        </h2>
        <p className="mt-4 text-lg text-gray-400">
          Join 500+ businesses using AIMS to generate qualified meetings on autopilot.
        </p>
        <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/get-started"
            className="inline-flex items-center gap-2 rounded-lg bg-[#DC2626] px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-red-900/30 transition hover:bg-[#B91C1C]"
          >
            Book a Strategy Call <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/marketplace"
            className="inline-flex items-center gap-2 rounded-lg border border-white/20 px-8 py-3.5 text-base font-semibold text-white transition hover:bg-white/10"
          >
            Browse Services
          </Link>
        </div>
        <p className="mt-5 text-sm text-gray-500">No credit card required &middot; Cancel anytime</p>
      </div>
    </section>
  )
}
