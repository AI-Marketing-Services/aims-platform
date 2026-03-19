import type { Metadata } from "next"
import { Suspense } from "react"
import { GetStartedClient } from "./GetStartedClient"

export const metadata: Metadata = {
  title: "Get Started — Book Your Strategy Call",
  description: "Book a free strategy call with the AIMS team. We'll audit your current pipeline and build a custom growth plan.",
  openGraph: {
    title: "Get Started | AIMS",
    description: "Book a free strategy call with the AIMS team. We'll audit your current pipeline and build a custom growth plan.",
  },
}

export default function GetStartedPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-deep" />}>
      <GetStartedClient />
    </Suspense>
  )
}
