import type { Metadata } from "next"
import { CheckCircle, XCircle, Zap, Clock, TrendingUp, Shield, Users, BarChart } from "lucide-react"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Why AIMS — The Smarter Way to Grow",
  description: "See exactly why 500+ businesses chose AIMS over traditional agencies. AI-powered execution. Transparent pricing. Results in 14 days.",
  openGraph: {
    title: "Why AIMS | The Smarter Way to Grow",
    description: "See exactly why 500+ businesses chose AIMS over traditional agencies. AI-powered execution. Transparent pricing. Results in 14 days.",
  },
}

const oldWay = [
  "Long agency contracts with no guarantees",
  "Generalist teams that don't understand your industry",
  "Manual processes that don't scale",
  "Monthly reports with no real-time visibility",
  "Single-channel tactics (usually just ads)",
  "High retainers before you see a single lead",
  "Slow onboarding — 30-90 days to go live",
]

const aimsWay = [
  "Month-to-month with performance accountability",
  "AI-trained on your specific vertical and ICP",
  "Automated systems that run 24/7 without adding headcount",
  "Live dashboard updated in real-time",
  "Multi-channel: outbound, inbound, AI voice, content, SEO",
  "Results visible within 14 days of kickoff",
  "Live in under a week — often in 48 hours",
]

const stats = [
  { value: "3.2x", label: "Average pipeline increase", icon: TrendingUp },
  { value: "500+", label: "Active clients served", icon: Users },
  { value: "14 days", label: "Average time to first lead", icon: Clock },
  { value: "97%", label: "Client retention rate", icon: Shield },
]

const pillars = [
  {
    icon: Zap,
    title: "AI-Native from Day One",
    description: "Every service is built around AI execution — not AI as a buzzword, but AI as the actual delivery engine. Claude, GPT-4o, and custom-trained models handle the work at scale.",
    color: "bg-primary/10 text-primary",
  },
  {
    icon: BarChart,
    title: "Full-Stack Growth",
    description: "We don't just run ads or just do outbound. We cover every stage of your pipeline: awareness, outbound, nurture, close, retain — across every channel that matters.",
    color: "bg-primary/10 text-primary",
  },
  {
    icon: Clock,
    title: "Speed of a Startup",
    description: "AIMS moves in days, not months. We've eliminated every bottleneck that slows traditional agencies down. From kickoff to first lead in 14 days, guaranteed.",
    color: "bg-primary/10 text-primary",
  },
  {
    icon: Shield,
    title: "Transparent by Design",
    description: "Every client gets a live portal with real-time data on campaigns, pipeline, and ROI. No more waiting for monthly PDF reports that are already 30 days stale.",
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
        <h1 className="text-5xl font-bold text-foreground mb-6 leading-tight">
          The Agency Model is Broken.<br />We Fixed It.
        </h1>
        <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
          Traditional agencies are slow, generalist, and expensive. AIMS is AI-native, specialized, and built for speed. Here&apos;s exactly what makes us different.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
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
            <h2 className="text-3xl font-bold text-foreground mb-4">Old Agency vs. AIMS</h2>
            <p className="text-muted-foreground">Every line item matters when it comes to your pipeline.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {/* Old way */}
            <div className="bg-card border border-border rounded-2xl p-8">
              <h3 className="font-semibold text-muted-foreground mb-6 text-sm uppercase tracking-wider">The Old Agency Model</h3>
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
              <h3 className="font-semibold text-primary mb-6 text-sm uppercase tracking-wider">The AIMS Way</h3>
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
              Book a Strategy Call
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
