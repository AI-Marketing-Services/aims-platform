import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "CRM Onboarding - AIMS",
  description:
    "Get started with your AIMS CRM. Step-by-step setup guide, video tutorials, and AI support to configure your vending business CRM.",
  openGraph: {
    title: "CRM Onboarding - AIMS",
    description:
      "Get started with your AIMS CRM. Step-by-step setup guide, video tutorials, and AI support.",
  },
}

export default function CrmOnboardingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
