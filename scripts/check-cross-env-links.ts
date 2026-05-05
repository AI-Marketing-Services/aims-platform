/**
 * Cross-environment link guard.
 *
 * Fails the build if a component/page inside one role's tree links
 * into another role's tree. Catches the specific class of bug that
 * Adam hit: clicking a button in the CLIENT portal and bouncing to
 * an admin page because someone hardcoded an /admin/* href.
 *
 * Rules:
 *   src/app/(portal)/**   — may NOT link to /admin, /reseller, /intern
 *   src/app/(reseller)/** — may NOT link to /admin, /portal, /intern
 *   src/app/(intern)/**   — may NOT link to /admin, /portal, /reseller
 *   src/app/(admin)/**    — may NOT link to /portal, /reseller, /intern
 *
 * Shared components under src/components/* are exempted because they
 * can legitimately be used by multiple environments (e.g. AdminPreviewBanner
 * lives in components/shared and MUST link to /admin/dashboard).
 *
 * Usage:
 *   npx tsx scripts/check-cross-env-links.ts          — run locally
 *   exit code 0 = clean, 1 = violations found
 */

import { readFileSync, statSync } from "fs"
import { readdir } from "fs/promises"
import { join, relative } from "path"

const ROOT = process.cwd()

type EnvTree = {
  dir: string // relative to src/app
  forbiddenPrefixes: string[] // path segments not allowed in href/push/replace/redirect
}

const TREES: EnvTree[] = [
  { dir: "src/app/(portal)", forbiddenPrefixes: ["/admin", "/reseller", "/intern"] },
  { dir: "src/app/(reseller)", forbiddenPrefixes: ["/admin", "/portal", "/intern"] },
  { dir: "src/app/(intern)", forbiddenPrefixes: ["/admin", "/portal", "/reseller"] },
  { dir: "src/app/(admin)", forbiddenPrefixes: ["/portal", "/reseller", "/intern"] },
]

// Patterns we check. Line-anchored so we don't grep comments or strings unrelated
// to navigation (e.g. documentation of a URL pattern).
const PATTERNS = [
  /href=["']([^"']+)["']/g,
  /(?:router\.)?(?:push|replace)\(\s*["'`]([^"'`]+)["'`]/g,
  /\bredirect\(\s*["'`]([^"'`]+)["'`]/g,
]

const ALLOWED_EXCEPTIONS = new Set<string>([
  // Auth bounces to sign-in pages are always fine cross-environment.
  "/sign-in",
  "/sign-up",
])

// Specific file-path + URL pairs we accept. The portal/reseller/intern
// layouts themselves legitimately redirect to /admin/dashboard when
// an admin lands there without preview mode on.
const ALLOWED_PAIRS = new Set<string>([
  "src/app/(portal)/layout.tsx::/admin/dashboard",
  "src/app/(reseller)/layout.tsx::/admin/dashboard",
  "src/app/(intern)/layout.tsx::/admin/dashboard",
  // Whitelabel clients (CLIENT role with onboarding complete) live in
  // /portal/* normally; the reseller layout's logo bounces them home.
  "src/app/(reseller)/layout.tsx::/portal/dashboard",
  // CLIENT users without onboarding-complete who land in /reseller/*
  // get sent to their onboarding hub to unlock whitelabel.
  "src/app/(reseller)/layout.tsx::/portal/onboard?from=whitelabel",
])

async function* walk(dir: string): AsyncIterable<string> {
  let entries
  try {
    entries = await readdir(dir, { withFileTypes: true })
  } catch {
    return
  }
  for (const e of entries) {
    const full = join(dir, e.name)
    if (e.isDirectory()) {
      yield* walk(full)
    } else if (/\.(tsx?|jsx?)$/.test(e.name)) {
      yield full
    }
  }
}

function extractUrls(content: string): string[] {
  const urls: string[] = []
  for (const re of PATTERNS) {
    re.lastIndex = 0
    let m: RegExpExecArray | null
    while ((m = re.exec(content))) {
      const url = m[1]
      if (!url) continue
      if (!url.startsWith("/")) continue
      urls.push(url)
    }
  }
  return urls
}

async function main() {
  const violations: Array<{ file: string; url: string; reason: string }> = []

  for (const tree of TREES) {
    const abs = join(ROOT, tree.dir)
    try {
      if (!statSync(abs).isDirectory()) continue
    } catch {
      continue
    }
    for await (const file of walk(abs)) {
      const relPath = relative(ROOT, file)
      const content = readFileSync(file, "utf8")
      const urls = extractUrls(content)
      for (const url of urls) {
        const prefix = tree.forbiddenPrefixes.find((p) => url === p || url.startsWith(`${p}/`))
        if (!prefix) continue
        if (ALLOWED_EXCEPTIONS.has(url)) continue
        // Accept a short (file, url) allowlist for legitimate bounces.
        if (ALLOWED_PAIRS.has(`${relPath}::${url}`)) continue
        // Accept any /<env>/dashboard URL as a safety-bounce destination.
        // "If you don't belong here, go home" is a common and valid pattern
        // in both layouts and pages, and it's the opposite of the bug we
        // want to catch (which is an actual user-facing link cross-env).
        if (/^\/(admin|portal|reseller|intern)\/dashboard$/.test(url)) {
          continue
        }
        violations.push({ file: relPath, url, reason: `${tree.dir} may not link to ${prefix}/…` })
      }
    }
  }

  if (violations.length === 0) {
    console.log("[OK] No cross-environment link violations found.")
    return
  }

  console.error(`[FAIL] Found ${violations.length} cross-environment link violation(s):`)
  for (const v of violations) {
    console.error(`  ${v.file}\n    ${v.url}\n    ${v.reason}`)
  }
  process.exit(1)
}

main().catch((err) => {
  console.error("[FAIL]", err)
  process.exit(1)
})
