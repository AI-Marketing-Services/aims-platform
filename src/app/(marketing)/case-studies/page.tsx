import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight, TrendingUp } from "lucide-react"

export const metadata: Metadata = {
  title: "Case Studies — AIMS",
  description: "Real results from real businesses. See how AIMS builds AI-powered systems that generate leads, close deals, and automate operations.",
}

const CASE_STUDIES = [
  {
    slug: "ford-dealership",
    client: "Regional Ford Dealership Group",
    industry: "Automotive",
    headline: "4.2x lead response rate, 31% more show rates",
    summary: "A 3-location Ford dealer group was losing deals to competitors who responded faster. AIMS deployed an AI follow-up system that contacted every lead within 90 seconds — around the clock.",
    metrics: [
      { value: "4.2x", label: "Lead response rate" },
      { value: "31%", label: "Show rate improvement" },
      { value: "22%", label: "Service lane bookings" },
    ],
    tags: ["Automotive", "BDC Automation", "AI Follow-Up"],
  },
  {
    slug: "vendingpreneur",
    client: "Multi-Route Vending Operator",
    industry: "Vending / Retail",
    headline: "47 new locations secured in 90 days with AI outbound",
    summary: "A vending operator running 200+ machines across 3 states was manually prospecting new locations. AIMS built a cold outbound system targeting property managers and facility directors.",
    metrics: [
      { value: "47", label: "New locations secured" },
      { value: "90 days", label: "To results" },
      { value: "$284", label: "Cost per location" },
    ],
    tags: ["Vending", "Cold Outbound", "Lead Generation"],
  },
  {
    slug: "pl-automation",
    client: "P&L Automation (SaaS)",
    industry: "Technology",
    headline: "Pipeline 3x in 60 days — from 0 outbound to full system",
    summary: "A B2B SaaS company had no outbound motion and relied entirely on inbound. AIMS built a full outbound stack targeting CFOs and VPs of Finance at mid-market companies.",
    metrics: [
      { value: "3x", label: "Pipeline growth" },
      { value: "60 days", label: "From launch to results" },
      { value: "12%", label: "Lead-to-meeting rate" },
    ],
    tags: ["SaaS", "Cold Outbound", "CRM Setup"],
  },
]

export default function CaseStudiesPage() {
  return (
    <div className="min-h-screen bg-deep">
      <div className="max-w-5xl mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary text-sm font-medium rounded-full mb-6">
            <TrendingUp className="w-3.5 h-3.5" />
            Client Results
          </div>
          <h1 className="text-4xl font-bold text-foreground mb-4">Case Studies</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Real businesses. Real results. See how AIMS builds AI systems that generate measurable revenue.
          </p>
        </div>

        {/* Case study cards */}
        <div className="space-y-6">
          {CASE_STUDIES.map((cs) => (
            <Link
              key={cs.slug}
              href={`/case-studies/${cs.slug}`}
              className="block bg-card border border-border rounded-2xl p-8 hover:shadow-md hover:border-border transition-all group"
            >
              <div className="flex flex-col sm:flex-row sm:items-start gap-6">
                <div className="flex-1">
                  <div className="flex flex-wrap gap-2 mb-3">
                    {cs.tags.map((tag) => (
                      <span key={tag} className="text-xs font-medium px-2 py-0.5 bg-deep text-muted-foreground rounded-full">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <h2 className="text-xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
                    {cs.headline}
                  </h2>
                  <p className="text-sm text-muted-foreground mb-4">{cs.summary}</p>
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{cs.client} · {cs.industry}</p>
                </div>
                <div className="flex sm:flex-col gap-6 sm:gap-4 sm:text-right">
                  {cs.metrics.map((m) => (
                    <div key={m.label}>
                      <div className="text-2xl font-black text-primary">{m.value}</div>
                      <div className="text-xs text-muted-foreground">{m.label}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-4 flex items-center gap-1 text-sm font-medium text-primary">
                Read case study <ArrowRight className="w-4 h-4" />
              </div>
            </Link>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-14 bg-primary rounded-2xl p-10 text-center text-white">
          <h2 className="text-2xl font-bold mb-3">Want results like these?</h2>
          <p className="text-muted-foreground mb-6">
            Book a free strategy call and we&apos;ll show you exactly what AIMS would build for your business — with projected timelines and ROI.
          </p>
          <Link
            href="/get-started"
            className="inline-flex items-center gap-2 px-8 py-4 bg-card text-primary font-semibold rounded-xl hover:bg-primary/10 transition-colors"
          >
            Book Free Strategy Call
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </div>
  )
}
