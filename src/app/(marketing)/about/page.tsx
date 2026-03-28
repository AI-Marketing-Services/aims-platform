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
  { icon: Zap, title: "AI-Native Execution", desc: "Every deliverable runs on custom AI workflows - not templates, not manual labor. Production systems deployed in your environment, running 24/7." },
  { icon: BarChart2, title: "Outcomes Over Outputs", desc: "We ship deployed AI systems, not strategy decks. Every engagement is tied to measurable efficiency gains tracked in real time." },
  { icon: Clock, title: "90-Day Deployment Cycle", desc: "From diagnostic to production AI in 90 days. No drawn-out discovery phases. We move at operator speed because our engineers sit inside your operations." },
  { icon: Shield, title: "Full Transparency", desc: "Every client gets a live portal with real-time data on progress, pipeline, and ROI. No waiting for monthly reports that are already stale." },
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
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-foreground">
            We Deploy the AI.<br />You Run the Business.
          </h1>
          <p className="mt-6 text-xl text-muted-foreground max-w-2xl mx-auto">
            AIMS (AI Managing Services) is a division of Modern Amenities Group. We embed senior AI engineers directly in B2B operations to build, deploy, and manage production AI systems that deliver measurable results in 90 days.
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
                The best companies scale on systems, not headcount. Our mission is to give every B2B business access to the same AI-powered operational infrastructure that Fortune 500 companies spend millions building in-house - deployed in weeks, not years.
              </p>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                We do not consult from the sidelines. Our engineers embed in your operations, build production AI, and stay to measure results and optimize.
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
                { value: "40%", label: "Average operational efficiency gain" },
                { value: "90d", label: "Diagnostic to deployed AI" },
                { value: "12+", label: "Industries with deep vertical expertise" },
                { value: "3", label: "Flagship engagement models" },
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
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 stagger-in">
            {PILLARS.map((p) => (
              <div key={p.title} className="bg-deep border border-border rounded-2xl p-6 animated-glow-card">
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
          <h2 className="text-3xl font-bold text-foreground">Ready to see what AI deploys in your operations?</h2>
          <p className="mt-3 text-muted-foreground">Book a 30-minute call. We will map your highest-ROI AI opportunities and show you exactly what we would build.</p>
          <Link
            href="/get-started"
            className="mt-8 inline-flex items-center gap-2 rounded-lg bg-primary px-8 py-3.5 font-semibold text-white hover:bg-primary/90 transition"
          >
            Book a Consultation <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  )
}
