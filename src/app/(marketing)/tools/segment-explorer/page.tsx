import type { Metadata } from "next"
import SegmentExplorerClient from "./SegmentExplorerClient"

export const metadata: Metadata = {
  title: "Audience Segment Explorer | AI Operator Collective",
  description:
    "Discover your ideal customer segments with AI-powered analysis. Get actionable targeting recommendations.",
}

export default function SegmentExplorerPage() {
  return <SegmentExplorerClient />
}
