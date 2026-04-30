import { PLAYBOOK_MANIFEST, type IndustryPlaybook, type PlaybookUseCase } from "./manifest"

/**
 * Match a deal's industry to the most-relevant playbook entries from
 * the manifest. Returns the top playbook + its top 2 use cases.
 *
 * Matching rules (loose, ordered by specificity):
 *   1. Exact id match (industry === playbook.id)
 *   2. Substring match either direction (deal industry contains
 *      playbook.industry OR vice versa, lowercase)
 *   3. Keyword fuzzy match — predefined synonyms for common
 *      industry phrasings (e.g. "real estate agency" → "real estate")
 *   4. Fallback: null (operator browses /portal/playbooks manually)
 */

const KEYWORD_SYNONYMS: Record<string, string[]> = {
  hvac: ["hvac", "plumbing", "heating", "cooling", "ac repair", "furnace"],
  dental: ["dental", "dentist", "orthodont", "endodont"],
  realestate: ["real estate", "realtor", "realty", "property sale", "brokerage"],
  restaurant: ["restaurant", "food service", "cafe", "diner", "bistro", "bar & grill"],
  law: ["law firm", "attorney", "legal services", "lawyer", "litigation"],
  ecommerce: ["e-commerce", "ecommerce", "online retail", "dtc brand", "shopify"],
  roofing: ["roofing", "contractor", "construction", "general contractor"],
  gym: ["gym", "fitness", "crossfit", "yoga", "personal training", "studio"],
  financial: ["financial advisor", "wealth management", "rias", "registered investment"],
  property: ["property management", "rental management", "leasing"],
}

function normalize(s: string): string {
  return s.toLowerCase().trim()
}

export interface PlaybookMatch {
  playbook: IndustryPlaybook
  topUseCases: PlaybookUseCase[]
  matchType: "exact" | "substring" | "keyword"
  confidence: "high" | "medium" | "low"
}

export function matchPlaybookForIndustry(industry: string | null | undefined): PlaybookMatch | null {
  if (!industry) return null
  const ind = normalize(industry)

  // 1. Exact id match
  for (const pb of PLAYBOOK_MANIFEST) {
    if (pb.id === ind || normalize(pb.industry) === ind) {
      return {
        playbook: pb,
        topUseCases: rankUseCases(pb.useCases),
        matchType: "exact",
        confidence: "high",
      }
    }
  }

  // 2. Substring match either direction
  for (const pb of PLAYBOOK_MANIFEST) {
    const pbIndustry = normalize(pb.industry)
    if (ind.includes(pbIndustry) || pbIndustry.includes(ind)) {
      return {
        playbook: pb,
        topUseCases: rankUseCases(pb.useCases),
        matchType: "substring",
        confidence: "high",
      }
    }
  }

  // 3. Keyword fuzzy match via synonyms
  for (const pb of PLAYBOOK_MANIFEST) {
    const synonyms = KEYWORD_SYNONYMS[pb.id]
    if (!synonyms) continue
    if (synonyms.some((kw) => ind.includes(kw))) {
      return {
        playbook: pb,
        topUseCases: rankUseCases(pb.useCases),
        matchType: "keyword",
        confidence: "medium",
      }
    }
  }

  return null
}

/**
 * Rank use cases by perceived value — Easy difficulty + bigger
 * monthlyValue floor surfaces the highest-leverage plays first.
 * The display will show top 2.
 */
function rankUseCases(useCases: PlaybookUseCase[]): PlaybookUseCase[] {
  const difficultyWeight: Record<PlaybookUseCase["difficulty"], number> = {
    Easy: 3,
    Medium: 2,
    Advanced: 1,
  }
  return [...useCases]
    .sort((a, b) => {
      const wa = difficultyWeight[a.difficulty] + valueFloor(a.monthlyValue) / 1000
      const wb = difficultyWeight[b.difficulty] + valueFloor(b.monthlyValue) / 1000
      return wb - wa
    })
    .slice(0, 2)
}

function valueFloor(monthlyValue: string): number {
  // Pull the first dollar number from "$800-$1,500/mo" → 800
  const m = monthlyValue.match(/\$([\d,]+)/)
  if (!m || !m[1]) return 0
  return parseInt(m[1].replace(/,/g, ""), 10) || 0
}
