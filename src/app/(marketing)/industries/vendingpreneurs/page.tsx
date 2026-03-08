import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight, CheckCircle2, TrendingUp, Phone, Mail, MapPin, BarChart2, Zap, DollarSign, Check, Star, Lock } from "lucide-react"

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

// VP Operator Toolkit add-ons
type VPTier = "free" | "solo" | "root" | "empire"

interface VPAddon {
  name: string
  desc: string
  tools: string
  price: string
  tier: VPTier
  href?: string
}

const VP_ADDONS: VPAddon[] = [
  {
    name: "Vending ROI Calculator",
    desc: "Real-time ROI estimates using live data from 500+ VP operators. Input any location, get revenue projections.",
    tools: "Vercel, live operator database",
    price: "Free with membership",
    tier: "free",
    href: "/tools/roi-calculator?ref=vp",
  },
  {
    name: "Live Operator Map",
    desc: "Interactive map of all VP operator locations — useful for territory planning and expansion decisions.",
    tools: "Mapbox, Vercel",
    price: "Free with membership",
    tier: "free",
  },
  {
    name: "Community Knowledge Bot",
    desc: "AI trained on all VP content, webinars, and SOPs — ask it anything about running your vending business.",
    tools: "Claude API, Skool, N8N",
    price: "Included (Solo+)",
    tier: "solo",
    href: "/services/ai-community-chatbot",
  },
  {
    name: "Vendor Ordering Portal",
    desc: "Order Red Bull, Pepsi, and other vendors directly through your VP dashboard with volume pricing and order history.",
    tools: "Airtable, Stripe, Resend",
    price: "Included (Solo+)",
    tier: "solo",
    href: "/services/vendor-ordering-portal",
  },
  {
    name: "Location Mockup Generator",
    desc: "Generate professional vending machine placement mockups for any space to close location deals faster.",
    tools: "V0, Canva API",
    price: "$47/mo add-on",
    tier: "solo",
  },
  {
    name: "AI Receptionist",
    desc: "24/7 inbound call handling for your vending business — handles FAQs, routes location requests, books callbacks.",
    tools: "Retell AI, GHL, Twilio",
    price: "$97/mo add-on",
    tier: "root",
    href: "/services/voice-agents",
  },
  {
    name: "Reputation Autopilot",
    desc: "Automated review requests to location partners and customers. Routes feedback and boosts Google profile.",
    tools: "GHL, Twilio, Google Business",
    price: "$97/mo add-on",
    tier: "root",
    href: "/services/ai-reputation-engine",
  },
  {
    name: "Location Scouting Score",
    desc: "Enter any address, get foot traffic, demographic, and competitor proximity score to evaluate before you commit.",
    tools: "Google Places API, Clay, N8N",
    price: "$97/mo add-on",
    tier: "root",
  },
  {
    name: "Operator Dashboard",
    desc: "Machine performance, revenue per location, lease tracking, inventory alerts — all in one view.",
    tools: "Airtable, BaseDash, N8N",
    price: "$147/mo add-on",
    tier: "root",
  },
  {
    name: "VP GHL Business OS",
    desc: "Full GoHighLevel subaccount: website, CRM, pipelines, AI receptionist, and outbound dialer — ready day one.",
    tools: "GoHighLevel, Retell AI, Twilio",
    price: "$297/mo add-on",
    tier: "root",
    href: "/services/ghl-community-os",
  },
  {
    name: "Outbound Lead Dialer",
    desc: "AI outbound calls to location prospects, qualifies interest, books site visits automatically.",
    tools: "Retell AI, GHL, Clay",
    price: "$197/mo add-on",
    tier: "empire",
    href: "/services/voice-agents",
  },
  {
    name: "Cold Outbound Engine (VP Edition)",
    desc: "Pre-configured Clay sequences targeting your ICP — gyms, offices, warehouses, schools — with VP-specific copy.",
    tools: "Clay, Instantly, GHL",
    price: "$297/mo add-on",
    tier: "empire",
    href: "/services/cold-outbound",
  },
]

const TIER_CONFIG: Record<VPTier, { label: string; color: string; bg: string; border: string }> = {
  free:   { label: "Free",         color: "text-gray-600",    bg: "bg-gray-50",    border: "border-gray-200" },
  solo:   { label: "Solo",         color: "text-blue-700",    bg: "bg-blue-50",    border: "border-blue-200" },
  root:   { label: "Root Owner",   color: "text-purple-700",  bg: "bg-purple-50",  border: "border-purple-200" },
  empire: { label: "Vending Empire", color: "text-[#DC2626]", bg: "bg-red-50",     border: "border-red-200" },
}

const TIER_TIERS: { tier: VPTier; title: string; subtitle: string }[] = [
  { tier: "free",   title: "Any VP Member",      subtitle: "Included with any membership tier" },
  { tier: "solo",   title: "Solo Operator",       subtitle: "Base subscription benefits" },
  { tier: "root",   title: "Root Owner",          subtitle: "Mid-tier unlock + all above" },
  { tier: "empire", title: "Vending Empire",      subtitle: "Full stack — nothing held back" },
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

      {/* AIMS Services for VP */}
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

      {/* VP Operator Toolkit */}
      <section className="py-24 bg-card">
        <div className="mx-auto max-w-5xl px-4">
          <div className="mb-4">
            <span className="inline-block rounded-full bg-red-50 border border-red-200 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-[#DC2626] mb-4">
              VP Operator Toolkit
            </span>
            <h2 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
              Operating infrastructure built for vending
            </h2>
            <p className="mt-3 max-w-2xl text-base text-muted-foreground leading-relaxed">
              Tools built specifically for VP community members. Add any tool to your subscription.
              Some included free, some paid add-ons — every tier deepens your competitive edge.
            </p>
          </div>

          {/* Tier legend */}
          <div className="flex flex-wrap gap-3 mb-10 mt-8">
            {TIER_TIERS.map(({ tier, title, subtitle }) => {
              const config = TIER_CONFIG[tier]
              return (
                <div key={tier} className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 ${config.border} ${config.bg}`}>
                  <span className={`text-xs font-bold uppercase tracking-wider ${config.color}`}>{title}</span>
                  <span className="text-xs text-muted-foreground hidden sm:inline">— {subtitle}</span>
                </div>
              )
            })}
          </div>

          {/* Add-ons grid */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {VP_ADDONS.map((addon) => {
              const config = TIER_CONFIG[addon.tier]
              const card = (
                <div className={`rounded-2xl border bg-background p-5 flex flex-col gap-3 h-full ${addon.href ? "hover:border-[#DC2626]/40 hover:shadow-md transition-all" : ""}`}>
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm font-bold text-foreground leading-snug">{addon.name}</h3>
                    <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${config.color} ${config.bg} ${config.border}`}>
                      {config.label}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed flex-1">{addon.desc}</p>
                  <div className="flex items-center justify-between pt-1 border-t border-border">
                    <span className="text-xs text-muted-foreground font-medium">{addon.tools}</span>
                    <span className={`text-xs font-bold ${addon.tier === "free" ? "text-green-600" : addon.price.includes("Included") ? "text-blue-600" : "text-foreground"}`}>
                      {addon.price}
                    </span>
                  </div>
                  {addon.href && (
                    <div className={`flex items-center gap-1 text-xs font-semibold ${config.color}`}>
                      Learn more <ArrowRight className="h-3 w-3" />
                    </div>
                  )}
                </div>
              )

              return addon.href ? (
                <Link key={addon.name} href={addon.href} className="block h-full">
                  {card}
                </Link>
              ) : (
                <div key={addon.name} className="h-full">
                  {card}
                </div>
              )
            })}
          </div>

          {/* Tier unlock table */}
          <div className="mt-14 rounded-2xl border border-border bg-background overflow-hidden">
            <div className="px-6 py-5 border-b border-border">
              <h3 className="text-base font-bold text-foreground">What unlocks at each tier</h3>
              <p className="text-sm text-muted-foreground mt-1">Every add-on deepens switching costs and creates a clear upgrade path.</p>
            </div>
            <div className="divide-y divide-border">
              {TIER_TIERS.map(({ tier, title }) => {
                const config = TIER_CONFIG[tier]
                const tierAddons = VP_ADDONS.filter((a) => a.tier === tier)
                return (
                  <div key={tier} className="px-6 py-4 flex items-start gap-4">
                    <span className={`shrink-0 mt-0.5 rounded-lg border px-3 py-1 text-xs font-bold uppercase tracking-wider w-28 text-center ${config.color} ${config.bg} ${config.border}`}>
                      {title}
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {tierAddons.map((a) => (
                        <span key={a.name} className="flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs text-foreground/70">
                          <Check className="h-3 w-3 text-green-500 shrink-0" />
                          {a.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="mt-8 text-center">
            <Link
              href="/get-started?ref=vp-toolkit"
              className="inline-flex items-center gap-2 rounded-xl bg-[#DC2626] px-8 py-4 text-base font-semibold text-white hover:bg-[#B91C1C] transition"
            >
              Get access to the VP Toolkit <ArrowRight className="h-5 w-5" />
            </Link>
            <p className="mt-3 text-sm text-muted-foreground">Book a 30-min call to see which tier fits your operation.</p>
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
