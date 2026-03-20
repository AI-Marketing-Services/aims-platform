import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight, CheckCircle2, Phone, Star, Users, BarChart2, Zap, Calendar } from "lucide-react"

export const metadata: Metadata = {
  title: "AI Systems for Hotels & Hospitality - AIMS",
  description: "AIMS builds the AI infrastructure that helps hotels and hospitality businesses drive direct bookings, reduce OTA dependence, and deliver 5-star guest experiences at scale.",
}

const PAIN_POINTS = [
  { icon: Calendar, pain: "Over-reliance on OTAs eating into margins with 15-25% commissions", fix: "Direct booking engine with AI-powered retargeting to convert OTA lookers into direct guests" },
  { icon: Phone, pain: "Front desk overwhelmed with calls, reservation changes, and FAQ inquiries", fix: "AI voice and chat agents handle routine calls, freeing your team for high-value guests" },
  { icon: Star, pain: "Inconsistent review responses - negative reviews going unaddressed for days", fix: "Automated review monitoring and AI-drafted responses published within the hour" },
  { icon: Users, pain: "Past guests not returning - no system to drive repeat bookings", fix: "Loyalty nurture sequences that reach past guests with personalized offers at the right time" },
  { icon: BarChart2, pain: "Corporate and group sales pipeline tracked in spreadsheets or email threads", fix: "CRM built for group sales with automated follow-up, proposal tracking, and revenue forecasting" },
  { icon: Zap, pain: "Seasonal dips with no proactive strategy to fill rooms in shoulder season", fix: "Targeted outbound campaigns reaching event planners, corporate travel managers, and tour operators" },
]

const RESULTS = [
  { value: "22%", label: "increase in direct bookings" },
  { value: "1 hr", label: "avg. review response time" },
  { value: "3.1x", label: "group lead volume increase" },
  { value: "18%", label: "reduction in OTA commission spend" },
]

const SERVICES = [
  {
    name: "Direct Booking Growth System",
    slug: "pixel-intelligence",
    desc: "AI-powered retargeting, email sequences, and a conversion-optimized booking flow that turns OTA browsers into direct bookers on your own site.",
    price: "Custom",
    badge: "Highest ROI",
  },
  {
    name: "AI Front Desk & Chat Agent",
    slug: "website-crm-chatbot",
    desc: "An AI agent trained on your property, amenities, policies, and FAQs that handles guest inquiries, upsells packages, and books reservations around the clock.",
    price: "from $197/mo",
    badge: "Most Popular",
  },
  {
    name: "Group & Corporate Sales CRM",
    slug: "cold-outbound",
    desc: "Purpose-built outbound engine targeting event planners, corporate travel managers, and meeting organizers - with automated follow-up that never drops the ball.",
    price: "Custom",
    badge: null,
  },
  {
    name: "Review & Reputation Management",
    slug: "local-seo",
    desc: "Automated review generation, monitoring across 12+ platforms, and AI-drafted responses that protect your brand and boost your star rating.",
    price: "Custom",
    badge: null,
  },
]

export default function HotelsHospitalityPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="bg-gradient-to-b from-background to-deep py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary text-sm font-medium rounded-full mb-6">
            <Zap className="w-3.5 h-3.5" />
            Built for Hotels & Hospitality
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold mb-6 leading-tight text-foreground">
            Fill Your Rooms.<br />
            <span className="text-primary">Own Your Guest Relationships.</span>
          </h1>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            AIMS builds the AI systems that drive direct bookings, reduce OTA dependence, and let your team focus on delivering exceptional guest experiences - not answering the same questions 40 times a day.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/get-started"
              className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-primary/90 transition-colors"
            >
              Book a Consultation
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/tools/roi-calculator"
              className="inline-flex items-center gap-2 px-8 py-4 bg-card text-foreground font-semibold rounded-xl hover:bg-card/80 transition-colors border border-border"
            >
              Calculate Your ROI
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
            <h2 className="text-3xl font-bold text-foreground mb-4">Every Hospitality Challenge - Solved with AI</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">Your guests expect a 5-star experience. Your backend systems should be working just as hard.</p>
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
            <h2 className="text-3xl font-bold text-foreground mb-4">AIMS Services for Hotels & Hospitality</h2>
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
            <h2 className="text-2xl font-bold text-foreground mb-1">Customer Reactivation Stack</h2>
            <p className="text-sm text-muted-foreground mb-4">Re-engage past guests, recover lapsed bookings, and drive repeat stays with AI-powered reactivation, voice agents, and reputation management.</p>
            <div className="flex flex-wrap gap-2 mb-5">
              {["Lead Reactivation", "Database Reactivation", "AI Voice Agents", "AI Reputation Engine"].map((s) => (
                <span key={s} className="inline-flex items-center gap-1 px-2.5 py-1 bg-deep text-foreground text-xs font-medium rounded-full">
                  <CheckCircle2 className="w-3 h-3 text-primary" />{s}
                </span>
              ))}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-foreground">from $347/mo</span>
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
          <h2 className="text-3xl font-bold mb-4 text-foreground">Let&apos;s grow your direct bookings.</h2>
          <p className="text-muted-foreground mb-8">
            Book a free 30-minute strategy call. We&apos;ll review your current booking mix, identify where you&apos;re losing revenue to OTAs, and show you exactly what AI can do.
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
