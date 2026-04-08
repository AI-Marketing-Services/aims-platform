import type { Metadata } from "next"
import AIOpportunityAuditClient from "./AIOpportunityAuditClient"

export const metadata: Metadata = {
  title: "Free AI Opportunity Audit for Your Business | AI Operator Collective",
  description:
    "Get a personalized AI integration report for your business in under 90 seconds. We scan your site, identify the highest-ROI AI opportunities, and recommend the exact tools to deploy. Free, no calls.",
  alternates: { canonical: "https://aioperatorcollective.com/tools/ai-opportunity-audit" },
  openGraph: {
    type: "website",
    url: "https://aioperatorcollective.com/tools/ai-opportunity-audit",
    title: "Free AI Opportunity Audit — Personalized Report for Your Business",
    description:
      "We scan your website, analyze your business, and deliver 5 specific AI opportunities with the exact tools to deploy. 90 seconds. No calls.",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
}

export default function AIOpportunityAuditPage() {
  return <AIOpportunityAuditClient />
}
