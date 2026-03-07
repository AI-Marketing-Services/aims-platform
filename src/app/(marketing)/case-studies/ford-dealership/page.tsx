import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight, CheckCircle2, TrendingUp, Clock, Calendar } from "lucide-react"

export const metadata: Metadata = {
  title: "Ford Dealership AI Case Study — AIMS",
  description: "How a 3-location Ford dealer group achieved a 4.2x lead response rate and 31% improvement in show rates with AIMS AI automation.",
}

export default function FordDealershipCaseStudy() {
  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <div className="max-w-3xl mx-auto px-4 py-16">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-400 mb-8">
          <Link href="/case-studies" className="hover:text-[#DC2626] transition-colors">Case Studies</Link>
          <span>/</span>
          <span className="text-gray-600">Regional Ford Dealership Group</span>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-4">
          {["Automotive", "BDC Automation", "AI Follow-Up", "CRM"].map((tag) => (
            <span key={tag} className="text-xs font-medium px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">{tag}</span>
          ))}
        </div>

        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
          4.2x Lead Response Rate for a 3-Location Ford Dealer Group
        </h1>
        <p className="text-lg text-gray-500 mb-10">
          How AIMS deployed an AI-powered BDC system that followed up with every lead in under 90 seconds — turning missed opportunities into booked appointments.
        </p>

        {/* Metrics banner */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-10 grid grid-cols-3 gap-4 text-center shadow-sm">
          {[
            { value: "4.2x", label: "Lead response rate" },
            { value: "31%", label: "Show rate improvement" },
            { value: "22%", label: "Service bookings increase" },
          ].map((m) => (
            <div key={m.label}>
              <div className="text-3xl font-black text-[#DC2626] mb-1">{m.value}</div>
              <div className="text-xs text-gray-500">{m.label}</div>
            </div>
          ))}
        </div>

        {/* Content */}
        <div className="prose prose-gray max-w-none space-y-8">
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">The Challenge</h2>
            <p className="text-gray-600 leading-relaxed">
              A regional Ford dealership group with three locations across the midwest was losing deals to competitors who responded faster to digital leads. Their BDC team was handling 200+ leads per month manually — and with average response times exceeding 3 hours, a significant percentage of leads had already gone elsewhere by the time anyone made contact.
            </p>
            <p className="text-gray-600 leading-relaxed mt-3">
              The dealership&apos;s GSM described it plainly: &quot;We were paying for leads we weren&apos;t working fast enough. Our show rate was 34% and we knew it should be closer to 50%.&quot;
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">What AIMS Built</h2>
            <div className="space-y-3">
              {[
                "AI-powered lead follow-up system triggering within 90 seconds of every new lead — email, SMS, and outbound AI voice call",
                "Custom CRM workflow routing hot leads immediately to available sales reps via mobile notification",
                "Automated appointment confirmation and day-before reminder sequences reducing no-shows",
                "Service lane outreach campaign targeting customers overdue for maintenance using vehicle history data",
                "Weekly performance dashboard giving management visibility into lead-to-show conversion by source",
              ].map((item) => (
                <div key={item} className="flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                  <p className="text-gray-600 text-sm">{item}</p>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">The Timeline</h2>
            <div className="space-y-3">
              {[
                { icon: Clock, time: "Week 1-2", desc: "CRM integration, lead routing workflows, and AI follow-up sequences built and tested" },
                { icon: Calendar, time: "Week 3", desc: "AI voice agent deployed on inbound leads, BDC team trained on new handoff protocol" },
                { icon: TrendingUp, time: "Day 30", desc: "First full month results: response rate improved from 22% to 4.2x, show rate from 34% to 45%" },
              ].map(({ icon: Icon, time, desc }) => (
                <div key={time} className="flex items-start gap-4 bg-white border border-gray-200 rounded-xl p-4">
                  <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Icon className="w-4 h-4 text-[#DC2626]" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{time}</p>
                    <p className="text-sm text-gray-500">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">Results After 90 Days</h2>
            <div className="bg-green-50 border border-green-200 rounded-xl p-6 space-y-3">
              {[
                "Lead response time: from avg. 3.2 hours → under 90 seconds",
                "Lead-to-appointment rate: 22% → 38%",
                "Show rate: 34% → 45% (+31%)",
                "Service lane bookings: +22% month-over-month",
                "BDC workload: reduced by 40% on tier-1 follow-up tasks",
              ].map((item) => (
                <div key={item} className="flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                  <p className="text-green-800 text-sm">{item}</p>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* CTA */}
        <div className="mt-14 bg-[#DC2626] rounded-2xl p-8 text-center text-white">
          <h2 className="text-2xl font-bold mb-3">Running a dealership? Let&apos;s build your system.</h2>
          <p className="text-red-100 mb-6">
            Book a free 30-minute strategy call. We&apos;ll audit your current lead flow and show you exactly what AIMS would build — with projected results.
          </p>
          <Link
            href="/get-started"
            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-[#DC2626] font-semibold rounded-xl hover:bg-red-50 transition-colors"
          >
            Book Free Strategy Call
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>

        <div className="mt-8 text-center">
          <Link href="/case-studies" className="text-sm text-gray-400 hover:text-[#DC2626] transition-colors">
            ← Back to all case studies
          </Link>
        </div>
      </div>
    </div>
  )
}
