/**
 * Credit pricing — the canonical cost table for every enrichment operation.
 * Tuned to actual API spend × ~3x margin so credit revenue covers costs.
 */

export const CREDIT_COSTS = {
  // Discovery — Scout tool
  PLACES_SEARCH: 1,
  // Enrichment pipeline
  WEBSITE_SCRAPE: 0, // free (no API)
  PERPLEXITY_RESEARCH: 2,
  HUNTER_DOMAIN_SEARCH: 3,
  HUNTER_EMAIL_FINDER: 5,
  PROSPEO_COMPANY_BILLABLE: 10,
  PROSPEO_PERSON_BILLABLE: 15,
  // Free responses (deduped Prospeo matches return free_enrichment: true)
  PROSPEO_COMPANY_FREE: 0,
  PROSPEO_PERSON_FREE: 0,
} as const

export type CreditCostKey = keyof typeof CREDIT_COSTS

/**
 * Worst-case enrichment cost — used for the pre-flight balance check
 * before kicking off the orchestrator. Real spend is usually lower
 * because Prospeo dedup + Hunter caching avoid charges.
 */
export const MAX_ENRICHMENT_COST =
  CREDIT_COSTS.PERPLEXITY_RESEARCH +
  CREDIT_COSTS.HUNTER_DOMAIN_SEARCH +
  CREDIT_COSTS.HUNTER_EMAIL_FINDER +
  CREDIT_COSTS.PROSPEO_COMPANY_BILLABLE +
  CREDIT_COSTS.PROSPEO_PERSON_BILLABLE * 4 // up to 4 person lookups

// Plan tiers + monthly grants
export const PLAN_GRANTS: Record<string, number> = {
  trial: 50,
  operator: 500,
  pro: 2000,
  agency: 10000,
}

export const PLAN_LABELS: Record<string, string> = {
  trial: "Trial",
  operator: "Operator",
  pro: "Pro",
  agency: "Agency",
}
