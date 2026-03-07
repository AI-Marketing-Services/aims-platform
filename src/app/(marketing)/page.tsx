import type { Metadata } from "next"
import { Hero } from "@/components/marketing/Hero"
import { LogoTicker } from "@/components/marketing/LogoTicker"
import { ServicesGrid } from "@/components/marketing/ServicesGrid"
import { HowItWorks } from "@/components/marketing/HowItWorks"
import { Benefits } from "@/components/marketing/Benefits"
import { WhyAIMS } from "@/components/marketing/WhyAIMS"
import { Integrations } from "@/components/marketing/Integrations"
import { Pricing } from "@/components/marketing/Pricing"
import { FAQ } from "@/components/marketing/FAQ"
import { FinalCTA } from "@/components/marketing/FinalCTA"

export const metadata: Metadata = {
  title: "AIMS — AI-Powered Business Infrastructure",
  description: "AIMS builds and runs your outbound engine, AI calling systems, and pipeline operations — so your team closes deals, not chases them. From $97/mo.",
  alternates: { canonical: "https://aimseos.com" },
}

const ORG_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "AIMS",
  url: "https://aimseos.com",
  logo: "https://aimseos.com/logo.png",
  description: "AI-powered business infrastructure — outbound campaigns, AI voice agents, and pipeline automation.",
  contactPoint: {
    "@type": "ContactPoint",
    email: "hello@aimseos.com",
    contactType: "sales",
  },
  sameAs: [
    "https://linkedin.com/company/aimanagingservices",
    "https://twitter.com/aimanagingsvcs",
  ],
}

const FAQ_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "How long until I start seeing results with AIMS?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Most clients see their first booked meetings within 14 days of launch. Full pipeline impact is typically visible within 30-60 days as sequences warm up and AI agents learn your ICP.",
      },
    },
    {
      "@type": "Question",
      name: "What industries does AIMS work with?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "AIMS specializes in B2B businesses across professional services, SaaS, multi-location operators (vending, healthcare, auto), and enterprise sales teams.",
      },
    },
    {
      "@type": "Question",
      name: "How is AIMS pricing structured?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Core GHL packages start at $97-$397/mo. Outbound campaigns, voice agents, and custom services are priced based on volume and complexity. We offer a 14-day trial and month-to-month contracts.",
      },
    },
    {
      "@type": "Question",
      name: "Do I need to use specific tools to work with AIMS?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "No. AIMS is tool-agnostic and integrates with your existing CRM, email, and communication stack — including GoHighLevel, HubSpot, Salesforce, or a clean stack built from scratch.",
      },
    },
  ],
}

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(ORG_SCHEMA) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_SCHEMA) }}
      />
      <Hero />
      <LogoTicker />
      <ServicesGrid />
      <HowItWorks />
      <Benefits />
      <WhyAIMS />
      <Integrations />
      <Pricing />
      <FAQ />
      <FinalCTA />
    </>
  )
}
