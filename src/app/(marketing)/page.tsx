import type { Metadata } from "next"
import { Hero } from "@/components/marketing/Hero"
import { LogoTicker } from "@/components/marketing/LogoTicker"
import { ServicesGrid } from "@/components/marketing/ServicesGrid"
import { HowItWorks } from "@/components/marketing/HowItWorks"
import { Benefits } from "@/components/marketing/Benefits"
import { WhyAIMS } from "@/components/marketing/WhyAIMS"
import { Integrations } from "@/components/marketing/Integrations"
import { FAQ } from "@/components/marketing/FAQ"
import { FinalCTA } from "@/components/marketing/FinalCTA"

export const metadata: Metadata = {
  title: "AIMS — Forward-Deployed AI Consulting",
  description: "AIMS embeds senior AI engineers directly in your operations to diagnose bottlenecks, build custom AI solutions, and deliver measurable efficiency gains in 90 days.",
  alternates: { canonical: "https://aimseos.com" },
  openGraph: {
    title: "AIMS — Forward-Deployed AI Consulting",
    description: "AIMS embeds senior AI engineers directly in your operations to diagnose bottlenecks, build custom AI solutions, and deliver measurable efficiency gains in 90 days.",
  },
}

const ORG_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "AIMS",
  url: "https://aimseos.com",
  logo: "https://aimseos.com/logo.png",
  description: "Forward-deployed AI consulting firm. We embed senior engineers in your operations to diagnose bottlenecks, build custom AI solutions, and deliver measurable efficiency gains.",
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
        text: "Our forward-deployed engineers begin the operational diagnostic in week one. Most clients see their first deployed AI solutions within 60 days, with measurable efficiency gains tracked from day one of deployment.",
      },
    },
    {
      "@type": "Question",
      name: "What industries does AIMS work with?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "AIMS specializes in B2B businesses across professional services, SaaS, multi-location operators (vending, healthcare, auto), and enterprise teams. Our engineers have deep vertical expertise in each industry.",
      },
    },
    {
      "@type": "Question",
      name: "How is AIMS pricing structured?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Engagements are custom-scoped based on company size, operational complexity, and the number of departments involved. We provide a detailed scope and investment proposal after the initial discovery call.",
      },
    },
    {
      "@type": "Question",
      name: "Do I need to use specific tools to work with AIMS?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "No. AIMS is tool-agnostic. Our engineers embed into your existing tech stack and workflows — whether that is HubSpot, Salesforce, custom internal tools, or a greenfield environment.",
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
      <FAQ />
      <FinalCTA />
    </>
  )
}
