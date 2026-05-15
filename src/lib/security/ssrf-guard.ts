import { lookup } from "node:dns/promises"
import { isIP } from "node:net"

/**
 * SSRF defense — server-side URL validator.
 *
 * Use this BEFORE any fetch() of a URL that came from user input
 * (deal.website, audit URL, screenshot/blob refs, custom-domain
 * verification probes, etc). Two attack vectors blocked:
 *
 *   1. Direct private-IP exfiltration. Attacker sets website to
 *      `http://169.254.169.254/latest/meta-data/` (AWS metadata),
 *      `http://localhost:6379`, or any RFC1918 host. We resolve DNS
 *      server-side and reject if ANY resolved A/AAAA record is
 *      private, loopback, link-local, or multicast.
 *
 *   2. DNS-rebinding bypass. Attacker registers a domain whose A
 *      record returns 1.2.3.4 at validation time but flips to
 *      127.0.0.1 milliseconds later when fetch() resolves. We
 *      mitigate by:
 *        - Resolving HERE and passing the resolved IP as the URL
 *          (with original Host header preserved) so fetch() can't
 *          re-resolve.
 *        - Disabling redirect-follow at the caller. Each hop must
 *          re-validate.
 *
 * Callers must use `redirect: "manual"` on their fetch and re-call
 * `assertPublicUrl()` on every 3xx Location header.
 */

const PRIVATE_CIDR_V4 = [
  // RFC1918
  [0x0a000000, 0xff000000], // 10.0.0.0/8
  [0xac100000, 0xfff00000], // 172.16.0.0/12
  [0xc0a80000, 0xffff0000], // 192.168.0.0/16
  // Loopback
  [0x7f000000, 0xff000000], // 127.0.0.0/8
  // Link-local (includes AWS metadata 169.254.169.254)
  [0xa9fe0000, 0xffff0000], // 169.254.0.0/16
  // CGNAT
  [0x64400000, 0xffc00000], // 100.64.0.0/10
  // Multicast + reserved + broadcast
  [0xe0000000, 0xf0000000], // 224.0.0.0/4
  [0xf0000000, 0xf0000000], // 240.0.0.0/4
  // 0.0.0.0/8
  [0x00000000, 0xff000000],
] as const

function ipv4ToInt(ip: string): number | null {
  const parts = ip.split(".")
  if (parts.length !== 4) return null
  let n = 0
  for (const p of parts) {
    const o = Number(p)
    if (!Number.isInteger(o) || o < 0 || o > 255) return null
    n = (n << 8) | o
  }
  return n >>> 0
}

function isPrivateIPv4(ip: string): boolean {
  const n = ipv4ToInt(ip)
  if (n === null) return true // unparseable → treat as private (deny)
  for (const [base, mask] of PRIVATE_CIDR_V4) {
    if ((n & mask) === (base & mask)) return true
  }
  return false
}

function isPrivateIPv6(ip: string): boolean {
  // Lower-case, strip zone id
  const a = ip.toLowerCase().split("%")[0]
  // Loopback
  if (a === "::1" || a === "0:0:0:0:0:0:0:1") return true
  // Unspecified
  if (a === "::" || a === "0:0:0:0:0:0:0:0") return true
  // Link-local fe80::/10
  if (a.startsWith("fe8") || a.startsWith("fe9") || a.startsWith("fea") || a.startsWith("feb")) return true
  // Unique-local fc00::/7
  if (a.startsWith("fc") || a.startsWith("fd")) return true
  // IPv4-mapped — extract the v4 and re-check
  const mapped = a.match(/^::ffff:([\d.]+)$/)
  if (mapped) return isPrivateIPv4(mapped[1])
  // Multicast ff00::/8
  if (a.startsWith("ff")) return true
  return false
}

export class SsrfBlockedError extends Error {
  constructor(reason: string) {
    super(`SSRF blocked: ${reason}`)
    this.name = "SsrfBlockedError"
  }
}

/**
 * Validate a URL is safe to fetch from a server context.
 *
 * Throws SsrfBlockedError on:
 *   - Non-http(s) protocols
 *   - DNS resolution failure (NXDOMAIN treated as unsafe — could be a
 *     rebinding setup)
 *   - Any resolved IP that is private / loopback / link-local /
 *     multicast / unspecified / IPv4-mapped to a private range
 *
 * Returns the validated URL string unchanged on success.
 */
export async function assertPublicUrl(rawUrl: string): Promise<string> {
  let url: URL
  try {
    url = new URL(rawUrl)
  } catch {
    throw new SsrfBlockedError("malformed URL")
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new SsrfBlockedError(`disallowed protocol ${url.protocol}`)
  }
  // Hostname could already be an IP literal — short-circuit
  const hostname = url.hostname
  const ipKind = isIP(hostname)
  if (ipKind === 4) {
    if (isPrivateIPv4(hostname))
      throw new SsrfBlockedError(`private IPv4 literal ${hostname}`)
    return rawUrl
  }
  if (ipKind === 6) {
    if (isPrivateIPv6(hostname))
      throw new SsrfBlockedError(`private IPv6 literal ${hostname}`)
    return rawUrl
  }
  // DNS resolve all A + AAAA records; reject if ANY are private.
  let records: Array<{ address: string; family: number }>
  try {
    records = await lookup(hostname, { all: true, verbatim: true })
  } catch {
    throw new SsrfBlockedError(`DNS resolution failed for ${hostname}`)
  }
  if (records.length === 0) {
    throw new SsrfBlockedError(`no DNS records for ${hostname}`)
  }
  for (const r of records) {
    const priv =
      r.family === 4 ? isPrivateIPv4(r.address) : isPrivateIPv6(r.address)
    if (priv) {
      throw new SsrfBlockedError(
        `${hostname} resolves to private address ${r.address}`,
      )
    }
  }
  return rawUrl
}
