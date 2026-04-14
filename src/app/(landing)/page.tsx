import type { Metadata } from "next"
import { CommunityHero } from "@/components/community/CommunityHero"
import { ComparisonTable } from "@/components/community/ComparisonTable"
import { WhatIsSection } from "@/components/community/WhatIsSection"
import { ConsortiumMentors } from "@/components/community/ConsortiumMentors"
import { CommunityFAQ } from "@/components/community/CommunityFAQ"
import { FinalCTASection } from "@/components/community/FinalCTASection"
import { CommunityDisclosures } from "@/components/community/CommunityDisclosures"

/* ─── REMOVED SECTIONS (commented out, not deleted) ───
import { EverythingInside } from "@/components/community/EverythingInside"
import { HowItWorksSteps } from "@/components/community/HowItWorksSteps"
import { SolutionsGrid } from "@/components/community/SolutionsGrid"
import { WhatHappensNext } from "@/components/community/WhatHappensNext"
import { ApplicationCard } from "@/components/community/ApplicationCard"
─── */

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
      name: "Do I need a tech background?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "No. You need domain expertise and a willingness to work. AI tools are taught in week 5 - after you have a business to deploy them in. The sequencing is intentional.",
      },
    },
    {
      "@type": "Question",
      name: "What if I'm still in my W-2?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Most members start while still employed. The program is designed so you can build your pipeline and get your first client before you make the leap.",
      },
    },
    {
      "@type": "Question",
      name: "Will this get me clients?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "The program gives you the exact system AIMS operators use. Your results depend entirely on the work you put in. We make no income claims.",
      },
    },
    {
      "@type": "Question",
      name: "What does it cost?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Pricing is shared over email with applicants who are offered a cohort seat. No payment to apply - ever. No surprise pitch calls.",
      },
    },
    {
      "@type": "Question",
      name: "What do I get for free right now?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "The AI Operator Playbook Vault - cold email sequences, discovery frameworks, pricing models, and outreach scripts - delivered to your inbox the moment you apply. Yours to keep regardless of whether you join.",
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
      <ComparisonTable />
      <WhatIsSection />
      <ConsortiumMentors />
      <CommunityFAQ />
      <FinalCTASection />
      <CommunityDisclosures />

      {/* ─── REMOVED SECTIONS ───
      <EverythingInside />
      <HowItWorksSteps />
      <SolutionsGrid />
      <WhatHappensNext />
      <ApplicationCard />
      ─── */}
    </>
  )
}
