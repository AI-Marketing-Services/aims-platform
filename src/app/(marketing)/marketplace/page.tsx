import type { Metadata } from "next"
import { MarketplaceClient } from "./MarketplaceClient"

export const metadata: Metadata = {
  title: "Engagements | AIMS",
  description: "Forward-deployed AI engineering engagements custom-scoped to your business. Browse our full catalog of AI-powered solutions.",
}

export default function MarketplacePage() {
  return <MarketplaceClient />
}
