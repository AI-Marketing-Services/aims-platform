import type { Metadata } from "next"
import dynamic from "next/dynamic"
import { Hero } from "@/components/marketing/hero"
import { LogoTicker } from "@/components/marketing/LogoTicker"
import { FinalCTA } from "@/components/marketing/FinalCTA"

const ServicesGrid = dynamic(
  () => import("@/components/marketing/ServicesGrid").then(m => ({ default: m.ServicesGrid })),
  { loading: () => <div className="py-24" /> }
)
const HowItWorks = dynamic(
  () => import("@/components/marketing/HowItWorks").then(m => ({ default: m.HowItWorks })),
  { loading: () => <div className="py-24" /> }
)
const Benefits = dynamic(
  () => import("@/components/marketing/Benefits").then(m => ({ default: m.Benefits })),
  { loading: () => <div className="py-24" /> }
)
const WhyAIMS = dynamic(
  () => import("@/components/marketing/WhyAIMS").then(m => ({ default: m.WhyAIMS })),
  { loading: () => <div className="py-24" /> }
)
const Integrations = dynamic(
  () => import("@/components/marketing/Integrations").then(m => ({ default: m.Integrations })),
  { loading: () => <div className="py-24" /> }
)
const FAQ = dynamic(
  () => import("@/components/marketing/FAQ").then(m => ({ default: m.FAQ })),
  { loading: () => <div className="py-24" /> }
)

export const metadata: Metadata = {
  title: "AIMS Platform - Forward-Deployed AI Consulting",
  description: "AIMS embeds senior AI engineers directly in your operations to diagnose bottlenecks, build custom AI solutions, and deliver measurable efficiency gains in 90 days.",
  alternates: { canonical: "https://www.aioperatorcollective.com/aims-platform" },
  robots: { index: false, follow: false },
  openGraph: {
    title: "AIMS Platform - Forward-Deployed AI Consulting",
    description: "AIMS embeds senior AI engineers directly in your operations to diagnose bottlenecks, build custom AI solutions, and deliver measurable efficiency gains in 90 days.",
  },
}

const ORG_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "AIMS",
  url: "https://www.aioperatorcollective.com",
  logo: "https://www.aioperatorcollective.com/logo.png",
  description: "Forward-deployed AI consulting firm. We embed senior engineers in your operations to diagnose bottlenecks, build custom AI solutions, and deliver measurable efficiency gains.",
  contactPoint: {
    "@type": "ContactPoint",
    email: "irtaza@modern-amenities.com",
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
        text: "No. AIMS is tool-agnostic. Our engineers embed into your existing tech stack and workflows - whether that is HubSpot, Salesforce, custom internal tools, or a greenfield environment.",
      },
    },
  ],
}

export default function AimsPlatformPage() {
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
