import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight, CheckCircle2, Users, BarChart2, Zap, Building2, Shield, TrendingUp } from "lucide-react"

export const metadata: Metadata = {
  title: "AI Systems for Enterprise — AIMS",
  description: "AIMS builds enterprise-grade AI infrastructure for revenue teams — custom agents, data pipelines, multi-channel outbound, and operational automation at scale.",
}

const PAIN_POINTS = [
  { icon: Building2, pain: "Sales team spending 60%+ of time on non-selling activities", fix: "AI handles research, CRM updates, scheduling, and follow-up — so reps sell more in fewer hours" },
  { icon: Users, pain: "Marketing and sales working from different data with no unified attribution", fix: "Revenue intelligence platform connecting marketing spend, pipeline, and closed revenue in one system" },
  { icon: BarChart2, pain: "Hiring more SDRs to scale outbound isn't working — rising CAC, inconsistent quality", fix: "AI-driven outbound at 10x the volume of a human SDR team — personalized, compliant, and trackable" },
  { icon: Shield, pain: "Data security and compliance concerns blocking AI adoption internally", fix: "Enterprise AI stack built on your own infrastructure with SOC 2-aligned configurations" },
  { icon: TrendingUp, pain: "RevOps drowning in manual reporting across 5+ tools", fix: "Automated reporting pipelines that surface the metrics leadership actually needs — daily, weekly, monthly" },
  { icon: Zap, pain: "AI strategy stuck in pilot mode — can't get from POC to production", fix: "AIMS deploys production-ready AI systems in 30 days, not 9 months" },
]

const RESULTS = [
  { value: "10x", label: "outbound capacity vs. human SDR" },
  { value: "30 days", label: "to full production deployment" },
  { value: "47%", label: "reduction in time spent on admin" },
  { value: "3.2x", label: "pipeline generated per dollar spent" },
]

const SERVICES = [
  {
    name: "Enterprise AI Outbound Engine",
    slug: "cold-outbound",
    desc: "Multi-channel outbound at enterprise scale — personalized sequences for thousands of accounts simultaneously, with account-level intent signals and A/B testing.",
    price: "Custom",
    badge: "Most Requested",
  },
  {
    name: "Revenue Intelligence Platform",
    slug: "ai-automation",
    desc: "Custom RevOps dashboard connecting your CRM, marketing, CS, and finance data. AI surfaces insights and flags risks before they become problems.",
    price: "Custom",
    badge: null,
  },
  {
    name: "AI Agent Development",
    slug: "ai-automation",
    desc: "Custom AI agents built for your specific workflows — from sales research and proposal generation to customer success playbooks and competitive intel.",
    price: "Custom",
    badge: "Custom Build",
  },
  {
    name: "Enterprise SEO + AEO Strategy",
    slug: "seo-aeo",
    desc: "Full-funnel content and technical SEO program designed for enterprise complexity — multi-site, multi-region, and optimized for AI search visibility.",
    price: "Custom",
    badge: null,
  },
]

export default function EnterprisePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="bg-gradient-to-b from-primary to-primary/90 text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-card/20 text-white/90 text-sm font-medium rounded-full mb-6">
            <Shield className="w-3.5 h-3.5" />
            Enterprise AI Solutions
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold mb-6 leading-tight">
            AI Infrastructure<br />
            <span className="text-primary">Built for Revenue Teams</span>
          </h1>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            AIMS builds custom AI systems for enterprise revenue teams — from multi-channel outbound at scale to custom agents that automate your highest-cost workflows.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/get-started"
              className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-white font-semibold rounded-xl hover:bg-primary/90 transition-colors"
            >
              Schedule Executive Briefing
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/tools/stack-configurator"
              className="inline-flex items-center gap-2 px-8 py-4 bg-card/10 text-white font-semibold rounded-xl hover:bg-card/20 transition-colors border border-white/20"
            >
              Build Your AI Stack
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
            <h2 className="text-3xl font-bold text-foreground mb-4">Enterprise Revenue Challenges — and How AIMS Solves Them</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">The same problems showing up in every board deck, solved with production-ready AI systems — not pilots.</p>
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
                  <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-green-400">{fix}</p>
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
            <h2 className="text-3xl font-bold text-foreground mb-4">Enterprise AI Services</h2>
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
          <div className="bg-card border-2 border-primary rounded-2xl p-8 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-primary mb-2">Recommended Package</p>
            <h2 className="text-2xl font-bold text-foreground mb-1">Enterprise AI Transformation</h2>
            <p className="text-sm text-muted-foreground mb-4">Our forward-deployed engineers audit your operations and build custom AI solutions you own forever. From assessment to production in 30 days.</p>
            <div className="flex flex-wrap gap-2 mb-5">
              {["Custom AI Audit", "Solution Architecture", "Implementation", "Training & Handoff"].map((s) => (
                <span key={s} className="inline-flex items-center gap-1 px-2.5 py-1 bg-deep text-foreground text-xs font-medium rounded-full">
                  <CheckCircle2 className="w-3 h-3 text-green-400" />{s}
                </span>
              ))}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-foreground">Custom pricing</span>
              <Link href="/solutions" className="inline-flex items-center gap-1 text-sm text-primary font-medium hover:underline">
                View all solutions <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 bg-primary">
        <div className="max-w-2xl mx-auto text-center text-white">
          <h2 className="text-3xl font-bold mb-4">Ready to move AI from pilot to production?</h2>
          <p className="text-muted-foreground mb-8">
            Schedule an executive briefing. We&apos;ll assess your current tech stack, identify the highest-leverage automation opportunities, and present a phased deployment plan.
          </p>
          <Link
            href="/get-started"
            className="inline-flex items-center gap-2 px-8 py-4 bg-card text-primary font-semibold rounded-xl hover:bg-primary/10 transition-colors"
          >
            Schedule Executive Briefing
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </div>
  )
}
