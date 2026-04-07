import type { Metadata } from "next"
import { CommunityHero } from "@/components/community/CommunityHero"
import { WhatIsSection } from "@/components/community/WhatIsSection"
import { EverythingInside } from "@/components/community/EverythingInside"
import { HowItWorksSteps } from "@/components/community/HowItWorksSteps"
import { ConsortiumMentors } from "@/components/community/ConsortiumMentors"
import { SolutionsGrid } from "@/components/community/SolutionsGrid"
import { RealResults } from "@/components/community/RealResults"
import { RiskFreeStripe } from "@/components/community/RiskFreeStripe"
import { ComparisonTable } from "@/components/community/ComparisonTable"
import { ApplicationCard } from "@/components/community/ApplicationCard"
import { CommunityFAQ } from "@/components/community/CommunityFAQ"
import { FinalCTASection } from "@/components/community/FinalCTASection"

export const metadata: Metadata = {
  title: "AI Operator Collective | Build a Real AI Services Business in 90 Days",
  description:
    "Join the operator-led community teaching white-collar professionals how to build a profitable AI services business. Business fundamentals first, AI deployment second. Backed by founders running $30M+ companies.",
  alternates: { canonical: "https://aioperatorcollective.com" },
  openGraph: {
    type: "website",
    url: "https://aioperatorcollective.com",
    siteName: "AI Operator Collective",
    title: "AI Operator Collective | Build a Real AI Services Business in 90 Days",
    description:
      "The only operator community that teaches business fundamentals first, AI deployment second. Backed by YPO operators with $100M+ in combined exits.",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Operator Collective | Build a Real AI Services Business in 90 Days",
    description:
      "Operator-led training and accountability program. Land your first AI services client in 90 days or get coached free until you do.",
  },
}

const ORG_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "AI Operator Collective",
  url: "https://aioperatorcollective.com",
  logo: "https://aioperatorcollective.com/logo.png",
  description:
    "Operator-led training and accountability community for professionals building AI services businesses. Powered by AIMS.",
  parentOrganization: {
    "@type": "Organization",
    name: "AIMS",
    url: "https://aimseos.com",
  },
}

const FAQ_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Do I need technical experience to join the AI Operator Collective?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "No. The first month is business fundamentals: forming your LLC, setting your pricing, building your sales process. AI tooling does not start until Week 5. The program is built for non-technical operators.",
      },
    },
    {
      "@type": "Question",
      name: "How long until I can land my first paying client?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Most cohort operators land their first paying engagement inside 90 days. The program is backed by a 90-day execution guarantee.",
      },
    },
    {
      "@type": "Question",
      name: "Who runs the AI Operator Collective?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "The program is operator-led by a consortium of YPO members and founders with $100M+ in combined exits across vending, healthcare, beverage, transportation, gaming, and finance.",
      },
    },
    {
      "@type": "Question",
      name: "What does pricing look like?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "The program is application-only. Pricing is reviewed on the strategy call after you submit your application.",
      },
    },
  ],
}

export default function LandingPage() {
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
      <CommunityHero />
      <WhatIsSection />
      <EverythingInside />
      <HowItWorksSteps />
      <ConsortiumMentors />
      <SolutionsGrid />
      <RealResults />
      <RiskFreeStripe />
      <ComparisonTable />
      <ApplicationCard />
      <CommunityFAQ />
      <FinalCTASection />
    </>
  )
}
