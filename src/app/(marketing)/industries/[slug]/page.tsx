import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight } from "lucide-react"

const INDUSTRIES: Record<string, { title: string; description: string }> = {
  vendingpreneurs: {
    title: "AI Services for Vendingpreneurs",
    description: "Automate route optimization, lead generation, and location prospecting with AI-powered tools built for vending operators.",
  },
  "car-dealerships": {
    title: "AI Services for Car Dealerships",
    description: "AI voice agents for recall outreach, inbound lead routing, and multi-location CRM automation for automotive dealers.",
  },
  "small-business": {
    title: "AI Services for Small Business",
    description: "Website, CRM, chatbot, and outbound engine — everything a small business needs to generate and close leads on autopilot.",
  },
  "hotels-hospitality": {
    title: "AI Services for Hotels & Hospitality",
    description: "Automated guest communication, review management, and booking optimization powered by AI.",
  },
  enterprise: {
    title: "AI Services for Enterprise",
    description: "Custom AI automation at scale — RevOps, content production, pipeline orchestration, and vendor consolidation.",
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

  return (
    <div className="min-h-screen pt-24 pb-16 bg-background">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold tracking-tight text-foreground">{title}</h1>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">{description}</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-12 text-center">
          <p className="text-lg font-semibold text-foreground mb-2">
            Ready to see what AI can do for your business?
          </p>
          <p className="text-muted-foreground mb-6">
            Book a free 30-minute strategy call and we'll build a custom growth plan for your industry.
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
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-border px-6 py-3 text-sm font-semibold text-foreground hover:bg-secondary transition-colors"
            >
              Browse All Services
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
