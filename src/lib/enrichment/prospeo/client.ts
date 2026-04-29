/**
 * Prospeo client — paid enrichment for company metadata + person details.
 *
 * Last in the pipeline because it's the only billed step. The orchestrator
 * checks `free_enrichment: true` on each response and skips the credit
 * debit when Prospeo confirms the match was free (deduped from a prior
 * paid lookup). Network/4xx errors throw a typed ProspeoError.
 */
import type {
  EnrichCompanyInput,
  EnrichPersonInput,
  ProspeoCompanyResponse,
  ProspeoErrorCode,
  ProspeoPersonResponse,
} from "./types"

const PROSPEO_BASE = "https://api.prospeo.io"
const DEFAULT_TIMEOUT_MS = 15000

export class ProspeoError extends Error {
  readonly code: ProspeoErrorCode
  readonly status: number
  constructor(code: ProspeoErrorCode, message: string, status = 0) {
    super(message)
    this.name = "ProspeoError"
    this.code = code
    this.status = status
  }
}

export function normalizeDomain(raw: string | null | undefined): string | null {
  if (!raw) return null
  const trimmed = raw.trim()
  if (!trimmed) return null
  try {
    const withProto = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
    const url = new URL(withProto)
    const host = url.hostname.toLowerCase().replace(/^www\./, "")
    if (!host || !host.includes(".")) return null
    return host
  } catch {
    return null
  }
}

function getKey(): string {
  const k = process.env.PROSPEO_API_KEY
  if (!k) throw new ProspeoError("NOT_CONFIGURED", "PROSPEO_API_KEY is not configured", 503)
  return k
}

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const apiKey = getKey()
  let res: Response
  try {
    res = await fetch(`${PROSPEO_BASE}${path}`, {
      method: "POST",
      headers: { "X-KEY": apiKey, "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(DEFAULT_TIMEOUT_MS),
    })
  } catch (err) {
    throw new ProspeoError(
      "NETWORK_ERROR",
      err instanceof Error ? err.message : "Network error",
      0,
    )
  }

  const text = await res.text()
  let json: unknown = null
  try {
    json = text ? JSON.parse(text) : null
  } catch {
    throw new ProspeoError("INTERNAL_ERROR", `Non-JSON response (${res.status})`, res.status)
  }

  const isRecord = (v: unknown): v is Record<string, unknown> =>
    typeof v === "object" && v !== null && !Array.isArray(v)

  if (!res.ok || (isRecord(json) && json.error === true)) {
    const code: ProspeoErrorCode =
      isRecord(json) && typeof json.error_code === "string"
        ? (json.error_code as ProspeoErrorCode)
        : res.status === 401
          ? "INVALID_API_KEY"
          : res.status === 429
            ? "RATE_LIMITED"
            : "INTERNAL_ERROR"
    const msg =
      isRecord(json) && typeof json.message === "string" ? json.message : `Prospeo failed (${code})`
    throw new ProspeoError(code, msg, res.status)
  }

  return json as T
}

export async function enrichCompany(
  input: EnrichCompanyInput,
): Promise<ProspeoCompanyResponse> {
  if (
    !input.company_id &&
    !input.company_linkedin_url &&
    !input.company_website &&
    !input.company_name
  ) {
    throw new ProspeoError(
      "INVALID_REQUEST",
      "Need website, LinkedIn URL, or name",
      400,
    )
  }
  const data: Record<string, string> = {}
  if (input.company_id) data.company_id = input.company_id
  if (input.company_linkedin_url) data.company_linkedin_url = input.company_linkedin_url
  if (input.company_website) data.company_website = input.company_website
  if (input.company_name) data.company_name = input.company_name
  return postJson<ProspeoCompanyResponse>("/enrich-company", { data })
}

export async function enrichPerson(input: EnrichPersonInput): Promise<ProspeoPersonResponse> {
  const hasName = (input.first_name && input.last_name) || input.full_name
  const hasCompany =
    input.company_name || input.company_website || input.company_linkedin_url
  if (
    !input.person_id &&
    !input.linkedin_url &&
    !input.email &&
    !(hasName && hasCompany)
  ) {
    throw new ProspeoError(
      "INVALID_REQUEST",
      "Need email, LinkedIn URL, or name+company",
      400,
    )
  }
  const data: Record<string, string> = {}
  for (const k of [
    "person_id",
    "linkedin_url",
    "email",
    "full_name",
    "first_name",
    "last_name",
    "company_name",
    "company_website",
    "company_linkedin_url",
  ] as const) {
    const v = input[k]
    if (v) data[k] = v
  }
  const body: Record<string, unknown> = { data }
  if (input.only_verified_email) body.only_verified_email = true
  if (input.enrich_mobile) body.enrich_mobile = true
  if (input.only_verified_mobile) body.only_verified_mobile = true
  return postJson<ProspeoPersonResponse>("/enrich-person", body)
}
