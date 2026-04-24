/**
 * Minimal HTML → plain text converter for Mighty post bodies.
 *
 * Real HTML parsing is overkill for what Mighty serves (basic articles
 * with <p>, <h*>, <ul>, <a>, <img>, <strong>, <em>, newlines). If we
 * ever need rich rendering we can swap to sanitize-html, but for
 * search + chat snippets this is plenty.
 *
 * Rules:
 *   - Convert block-ish tags (p, div, h1-6, li, br, tr) to newlines
 *   - Strip everything else
 *   - Decode common HTML entities
 *   - Collapse whitespace
 */

const BLOCK_TAGS = new Set([
  "p", "div", "h1", "h2", "h3", "h4", "h5", "h6",
  "li", "br", "tr", "section", "article", "header", "footer",
])

export function htmlToPlainText(html: string | null | undefined): string {
  if (!html) return ""

  let text = html

  // Insert newlines for block-ish open/close tags.
  text = text.replace(/<\/?([a-z][a-z0-9]*)\b[^>]*>/gi, (_, tag: string) => {
    return BLOCK_TAGS.has(tag.toLowerCase()) ? "\n" : ""
  })

  // Decode the handful of entities Mighty actually emits.
  text = text
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, code: string) => {
      const n = parseInt(code, 10)
      return Number.isFinite(n) ? String.fromCodePoint(n) : ""
    })

  // Collapse whitespace runs but preserve paragraph breaks (double \n).
  text = text
    .split("\n")
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter((line, i, arr) => !(line === "" && arr[i - 1] === ""))
    .join("\n")
    .trim()

  return text
}

export function truncate(text: string, max: number): string {
  if (text.length <= max) return text
  return text.slice(0, max - 1).trimEnd() + "…"
}
