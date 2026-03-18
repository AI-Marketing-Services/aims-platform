import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight, Check } from "lucide-react"

const INDUSTRIES: Record<string, { title: string; description: string; solution: string }> = {
  vendingpreneurs: {
    title: "AI Services for Vendingpreneurs",
    description: "Automate route optimization, lead generation, and location prospecting with AI-powered tools built for vending operators.",
    solution: "AI Growth Engine",
  },
  "car-dealerships": {
    title: "AI Services for Car Dealerships",
    description: "AI voice agents for recall outreach, inbound lead routing, and multi-location CRM automation for automotive dealers.",
    solution: "Revenue Operations Suite",
  },
  "small-business": {
    title: "AI Services for Small Business",
    description: "Website, CRM, chatbot, and outbound engine — everything a small business needs to generate and close leads on autopilot.",
    solution: "AI Growth Engine",
  },
  "hotels-hospitality": {
    title: "AI Services for Hotels & Hospitality",
    description: "Automated guest communication, review management, and booking optimization powered by AI.",
    solution: "Customer Reactivation Stack",
  },
  enterprise: {
    title: "AI Services for Enterprise",
    description: "Custom AI automation at scale — RevOps, content production, pipeline orchestration, and vendor consolidation.",
    solution: "Enterprise AI Transformation",
  },
  healthcare: {
    title: "AI Services for Healthcare & Medical",
    description: "Automate patient intake, appointment reminders, and review management to fill your schedule and reduce no-shows.",
    solution: "AI Growth Engine",
  },
  legal: {
    title: "AI Services for Legal & Law Firms",
    description: "AI-powered client intake, case lead generation, and reputation management that keeps your pipeline full.",
    solution: "Content & Authority Engine",
  },
  "home-services": {
    title: "AI Services for Home Services",
    description: "HVAC, plumbing, electrical, roofing — AI voice agents answer every call, book jobs, and reactivate past customers automatically.",
    solution: "Customer Reactivation Stack",
  },
  "real-estate": {
    title: "AI Services for Real Estate",
    description: "Automated lead nurture, listing promotion, and database reactivation that turns cold contacts into closings.",
    solution: "AI Growth Engine",
  },
  "professional-services": {
    title: "AI Services for Professional Services & Consulting",
    description: "Position yourself as the authority in your space with AI content production, LinkedIn outbound, and SEO that compounds.",
    solution: "Content & Authority Engine",
  },
  ecommerce: {
    title: "AI Services for E-Commerce & Retail",
    description: "Recover abandoned carts, reactivate lapsed buyers, and drive repeat purchases with AI-powered email and SMS sequences.",
    solution: "Customer Reactivation Stack",
  },
  saas: {
    title: "AI Services for SaaS & Technology",
    description: "Outbound pipeline generation, product-led growth automation, and RevOps systems that scale with your ARR.",
    solution: "Revenue Operations Suite",
  },
}

const SOLUTION_DETAILS: Record<string, { tagline: string; services: string[]; price: string }> = {
  "AI Growth Engine": {
    tagline: "Full-stack lead generation and conversion — website, outbound, voice, and SEO bundled together.",
    services: ["Website + CRM + Chatbot", "Cold Outbound Engine", "AI Voice Agents", "SEO/AEO"],
    price: "from $497/mo",
  },
  "Revenue Operations Suite": {
    tagline: "Turn your sales process into a repeatable, data-driven machine.",
    services: ["RevOps Pipeline", "Sales Team Enablement", "AI Tool Tracker", "P&L Finance Automation"],
    price: "from $397/mo",
  },
  "Customer Reactivation Stack": {
    tagline: "Re-engage dormant customers and recover churned revenue with AI.",
    services: ["Lead Reactivation", "Database Reactivation", "AI Voice Agents", "AI Reputation Engine"],
    price: "from $347/mo",
  },
  "Content & Authority Engine": {
    tagline: "AI-powered content production and distribution across every channel.",
    services: ["AI Content Engine", "LinkedIn Outbound", "SEO/AEO", "AI Reputation Engine"],
    price: "from $297/mo",
  },
  "Enterprise AI Transformation": {
    tagline: "Forward-deployed engineers audit your operations and build custom AI solutions you own forever.",
    services: ["Custom AI Audit", "Solution Architecture", "Implementation", "Training & Handoff"],
    price: "Custom pricing",
  },
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const industry = INDUSTRIES[slug]
  return {
    title: industry ? `${industry.title} | AIMS` : "Industry Solutions | AIMS",
    description: industry?.description ?? "AI-powered services tailored to your industry.",
  }
}

export default async function IndustryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const industry = INDUSTRIES[slug]

  const title = industry?.title ?? "Industry Solutions"
  const description = industry?.description ?? "AI-powered services tailored to your industry."
  const solutionName = industry?.solution ?? "AI Growth Engine"
  const solution = SOLUTION_DETAILS[solutionName] ?? SOLUTION_DETAILS["AI Growth Engine"]

  return (
    <div className="min-h-screen pt-24 pb-16 bg-[#FAFAFA]">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900">{title}</h1>
          <p className="mt-4 text-lg text-gray-500 max-w-2xl mx-auto">{description}</p>
        </div>

        {/* Recommended Solution */}
        <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm mb-8">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#DC2626] mb-2">Recommended Package</p>
          <h2 className="text-2xl font-bold text-gray-900 mb-1">{solutionName}</h2>
          <p className="text-sm text-gray-500 mb-4">{solution.tagline}</p>
          <div className="flex flex-wrap gap-2 mb-5">
            {solution.services.map((s) => (
              <span key={s} className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-full">
                <Check className="w-3 h-3 text-green-600" />{s}
              </span>
            ))}
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-900">{solution.price}</span>
            <Link href="/solutions" className="inline-flex items-center gap-1 text-sm text-[#DC2626] font-medium hover:underline">
              View all solutions <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center shadow-sm">
          <p className="text-lg font-semibold text-gray-900 mb-2">
            Ready to see what AI can do for your business?
          </p>
          <p className="text-gray-500 mb-6">
            Book a free 30-minute strategy call and we&apos;ll build a custom growth plan for your industry.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/get-started"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#DC2626] px-6 py-3 text-sm font-semibold text-white hover:bg-[#B91C1C] transition-colors"
            >
              Book a Strategy Call <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/marketplace"
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 px-6 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Browse All Services
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
