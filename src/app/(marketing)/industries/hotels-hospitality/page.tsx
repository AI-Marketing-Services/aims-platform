import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight, CheckCircle2, Phone, Star, Users, BarChart2, Zap, Calendar } from "lucide-react"

export const metadata: Metadata = {
  title: "AI Systems for Hotels & Hospitality — AIMS",
  description: "AIMS builds the AI infrastructure that helps hotels and hospitality businesses drive direct bookings, reduce OTA dependence, and deliver 5-star guest experiences at scale.",
}

const PAIN_POINTS = [
  { icon: Calendar, pain: "Over-reliance on OTAs eating into margins with 15-25% commissions", fix: "Direct booking engine with AI-powered retargeting to convert OTA lookers into direct guests" },
  { icon: Phone, pain: "Front desk overwhelmed with calls, reservation changes, and FAQ inquiries", fix: "AI voice and chat agents handle routine calls, freeing your team for high-value guests" },
  { icon: Star, pain: "Inconsistent review responses — negative reviews going unaddressed for days", fix: "Automated review monitoring and AI-drafted responses published within the hour" },
  { icon: Users, pain: "Past guests not returning — no system to drive repeat bookings", fix: "Loyalty nurture sequences that reach past guests with personalized offers at the right time" },
  { icon: BarChart2, pain: "Corporate and group sales pipeline tracked in spreadsheets or email threads", fix: "CRM built for group sales with automated follow-up, proposal tracking, and revenue forecasting" },
  { icon: Zap, pain: "Seasonal dips with no proactive strategy to fill rooms in shoulder season", fix: "Targeted outbound campaigns reaching event planners, corporate travel managers, and tour operators" },
]

const RESULTS = [
  { value: "22%", label: "increase in direct bookings" },
  { value: "1 hr", label: "avg. review response time" },
  { value: "3.1x", label: "group lead volume increase" },
  { value: "18%", label: "reduction in OTA commission spend" },
]

const SERVICES = [
  {
    name: "Direct Booking Growth System",
    slug: "pixel-intelligence",
    desc: "AI-powered retargeting, email sequences, and a conversion-optimized booking flow that turns OTA browsers into direct bookers on your own site.",
    price: "Custom",
    badge: "Highest ROI",
  },
  {
    name: "AI Front Desk & Chat Agent",
    slug: "website-crm-chatbot",
    desc: "An AI agent trained on your property, amenities, policies, and FAQs that handles guest inquiries, upsells packages, and books reservations around the clock.",
    price: "from $197/mo",
    badge: "Most Popular",
  },
  {
    name: "Group & Corporate Sales CRM",
    slug: "cold-outbound",
    desc: "Purpose-built outbound engine targeting event planners, corporate travel managers, and meeting organizers — with automated follow-up that never drops the ball.",
    price: "Custom",
    badge: null,
  },
  {
    name: "Review & Reputation Management",
    slug: "local-seo",
    desc: "Automated review generation, monitoring across 12+ platforms, and AI-drafted responses that protect your brand and boost your star rating.",
    price: "Custom",
    badge: null,
  },
]

export default function HotelsHospitalityPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="bg-gradient-to-b from-gray-900 to-gray-800 text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 text-white/80 text-sm font-medium rounded-full mb-6">
            <Zap className="w-3.5 h-3.5" />
            Built for Hotels & Hospitality
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold mb-6 leading-tight">
            Fill Your Rooms.<br />
            <span className="text-[#DC2626]">Own Your Guest Relationships.</span>
          </h1>
          <p className="text-lg text-gray-300 mb-8 max-w-2xl mx-auto">
            AIMS builds the AI systems that drive direct bookings, reduce OTA dependence, and let your team focus on delivering exceptional guest experiences — not answering the same questions 40 times a day.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/get-started"
              className="inline-flex items-center gap-2 px-8 py-4 bg-[#DC2626] text-white font-semibold rounded-xl hover:bg-[#B91C1C] transition-colors"
            >
              Book a Strategy Call
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/tools/roi-calculator"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white/10 text-white font-semibold rounded-xl hover:bg-white/20 transition-colors border border-white/20"
            >
              Calculate Your ROI
            </Link>
          </div>
        </div>
      </section>

      {/* Results */}
      <section className="py-12 px-4 bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-6">
          {RESULTS.map((r) => (
            <div key={r.label} className="text-center">
              <div className="text-3xl font-black text-[#DC2626] mb-1">{r.value}</div>
              <div className="text-sm text-gray-500">{r.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Pain / Fix */}
      <section className="py-16 px-4 bg-[#FAFAFA]">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Every Hospitality Challenge — Solved with AI</h2>
            <p className="text-gray-500 max-w-xl mx-auto">Your guests expect a 5-star experience. Your backend systems should be working just as hard.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {PAIN_POINTS.map(({ icon: Icon, pain, fix }) => (
              <div key={pain} className="bg-white border border-gray-200 rounded-xl p-5">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Icon className="w-4 h-4 text-[#DC2626]" />
                  </div>
                  <p className="text-sm font-medium text-gray-700">{pain}</p>
                </div>
                <div className="flex items-start gap-2 pl-11">
                  <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-green-700">{fix}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">AIMS Services for Hotels & Hospitality</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {SERVICES.map((svc) => (
              <div key={svc.name} className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold text-gray-900">{svc.name}</h3>
                  {svc.badge && (
                    <span className="text-xs font-medium px-2 py-0.5 bg-red-50 text-[#DC2626] rounded-full">{svc.badge}</span>
                  )}
                </div>
                <p className="text-sm text-gray-500 mb-4">{svc.desc}</p>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-900">{svc.price}</span>
                  <Link
                    href={`/services/${svc.slug}`}
                    className="text-sm text-[#DC2626] font-medium hover:underline flex items-center gap-1"
                  >
                    Learn more <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 bg-[#DC2626]">
        <div className="max-w-2xl mx-auto text-center text-white">
          <h2 className="text-3xl font-bold mb-4">Let&apos;s grow your direct bookings.</h2>
          <p className="text-red-100 mb-8">
            Book a free 30-minute strategy call. We&apos;ll review your current booking mix, identify where you&apos;re losing revenue to OTAs, and show you exactly what AI can do.
          </p>
          <Link
            href="/get-started"
            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-[#DC2626] font-semibold rounded-xl hover:bg-red-50 transition-colors"
          >
            Book Free Strategy Call
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </div>
  )
}
