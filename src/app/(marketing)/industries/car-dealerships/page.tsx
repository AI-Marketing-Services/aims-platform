import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight, CheckCircle2, TrendingUp, Phone, Mail, Users, BarChart2, Zap, DollarSign } from "lucide-react"

export const metadata: Metadata = {
  title: "AI Systems for Car Dealerships - AIMS",
  description: "AIMS builds the AI infrastructure that helps dealerships generate more floor traffic, convert more leads, and fill the service lane - automatically.",
}

const PAIN_POINTS = [
  { icon: Phone, pain: "Leads from third-party sites go cold before your team follows up", fix: "AI follow-up triggers within 90 seconds - email, SMS, and voice - around the clock" },
  { icon: Users, pain: "BDC team overwhelmed with inbound, outbound, and service reminders", fix: "AI voice agents and SMS bots handle tier-1 follow-up so your BDC focuses on closers" },
  { icon: Mail, pain: "Old leads rotting in your CRM - service customers haven't been contacted in months", fix: "Reactivation sequences that bring back 15-20% of cold contacts automatically" },
  { icon: BarChart2, pain: "No visibility into which marketing channels actually drive showroom visits", fix: "Attribution dashboard connects ad spend, leads, and closed deals in one view" },
  { icon: DollarSign, pain: "Website visitors leaving without converting - chat widget goes unanswered", fix: "AI chatbot trained on your inventory, pricing, and trade-in process - 24/7" },
  { icon: Zap, pain: "Service lane under-capacity because customers never get proactive reminders", fix: "Automated service outreach campaigns that fill the lane 30 days in advance" },
]

const RESULTS = [
  { value: "4.2x", label: "increase in lead response rate" },
  { value: "18 min", label: "average time to first AI contact" },
  { value: "31%", label: "improvement in show-rate to appointments" },
  { value: "22%", label: "increase in service lane bookings" },
]

const SERVICES = [
  {
    name: "BDC AI Automation Suite",
    slug: "ai-automation",
    desc: "AI-powered follow-up system that contacts every new lead within 90 seconds via email, SMS, and voice - so no opportunity leaves your lot without a touchpoint.",
    price: "Custom",
    badge: "Most Popular",
  },
  {
    name: "Website + AI Chat + CRM",
    slug: "website-crm-chatbot",
    desc: "Dealership website with inventory-aware AI chatbot that qualifies buyers, books test drives, and syncs leads directly into your CRM pipeline.",
    price: "from $297/mo",
    badge: null,
  },
  {
    name: "Cold Outbound - Conquest Leads",
    slug: "cold-outbound",
    desc: "Multi-channel outbound targeting in-market buyers in your DMA - conquest campaigns that bring new buyers into your funnel before they hit a competitor.",
    price: "Custom",
    badge: null,
  },
  {
    name: "Lead Reactivation",
    slug: "lead-reactivation",
    desc: "Thousands of cold leads in your CRM? We build and run campaigns that convert 15-20% of dead leads back into active conversations.",
    price: "Custom",
    badge: "High ROI",
  },
]

export default function CarDealershipsPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="bg-gradient-to-b from-background to-deep py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary text-sm font-medium rounded-full mb-6">
            <Zap className="w-3.5 h-3.5" />
            Built for Automotive Dealerships
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold mb-6 leading-tight text-foreground">
            AI Systems That Fill Your<br />
            <span className="text-primary">Showroom and Service Lane</span>
          </h1>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            AIMS builds and operates the AI infrastructure that turns your dealership&apos;s digital presence into a 24/7 lead machine - from conquest to close to service.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/get-started"
              className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-primary/90 transition-colors"
            >
              Get a Free Strategy Call
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/tools/website-audit"
              className="inline-flex items-center gap-2 px-8 py-4 bg-card text-foreground font-semibold rounded-xl hover:bg-card/80 transition-colors border border-border"
            >
              Free Website Audit
            </Link>
          </div>
        </div>
      </section>

      {/* Results */}
      <section className="py-12 px-4 bg-card border-b border-border">
        <div className="max-w-4xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-6">
          {RESULTS.map((r) => (
            <div key={r.label} className="text-center">
              <div className="text-3xl font-black text-primary mb-1">{r.value}</div>
              <div className="text-sm text-muted-foreground">{r.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Pain / Fix */}
      <section className="py-16 px-4 bg-deep">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">Common Dealership Pain Points - Solved</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">Every problem your team is dealing with has an AI-driven fix. Here&apos;s how we solve them.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {PAIN_POINTS.map(({ icon: Icon, pain, fix }) => (
              <div key={pain} className="bg-card border border-border rounded-xl p-5">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Icon className="w-4 h-4 text-primary" />
                  </div>
                  <p className="text-sm font-medium text-foreground">{pain}</p>
                </div>
                <div className="flex items-start gap-2 pl-11">
                  <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-primary">{fix}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="py-16 px-4 bg-card">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">AIMS Services for Dealerships</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {SERVICES.map((svc) => (
              <div key={svc.name} className="border border-border rounded-xl p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold text-foreground">{svc.name}</h3>
                  {svc.badge && (
                    <span className="text-xs font-medium px-2 py-0.5 bg-primary/10 text-primary rounded-full">{svc.badge}</span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mb-4">{svc.desc}</p>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-foreground">{svc.price}</span>
                  <Link
                    href={`/services/${svc.slug}`}
                    className="text-sm text-primary font-medium hover:underline flex items-center gap-1"
                  >
                    Learn more <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Recommended Solution Package */}
      <section className="py-16 px-4 bg-deep">
        <div className="max-w-3xl mx-auto">
          <div className="bg-card border border-border rounded-2xl p-8 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-primary mb-2">Recommended Package</p>
            <h2 className="text-2xl font-bold text-foreground mb-1">Revenue Operations Suite</h2>
            <p className="text-sm text-muted-foreground mb-4">Turn your dealership sales process into a repeatable, data-driven machine with AI-powered pipeline management, team enablement, and finance automation.</p>
            <div className="flex flex-wrap gap-2 mb-5">
              {["RevOps Pipeline", "Sales Team Enablement", "AI Tool Tracker", "P&L Finance Automation"].map((s) => (
                <span key={s} className="inline-flex items-center gap-1 px-2.5 py-1 bg-deep text-foreground text-xs font-medium rounded-full">
                  <CheckCircle2 className="w-3 h-3 text-primary" />{s}
                </span>
              ))}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-foreground">from $397/mo</span>
              <Link href="/solutions" className="inline-flex items-center gap-1 text-sm text-primary font-medium hover:underline">
                View all solutions <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 bg-deep">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4 text-foreground">Ready to automate your dealership&apos;s growth?</h2>
          <p className="text-muted-foreground mb-8">
            Book a free 30-minute strategy call. We&apos;ll audit your current lead flow and show you exactly where AI can add the most revenue.
          </p>
          <Link
            href="/get-started"
            className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-primary/90 transition-colors"
          >
            Book Free Strategy Call
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </div>
  )
}
