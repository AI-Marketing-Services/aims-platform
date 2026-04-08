import type { Metadata } from "next"
import ExecutiveOpsAuditClient from "./ExecutiveOpsAuditClient"

export const metadata: Metadata = {
  title: "Executive Operations Audit | AI Operator Collective",
  description:
    "Map your company's AI bottlenecks and cost inefficiencies in 5 minutes. Get a custom executive scorecard showing exactly where automation would have the highest ROI.",
}

export default function ExecutiveOpsAuditPage() {
  return <ExecutiveOpsAuditClient />
}
