import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight, CheckCircle2, TrendingUp, Phone, Mail, MapPin, BarChart2, Zap, DollarSign } from "lucide-react"

export const metadata: Metadata = {
  title: "AI Systems for Vendingpreneurs — AIMS",
  description: "AIMS builds and runs the AI infrastructure that helps vending operators get more locations, answer every call, and reactivate lost accounts. Built for the Vendingpreneur community.",
}

const PAIN_POINTS = [
  { icon: Phone, pain: "Missing calls when you're on the road restocking", fix: "AI voice agent answers 24/7, books location meetings while you drive" },
  { icon: MapPin, pain: "Spending hours manually prospecting new locations", fix: "Cold outbound engine sends 2,000+ personalized pitches/month on autopilot" },
  { icon: Mail, pain: "Old location prospects sitting cold in a spreadsheet", fix: "Reactivation sequences turn 18% of dead leads into booked walkthroughs" },
  { icon: BarChart2, pain: "No system to track location pipeline or follow-ups", fix: "CRM pre-built for vending operators — locations, contacts, deal stages" },
  { icon: DollarSign, pain: "Website doesn't capture location inquiries after hours", fix: "AI chatbot trained on your routes, machines, and revenue splits" },
  { icon: Zap, pain: "Wearing every hat — operator, salesperson, and marketer", fix: "Full-stack automation so you focus on operations, not outreach" },
]

const RESULTS = [
  { value: "3x", label: "more location inquiry calls per month" },
  { value: "14 days", label: "to first new location outreach" },
  { value: "42%", label: "increase in location walkthrough bookings" },
  { value: "$284", label: "avg. cost per new location secured" },
]

const SERVICES = [
  {
    name: "Website + CRM + Chatbot",
    slug: "website-crm-chatbot",
    desc: "A location-optimized website with AI chatbot trained on your vending business. Captures every inquiry, books meetings, answers questions about your machines and revenue splits.",
    price: "from $97/mo",
    badge: "Most Popular",
  },
  {
    name: "Cold Outbound for New Locations",
    slug: "cold-outbound",
    desc: "We build and run a cold email system targeting property managers, office managers, and facility directors in your territory. Personalized at scale.",
    price: "Custom",
    badge: null,
  },
  {
    name: "AI Voice Agent — Never Miss a Call",
    slug: "voice-agents",
    desc: "An AI agent that answers calls, qualifies location leads, schedules walkthroughs, and routes service calls — even when you're restocking at 7am.",
    price: "Custom",
    badge: "High Impact",
  },
  {
    name: "Lead Reactivation",
    slug: "lead-reactivation",
    desc: "Have old location leads in your phone or spreadsheet? We run multi-channel reactivation campaigns that convert 18% of cold contacts into new conversations.",
    price: "Custom",
    badge: null,
  },
]

export default function VendingpreneursPage() {
  return (
    <div className="min-h-screen bg-background">

      {/* Hero */}
      <section className="pt-28 pb-20 bg-background">
        <div className="mx-auto max-w-5xl px-4">
          <div className="flex items-center gap-2 mb-6">
            <span className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-4 py-1.5 text-sm font-medium text-[#DC2626]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#DC2626] animate-pulse" />
              Built for the Vendingpreneur Community
            </span>
          </div>

          <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl md:text-6xl max-w-4xl leading-[1.1]">
            More locations.
            <br />
            <span className="text-[#DC2626]">Zero extra hours.</span>
          </h1>

          <p className="mt-6 text-xl text-muted-foreground max-w-2xl leading-relaxed">
            AIMS builds the AI infrastructure that fills your location pipeline, answers every inquiry,
            and reactivates lost accounts — so you can focus on running your routes.
          </p>

          <div className="mt-10 flex flex-col gap-4 sm:flex-row">
            <Link
              href="/get-started?ref=vendingpreneurs"
              className="inline-flex items-center gap-2 rounded-xl bg-[#DC2626] px-8 py-4 text-base font-semibold text-white hover:bg-[#B91C1C] transition shadow-md shadow-red-100"
            >
              Get Your Free Strategy Call <ArrowRight className="h-5 w-5" />
            </Link>
            <Link
              href="/tools/website-audit?ref=vendingpreneurs"
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-8 py-4 text-base font-semibold text-foreground hover:bg-muted transition"
            >
              Free Site Audit
            </Link>
          </div>

          <p className="mt-4 text-sm text-muted-foreground">
            Free 30-min call · No retainer lock-in · First results in 14 days
          </p>
        </div>
      </section>

      {/* Results bar */}
      <section className="bg-[#DC2626] py-12">
        <div className="mx-auto max-w-5xl px-4">
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            {RESULTS.map((r) => (
              <div key={r.value} className="text-center">
                <div className="text-3xl font-black text-white font-mono">{r.value}</div>
                <div className="mt-1 text-sm text-red-200">{r.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pain → Fix */}
      <section className="py-24 bg-card">
        <div className="mx-auto max-w-5xl px-4">
          <div className="mb-14">
            <span className="inline-block rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
              Built for Operators Like You
            </span>
            <h2 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
              Every operator problem, solved by AI
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {PAIN_POINTS.map((item) => (
              <div key={item.pain} className="rounded-2xl border border-border bg-background p-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50">
                    <item.icon className="h-5 w-5 text-[#DC2626]" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground line-through mb-1.5">{item.pain}</p>
                    <p className="text-sm font-medium text-foreground flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-[#DC2626] mt-0.5" />
                      {item.fix}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="py-24 bg-background">
        <div className="mx-auto max-w-5xl px-4">
          <div className="mb-14">
            <span className="inline-block rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
              AIMS for Vending Operators
            </span>
            <h2 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
              The exact systems your operation needs
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            {SERVICES.map((service) => (
              <Link
                key={service.slug}
                href={`/services/${service.slug}?ref=vendingpreneurs`}
                className="group rounded-2xl border border-border bg-card p-7 hover:border-[#DC2626]/40 hover:shadow-md transition-all"
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-semibold text-muted-foreground">{service.price}</span>
                  {service.badge && (
                    <span className="rounded-full bg-red-50 border border-red-200 px-2.5 py-0.5 text-[10px] font-semibold text-[#DC2626]">
                      {service.badge}
                    </span>
                  )}
                </div>
                <h3 className="text-lg font-bold text-foreground group-hover:text-[#DC2626] transition-colors mb-2">
                  {service.name}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{service.desc}</p>
                <div className="mt-5 flex items-center gap-2 text-sm font-semibold text-[#DC2626]">
                  Learn more <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Social proof quote */}
      <section className="py-20 bg-card">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <div className="text-4xl text-muted-foreground mb-6">&ldquo;</div>
          <blockquote className="text-xl font-medium text-foreground leading-relaxed">
            In 30 days AIMS had us getting 3x more location inquiry calls and we secured 4 new accounts
            we would have never gotten through cold email alone.
          </blockquote>
          <div className="mt-6 text-sm text-muted-foreground">
            Vending operator · 47 locations · Southeast US
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-[#DC2626]">
        <div className="mx-auto max-w-2xl px-4 text-center">
          <TrendingUp className="mx-auto h-10 w-10 text-red-200 mb-6" />
          <h2 className="text-3xl font-bold text-white sm:text-4xl">
            Ready to add 10 locations this quarter?
          </h2>
          <p className="mt-4 text-red-100 text-lg">
            Book a free 30-minute call. We&apos;ll audit your current lead flow and build a custom plan for your operation.
          </p>
          <Link
            href="/get-started?ref=vendingpreneurs"
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-10 py-4 text-base font-semibold text-[#DC2626] hover:bg-red-50 transition shadow-lg"
          >
            Book Your Free Strategy Call <ArrowRight className="h-5 w-5" />
          </Link>
          <p className="mt-4 text-red-200 text-sm">
            No retainer required · Cancel anytime · Results in 14 days
          </p>
        </div>
      </section>
    </div>
  )
}
