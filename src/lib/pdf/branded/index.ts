import "server-only"

import type { LeadMagnetType } from "@prisma/client"
import { loadBrandTokensForOperator } from "./load-tokens"
import { buildBrandedWebsiteAuditPDF } from "./website-audit"
import type { WebsiteAuditPDFInput } from "./types"
import { logger } from "@/lib/logger"

export interface BrandedPDFAttachment {
  filename: string
  content: Buffer
}

/**
 * Build a branded PDF for the given submission type. Returns null when
 * no template is registered for the type — the caller should treat
 * `null` as "no attachment" and continue with the existing email flow.
 *
 * Templates are added incrementally. Phase 1 ships Website Audit only;
 * subsequent phases add the other 6 tools.
 */
export async function buildBrandedSubmissionPDF(args: {
  type: LeadMagnetType
  operatorUserId: string | null | undefined
  submissionData: Record<string, unknown>
  submissionResults: Record<string, unknown> | undefined
  score: number | undefined
  recipientName: string | null
}): Promise<BrandedPDFAttachment | null> {
  try {
    const brand = await loadBrandTokensForOperator(args.operatorUserId)

    if (args.type === "WEBSITE_AUDIT") {
      const url = pickString(args.submissionData?.url) ?? "your website"
      const scores = (args.submissionData?.scores ?? args.submissionResults?.scores) as
        | WebsiteAuditPDFInput["scores"]
        | undefined
      const recommendations = (args.submissionResults?.recommendations ??
        args.submissionData?.recommendations) as
        | WebsiteAuditPDFInput["recommendations"]
        | undefined

      const pdf = await buildBrandedWebsiteAuditPDF(brand, {
        url,
        score: typeof args.score === "number" ? Math.round(args.score) : 50,
        recipientName: args.recipientName,
        scores,
        recommendations,
      })

      const safeUrl = url.replace(/[^a-z0-9.-]+/gi, "-").slice(0, 40) || "audit"
      return {
        filename: `website-audit-${safeUrl}.pdf`,
        content: pdf,
      }
    }

    // Other types: no template yet — caller falls through to email-only.
    return null
  } catch (err) {
    logger.error("Failed to build branded PDF", err, {
      type: args.type,
      operatorUserId: args.operatorUserId,
    })
    return null
  }
}

function pickString(v: unknown): string | null {
  if (typeof v === "string" && v.trim()) return v.trim()
  return null
}
