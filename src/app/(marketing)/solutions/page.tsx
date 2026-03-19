import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight, Check, Sparkles, Building2 } from "lucide-react"

export const metadata: Metadata = {
  title: "Engagement Models — Forward-Deployed AI Consulting | AIMS",
  description:
    "Explore AIMS engagement models. From outbound pipeline to SEO dominance to revenue operations, our forward-deployed engineers build and run AI systems inside your business.",
}

const SOLUTION_PACKAGES = [
  {
    name: "Wild Ducks",
    tagline: "Outbound pipeline, fully deployed",
    description:
      "We build and run your entire cold outbound engine — ICP targeting, multi-domain infrastructure, AI-personalized sequences, and warm lead routing. You get meetings, we handle everything else.",
    services: [
      "Cold Outbound Engine",
      "AI Voice Agents",
      "Lead Enrichment",
      "Deliverability Infrastructure",
    ],
    idealFor: "B2B service businesses, agencies, consultancies",
    isCustom: false,
  },
  {
    name: "Money Page",
    tagline: "Own your search presence across every channel",
    description:
      "We engineer your SEO and AEO strategy so you rank in Google and get cited by ChatGPT, Perplexity, and every AI answer engine. Content clusters, technical optimization, and authority building — all done for you.",
    services: [
      "SEO & AEO Optimization",
      "AI Content Engine",
      "LinkedIn Outbound",
      "Reputation Engine",
    ],
    idealFor: "Thought leaders, consultants, professional services",
    isCustom: false,
  },
  {
    name: "Steel Trap",
    tagline: "Revenue operations that never leak",
    description:
      "We architect your entire revenue operations layer — CRM, lead routing, attribution, conversion tracking, and rep performance dashboards. Full pipeline visibility, zero manual work.",
    services: [
      "RevOps Pipeline",
      "Sales Team Enablement",
      "AI Tool Tracker",
      "Finance Automation",
    ],
    idealFor: "Growing companies with 5-50 employees",
    isCustom: false,
  },
  {
    name: "Customer Reactivation",
    tagline: "Win back lost revenue automatically",
    description:
      "We mine your CRM for dead and cold leads, then run personalized multi-channel reactivation sequences. Avg. 18% of dormant leads convert to booked meetings within 30 days.",
    services: [
      "Lead Reactivation",
      "Database Reactivation",
      "AI Voice Agents",
      "AI Reputation Engine",
    ],
    idealFor: "Businesses with 500+ past customers/leads",
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
    isCustom: true,
  },
]

export default function SolutionsPage() {
  return (
    <div className="min-h-screen bg-deep">
      {/* Hero */}
      <section className="pt-28 pb-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary text-sm font-medium rounded-full mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            Engagement Models
          </div>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-foreground mb-4">
            AI Engagements Built For Your Business
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            We don&rsquo;t sell tools — we deploy engineers inside your business
            to build and run AI systems that drive measurable outcomes from
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
                className="bg-card border border-border rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col"
              >
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-foreground mb-1">
                    {pkg.name}
                  </h2>
                  <p className="text-sm font-medium text-primary mb-3">
                    {pkg.tagline}
                  </p>
                  <p className="text-sm text-muted-foreground mb-5">
                    {pkg.description}
                  </p>
                  <div className="flex flex-wrap gap-2 mb-5">
                    {pkg.services.map((s) => (
                      <span
                        key={s}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-deep text-foreground text-xs font-medium rounded-full"
                      >
                        <Check className="w-3 h-3 text-green-400" />
                        {s}
                      </span>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Ideal for: {pkg.idealFor}
                  </p>
                </div>
                <div className="mt-6">
                  <Link
                    href="/get-started"
                    className="inline-flex items-center justify-center gap-2 w-full rounded-sm bg-primary px-5 py-3 text-sm font-semibold text-white hover:bg-primary/90 transition-colors"
                  >
                    Schedule a Consultation
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
              className="mt-6 bg-card border-2 border-primary rounded-2xl p-8 shadow-sm"
            >
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                <div className="flex-1">
                  <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-primary/10 text-primary text-xs font-semibold rounded-full mb-3">
                    <Building2 className="w-3 h-3" />
                    Enterprise
                  </div>
                  <h2 className="text-2xl font-bold text-foreground mb-1">
                    {pkg.name}
                  </h2>
                  <p className="text-sm font-medium text-primary mb-3">
                    {pkg.tagline}
                  </p>
                  <p className="text-sm text-muted-foreground mb-4">
                    {pkg.description}
                  </p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {pkg.services.map((s) => (
                      <span
                        key={s}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-deep text-foreground text-xs font-medium rounded-full"
                      >
                        <Check className="w-3 h-3 text-green-400" />
                        {s}
                      </span>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Ideal for: {pkg.idealFor}
                  </p>
                </div>
                <div className="flex flex-col items-center gap-3 md:min-w-[200px]">
                  <Link
                    href="/get-started"
                    className="inline-flex items-center justify-center gap-2 w-full rounded-sm bg-primary px-6 py-3 text-sm font-semibold text-white hover:bg-primary/90 transition-colors"
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
          <div className="bg-card border border-border rounded-2xl p-8 text-center shadow-sm">
            <h2 className="text-xl font-bold text-foreground mb-2">
              Not sure which solution fits?
            </h2>
            <p className="text-sm text-muted-foreground mb-6">
              Take our free AI Readiness Quiz. In 2 minutes you will get a
              personalized score and a recommended solution package matched to
              your business.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/tools/ai-readiness-quiz"
                className="inline-flex items-center justify-center gap-2 rounded-sm bg-primary px-6 py-3 text-sm font-semibold text-white hover:bg-primary/90 transition-colors"
              >
                Take the Free Quiz
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/marketplace"
                className="inline-flex items-center justify-center gap-2 rounded-sm border border-border px-6 py-3 text-sm font-semibold text-foreground hover:bg-surface transition-colors"
              >
                Explore All Engagements
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
