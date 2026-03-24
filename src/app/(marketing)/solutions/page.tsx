import type { Metadata } from "next"
import { SolutionsClient } from "./SolutionsClient"

export const metadata: Metadata = {
  title: "Engagement Models - Forward-Deployed AI Consulting | AIMS",
  description:
    "Explore AIMS engagement models. From outbound pipeline to SEO dominance to revenue operations, our forward-deployed engineers build and run AI systems inside your business.",
  alternates: { canonical: "https://aimseos.com/solutions" },
}

export default function SolutionsPage() {
  return <SolutionsClient />
}
