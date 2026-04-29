/**
 * Prospeo API types — company + person enrichment shapes.
 *
 * `free_enrichment: true` means: this lookup was deduped against a prior
 * paid match — Prospeo doesn't charge again. Orchestrator must skip
 * credit-charging on these responses.
 */

export interface ProspeoCompany {
  company_id?: string | null
  name?: string | null
  website?: string | null
  domain?: string | null
  description?: string | null
  industry?: string | null
  employee_count?: number | null
  employee_range?: string | null
  country?: string | null
  state?: string | null
  city?: string | null
  revenue_range_printed?: string | null
  founded?: number | null
  linkedin_url?: string | null
  twitter_url?: string | null
  facebook_url?: string | null
  instagram_url?: string | null
  logo_url?: string | null
  phone_hq?:
    | {
        phone_hq?: string | null
        phone_hq_national?: string | null
        phone_hq_international?: string | null
      }
    | string
    | null
  keywords?: string[] | null
}

export interface ProspeoPerson {
  person_id?: string | null
  first_name?: string | null
  last_name?: string | null
  full_name?: string | null
  linkedin_url?: string | null
  job_title?: string | null
  email?: string | null
  email_status?: string | null
  mobile?: string | null
  mobile_status?: string | null
}

export interface ProspeoCompanyResponse {
  error: false
  free_enrichment: boolean
  company: ProspeoCompany
}

export interface ProspeoPersonResponse {
  error: false
  free_enrichment: boolean
  person: ProspeoPerson
  company?: ProspeoCompany | null
}

export type ProspeoErrorCode =
  | "NO_MATCH"
  | "INSUFFICIENT_CREDITS"
  | "INVALID_API_KEY"
  | "INVALID_REQUEST"
  | "INTERNAL_ERROR"
  | "RATE_LIMITED"
  | "NETWORK_ERROR"
  | "NOT_CONFIGURED"

export interface EnrichCompanyInput {
  company_website?: string | null
  company_linkedin_url?: string | null
  company_name?: string | null
  company_id?: string | null
}

export interface EnrichPersonInput {
  first_name?: string
  last_name?: string
  full_name?: string
  linkedin_url?: string
  email?: string
  company_name?: string
  company_website?: string
  company_linkedin_url?: string
  person_id?: string
  only_verified_email?: boolean
  enrich_mobile?: boolean
  only_verified_mobile?: boolean
}
