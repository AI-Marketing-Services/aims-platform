/**
 * Defensive dash stripper. Even with strict "no em-dashes" rules in
 * every AI system prompt, models occasionally slip in em-dashes,
 * en-dashes, figure dashes, or horizontal bars — all of which read as
 * "AI-written" and feel unprofessional in cold emails / proposals.
 *
 * We strip any of these long-dash variants:
 *   - U+2014  EM DASH          —
 *   - U+2013  EN DASH          –
 *   - U+2012  FIGURE DASH      ‒
 *   - U+2015  HORIZONTAL BAR   ―
 *   - U+2212  MINUS SIGN       −  (sometimes used decoratively)
 *   - U+2E3A  TWO-EM DASH      ⸺
 *   - U+2E3B  THREE-EM DASH    ⸻
 *
 * We do NOT strip the regular hyphen (-) or the soft hyphen — those
 * appear in legitimate compound words like "follow-up" and ranges.
 *
 * Strategy:
 *   1. Where dashes appear with surrounding spaces (sentence-joining
 *      use): replace with ": " — preserves clause structure cleanly.
 *   2. Where dashes appear inside tokens (compound use): replace with
 *      ", " — keeps the comma list feel.
 */

const LONG_DASH_CLASS = "[‒–—―−⸺⸻]"

const SPACED_DASH_RE = new RegExp(`\\s*${LONG_DASH_CLASS}\\s*`, "g")
const BARE_DASH_RE = new RegExp(LONG_DASH_CLASS, "g")

/**
 * Strip long-dash variants from a single string.
 * Safe to pass null/undefined — returns "".
 */
export function stripDashes(input: string | null | undefined): string {
  if (!input) return ""
  return input.replace(SPACED_DASH_RE, ": ").replace(BARE_DASH_RE, ",")
}

/**
 * Strip long-dash variants from each non-empty string in an array.
 * Useful for AI service / pain-point lists.
 */
export function stripDashesArr(input: readonly string[] | null | undefined): string[] {
  if (!input) return []
  return input.map(stripDashes).filter(Boolean)
}
