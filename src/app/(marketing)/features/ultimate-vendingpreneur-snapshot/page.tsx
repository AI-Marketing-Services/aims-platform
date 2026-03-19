import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight, CheckCircle2, BarChart2, Phone, Mail, MapPin, TrendingUp, Zap } from "lucide-react"

export const metadata: Metadata = {
  title: "The Ultimate Vendingpreneur Snapshot — AIMS",
  description: "One dashboard that shows every location, every machine, every lead, and every dollar. Built exclusively for serious vending operators.",
}

const SNAPSHOT_FEATURES = [
  {
    icon: MapPin,
    title: "Location Pipeline",
    desc: "Every prospective location tracked through your pipeline — from cold outreach to signed agreement. Never lose a lead in a spreadsheet again.",
  },
  {
    icon: Phone,
    title: "Inbound Call Log",
    desc: "Every call your AI agent answered, with transcript, lead score, and follow-up task — automatically created in your CRM.",
  },
  {
    icon: Mail,
    title: "Outbound Campaign Stats",
    desc: "See exactly how many emails sent, opened, replied to, and converted into location meetings this week.",
  },
  {
    icon: TrendingUp,
    title: "Revenue by Location",
    desc: "Track monthly revenue per location, identify underperformers, and prioritize your restock route based on ROI.",
  },
  {
    icon: BarChart2,
    title: "Reactivation Queue",
    desc: "A ranked list of your coldest leads with the highest conversion probability — ready to launch a campaign in one click.",
  },
  {
    icon: Zap,
    title: "AI Action Items",
    desc: "Every morning, your snapshot surfaces 3 things to act on today: follow-ups due, new location matches, and sequences to review.",
  },
]

const METRICS = [
  { value: "1 dashboard", label: "for your entire operation" },
  { value: "Daily", label: "AI-generated action items" },
  { value: "Real-time", label: "campaign + call performance" },
  { value: "Zero", label: "manual data entry" },
]

export default function VPSnapshotPage() {
  return (
    <div className="min-h-screen bg-background">

      {/* Hero */}
      <section className="pt-28 pb-20">
        <div className="mx-auto max-w-5xl px-4">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary mb-6">
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            Exclusive to AIMS Clients
          </span>

          <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl md:text-6xl max-w-4xl leading-[1.1]">
            The Ultimate
            <br />
            <span className="text-primary">Vendingpreneur Snapshot</span>
          </h1>

          <p className="mt-6 text-xl text-muted-foreground max-w-2xl leading-relaxed">
            One command-center dashboard that shows your full location pipeline, AI campaign performance,
            inbound call results, and revenue by machine — updated every morning before you start your route.
          </p>

          <div className="mt-10 flex flex-col gap-4 sm:flex-row">
            <Link
              href="/get-started?feature=vp-snapshot"
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-8 py-4 text-base font-semibold text-white hover:bg-primary/90 transition shadow-md"
            >
              Get Access — Book a Call <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Metrics strip */}
      <section className="bg-foreground py-12">
        <div className="mx-auto max-w-5xl px-4">
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            {METRICS.map((m) => (
              <div key={m.value} className="text-center">
                <div className="text-2xl font-black text-background font-mono">{m.value}</div>
                <div className="mt-1 text-sm text-background/60">{m.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature grid */}
      <section className="py-24 bg-background">
        <div className="mx-auto max-w-5xl px-4">
          <div className="mb-14">
            <h2 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
              What&rsquo;s inside your Snapshot
            </h2>
            <p className="mt-3 text-muted-foreground max-w-xl">
              Six modules that give you total visibility over your operation, pipeline, and growth campaigns.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {SNAPSHOT_FEATURES.map((feature, i) => (
              <div
                key={feature.title}
                className="rounded-2xl border border-border bg-card p-7"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 mb-5">
                  <feature.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-base font-bold text-foreground mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How you get it */}
      <section className="py-20 bg-card">
        <div className="mx-auto max-w-4xl px-4">
          <h2 className="text-2xl font-bold text-foreground mb-10 text-center">
            How to get your Snapshot
          </h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            {[
              { step: "1", title: "Book a strategy call", desc: "30 minutes — we map your current operation, pipeline gaps, and growth goals." },
              { step: "2", title: "We build your system", desc: "AIMS configures your CRM, connects your campaigns, and sets up your AI agent in 14 days." },
              { step: "3", title: "Wake up to your Snapshot", desc: "Every morning your dashboard updates with location pipeline, campaign stats, and AI action items." },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="text-6xl font-black text-surface mb-4 font-mono">{item.step}</div>
                <h3 className="text-base font-bold text-foreground mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What&rsquo;s included */}
      <section className="py-20 bg-background">
        <div className="mx-auto max-w-4xl px-4">
          <h2 className="text-2xl font-bold text-foreground mb-8 text-center">
            Everything included with your Snapshot setup
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {[
              "CRM pre-configured for vending operators",
              "AI voice agent (inbound + outbound)",
              "Cold email system targeting your territory",
              "Website + chatbot trained on your business",
              "Location reactivation campaign setup",
              "Daily Snapshot delivered to your inbox",
              "Weekly campaign performance review",
              "Dedicated AIMS success manager",
            ].map((item) => (
              <div key={item} className="flex items-center gap-3 rounded-lg border border-border bg-card p-4">
                <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />
                <span className="text-sm font-medium text-foreground">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-primary">
        <div className="mx-auto max-w-2xl px-4 text-center">
          <h2 className="text-3xl font-bold text-white sm:text-4xl">
            Get your Snapshot set up this week
          </h2>
          <p className="mt-4 text-muted-foreground text-lg">
            Limited onboarding spots available. Book now and we start building within 24 hours.
          </p>
          <Link
            href="/get-started?feature=vp-snapshot"
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-card px-10 py-4 text-base font-semibold text-primary hover:bg-primary/10 transition shadow-lg"
          >
            Book Your Free Strategy Call <ArrowRight className="h-5 w-5" />
          </Link>
          <p className="mt-4 text-muted-foreground text-sm">
            No credit card · Cancel anytime · Results in 14 days
          </p>
        </div>
      </section>
    </div>
  )
}
