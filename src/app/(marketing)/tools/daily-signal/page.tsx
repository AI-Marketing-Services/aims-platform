import type { Metadata } from "next"
import DailySignalClient from "./DailySignalClient"

export const metadata: Metadata = {
  title: "Daily Signal | AI Operator Collective",
  description:
    "A Notion-style daily AI news digest. One card per topic, one link, one sentence. All signal, no fluff — delivered to your inbox at 6am ET.",
}

export default function DailySignalPage() {
  return <DailySignalClient />
}
