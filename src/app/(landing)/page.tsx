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
import { CommunityDisclosures } from "@/components/community/CommunityDisclosures"

export const metadata: Metadata = {
  title: "AI Operator Collective | Operator-Led AI Services Community",
  description:
    "An application-only community for professionals who want to build an AI services business. Business fundamentals first, AI tooling second. Operated by the team behind the AIMS portfolio.",
  alternates: { canonical: "https://aioperatorcollective.com" },
  openGraph: {
    type: "website",
    url: "https://aioperatorcollective.com",
    siteName: "AI Operator Collective",
    title: "AI Operator Collective | Operator-Led AI Services Community",
    description:
      "Application-only community for operators building AI services businesses. Business fundamentals first, AI tooling second. Operated by the team behind the AIMS portfolio.",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Operator Collective | Operator-Led AI Services Community",
    description:
      "Application-only community for operators building AI services businesses. Operated by the team behind the AIMS portfolio.",
  },
}

const ORG_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "AI Operator Collective",
  url: "https://aioperatorcollective.com",
  logo: "https://aioperatorcollective.com/logo.png",
  description:
    "Operator-led training and accountability community for professionals building AI services businesses. Operated by Modern Amenities LLC.",
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
        text: "No. The first phase of the program is business fundamentals: forming your LLC, setting your pricing, building your sales process. AI tooling is introduced later in the program.",
      },
    },
    {
      "@type": "Question",
      name: "Will the program get me clients?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "No. The Collective makes no income or client claims. The program teaches the sales process and infrastructure used inside the AIMS portfolio. Whether you land clients depends entirely on the work you put in.",
      },
    },
    {
      "@type": "Question",
      name: "Is there a guarantee?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "No. The Collective does not guarantee income, clients, or any specific outcome. The program is structured to give you the best chance, but the work is on you.",
      },
    },
    {
      "@type": "Question",
      name: "What does pricing look like?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "The program is application-only. Pricing is reviewed on the strategy call only if there is mutual fit. There is no payment required to apply.",
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
      <CommunityDisclosures />
    </>
  )
}
