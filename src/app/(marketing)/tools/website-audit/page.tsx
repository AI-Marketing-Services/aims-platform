import type { Metadata } from "next"
import WebsiteAuditClient from "./WebsiteAuditClient"

export const metadata: Metadata = {
  title: "Website Audit | AI Operator Collective",
  description:
    "Get a free AI-powered website audit with actionable recommendations to improve performance and conversions.",
}

export default function WebsiteAuditPage() {
  return <WebsiteAuditClient />
}
