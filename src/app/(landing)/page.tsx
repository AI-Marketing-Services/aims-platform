import type { Metadata } from "next"
import { CommunityHero } from "@/components/community/CommunityHero"
import { WhatIsSection } from "@/components/community/WhatIsSection"
import { EverythingInside } from "@/components/community/EverythingInside"
import { HowItWorksSteps } from "@/components/community/HowItWorksSteps"
import { ConsortiumMentors } from "@/components/community/ConsortiumMentors"
import { SolutionsGrid } from "@/components/community/SolutionsGrid"
import { ComparisonTable } from "@/components/community/ComparisonTable"
import { WhatHappensNext } from "@/components/community/WhatHappensNext"
import { ApplicationCard } from "@/components/community/ApplicationCard"
import { CommunityFAQ } from "@/components/community/CommunityFAQ"
import { FinalCTASection } from "@/components/community/FinalCTASection"
import { CommunityDisclosures } from "@/components/community/CommunityDisclosures"

export const metadata: Metadata = {
  title: "AI Operator Collective | Turn Your Career Into an AI Services Business",
  description:
    "An application-only, operator-led program for displaced W-2 professionals and corporate leaders building an AI services business. Business fundamentals first, AI tooling second. Free AI Operator Playbook Vault on signup.",
  alternates: { canonical: "https://aioperatorcollective.com" },
  openGraph: {
    type: "website",
    url: "https://aioperatorcollective.com",
    siteName: "AI Operator Collective",
    title: "AI Operator Collective | Turn Your Career Into an AI Services Business",
    description:
      "Operator-led program for displaced W-2 professionals and corporate leaders building an AI services business. Free Playbook Vault delivered instantly on signup.",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Operator Collective | Turn Your Career Into an AI Services Business",
    description:
      "Operator-led program for professionals building an AI services business. Free Playbook Vault delivered instantly on signup.",
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
      name: "What is the AI Operator Playbook Vault and what's in it?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "It's the collection of cold email sequences, discovery frameworks, pricing models, outreach scripts, and delivery playbooks the AIMS team uses internally. You get it as a single email the moment you submit the form — free, no strings.",
      },
    },
    {
      "@type": "Question",
      name: "Who is this built for?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Displaced W-2 professionals and corporate leaders with domain expertise who want to build an AI services business rather than find another job. Not built for passive income seekers or people who won't implement.",
      },
    },
    {
      "@type": "Question",
      name: "Do I need technical experience to join?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "No. The first four weeks are business fundamentals: LLC, pricing, pipeline, sales process. AI tooling does not start until Week 5.",
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
      <SolutionsGrid />
      <ConsortiumMentors />
      <ComparisonTable />
      <WhatHappensNext />
      <ApplicationCard />
      <CommunityFAQ />
      <FinalCTASection />
      <CommunityDisclosures />
    </>
  )
}
