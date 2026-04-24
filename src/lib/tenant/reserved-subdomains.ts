/**
 * Subdomains that resellers cannot claim because they map to platform
 * infrastructure or create routing ambiguity. Keep in sync with any new
 * top-level routes you add under aioperatorcollective.com.
 *
 * No external imports — this file is referenced from middleware (edge
 * runtime), API routes (node), and client components (browser).
 */
export const RESERVED_SUBDOMAINS: ReadonlySet<string> = new Set([
  'www',
  'app',
  'api',
  'admin',
  'auth',
  'mail',
  'docs',
  'blog',
  'help',
  'status',
  'portal',
  'reseller',
  'intern',
  'cdn',
  'static',
])

export function isReservedSubdomain(slug: string): boolean {
  return RESERVED_SUBDOMAINS.has(slug)
}
