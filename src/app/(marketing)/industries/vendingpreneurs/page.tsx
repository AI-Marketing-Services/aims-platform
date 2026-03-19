import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight, CheckCircle2, TrendingUp, Phone, Mail, MapPin, BarChart2, Zap, DollarSign, Check } from "lucide-react"

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

// VP Operator Toolkit — tier pricing
interface VPTier {
  id: string
  name: string
  price: string
  priceNote: string
  description: string
  popular: boolean
  features: { name: string; desc: string }[]
  cta: string
}

const VP_TIERS: VPTier[] = [
  {
    id: "free",
    name: "Free",
    price: "$0",
    priceNote: "with any VP membership",
    description: "Core tools every operator gets on day one.",
    popular: false,
    cta: "Join VP Community",
    features: [
      { name: "Vending ROI Calculator", desc: "Real-time ROI estimates using live data from 500+ operators. Input any location, get revenue projections." },
      { name: "Community Knowledge Bot", desc: "AI trained on all VP content, webinars, and SOPs — ask it anything about running your vending business." },
    ],
  },
  {
    id: "solo",
    name: "Solo Operator",
    price: "$297",
    priceNote: "per month",
    description: "Everything in Free, plus ordering and location tools.",
    popular: false,
    cta: "Start Solo",
    features: [
      { name: "Everything in Free", desc: "" },
      { name: "Vendor Ordering Portal", desc: "Order Red Bull, Pepsi, and other vendors directly through your VP dashboard with volume pricing and order history." },
      { name: "Location Mockup Generator", desc: "Generate professional vending machine placement mockups for any space to close location deals faster." },
    ],
  },
  {
    id: "root",
    name: "Route Owner",
    price: "$597",
    priceNote: "per month",
    description: "Full operating infrastructure — the complete GHL snapshot.",
    popular: true,
    cta: "Get Route Owner",
    features: [
      { name: "Everything in Solo", desc: "" },
      { name: "VP GHL Business OS", desc: "Full GoHighLevel subaccount: website, CRM, pipelines, AI receptionist, and outbound dialer — ready day one." },
      { name: "AI Receptionist", desc: "24/7 inbound call handling — handles FAQs, routes location requests, and books callbacks automatically." },
      { name: "Reputation Autopilot", desc: "Automated review requests to location partners. Routes feedback and boosts your Google profile." },
      { name: "Location Scouting Score", desc: "Enter any address, get foot traffic, demographic, and competitor proximity score before you commit." },
      { name: "Operator Dashboard", desc: "Machine performance, revenue per location, lease tracking, and inventory alerts — all in one view." },
    ],
  },
  {
    id: "empire",
    name: "Vending Empire",
    price: "$997",
    priceNote: "per month",
    description: "Everything in Route Owner, plus full outbound growth engine.",
    popular: false,
    cta: "Go Empire",
    features: [
      { name: "Everything in Route Owner", desc: "" },
      { name: "Outbound Lead Dialer", desc: "AI outbound calls to location prospects — qualifies interest and books site visits without lifting a finger." },
      { name: "Cold Outbound Engine (VP Edition)", desc: "Pre-configured Clay sequences targeting gyms, offices, warehouses, and schools with VP-specific copy." },
    ],
  },
]

export default function VendingpreneursPage() {
  return (
    <div className="min-h-screen bg-background">

      {/* Hero */}
      <section className="pt-28 pb-20 bg-background">
        <div className="mx-auto max-w-5xl px-4">
          <div className="flex items-center gap-2 mb-6">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
              Built for the Vendingpreneur Community
            </span>
          </div>

          <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl md:text-6xl max-w-4xl leading-[1.1]">
            More locations.
            <br />
            <span className="text-primary">Zero extra hours.</span>
          </h1>

          <p className="mt-6 text-xl text-muted-foreground max-w-2xl leading-relaxed">
            AIMS builds the AI infrastructure that fills your location pipeline, answers every inquiry,
            and reactivates lost accounts — so you can focus on running your routes.
          </p>

          <div className="mt-10 flex flex-col gap-4 sm:flex-row">
            <Link
              href="/get-started?ref=vendingpreneurs"
              className="inline-flex items-center gap-2 rounded-sm bg-primary px-8 py-4 text-base font-semibold text-primary-foreground hover:bg-primary/90 transition shadow-md shadow-primary/20"
            >
              Get Your Free Strategy Call <ArrowRight className="h-5 w-5" />
            </Link>
            <Link
              href="/tools/website-audit?ref=vendingpreneurs"
              className="inline-flex items-center gap-2 rounded-sm border border-border bg-card px-8 py-4 text-base font-semibold text-foreground hover:bg-muted transition"
            >
              Free Site Audit
            </Link>
          </div>

          <p className="mt-4 text-sm text-muted-foreground">
            Free 30-min call · No retainer lock-in · First results in 14 days
          </p>
        </div>
      </section>

      {/* Results — stat cards with red outlines */}
      <section className="py-12 bg-background">
        <div className="mx-auto max-w-5xl px-4">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {RESULTS.map((r) => (
              <div
                key={r.value}
                className="rounded-2xl border-2 border-primary bg-card px-6 py-5 text-center shadow-sm"
              >
                <div className="text-3xl font-black text-primary font-mono">{r.value}</div>
                <div className="mt-1.5 text-xs text-muted-foreground leading-snug">{r.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pain → Fix */}
      <section className="py-24 bg-card">
        <div className="mx-auto max-w-5xl px-4">
          <div className="mb-14">
            <span className="inline-block rounded-full bg-deep px-3 py-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
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
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm bg-primary/10">
                    <item.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground line-through mb-1.5">{item.pain}</p>
                    <p className="text-sm font-medium text-foreground flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-primary mt-0.5" />
                      {item.fix}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AIMS Services for VP */}
      <section className="py-24 bg-background">
        <div className="mx-auto max-w-5xl px-4">
          <div className="mb-14">
            <span className="inline-block rounded-full bg-deep px-3 py-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
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
                className="group rounded-2xl border border-border bg-card p-7 hover:border-primary/40 hover:shadow-md transition-all"
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-semibold text-muted-foreground">{service.price}</span>
                  {service.badge && (
                    <span className="rounded-full bg-primary/10 border border-primary/30 px-2.5 py-0.5 text-[10px] font-semibold text-primary">
                      {service.badge}
                    </span>
                  )}
                </div>
                <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors mb-2">
                  {service.name}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{service.desc}</p>
                <div className="mt-5 flex items-center gap-2 text-sm font-semibold text-primary">
                  Learn more <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* VP Operator Toolkit — clean tier pricing */}
      <section className="py-24 bg-card">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mb-4">
            <span className="inline-block rounded-full bg-deep px-3 py-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
              VP Operator Toolkit
            </span>
            <h2 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
              One operating system. Four tiers.
            </h2>
            <p className="mt-3 max-w-2xl text-base text-muted-foreground leading-relaxed">
              Every tool below is delivered as a module inside your VP GHL Business OS snapshot —
              no separate logins, no duct tape. One system, everything in one place.
            </p>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {VP_TIERS.map((tier) => (
              <div
                key={tier.id}
                className={`relative flex flex-col rounded-2xl border bg-background p-6 ${
                  tier.popular
                    ? "border-primary shadow-md"
                    : "border-border"
                }`}
              >
                {tier.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="rounded-full bg-primary px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-primary-foreground">
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="mb-5">
                  <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">{tier.name}</h3>
                  <div className="mt-2 flex items-end gap-1">
                    <span className="text-3xl font-black text-foreground">{tier.price}</span>
                    <span className="text-xs text-muted-foreground mb-1.5">/{tier.priceNote}</span>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground leading-relaxed">{tier.description}</p>
                </div>

                <ul className="flex-1 space-y-3 mb-6">
                  {tier.features.map((f) => (
                    <li key={f.name} className="flex items-start gap-2">
                      <Check className={`h-3.5 w-3.5 shrink-0 mt-0.5 ${f.desc === "" ? "text-muted-foreground" : "text-primary"}`} />
                      <div>
                        <p className={`text-xs font-semibold ${f.desc === "" ? "text-muted-foreground" : "text-foreground"}`}>{f.name}</p>
                        {f.desc && <p className="text-[11px] text-muted-foreground leading-snug mt-0.5">{f.desc}</p>}
                      </div>
                    </li>
                  ))}
                </ul>

                <Link
                  href={`/get-started?ref=vp-${tier.id}`}
                  className={`w-full text-center rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${
                    tier.popular
                      ? "bg-primary text-primary-foreground hover:bg-primary/90"
                      : "border border-border bg-background text-foreground hover:bg-muted"
                  }`}
                >
                  {tier.cta}
                </Link>
              </div>
            ))}
          </div>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Not sure which tier fits your operation?{" "}
            <Link href="/get-started?ref=vp-consult" className="text-primary font-medium hover:underline">
              Book a free 30-min call
            </Link>{" "}
            and we&apos;ll recommend the right starting point.
          </p>
        </div>
      </section>

      {/* Recommended Solution Package */}
      <section className="py-16 px-4 bg-deep">
        <div className="max-w-3xl mx-auto">
          <div className="bg-card border border-border rounded-2xl p-8 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-primary mb-2">Recommended Package</p>
            <h2 className="text-2xl font-bold text-foreground mb-1">AI Growth Engine</h2>
            <p className="text-sm text-muted-foreground mb-4">The full-stack lead generation and conversion bundle designed for operators who want more locations without more hours. Website, outbound, voice agents, and SEO — all working together.</p>
            <div className="flex flex-wrap gap-2 mb-5">
              {["Website + CRM + Chatbot", "Cold Outbound Engine", "AI Voice Agents", "SEO/AEO"].map((s) => (
                <span key={s} className="inline-flex items-center gap-1 px-2.5 py-1 bg-deep text-foreground text-xs font-medium rounded-full">
                  <Check className="w-3 h-3 text-primary" />{s}
                </span>
              ))}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-foreground">from $497/mo</span>
              <Link href="/solutions" className="inline-flex items-center gap-1 text-sm text-primary font-medium hover:underline">
                View all solutions <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Social proof quote */}
      <section className="py-20 bg-background">
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
      <section className="py-24 bg-deep">
        <div className="mx-auto max-w-2xl px-4 text-center">
          <TrendingUp className="mx-auto h-10 w-10 text-primary/70 mb-6" />
          <h2 className="text-3xl font-bold text-foreground sm:text-4xl">
            Ready to add 10 locations this quarter?
          </h2>
          <p className="mt-4 text-muted-foreground text-lg">
            Book a free 30-minute call. We&apos;ll audit your current lead flow and build a custom plan for your operation.
          </p>
          <Link
            href="/get-started?ref=vendingpreneurs"
            className="mt-8 inline-flex items-center gap-2 rounded-sm bg-primary px-10 py-4 text-base font-semibold text-primary-foreground hover:bg-primary/90 transition shadow-lg"
          >
            Book Your Free Strategy Call <ArrowRight className="h-5 w-5" />
          </Link>
          <p className="mt-4 text-muted-foreground text-sm">
            No retainer required · Cancel anytime · Results in 14 days
          </p>
        </div>
      </section>
    </div>
  )
}
