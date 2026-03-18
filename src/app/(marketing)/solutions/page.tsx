import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight, Check, Sparkles, Building2 } from "lucide-react"

export const metadata: Metadata = {
  title: "AI Solutions — Pre-Built Packages for Every Business | AIMS",
  description:
    "Choose a pre-built AI solution package or customize your own. From lead generation to revenue operations, AIMS bundles the right services for your growth stage.",
}

const SOLUTION_PACKAGES = [
  {
    name: "AI Growth Engine",
    tagline: "Full-stack lead generation and conversion",
    description:
      "Everything you need to fill your pipeline and convert leads on autopilot.",
    services: [
      "Website + CRM + Chatbot",
      "Cold Outbound Engine",
      "AI Voice Agents",
      "SEO/AEO",
    ],
    idealFor: "B2B service businesses, agencies, consultancies",
    startingPrice: "from $497/mo",
    isCustom: false,
  },
  {
    name: "Revenue Operations Suite",
    tagline: "Systemize your sales and operations",
    description:
      "Turn your sales process into a repeatable, data-driven machine.",
    services: [
      "RevOps Pipeline",
      "Sales Team Enablement",
      "AI Tool Tracker",
      "P&L Finance Automation",
    ],
    idealFor: "Growing companies with 5-50 employees",
    startingPrice: "from $397/mo",
    isCustom: false,
  },
  {
    name: "Customer Reactivation Stack",
    tagline: "Win back lost revenue automatically",
    description:
      "Re-engage dormant customers and recover churned revenue with AI.",
    services: [
      "Lead Reactivation",
      "Database Reactivation",
      "AI Voice Agents",
      "AI Reputation Engine",
    ],
    idealFor: "Businesses with 500+ past customers/leads",
    startingPrice: "from $347/mo",
    isCustom: false,
  },
  {
    name: "Content & Authority Engine",
    tagline: "Become the go-to expert in your space",
    description:
      "AI-powered content production and distribution across every channel.",
    services: [
      "AI Content Engine",
      "LinkedIn Outbound",
      "SEO/AEO",
      "AI Reputation Engine",
    ],
    idealFor: "Thought leaders, consultants, professional services",
    startingPrice: "from $297/mo",
    isCustom: false,
  },
  {
    name: "Enterprise AI Transformation",
    tagline: "Custom AI solutions built for your business",
    description:
      "Our forward-deployed engineers audit your operations and build custom AI solutions you own forever.",
    services: [
      "Custom AI Audit",
      "Solution Architecture",
      "Implementation",
      "Training & Handoff",
    ],
    idealFor: "Companies doing $1M+ revenue ready to transform with AI",
    startingPrice: "Custom pricing",
    isCustom: true,
  },
]

export default function SolutionsPage() {
  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      {/* Hero */}
      <section className="pt-28 pb-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-50 text-[#DC2626] text-sm font-medium rounded-full mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            Solution Packages
          </div>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-gray-900 mb-4">
            AI Solutions Built For Your Business
          </h1>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto">
            Stop buying one-off tools. Each package bundles the right AIMS
            services for a specific outcome — so everything works together from
            day one.
          </p>
        </div>
      </section>

      {/* Solution Cards */}
      <section className="pb-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {SOLUTION_PACKAGES.filter((p) => !p.isCustom).map((pkg) => (
              <div
                key={pkg.name}
                className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col"
              >
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-gray-900 mb-1">
                    {pkg.name}
                  </h2>
                  <p className="text-sm font-medium text-[#DC2626] mb-3">
                    {pkg.tagline}
                  </p>
                  <p className="text-sm text-gray-600 mb-5">
                    {pkg.description}
                  </p>
                  <div className="flex flex-wrap gap-2 mb-5">
                    {pkg.services.map((s) => (
                      <span
                        key={s}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-full"
                      >
                        <Check className="w-3 h-3 text-green-600" />
                        {s}
                      </span>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mb-1">
                    Ideal for: {pkg.idealFor}
                  </p>
                  <p className="text-sm font-semibold text-gray-900">
                    {pkg.startingPrice}
                  </p>
                </div>
                <div className="mt-6">
                  <Link
                    href="/get-started"
                    className="inline-flex items-center justify-center gap-2 w-full rounded-xl bg-[#DC2626] px-5 py-3 text-sm font-semibold text-white hover:bg-[#B91C1C] transition-colors"
                  >
                    Get Started
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {/* Enterprise / Custom Card — Full Width */}
          {SOLUTION_PACKAGES.filter((p) => p.isCustom).map((pkg) => (
            <div
              key={pkg.name}
              className="mt-6 bg-white border-2 border-[#DC2626] rounded-2xl p-8 shadow-sm"
            >
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                <div className="flex-1">
                  <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-red-50 text-[#DC2626] text-xs font-semibold rounded-full mb-3">
                    <Building2 className="w-3 h-3" />
                    Enterprise
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-1">
                    {pkg.name}
                  </h2>
                  <p className="text-sm font-medium text-[#DC2626] mb-3">
                    {pkg.tagline}
                  </p>
                  <p className="text-sm text-gray-600 mb-4">
                    {pkg.description}
                  </p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {pkg.services.map((s) => (
                      <span
                        key={s}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-full"
                      >
                        <Check className="w-3 h-3 text-green-600" />
                        {s}
                      </span>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500">
                    Ideal for: {pkg.idealFor}
                  </p>
                </div>
                <div className="flex flex-col items-center gap-3 md:min-w-[200px]">
                  <p className="text-lg font-bold text-gray-900">
                    {pkg.startingPrice}
                  </p>
                  <Link
                    href="/get-started"
                    className="inline-flex items-center justify-center gap-2 w-full rounded-xl bg-[#DC2626] px-6 py-3 text-sm font-semibold text-white hover:bg-[#B91C1C] transition-colors"
                  >
                    Talk to Us
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="pb-20 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center shadow-sm">
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Not sure which solution fits?
            </h2>
            <p className="text-sm text-gray-500 mb-6">
              Take our free AI Readiness Quiz. In 2 minutes you will get a
              personalized score and a recommended solution package matched to
              your business.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/tools/ai-readiness-quiz"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#DC2626] px-6 py-3 text-sm font-semibold text-white hover:bg-[#B91C1C] transition-colors"
              >
                Take the Free Quiz
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/marketplace"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 px-6 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Browse All Services
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
