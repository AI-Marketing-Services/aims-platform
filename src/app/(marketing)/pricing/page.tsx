import type { Metadata } from "next"
import { Pricing } from "@/components/marketing/Pricing"
import { FAQ } from "@/components/marketing/FAQ"
import { FinalCTA } from "@/components/marketing/FinalCTA"

export const metadata: Metadata = {
  title: "Pricing — Transparent Plans Starting at $97/mo",
  description: "Simple, transparent pricing for AI-powered marketing and sales infrastructure. No long-term contracts.",
  openGraph: {
    title: "Pricing | AIMS",
    description: "Simple, transparent pricing for AI-powered marketing and sales infrastructure. No long-term contracts.",
  },
}

export default function PricingPage() {
  return (
    <div className="pt-20">
      <div className="py-16 text-center border-b border-border bg-white">
        <h1 className="text-5xl font-bold tracking-tight">Simple, Transparent Pricing</h1>
        <p className="mt-4 text-xl text-muted-foreground max-w-xl mx-auto">
          Start with what you need. Scale as you grow. No long-term contracts.
        </p>
      </div>
      <Pricing />
      <FAQ />
      <FinalCTA />
    </div>
  )
}
