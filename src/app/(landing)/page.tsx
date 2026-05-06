import type { Metadata } from "next"
import { CommunityHero } from "@/components/community/CommunityHero"
import { ProblemStakes } from "@/components/community/ProblemStakes"
import { OperatorMotion } from "@/components/community/OperatorMotion"
import { HowItWorksPlan } from "@/components/community/HowItWorksPlan"
import { ConsortiumMentors } from "@/components/community/ConsortiumMentors"
import { WhatIsSection } from "@/components/community/WhatIsSection"
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
  title:
    "AI Operator Collective | Move from AI-Curious to AI-Capable",
  description:
    "AIOC is a cohort-based apprenticeship for people who want to become useful where AI turns into business value: prospecting, discovery, diagnosis, scoping, setup, and delivery. Application-only. 10 seats per cohort.",
  alternates: { canonical: "https://aioperatorcollective.com" },
  openGraph: {
    type: "website",
    url: "https://aioperatorcollective.com",
    siteName: "AI Operator Collective",
    title:
      "AI Operator Collective | Move from AI-Curious to AI-Capable",
    description:
      "Cohort-based apprenticeship for people who want to become credible AI Operators. Application-only. 10 seats per cohort. Powered by AIMS.",
    images: [{ url: "/og-image.png?v=2", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title:
      "AI Operator Collective | Move from AI-Curious to AI-Capable",
    description:
      "Cohort-based apprenticeship for credible AI Operators. Application-only. Powered by AIMS.",
    images: [{ url: "/og-image.png?v=2", width: 1200, height: 630 }],
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
    url: "https://www.aioperatorcollective.com",
  },
}

const FAQ_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Do I need a technical background?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "No. AIOC is not built for AI engineers. It is built for smart, operator-minded people who want to understand how AI can solve real business problems. Technical curiosity helps. Business judgment matters more.",
      },
    },
    {
      "@type": "Question",
      name: "Can I do this while I am still in my W2?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. Many people will be building capability while still employed. Your day-to-day work gives you a place to start noticing processes, handoffs, repeated questions, and small operational fires differently. Depending on your role, your current job may become a useful testing ground for the operator lens.",
      },
    },
    {
      "@type": "Question",
      name: "Is this an AI agency course?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Not in the usual internet sense. AIOC is not built around copy-this-offer scripts. The focus is the full operator motion: market selection, prospecting, discovery, diagnosis, workflow mapping, ROI thinking, practical AI-enabled solutioning, and credible business conversations.",
      },
    },
    {
      "@type": "Question",
      name: "Will this get me clients?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "No one can honestly guarantee that. AIOC is designed to help you build the judgment, language, prospecting rhythm, workflow thinking, and practical reps that support credible client conversations. Outcomes depend on your effort and execution.",
      },
    },
    {
      "@type": "Question",
      name: "What does it cost?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "The first cost is time — roughly one to two hours per day to build real momentum. Applicants who are a fit will receive current pricing, terms, and cohort details before making any enrollment decision.",
      },
    },
    {
      "@type": "Question",
      name: "Is AIOC a fixed-duration program?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "No. AIOC is built more like an operator development track than a one-and-done course. The first phase gives you structure: the operator lens, discovery reps, scoping practice, business setup, and delivery standards. The bigger goal is operator judgment, communication, and follow-through over time.",
      },
    },
    {
      "@type": "Question",
      name: "What happens after I apply?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "We review your application, then qualified applicants are invited to a call with someone from our team. That call is a mutual fit conversation, not a pressure pitch. We are looking for curious, high-agency operators who want to build real capability.",
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
      <ProblemStakes />
      <OperatorMotion />
      <HowItWorksPlan />
      {/* Built by operators for future operators — keeps the board-of-operators
          card grid Jess wanted retained inside this section. */}
      <ConsortiumMentors />
      {/* "Who It Is For" — probably-for-you / probably-not-for-you split. */}
      <WhatIsSection />
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
