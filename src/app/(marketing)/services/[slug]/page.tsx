import type { Metadata } from "next"
import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowRight, Check } from "lucide-react"
import { db } from "@/lib/db"
import { ServiceDemoSection } from "@/components/marketing/ServiceDemoSection"

type Params = { slug: string }

// Static fallback data for the 6 core services (used when DB row doesn't exist yet)
const STATIC_SERVICES: Record<string, {
  name: string
  pillar: string
  shortDesc: string
  longDesc: string
  features: string[]
}> = {
  "cold-outbound": {
    name: "Outbound Lead Campaigns",
    pillar: "SALES",
    shortDesc: "Multi-domain email infra, AI SDR reply handling, auto-enrichment, and deliverability monitoring.",
    longDesc: "We build and run your entire cold outbound engine — from ICP research and lead sourcing to AI-personalized copy, multi-step sequences, and hot-lead routing. Your team receives warm, qualified meetings. We handle everything else.",
    features: [
      "Multi-domain email infrastructure setup",
      "AI-powered lead sourcing & enrichment",
      "1:1 personalized email copy via GPT-4",
      "Multi-step sequences (D1, D3, D7, D14)",
      "Auto reply handling & meeting routing",
      "Weekly deliverability monitoring",
      "CRM integration & reporting dashboard",
      "Dedicated AIMS success manager",
    ],
  },
  "revops-pipeline": {
    name: "RevOps Pipeline",
    pillar: "OPERATIONS",
    shortDesc: "CRM architecture, lead routing, attribution, conversion dashboards, and rep coaching.",
    longDesc: "We architect your entire revenue operations layer — CRM setup, lead routing rules, attribution models, conversion tracking, and rep performance dashboards. Get full pipeline visibility in under 7 days.",
    features: [
      "CRM audit and full rebuild",
      "Lead routing and assignment rules",
      "Attribution and conversion tracking",
      "Pipeline stage definitions and playbooks",
      "Sales rep coaching dashboard",
      "Revenue forecasting model",
      "Slack-based deal alerts",
      "Bi-weekly RevOps review calls",
    ],
  },
  "voice-agents": {
    name: "AI Calling Agents",
    pillar: "SALES",
    shortDesc: "Inbound and outbound AI voice agents with multi-location routing, live transcripts, and CRM sync.",
    longDesc: "Deploy AI voice agents that handle inbound calls 24/7 and run outbound dial campaigns while you sleep. Calls are transcribed in real-time, leads are scored, and hot prospects are routed directly to your team.",
    features: [
      "Inbound AI receptionist — 24/7 coverage",
      "Outbound AI dialer campaigns",
      "Real-time call transcription",
      "Lead scoring and qualification",
      "CRM sync after every call",
      "Multi-location call routing",
      "Custom voice and script setup",
      "Call analytics dashboard",
    ],
  },
  "content-production": {
    name: "Content Production Pod",
    pillar: "MARKETING",
    shortDesc: "AI-powered content calendar, short-form video scripts, email copy, and LinkedIn ghostwriting.",
    longDesc: "Your dedicated AI content team produces 30+ high-quality assets per month — video scripts, LinkedIn posts, email sequences, and ad copy — all aligned to your brand voice and ICP.",
    features: [
      "Monthly content calendar and strategy",
      "30+ assets per month",
      "Short-form video scripts (TikTok, Reels, Shorts)",
      "LinkedIn ghostwriting and scheduling",
      "Email sequence copywriting",
      "Ad copy and creative briefs",
      "Brand voice guide and training",
      "Content performance reporting",
    ],
  },
  "lead-reactivation": {
    name: "Lead Reactivation",
    pillar: "SALES",
    shortDesc: "Turn dead CRM contacts into booked meetings using AI personalization and multi-channel sequences.",
    longDesc: "We mine your existing CRM for dead or cold leads and run personalized multi-channel reactivation sequences via email, SMS, and LinkedIn. Avg. 18% of dead leads convert to booked meetings within 30 days.",
    features: [
      "Full CRM dead-lead audit",
      "AI-personalized reactivation copy",
      "Multi-channel: email + SMS + LinkedIn",
      "Lead scoring and segmentation",
      "Hot lead routing to your team",
      "30-day reactivation sprint",
      "CRM updates and tagging",
      "Results report and ROI tracking",
    ],
  },
  "database-reactivation": {
    name: "Database Reactivation",
    pillar: "OPERATIONS",
    shortDesc: "Full CRM audit, deduplication, re-enrichment, and a scored outreach plan for your existing contacts.",
    longDesc: "We perform a complete CRM health audit — deduplication, bounce cleanup, re-enrichment with fresh firmographic and contact data, and a scored outreach prioritization plan. Avg. $24K recovered pipeline per client.",
    features: [
      "Complete CRM data audit",
      "Deduplication and record merging",
      "Bounce and invalid email cleanup",
      "Re-enrichment with fresh contact data",
      "Company firmographic enrichment",
      "Lead scoring model build",
      "Prioritized outreach playbook",
      "Clean CRM handoff with documentation",
    ],
  },
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params
  const staticSvc = STATIC_SERVICES[slug]
  if (!staticSvc) {
    try {
      const service = await db.serviceArm.findUnique({ where: { slug } })
      if (!service) return {}
      return { title: service.name, description: service.shortDesc }
    } catch {
      return {}
    }
  }
  return { title: staticSvc.name, description: staticSvc.shortDesc }
}

export default async function ServicePage({ params }: { params: Promise<Params> }) {
  const { slug } = await params

  // Try DB first, fall back to static data
  let service: {
    name: string
    pillar: string
    shortDesc: string
    longDesc: string | null
    features: string[]
    useCases: { industry: string; result: string }[]
    tiers: { id: string; name: string; price: number; interval: string; slug: string; isPopular: boolean; features: string[] }[]
    pricingModel?: string
  } | null = null

  try {
    const dbService = await db.serviceArm.findUnique({
      where: { slug },
      include: { tiers: { orderBy: { sortOrder: "asc" } } },
    })
    if (dbService) {
      service = {
        name: dbService.name,
        pillar: dbService.pillar,
        shortDesc: dbService.shortDesc,
        longDesc: dbService.longDesc,
        features: Array.isArray(dbService.features) ? (dbService.features as string[]) : [],
        useCases: Array.isArray(dbService.useCases) ? (dbService.useCases as { industry: string; result: string }[]) : [],
        tiers: dbService.tiers.map((t) => ({
          id: t.id,
          name: t.name,
          price: t.price,
          interval: t.interval,
          slug: t.slug,
          isPopular: t.isPopular,
          features: Array.isArray(t.features) ? (t.features as string[]) : [],
        })),
        pricingModel: dbService.pricingModel,
      }
    }
  } catch {
    // DB unavailable — use static data
  }

  // Fall back to static config
  if (!service) {
    const staticSvc = STATIC_SERVICES[slug]
    if (!staticSvc) notFound()
    service = {
      ...staticSvc,
      longDesc: staticSvc.longDesc,
      useCases: [],
      tiers: [],
    }
  }

  const pillarColors: Record<string, string> = {
    MARKETING: "bg-red-50 text-red-700 border-red-200",
    SALES: "bg-red-50 text-red-700 border-red-200",
    OPERATIONS: "bg-red-50 text-red-700 border-red-200",
    FINANCE: "bg-red-50 text-red-700 border-red-200",
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://aimseos.com"

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: service.name,
    description: service.shortDesc,
    brand: { "@type": "Brand", name: "AIMS" },
    url: `${appUrl}/services/${slug}`,
    offers: service.tiers.length > 0
      ? service.tiers.map((t) => ({
          "@type": "Offer",
          name: t.name,
          price: t.price / 100,
          priceCurrency: "USD",
          priceSpecification: {
            "@type": "UnitPriceSpecification",
            price: t.price / 100,
            priceCurrency: "USD",
            billingDuration: t.interval === "month" ? "P1M" : "P1Y",
          },
        }))
      : { "@type": "Offer", availability: "https://schema.org/InStock" },
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="border-b border-gray-100 bg-white py-20">
        <div className="container mx-auto max-w-4xl px-4">
          <span className={`inline-block rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wider mb-4 ${pillarColors[service.pillar] ?? "bg-gray-100 text-gray-600 border-gray-200"}`}>
            {service.pillar}
          </span>
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 md:text-5xl">{service.name}</h1>
          <p className="mt-4 text-xl text-gray-500 max-w-2xl">{service.longDesc ?? service.shortDesc}</p>
          <div className="mt-8 flex flex-col gap-4 sm:flex-row">
            <Link
              href={`/get-started?service=${slug}`}
              className="inline-flex items-center gap-2 rounded-lg bg-[#DC2626] px-8 py-3.5 font-semibold text-white hover:bg-[#B91C1C] transition"
            >
              Get Started <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/get-started"
              className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-8 py-3.5 font-semibold text-gray-700 hover:bg-gray-50 transition"
            >
              Book a Call
            </Link>
          </div>
        </div>
      </section>

      {/* Interactive Demo */}
      <ServiceDemoSection slug={slug} />

      {/* Features */}
      {service.features.length > 0 && (
        <section className="py-20 bg-white">
          <div className="container mx-auto max-w-4xl px-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-8">What&rsquo;s Included</h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {service.features.map((feature) => (
                <div key={feature} className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 p-4">
                  <Check className="h-5 w-5 shrink-0 text-[#DC2626]" />
                  <span className="text-sm font-medium text-gray-800">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Use Cases */}
      {service.useCases.length > 0 && (
        <section className="py-20 bg-gray-50">
          <div className="container mx-auto max-w-4xl px-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-8">Results By Industry</h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
              {service.useCases.map((uc) => (
                <div key={uc.industry} className="rounded-xl border border-gray-100 bg-white p-6 text-center shadow-sm">
                  <div className="text-sm font-semibold text-gray-500 mb-2">{uc.industry}</div>
                  <div className="text-lg font-bold text-[#DC2626]">{uc.result}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Pricing */}
      {service.tiers.length > 0 && (
        <section className="py-20 bg-white">
          <div className="container mx-auto max-w-4xl px-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-8">Pricing</h2>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {service.tiers.map((tier) => (
                <div
                  key={tier.id}
                  className={`rounded-xl border-2 bg-white p-6 ${tier.isPopular ? "border-[#DC2626] shadow-lg" : "border-gray-100"}`}
                >
                  {tier.isPopular && (
                    <div className="mb-3">
                      <span className="rounded-full bg-[#DC2626] px-2 py-0.5 text-[10px] font-semibold text-white">
                        Most Popular
                      </span>
                    </div>
                  )}
                  <div className="text-lg font-bold text-gray-900">{tier.name}</div>
                  <div className="mt-2 text-3xl font-black text-gray-900">
                    ${tier.price.toLocaleString()}
                    <span className="text-sm font-normal text-gray-500">/{tier.interval}</span>
                  </div>
                  {tier.features.length > 0 && (
                    <ul className="mt-4 space-y-2">
                      {tier.features.map((f) => (
                        <li key={f} className="flex items-start gap-2 text-xs text-gray-500">
                          <Check className="mt-0.5 h-3 w-3 shrink-0 text-[#DC2626]" />
                          {f}
                        </li>
                      ))}
                    </ul>
                  )}
                  <Link
                    href={`/get-started?service=${slug}&tier=${tier.slug}`}
                    className={`mt-5 block rounded-lg py-2.5 text-center text-sm font-semibold transition ${tier.isPopular ? "bg-[#DC2626] text-white hover:bg-[#B91C1C]" : "border border-gray-200 text-gray-700 hover:bg-gray-50"}`}
                  >
                    Get Started
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Custom pricing fallback */}
      {service.tiers.length === 0 && (
        <section className="py-20 bg-gray-50">
          <div className="container mx-auto max-w-4xl px-4">
            <div className="rounded-2xl border border-gray-100 bg-white p-10 text-center shadow-sm">
              <h2 className="text-2xl font-bold text-gray-900 mb-3">Custom Pricing</h2>
              <p className="text-gray-500 mb-6 max-w-lg mx-auto">
                Pricing for {service.name} is tailored to your business size, goals, and scope. Book a call and we&rsquo;ll build your plan.
              </p>
              <Link
                href={`/get-started?service=${slug}`}
                className="inline-flex items-center gap-2 rounded-lg bg-[#DC2626] px-8 py-3.5 font-semibold text-white hover:bg-[#B91C1C] transition"
              >
                Get a Custom Quote <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="py-20 bg-gray-900">
        <div className="container mx-auto max-w-2xl px-4 text-center">
          <h2 className="text-3xl font-bold text-white">Ready to get started?</h2>
          <p className="mt-3 text-gray-400">Book a strategy call and we&rsquo;ll build your custom plan.</p>
          <Link
            href="/get-started"
            className="mt-8 inline-flex items-center gap-2 rounded-lg bg-[#DC2626] px-8 py-3.5 font-semibold text-white hover:bg-[#B91C1C] transition"
          >
            Book a Strategy Call <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
    </>
  )
}
