"use client"

import dynamic from "next/dynamic"
import { notFound } from "next/navigation"

/**
 * Lazy-loads each tool's client component. We pull from the existing
 * `/tools/<slug>/<Client>.tsx` files so the tenant route renders the
 * exact same UI as the platform route — only the brand tokens flowing
 * through TenantThemeProvider change.
 *
 * Lives in a client component because `dynamic({ ssr: false })` is not
 * permitted in server components in Next.js 15+. Each tool client is
 * heavily interactive (multi-step forms, animation timing, localStorage
 * drafts) so client-only render is appropriate.
 */
const TOOL_COMPONENTS = {
  "ai-readiness-quiz": dynamic(
    () =>
      import("@/app/(marketing)/tools/ai-readiness-quiz/AIReadinessQuizClient"),
    { ssr: false },
  ),
  "roi-calculator": dynamic(
    () => import("@/app/(marketing)/tools/roi-calculator/ROICalculatorClient"),
    { ssr: false },
  ),
  "website-audit": dynamic(
    () => import("@/app/(marketing)/tools/website-audit/WebsiteAuditClient"),
    { ssr: false },
  ),
  "business-credit-score": dynamic(
    () =>
      import(
        "@/app/(marketing)/tools/business-credit-score/BusinessCreditScoreClient"
      ),
    { ssr: false },
  ),
  "executive-ops-audit": dynamic(
    () =>
      import(
        "@/app/(marketing)/tools/executive-ops-audit/ExecutiveOpsAuditClient"
      ),
    { ssr: false },
  ),
  "segment-explorer": dynamic(
    () =>
      import("@/app/(marketing)/tools/segment-explorer/SegmentExplorerClient"),
    { ssr: false },
  ),
  "stack-configurator": dynamic(
    () =>
      import(
        "@/app/(marketing)/tools/stack-configurator/StackConfiguratorClient"
      ),
    { ssr: false },
  ),
} as const

type ToolSlug = keyof typeof TOOL_COMPONENTS

export function TenantToolRenderer({ slug }: { slug: string }) {
  const Component = TOOL_COMPONENTS[slug as ToolSlug]
  if (!Component) notFound()
  return <Component />
}
