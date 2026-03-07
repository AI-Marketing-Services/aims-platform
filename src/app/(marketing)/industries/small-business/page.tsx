import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight, CheckCircle2, Phone, Mail, Users, BarChart2, Zap, Clock } from "lucide-react"

export const metadata: Metadata = {
  title: "AI Systems for Small Businesses — AIMS",
  description: "AIMS gives small businesses the same AI-powered sales and marketing infrastructure that enterprise companies use — at a price that makes sense for a growing team.",
}

const PAIN_POINTS = [
  { icon: Clock, pain: "No time to follow up with every lead — too busy running the business", fix: "AI sequences follow up instantly and nurture leads for weeks without any manual work" },
  { icon: Phone, pain: "Calls going to voicemail when you're with a customer", fix: "AI voice agent answers, qualifies, and books appointments around the clock" },
  { icon: Users, pain: "Can't afford a full sales team but need consistent pipeline", fix: "AI-driven outbound system that works like a 3-person BDR team at a fraction of the cost" },
  { icon: Mail, pain: "Website built years ago — not generating any leads", fix: "Modern conversion-optimized site with AI chatbot capturing visitors 24/7" },
  { icon: BarChart2, pain: "No idea which marketing efforts are actually working", fix: "Dashboard connecting ad spend, leads, and closed revenue in plain English" },
  { icon: Zap, pain: "Competitor down the street is winning more business — you're not sure why", fix: "Competitive positioning analysis + SEO strategy to outrank and outconvert them" },
]

const RESULTS = [
  { value: "2-3x", label: "more leads per month" },
  { value: "14 days", label: "to first AI system live" },
  { value: "80%", label: "reduction in manual follow-up time" },
  { value: "$500+", label: "avg. monthly tool savings" },
]

const SERVICES = [
  {
    name: "Website + CRM + AI Chatbot",
    slug: "website-crm-chatbot",
    desc: "Everything you need in one bundle: a lead-generating website, a CRM configured for your sales process, and an AI chatbot trained on your business.",
    price: "from $97/mo",
    badge: "Best Value",
  },
  {
    name: "AI Readiness + Audit",
    slug: "ai-readiness",
    desc: "Not sure where to start with AI? We audit your current stack, identify the highest-leverage gaps, and deliver a prioritized roadmap with clear next steps.",
    price: "Free",
    badge: "Start Here",
  },
  {
    name: "Cold Outbound System",
    slug: "cold-outbound",
    desc: "Done-for-you outbound engine targeting your ideal customers via email and LinkedIn. Sequences personalized at scale — designed to book calls, not get ignored.",
    price: "Custom",
    badge: null,
  },
  {
    name: "SEO + Local Visibility",
    slug: "seo-aeo",
    desc: "Show up when your customers are searching — on Google, Maps, and now AI search engines like ChatGPT and Perplexity. Built for local and regional businesses.",
    price: "Custom",
    badge: null,
  },
]

export default function SmallBusinessPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="bg-gradient-to-b from-gray-900 to-gray-800 text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 text-white/80 text-sm font-medium rounded-full mb-6">
            <Zap className="w-3.5 h-3.5" />
            Built for Small Business Owners
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold mb-6 leading-tight">
            Enterprise AI for<br />
            <span className="text-[#DC2626]">Small Business Budgets</span>
          </h1>
          <p className="text-lg text-gray-300 mb-8 max-w-2xl mx-auto">
            AIMS gives you the same AI-powered sales and marketing infrastructure your biggest competitors use — built, deployed, and managed for you at a price that makes sense.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/get-started"
              className="inline-flex items-center gap-2 px-8 py-4 bg-[#DC2626] text-white font-semibold rounded-xl hover:bg-[#B91C1C] transition-colors"
            >
              Get Free Strategy Call
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/tools/ai-readiness-quiz"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white/10 text-white font-semibold rounded-xl hover:bg-white/20 transition-colors border border-white/20"
            >
              Free AI Readiness Quiz
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
            <h2 className="text-3xl font-bold text-gray-900 mb-4">The Problems Every Small Business Owner Faces</h2>
            <p className="text-gray-500 max-w-xl mx-auto">You&apos;re not alone. These are the exact challenges we solve for businesses like yours every week.</p>
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
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Start Here — AIMS for Small Business</h2>
            <p className="text-gray-500 max-w-xl mx-auto">Pick the one service that solves your biggest problem, or let us build a full stack.</p>
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
          <h2 className="text-3xl font-bold mb-4">Let&apos;s build your growth engine.</h2>
          <p className="text-red-100 mb-8">
            Book a free 30-minute strategy call. We&apos;ll look at your current setup, identify the biggest gaps, and give you a clear plan — no obligation, no pressure.
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
