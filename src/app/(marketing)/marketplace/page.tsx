import type { Metadata } from "next"
import { MarketplaceClient } from "./MarketplaceClient"

export const metadata: Metadata = {
  title: "Marketplace — Browse All AI Services",
  description: "Browse AIMS's full catalog of AI-powered marketing, sales, operations, and finance services.",
}

export default function MarketplacePage() {
  return <MarketplaceClient />
}
