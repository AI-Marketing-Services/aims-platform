import type { Metadata } from "next"
import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowRight, Check } from "lucide-react"

// Static data — replace with DB queries once prisma is set up
const SERVICES: Record<string, {
  name: string
  pillar: string
  shortDesc: string
  longDesc: string
  basePrice?: number
  pricingModel: string
  features: string[]
  useCases: { industry: string; result: string }[]
  tiers?: { name: string; price: number; features: string[]; popular?: boolean }[]
}> = {
  "website-crm-chatbot": {
    name: "Website + CRM + Chatbot",
    pillar: "MARKETING",
    shortDesc: "GHL-powered website with built-in CRM and AI chatbot",
    longDesc: "The complete front-end and back-end infrastructure for your business. Built on GoHighLevel, we deploy a conversion-optimized website, configure your CRM pipeline, and train an AI chatbot on your business in under 2 weeks.",
    basePrice: 97,
    pricingModel: "MONTHLY",
    features: [
      "Custom GHL website template",
      "AI-powered chatbot trained on your business",
      "CRM pipeline with lead tracking",
      "Booking calendar integration",
      "Contact management & automations",
      "Email + SMS follow-up sequences",
      "Analytics dashboard",
    ],
    useCases: [
      { industry: "Car Dealerships", result: "42% more test drive bookings" },
      { industry: "Vending Operators", result: "3x increase in location inquiries" },
      { industry: "Professional Services", result: "2x more qualified consultations" },
    ],
    tiers: [
      { name: "Starter", price: 97, features: ["GHL website", "Booking calendar", "Basic analytics"] },
      { name: "Growth", price: 197, features: ["+ AI Chatbot", "+ CRM pipeline", "+ Contact management"] },
      { name: "Pro", price: 297, features: ["+ Email automations", "+ Lead nurture", "+ SMS follow-up"], popular: true },
      { name: "Elite", price: 397, features: ["+ Voice agent", "+ Full workflow automation", "+ Priority support"] },
    ],
  },
  "cold-outbound": {
    name: "Cold Outbound Engine",
    pillar: "SALES",
    shortDesc: "Multi-domain email infrastructure with AI SDR reply handling",
    longDesc: "We build a complete cold email system: domain warmup, personalized sequences written by our team, AI-powered reply handling, and weekly optimization. You get booked meetings — we handle everything else.",
    pricingModel: "CUSTOM",
    features: [
      "5-15 warmed email domains",
      "AI-personalized sequences",
      "Auto-enrichment via Clay + Apollo",
      "AI SDR handles replies & books meetings",
      "Weekly A/B testing",
      "Monthly performance reports",
    ],
    useCases: [
      { industry: "SaaS Companies", result: "14 demos booked in first 30 days" },
      { industry: "Staffing Agencies", result: "8x increase in pipeline value" },
      { industry: "Commercial Services", result: "47 qualified meetings in 90 days" },
    ],
  },
  "voice-agents": {
    name: "AI Voice Agent Platform",
    pillar: "SALES",
    shortDesc: "Inbound and outbound AI calling with multi-location routing",
    longDesc: "Deploy AI voice agents that handle inbound calls, qualify leads, book appointments, and even run outbound call campaigns — without human SDRs picking up the phone.",
    pricingModel: "CUSTOM",
    features: [
      "Inbound call handling 24/7",
      "Outbound campaign dialing",
      "Multi-location call routing",
      "Live call transcripts",
      "CRM integration",
      "Custom voice + script",
    ],
    useCases: [
      { industry: "Multi-location Retail", result: "Zero missed calls, 3x booking rate" },
      { industry: "Healthcare Clinics", result: "60% reduction in front-desk call volume" },
      { industry: "Auto Dealerships", result: "18% more service appointments" },
    ],
  },
}

type Params = { slug: string }

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params
  const service = SERVICES[slug]
  if (!service) return {}
  return {
    title: service.name,
    description: service.shortDesc,
  }
}

export default async function ServicePage({ params }: { params: Promise<Params> }) {
  const { slug } = await params
  const service = SERVICES[slug]

  if (!service) notFound()

  const pillarColors: Record<string, string> = {
    MARKETING: "bg-green-50 text-green-700 border-green-200",
    SALES: "bg-blue-50 text-blue-700 border-blue-200",
    OPERATIONS: "bg-orange-50 text-orange-700 border-orange-200",
    FINANCE: "bg-purple-50 text-purple-700 border-purple-200",
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="border-b border-border bg-card py-20">
        <div className="container mx-auto max-w-4xl px-4">
          <span className={`inline-block rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wider mb-4 ${pillarColors[service.pillar] ?? ""}`}>
            {service.pillar}
          </span>
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl">{service.name}</h1>
          <p className="mt-4 text-xl text-muted-foreground max-w-2xl">{service.longDesc}</p>
          <div className="mt-8 flex flex-col gap-4 sm:flex-row">
            <Link
              href={`/get-started?service=${slug}`}
              className="inline-flex items-center gap-2 rounded-lg bg-[#DC2626] px-8 py-3.5 font-semibold text-white hover:bg-[#B91C1C] transition"
            >
              Get Started <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/get-started"
              className="inline-flex items-center gap-2 rounded-lg border border-border px-8 py-3.5 font-semibold text-foreground hover:bg-secondary transition"
            >
              Book a Call
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20">
        <div className="container mx-auto max-w-4xl px-4">
          <h2 className="text-2xl font-bold mb-8">What&rsquo;s Included</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {service.features.map((feature) => (
              <div key={feature} className="flex items-center gap-3 rounded-lg border border-border bg-card p-4">
                <Check className="h-5 w-5 shrink-0 text-[#DC2626]" />
                <span className="text-sm font-medium text-foreground">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-20 bg-secondary/20">
        <div className="container mx-auto max-w-4xl px-4">
          <h2 className="text-2xl font-bold mb-8">Results By Industry</h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            {service.useCases.map((uc) => (
              <div key={uc.industry} className="rounded-xl border border-border bg-card p-6 text-center shadow-sm">
                <div className="text-sm font-semibold text-muted-foreground mb-2">{uc.industry}</div>
                <div className="text-lg font-bold text-[#DC2626]">{uc.result}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      {service.tiers && (
        <section className="py-20">
          <div className="container mx-auto max-w-4xl px-4">
            <h2 className="text-2xl font-bold mb-8">Pricing</h2>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {service.tiers.map((tier) => (
                <div
                  key={tier.name}
                  className={`rounded-xl border-2 bg-card p-6 ${tier.popular ? "border-[#DC2626] shadow-lg" : "border-border"}`}
                >
                  {tier.popular && (
                    <div className="mb-3">
                      <span className="rounded-full bg-[#DC2626] px-2 py-0.5 text-[10px] font-semibold text-white">
                        Most Popular
                      </span>
                    </div>
                  )}
                  <div className="text-lg font-bold">{tier.name}</div>
                  <div className="mt-2 text-3xl font-black">${tier.price}<span className="text-sm font-normal text-muted-foreground">/mo</span></div>
                  <ul className="mt-4 space-y-2">
                    {tier.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-xs text-muted-foreground">
                        <Check className="mt-0.5 h-3 w-3 shrink-0 text-[#DC2626]" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={`/get-started?service=${slug}&tier=${tier.name.toLowerCase()}`}
                    className={`mt-5 block rounded-lg py-2.5 text-center text-sm font-semibold transition ${tier.popular ? "bg-[#DC2626] text-white hover:bg-[#B91C1C]" : "border border-border text-foreground hover:bg-secondary"}`}
                  >
                    Get Started
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="py-20 bg-[#DC2626]">
        <div className="container mx-auto max-w-2xl px-4 text-center">
          <h2 className="text-3xl font-bold text-white">Ready to get started?</h2>
          <p className="mt-3 text-red-100">Book a strategy call and we&rsquo;ll build your custom plan.</p>
          <Link
            href="/get-started"
            className="mt-8 inline-flex items-center gap-2 rounded-lg bg-card px-8 py-3.5 font-semibold text-[#DC2626] hover:bg-red-50 transition"
          >
            Book a Strategy Call <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  )
}
