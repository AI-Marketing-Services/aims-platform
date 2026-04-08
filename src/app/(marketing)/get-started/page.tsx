import type { Metadata } from "next"
import { Suspense } from "react"
import { GetStartedClient } from "./GetStartedClient"

export const metadata: Metadata = {
  title: "Get Started",
  description: "Get in touch with the AIMS team.",
  // Not indexed on the Collective domain — the Collective landing page and
  // application card at /#apply is the primary conversion surface. Leaving
  // this page routable but invisible to search so it doesn't compete.
  robots: { index: false, follow: false },
}

export default function GetStartedPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-deep" />}>
      <GetStartedClient />
    </Suspense>
  )
}
