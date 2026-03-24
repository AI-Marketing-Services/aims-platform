import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight, Zap, BarChart2, Clock, Shield, CheckCircle } from "lucide-react"

export const metadata: Metadata = {
  title: "About AIMS - AI Managing Services",
  description: "AIMS is a division of Modern Amenities Group, building AI-powered business infrastructure for B2B companies.",
  alternates: { canonical: "https://aimseos.com/about" },
  openGraph: {
    title: "About AIMS | AI Managing Services",
    description: "AIMS is a division of Modern Amenities Group, building AI-powered business infrastructure for B2B companies.",
  },
}

const PILLARS = [
  { icon: Zap, title: "AI-Native Execution", desc: "Every deliverable is powered by custom AI workflows - not templates, not manual work. We build agents that run 24/7 so you don't have to." },
  { icon: BarChart2, title: "Results-First Model", desc: "We don't get paid to make decks. We get paid when your pipeline grows. Every engagement is tied to measurable outcomes." },
  { icon: Clock, title: "Speed of a Product Team", desc: "From kickoff to first lead in 14 days. We've eliminated every bottleneck that slows traditional agencies down." },
  { icon: Shield, title: "Full Transparency", desc: "Every client gets a live portal with real-time data on campaigns, pipeline, and ROI. No waiting for monthly reports." },
]

const VALUES = [
  "We build systems, not dependencies",
  "AI is the execution layer, not just the buzzword",
  "Results in days, not months",
  "Every client has a live dashboard",
  "We own outcomes, not just deliverables",
  "Simple, honest pricing - no hidden fees",
]

export default function AboutPage() {
  return (
    <div className="min-h-screen pt-20 bg-deep">
      {/* Hero */}
      <section className="py-20 border-b border-border bg-card">
        <div className="container mx-auto max-w-4xl px-4 text-center">
          <span className="inline-block rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary mb-4">
            About AIMS
          </span>
          <h1 className="text-5xl font-bold tracking-tight text-foreground">
            We Build The Systems.<br />You Close The Deals.
          </h1>
          <p className="mt-6 text-xl text-muted-foreground max-w-2xl mx-auto">
            AIMS (AI Managing Services) is a division of Modern Amenities Group. We build and operate
            AI-powered marketing and sales infrastructure for B2B businesses that want to grow without
            adding headcount.
          </p>
        </div>
      </section>

      {/* Mission + Stats */}
      <section className="py-20">
        <div className="container mx-auto max-w-5xl px-4">
          <div className="grid grid-cols-1 gap-12 md:grid-cols-2 items-center">
            <div>
              <h2 className="text-3xl font-bold text-foreground">Our Mission</h2>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                The best companies are built on systems, not hustle. Our mission is to give every B2B
                business access to the same AI-powered infrastructure that Fortune 500 companies spend
                millions building in-house - at a fraction of the cost.
              </p>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                We don&rsquo;t just consult. We build, deploy, and run the systems for you. Your job is to
                show up to the meetings we book.
              </p>
              <div className="mt-8 space-y-3">
                {VALUES.map((v) => (
                  <div key={v} className="flex items-center gap-2.5 text-sm text-foreground">
                    <CheckCircle className="w-4 h-4 text-primary flex-shrink-0" />
                    {v}
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-2xl bg-surface border border-primary/20 p-8 space-y-6">
              {[
                { value: "500+", label: "Businesses served" },
                { value: "3.2x", label: "Average pipeline increase" },
                { value: "14 days", label: "Average time to first lead" },
                { value: "3", label: "Flagship engagements" },
              ].map((stat) => (
                <div key={stat.label}>
                  <div className="text-4xl font-black text-primary">{stat.value}</div>
                  <div className="text-muted-foreground text-sm mt-0.5">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* How we operate */}
      <section className="py-20 bg-card border-y border-border">
        <div className="container mx-auto max-w-5xl px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground">How AIMS Operates</h2>
            <p className="mt-3 text-muted-foreground">Four principles that drive every engagement</p>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {PILLARS.map((p) => (
              <div key={p.title} className="bg-deep border border-border rounded-2xl p-6">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                  <p.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">{p.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-card border-t border-border">
        <div className="container mx-auto max-w-2xl px-4 text-center">
          <h2 className="text-3xl font-bold text-foreground">Ready to put your pipeline on autopilot?</h2>
          <p className="mt-3 text-muted-foreground">Book a strategy call. We&apos;ll audit your current stack and show you exactly what AIMS would build.</p>
          <Link
            href="/get-started"
            className="mt-8 inline-flex items-center gap-2 rounded-lg bg-card px-8 py-3.5 font-semibold text-primary hover:bg-primary/10 transition"
          >
            Book a Consultation <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  )
}
