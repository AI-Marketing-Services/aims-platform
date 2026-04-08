import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Free AI Tools | AI Operator Collective",
  description:
    "Free AI-powered tools for your business - readiness quiz, ROI calculator, website audit, segment explorer, and stack configurator.",
  openGraph: {
    title: "Free AI Tools | AI Operator Collective",
    description:
      "Free AI-powered tools for your business - readiness quiz, ROI calculator, website audit, segment explorer, and stack configurator.",
  },
}

export default function ToolsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
