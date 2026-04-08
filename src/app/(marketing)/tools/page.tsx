import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight, BarChart2, Globe, Zap, Layers, Search, BookOpen, Sparkles, Briefcase, TrendingUp } from "lucide-react"

export const metadata: Metadata = {
  title: "Free AI Tools | AI Operator Collective",
  description:
    "Free AI-powered tools to assess your readiness, calculate ROI, audit your website, and explore your ideal customer segments.",
}

const FEATURED_TOOLS = [
  {
    href: "/tools/ai-opportunity-audit",
    icon: Sparkles,
    title: "AI Opportunity Audit",
    description:
      "Answer 4 questions and drop your URL. We scan your site, analyze your business, and deliver a personalized report with the highest-ROI AI opportunities for your company.",
    cta: "Run My Audit",
    badge: "For businesses",
    highlight: true,
  },
  {
    href: "/tools/ai-playbook",
    icon: BookOpen,
    title: "AI Operator Playbook",
    description:
      "Twelve specific AI plays for corporate professionals. Turn your W-2 expertise into an AI services business or become the AI champion at your day job.",
    cta: "Read the Playbook",
    badge: "For operators",
    highlight: true,
  },
]

const TOOLS = [
  {
    href: "/tools/ai-readiness-quiz",
    icon: Zap,
    title: "AI Readiness Quiz",
    description:
      "Score your business across 5 AI readiness pillars and get a personalized roadmap in under 3 minutes.",
    cta: "Take the Quiz",
    badge: "3 min",
  },
  {
    href: "/tools/roi-calculator",
    icon: BarChart2,
    title: "ROI Calculator",
    description:
      "Calculate your potential return on AI automation based on your team size, industry, and current close rate.",
    cta: "Calculate ROI",
    badge: "Instant",
  },
  {
    href: "/tools/website-audit",
    icon: Globe,
    title: "Website Audit",
    description:
      "Get a full AI-powered audit of your site — SEO, answer engine optimization, conversion, and mobile performance.",
    cta: "Audit My Site",
    badge: "Free report",
  },
  {
    href: "/tools/executive-ops-audit",
    icon: TrendingUp,
    title: "Executive Ops Audit",
    description:
      "A 5-7 minute diagnostic that identifies the biggest operational bottlenecks costing you time and money, and maps them to specific AI solutions.",
    cta: "Run Ops Audit",
    badge: "For leaders",
  },
  {
    href: "/tools/business-credit-score",
    icon: Briefcase,
    title: "Business Credit Score",
    description:
      "Check your business credit profile and get a personalized action plan to build, repair, or leverage your credit for growth.",
    cta: "Check My Score",
    badge: "Free report",
  },
  {
    href: "/tools/segment-explorer",
    icon: Search,
    title: "Segment Explorer",
    description:
      "Explore your ideal customer profile across industries, company sizes, and pain points to sharpen your ICP.",
    cta: "Explore Segments",
    badge: "Interactive",
  },
  {
    href: "/tools/stack-configurator",
    icon: Layers,
    title: "Stack Configurator",
    description:
      "Build your recommended AI tool stack based on your business model, budget, and growth priorities.",
    cta: "Configure My Stack",
    badge: "Personalized",
  },
]

export default function ToolsIndexPage() {
  return (
    <div className="min-h-screen bg-[#08090D]">
      {/* Hero */}
      <section className="border-b border-border py-20">
        <div className="container mx-auto max-w-4xl px-4 text-center">
          <span className="inline-block rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary mb-4">
            Free Tools
          </span>
          <h1 className="text-4xl font-bold tracking-tight text-foreground md:text-5xl">
            AI Tools Built for Growth
          </h1>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            Interactive tools to benchmark your AI readiness, generate a personalized AI
            opportunity report, audit your site, and build your perfect stack — no signup required.
          </p>
        </div>
      </section>

      {/* Featured — cold-email landing targets */}
      <section className="py-20">
        <div className="container mx-auto max-w-5xl px-4">
          <div className="mb-10 text-center">
            <span className="inline-block rounded-full border border-primary/40 bg-primary/15 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary mb-3">
              Most popular
            </span>
            <h2 className="text-2xl font-bold text-foreground md:text-3xl">
              Start here
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 stagger-in">
            {FEATURED_TOOLS.map((tool) => {
              const Icon = tool.icon
              return (
                <Link
                  key={tool.href}
                  href={tool.href}
                  className="group relative flex flex-col rounded-xl border border-primary/30 bg-gradient-to-br from-[#141923] to-[#0E1219] p-8 transition-all hover:border-primary/60 hover:shadow-[0_0_40px_rgba(196,151,42,0.15)]"
                >
                  <div className="mb-5 flex items-center justify-between">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/15 border border-primary/30">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <span className="rounded-full border border-primary/40 bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary uppercase tracking-wider">
                      {tool.badge}
                    </span>
                  </div>
                  <h3 className="mb-3 text-xl font-bold text-foreground">{tool.title}</h3>
                  <p className="mb-6 flex-1 text-sm text-muted-foreground leading-relaxed">
                    {tool.description}
                  </p>
                  <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary group-hover:gap-2.5 transition-all">
                    {tool.cta}
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      {/* Secondary tools */}
      <section className="border-t border-border pt-20 pb-20">
        <div className="container mx-auto max-w-5xl px-4">
          <div className="mb-10 text-center">
            <h2 className="text-xl font-semibold text-foreground">More free tools</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Quick diagnostics, calculators, and explorers
            </p>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 stagger-in">
            {TOOLS.map((tool) => {
              const Icon = tool.icon
              return (
                <Link
                  key={tool.href}
                  href={tool.href}
                  className="group flex flex-col rounded-xl border border-border bg-[#141923] p-6 transition-all hover:border-primary/40 hover:shadow-[0_0_20px_rgba(196,151,42,0.08)] animated-glow-card"
                >
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <span className="rounded-full border border-border bg-[#0E1219] px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                      {tool.badge}
                    </span>
                  </div>
                  <h2 className="mb-2 text-base font-semibold text-foreground">{tool.title}</h2>
                  <p className="mb-5 flex-1 text-sm text-muted-foreground">{tool.description}</p>
                  <span className="inline-flex items-center gap-1.5 text-sm font-medium text-primary group-hover:gap-2.5 transition-all">
                    {tool.cta}
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="border-t border-border py-20">
        <div className="container mx-auto max-w-2xl px-4 text-center">
          <h2 className="text-2xl font-bold text-foreground">
            Want a custom AI assessment?
          </h2>
          <p className="mt-3 text-muted-foreground">
            Book a strategy call and we will walk through your business together and build a prioritized
            AI roadmap tailored to your goals.
          </p>
          <Link
            href="/get-started"
            className="mt-8 inline-flex items-center gap-2 rounded-sm bg-primary px-8 py-3.5 font-semibold text-white hover:bg-primary/90 transition-colors"
          >
            Book a Free Strategy Call
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  )
}
