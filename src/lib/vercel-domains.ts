// lib/vercel-domains.ts
// Vercel Domains API wrapper for reseller whitelabel custom domain management.

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface VerificationRecord {
  type: string
  domain: string
  value: string
}

export interface AddDomainResult {
  name: string
  verified: boolean
  verification: VerificationRecord[]
}

export interface DomainDetail {
  name: string
  verified: boolean
  verification: VerificationRecord[]
}

export interface VerifyResult {
  verified: boolean
  error?: {
    code: string
    message?: string
  }
}

export interface DomainConfig {
  misconfigured: boolean
  cnames: string[]
  aValues: string[]
}

export interface DnsRecord {
  type: 'A' | 'CNAME' | 'TXT'
  name: string
  value: string
}

export interface DnsInstructions {
  isApex: boolean
  records: DnsRecord[]
}

export interface DnsRecordStatus {
  type: 'A' | 'CNAME' | 'TXT'
  name: string
  value: string
  ok: boolean
}

export interface DnsStatus {
  allOk: boolean
  records: DnsRecordStatus[]
}

export interface SafeDomainStatus {
  ok: boolean
  reason?: string
  config?: DomainConfig
  verify?: VerifyResult
}

// ---------------------------------------------------------------------------
// Custom Errors
// ---------------------------------------------------------------------------

export class VercelDomainsNotConfiguredError extends Error {
  readonly code = 'vercel_domains_not_configured'

  constructor() {
    super(
      'Vercel Domains integration is not configured. Set VERCEL_TOKEN and VERCEL_PROJECT_ID.'
    )
    this.name = 'VercelDomainsNotConfiguredError'
  }
}

export class VercelDomainsApiError extends Error {
  readonly code: string
  readonly status: number

  constructor(status: number, code: string, message: string) {
    super(message)
    this.name = 'VercelDomainsApiError'
    this.status = status
    this.code = code
  }
}

// ---------------------------------------------------------------------------
// Config helpers
// ---------------------------------------------------------------------------

export function isVercelDomainsConfigured(): boolean {
  return Boolean(process.env.VERCEL_TOKEN && process.env.VERCEL_PROJECT_ID)
}

function assertConfigured(): void {
  if (!isVercelDomainsConfigured()) {
    throw new VercelDomainsNotConfiguredError()
  }
}

function getConfig(): {
  token: string
  projectId: string
  teamId: string | undefined
} {
  return {
    token: process.env.VERCEL_TOKEN as string,
    projectId: process.env.VERCEL_PROJECT_ID as string,
    teamId: process.env.VERCEL_TEAM_ID || undefined,
  }
}

// ---------------------------------------------------------------------------
// Core fetch helper
// ---------------------------------------------------------------------------

async function vercelFetch<T>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const { token, teamId } = getConfig()

  const url = new URL(`https://api.vercel.com${path}`)
  if (teamId) {
    url.searchParams.set('teamId', teamId)
  }

  const response = await fetch(url.toString(), {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
  })

  if (response.status === 204 || response.headers.get('content-length') === '0') {
    return undefined as unknown as T
  }

  const body = await response.json()

  if (!response.ok) {
    const isServerError = response.status >= 500
    const code: string = body?.error?.code ?? 'unknown'
    const message: string = body?.error?.message ?? response.statusText

    if (isServerError) {
      console.error(`[vercel-domains] Upstream ${response.status} on ${path}:`, message)
    }

    throw new VercelDomainsApiError(response.status, code, message)
  }

  return body as T
}

// ---------------------------------------------------------------------------
// Apex vs subdomain detection
// ---------------------------------------------------------------------------

function isApexDomain(domain: string): boolean {
  return domain.split('.').length <= 2
}

// ---------------------------------------------------------------------------
// getDomainDetail — GET /v9/projects/{projectId}/domains/{domain}
// ---------------------------------------------------------------------------

export async function getDomainDetail(domain: string): Promise<DomainDetail> {
  assertConfigured()
  const { projectId } = getConfig()

  const raw = await vercelFetch<{
    name: string
    verified: boolean
    verification?: VerificationRecord[]
  }>(`/v9/projects/${projectId}/domains/${domain}`)

  return {
    name: raw.name,
    verified: raw.verified ?? false,
    verification: raw.verification ?? [],
  }
}

// ---------------------------------------------------------------------------
// addDomain — POST /v10/projects/{projectId}/domains
// Gotcha 1: empty verification[] → internally fetches getDomainDetail
// Gotcha 2: domain_already_exists → soft warning, returns existing shape
// ---------------------------------------------------------------------------

export async function addDomain(domain: string): Promise<AddDomainResult> {
  assertConfigured()
  const { projectId } = getConfig()

  let raw: {
    name: string
    verified: boolean
    verification?: VerificationRecord[]
  }

  try {
    raw = await vercelFetch<typeof raw>(`/v10/projects/${projectId}/domains`, {
      method: 'POST',
      body: JSON.stringify({ name: domain }),
    })
  } catch (err) {
    // Gotcha 2: domain_already_exists is a soft warning
    if (err instanceof VercelDomainsApiError && err.code === 'domain_already_exists') {
      const detail = await getDomainDetail(domain)
      return detail
    }
    throw err
  }

  // Gotcha 1: empty / missing verification[] — fetch detail to populate it
  if (!raw.verification || raw.verification.length === 0) {
    const detail = await getDomainDetail(domain)
    return {
      name: raw.name ?? detail.name,
      verified: raw.verified ?? detail.verified,
      verification: detail.verification,
    }
  }

  return {
    name: raw.name,
    verified: raw.verified ?? false,
    verification: raw.verification,
  }
}

// ---------------------------------------------------------------------------
// removeDomain — DELETE /v9/projects/{projectId}/domains/{domain}
// ---------------------------------------------------------------------------

export async function removeDomain(domain: string): Promise<void> {
  assertConfigured()
  const { projectId } = getConfig()

  await vercelFetch<void>(`/v9/projects/${projectId}/domains/${domain}`, {
    method: 'DELETE',
  })
}

// ---------------------------------------------------------------------------
// verifyDomain — POST /v9/projects/{projectId}/domains/{domain}/verify
// ---------------------------------------------------------------------------

export async function verifyDomain(domain: string): Promise<VerifyResult> {
  assertConfigured()
  const { projectId } = getConfig()

  try {
    const raw = await vercelFetch<{ verified: boolean }>(`/v9/projects/${projectId}/domains/${domain}/verify`, {
      method: 'POST',
    })
    return { verified: raw.verified ?? false }
  } catch (err) {
    if (err instanceof VercelDomainsApiError) {
      return {
        verified: false,
        error: { code: err.code, message: err.message },
      }
    }
    throw err
  }
}

// ---------------------------------------------------------------------------
// getDomainConfig — GET /v6/domains/{domain}/config
// ---------------------------------------------------------------------------

export async function getDomainConfig(domain: string): Promise<DomainConfig> {
  assertConfigured()

  const raw = await vercelFetch<{
    misconfigured: boolean
    cnames?: string[]
    aValues?: string[]
  }>(`/v6/domains/${domain}/config`)

  return {
    misconfigured: raw.misconfigured ?? true,
    cnames: raw.cnames ?? [],
    aValues: raw.aValues ?? [],
  }
}

// ---------------------------------------------------------------------------
// buildDnsInstructions — returns the records a user must set
// Apex:      A @ 76.76.21.21  +  TXT _vercel <challenge>
// Subdomain: CNAME <name> cname.vercel-dns.com  +  TXT _vercel <challenge>
// Gotcha 3: apex vs subdomain detection via split('.').length
// ---------------------------------------------------------------------------

export function buildDnsInstructions(
  domain: string,
  txtChallenge: string
): DnsInstructions {
  const apex = isApexDomain(domain)
  const txtRecord: DnsRecord = {
    type: 'TXT',
    name: '_vercel',
    value: txtChallenge,
  }

  if (apex) {
    return {
      isApex: true,
      records: [
        { type: 'A', name: '@', value: '76.76.21.21' },
        txtRecord,
      ],
    }
  }

  const subName = domain.split('.')[0]
  return {
    isApex: false,
    records: [
      { type: 'CNAME', name: subName, value: 'cname.vercel-dns.com' },
      txtRecord,
    ],
  }
}

// ---------------------------------------------------------------------------
// buildDnsStatus — cross-references config + verify error for per-record status
// ---------------------------------------------------------------------------

export function buildDnsStatus(
  domain: string,
  config: DomainConfig | null,
  verifyError: string | null
): DnsStatus {
  const apex = isApexDomain(domain)
  const txtMissing = verifyError === 'missing_txt_record'

  if (!config) {
    const placeholder: DnsRecordStatus[] = apex
      ? [
          { type: 'A', name: '@', value: '76.76.21.21', ok: false },
          { type: 'TXT', name: '_vercel', value: '', ok: false },
        ]
      : [
          { type: 'CNAME', name: domain.split('.')[0], value: 'cname.vercel-dns.com', ok: false },
          { type: 'TXT', name: '_vercel', value: '', ok: false },
        ]
    return { allOk: false, records: placeholder }
  }

  const pointingOk = apex
    ? config.aValues.includes('76.76.21.21')
    : config.cnames.includes('cname.vercel-dns.com')

  const pointingRecord: DnsRecordStatus = apex
    ? { type: 'A', name: '@', value: '76.76.21.21', ok: pointingOk }
    : {
        type: 'CNAME',
        name: domain.split('.')[0],
        value: 'cname.vercel-dns.com',
        ok: pointingOk,
      }

  const txtRecord: DnsRecordStatus = {
    type: 'TXT',
    name: '_vercel',
    value: '',
    ok: !txtMissing && !config.misconfigured,
  }

  const allOk = !config.misconfigured && pointingOk && !txtMissing

  return {
    allOk,
    records: [pointingRecord, txtRecord],
  }
}

// ---------------------------------------------------------------------------
// safeGetDomainStatus — polling-safe wrapper
// Gotcha 4: never throws on Vercel 5xx in status-poll paths
// ---------------------------------------------------------------------------

export async function safeGetDomainStatus(domain: string): Promise<SafeDomainStatus> {
  if (!isVercelDomainsConfigured()) {
    return { ok: false, reason: 'not_configured' }
  }

  try {
    const [config, verify] = await Promise.all([
      getDomainConfig(domain),
      verifyDomain(domain),
    ])
    return { ok: true, config, verify }
  } catch (err) {
    if (err instanceof VercelDomainsApiError && err.status >= 500) {
      return { ok: false, reason: `vercel_${err.status}` }
    }
    if (err instanceof VercelDomainsApiError) {
      return { ok: false, reason: err.code }
    }
    return { ok: false, reason: 'unexpected_error' }
  }
}
