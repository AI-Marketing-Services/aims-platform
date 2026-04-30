/**
 * Auto-tag + lead-score helper. Runs after enrichment completes and
 * derives structured tags + a 0-100 priority score from the enrichment
 * + matched playbook. Pure function over already-fetched data — no
 * additional API calls, no Claude, fast, free.
 *
 * Tags applied to ClientDeal.tags:
 *   - {industry shorthand}      e.g. "real-estate", "hvac", "dental"
 *   - {size bucket}             e.g. "smb", "mid-market", "enterprise"
 *   - "high-fit" | "medium-fit" | "low-fit"  (playbook match strength)
 *   - "missing-website" | "missing-contact" (data quality flags)
 *
 * Lead score (0-100):
 *   - Industry match → up to +40 (exact playbook match), +25 (substring),
 *     +15 (keyword), 0 (no match)
 *   - Size signal → up to +25 (mid-market sweet spot), with smaller and
 *     larger company sizes scoring lower
 *   - Data completeness → up to +20 (full enrichment) ramping down to
 *     0 for nothing
 *   - Recency signal → up to +15 (founded < 5 years = scrappy / early
 *     adopter; founded 5-20 years = mature buyer; founded >20 = harder)
 */
import type { ClientDealEnrichment } from "@prisma/client"
import { matchPlaybookForIndustry } from "@/lib/playbooks/match"

interface AutoTagInput {
  industry: string | null
  enrichment: ClientDealEnrichment | null
  hasContacts: boolean
  hasWebsite: boolean
  hasContactEmail: boolean
}

export interface AutoTagResult {
  tags: string[]
  leadScore: number
  scoreBreakdown: {
    industry: number
    size: number
    completeness: number
    recency: number
  }
}

export function deriveAutoTags(input: AutoTagInput): AutoTagResult {
  const tags: string[] = []
  const breakdown = { industry: 0, size: 0, completeness: 0, recency: 0 }

  // ─── Industry tag + match score ────────────────────────────────────
  const industryRaw = input.enrichment?.industry ?? input.industry
  const match = matchPlaybookForIndustry(industryRaw)
  if (match) {
    tags.push(match.playbook.id) // e.g. "hvac", "realestate"
    breakdown.industry =
      match.matchType === "exact" ? 40 : match.matchType === "substring" ? 25 : 15
    if (match.confidence === "high") tags.push("high-fit")
    else if (match.confidence === "medium") tags.push("medium-fit")
    else tags.push("low-fit")
  } else {
    tags.push("low-fit")
  }

  // ─── Size bucket ───────────────────────────────────────────────────
  const empCount = input.enrichment?.employeeCount
  const empRange = input.enrichment?.employeeRange
  const sizeBucket = bucketEmployees(empCount, empRange)
  if (sizeBucket) {
    tags.push(sizeBucket)
    // Mid-market is the sweet spot for AIMS service deals — they have
    // budget but aren't behind enterprise procurement walls.
    breakdown.size =
      sizeBucket === "mid-market"
        ? 25
        : sizeBucket === "smb"
          ? 15
          : sizeBucket === "enterprise"
            ? 10
            : 5
  }

  // ─── Data completeness ─────────────────────────────────────────────
  let completenessPoints = 0
  if (input.hasWebsite) completenessPoints += 5
  if (input.hasContactEmail) completenessPoints += 5
  if (input.hasContacts) completenessPoints += 5
  if (input.enrichment?.description) completenessPoints += 5
  breakdown.completeness = completenessPoints

  if (!input.hasWebsite) tags.push("missing-website")
  if (!input.hasContactEmail && !input.hasContacts) tags.push("missing-contact")

  // ─── Recency signal (company age) ──────────────────────────────────
  const founded = input.enrichment?.foundedYear
  if (founded) {
    const age = new Date().getUTCFullYear() - founded
    if (age >= 0 && age < 5) {
      breakdown.recency = 15 // early-stage, agile, AI-curious
      tags.push("recent")
    } else if (age >= 5 && age < 20) {
      breakdown.recency = 12 // mature, established budget
    } else if (age >= 20) {
      breakdown.recency = 6 // legacy — harder to move
      tags.push("legacy")
    }
  }

  const leadScore = Math.min(
    100,
    Math.max(
      0,
      breakdown.industry + breakdown.size + breakdown.completeness + breakdown.recency,
    ),
  )

  return {
    tags: dedupTags(tags),
    leadScore,
    scoreBreakdown: breakdown,
  }
}

function bucketEmployees(
  count: number | null | undefined,
  range: string | null | undefined,
): "smb" | "mid-market" | "enterprise" | null {
  // Prefer numeric count if available
  if (typeof count === "number" && count > 0) {
    if (count < 50) return "smb"
    if (count < 500) return "mid-market"
    return "enterprise"
  }
  // Otherwise infer from the range string Prospeo sometimes returns
  if (typeof range === "string") {
    const lower = range.toLowerCase()
    if (lower.match(/^(1-10|11-50)$/) || lower.includes("1-10") || lower.includes("11-50")) {
      return "smb"
    }
    if (
      lower.includes("51-200") ||
      lower.includes("201-500") ||
      lower.includes("101-200")
    ) {
      return "mid-market"
    }
    if (lower.includes("501") || lower.includes("1001") || lower.includes("5001")) {
      return "enterprise"
    }
  }
  return null
}

function dedupTags(tags: string[]): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const t of tags) {
    const norm = t.toLowerCase().replace(/\s+/g, "-")
    if (!seen.has(norm)) {
      seen.add(norm)
      out.push(norm)
    }
  }
  return out
}
