import type { Metadata } from "next"
import { CheckCircle, XCircle, Zap, Clock, TrendingUp, Shield, Users, BarChart } from "lucide-react"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Why AIMS - The Smarter Way to Grow",
  description: "See exactly why 500+ businesses chose AIMS over traditional agencies. AI-powered execution. Transparent pricing. Results in 14 days.",
  alternates: { canonical: "https://aimseos.com/why-aims" },
  openGraph: {
    title: "Why AIMS | The Smarter Way to Grow",
    description: "See exactly why 500+ businesses chose AIMS over traditional agencies. AI-powered execution. Transparent pricing. Results in 14 days.",
  },
}

const oldWay = [
  "6-month discovery phases before any work starts",
  "Generalist teams with no vertical expertise",
  "Manual processes that break at scale",
  "Monthly PDF reports already 30 days stale",
  "Recommendations only - no implementation",
  "Knowledge walks out when the project ends",
  "Success measured in hours billed, not outcomes delivered",
]

const aimsWay = [
  "Engineers embedded in your operations from week one",
  "Deep vertical expertise across 12+ industries",
  "Production AI deployed in your workflows within 90 days",
  "Live portal with real-time progress and ROI tracking",
  "Full implementation - diagnostic, build, deploy, optimize",
  "Complete knowledge transfer - your team owns everything",
  "Success measured in efficiency gains and deployed systems",
]

const stats = [
  { value: "40%", label: "Average operational efficiency gain", icon: TrendingUp },
  { value: "90d", label: "Diagnostic to deployed AI", icon: Clock },
  { value: "12+", label: "Industries with deep vertical expertise", icon: Users },
  { value: "0", label: "Handoffs between teams", icon: Shield },
]

const pillars = [
  {
    icon: Zap,
    title: "Production AI, Not Prototypes",
    description: "Every engagement ships working AI systems into your operations. Custom-built solutions deployed in your environment, running 24/7, measured in real time.",
    color: "bg-primary/10 text-primary",
  },
  {
    icon: BarChart,
    title: "Cross-Department Deployment",
    description: "We audit every department - sales, ops, finance, marketing - to find the biggest time sinks and highest-ROI automation targets. No function left unexamined.",
    color: "bg-primary/10 text-primary",
  },
  {
    icon: Clock,
    title: "90-Day Deployment Cycle",
    description: "From operational diagnostic to production AI in 90 days. No drawn-out discovery phases. Our engineers embed with your team and start building in week one.",
    color: "bg-primary/10 text-primary",
  },
  {
    icon: Shield,
    title: "Transparent by Design",
    description: "Every client gets a live portal with real-time data on progress, efficiency gains, and ROI. No monthly PDF reports. No guessing.",
    color: "bg-primary/10 text-primary",
  },
]

export default function WhyAIMSPage() {
  return (
    <main className="bg-deep">
      {/* Hero */}
      <section className="py-20 px-4 text-center max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary text-sm font-medium rounded-full mb-6">
          Why AIMS
        </div>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-6 leading-tight">
          Traditional Consulting Ships Decks.<br />We Ship Production AI.
        </h1>
        <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
          AIMS replaces the traditional consulting model with forward-deployed engineers embedded in your operations. Here is exactly what makes us different.
        </p>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
          {stats.map((stat) => (
            <div key={stat.label} className="bg-card border border-border rounded-2xl p-6">
              <stat.icon className="w-5 h-5 text-primary mb-3 mx-auto" />
              <div className="text-3xl font-bold text-foreground">{stat.value}</div>
              <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Comparison */}
      <section className="py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">Traditional Consulting vs. AIMS</h2>
            <p className="text-muted-foreground">Every line item matters when it comes to your operations.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {/* Old way */}
            <div className="bg-card border border-border rounded-2xl p-8">
              <h3 className="font-semibold text-muted-foreground mb-6 text-sm uppercase tracking-wider">Traditional Consulting</h3>
              <div className="space-y-4">
                {oldWay.map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <XCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-muted-foreground">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            {/* AIMS way */}
            <div className="bg-card border-2 border-primary rounded-2xl p-8">
              <h3 className="font-semibold text-primary mb-6 text-sm uppercase tracking-wider">AIMS Forward-Deployed Model</h3>
              <div className="space-y-4">
                {aimsWay.map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-foreground font-medium">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Four pillars */}
      <section className="py-16 px-4 bg-card border-y border-border">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">The AIMS Difference</h2>
            <p className="text-muted-foreground">Four principles that make every engagement different.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {pillars.map((p) => (
              <div key={p.title} className="bg-deep border border-border rounded-2xl p-8">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-5 ${p.color}`}>
                  <p.icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-3">{p.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{p.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-foreground mb-4">Ready to see AIMS in action?</h2>
          <p className="text-muted-foreground mb-8">Book a 30-minute strategy call. We&apos;ll audit your pipeline and show you exactly what AIMS would build for your business.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/get-started"
              className="px-8 py-4 bg-primary text-white font-semibold rounded-xl hover:bg-primary/90 transition-colors"
            >
              Book a Consultation
            </Link>
            <Link
              href="/tools/ai-readiness-quiz"
              className="px-8 py-4 border border-border text-foreground font-semibold rounded-xl hover:border-line-hover transition-colors"
            >
              Take the AI Readiness Quiz
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
