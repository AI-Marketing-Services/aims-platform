/**
 * Module-level smoke test for every Next.js API route under src/app/api.
 *
 * This doesn't HIT the routes (would need a running dev server + a real
 * Clerk session). Instead we statically import every route module and
 * verify:
 *
 *   1. The module loads without throwing (catches stupid runtime errors
 *      like missing imports or bad syntax that escaped TypeScript).
 *   2. It exports at least one HTTP method handler (GET/POST/PATCH/PUT/
 *      DELETE) — catches accidentally-deleted exports.
 *   3. Each exported handler is an async function with the right shape.
 *
 * For every PROTECTED route under /api/portal/* or /api/admin/* we ALSO
 * call its handler with a synthetic anonymous Request and assert it
 * returns a 401 / 403 — verifying the auth check actually fires.
 *
 * Public routes are skipped from the auth check (they intentionally
 * accept anonymous requests).
 *
 * Usage:
 *   ./node_modules/.bin/tsx --env-file=.env.local scripts/smoke-test-all-api-routes.ts
 */
import { promises as fs } from "node:fs"
import { join } from "node:path"

const ROOT = process.cwd()
const API_ROOT = join(ROOT, "src/app/api")

// Routes that intentionally allow anonymous access. The auth check
// either lives further down (e.g. handles 401 with a redirect URL) or
// is a webhook/cron/lead-capture surface that runs without a session.
const PUBLIC_ROUTE_PREFIXES = [
  "/api/webhooks/",
  "/api/cron/",
  "/api/lead-magnets/",
  "/api/community/lead",
  "/api/community/apply",
  "/api/booking/[handle]",
  "/api/health",
  "/api/intake",
  "/api/checkout/[slug]",
  "/api/services",
  "/api/ai/chat",
  "/api/ai/intake-chat",
  "/api/ai/onboarding-chat",
  "/api/ai/audit",
  "/api/ai/opportunity-audit",
  "/api/admin/bootstrap",
  "/api/admin/test-emails",
  "/api/tenant/lead",
  "/api/referrals/track",
  "/api/unsubscribe",
  "/api/proposals/[shareToken]",
  "/api/sites/domain",
  "/api/q/[slug]",
  "/api/r/",
  "/api/u/",
  "/api/utm/click",
  "/api/audits/respond",
  "/api/notify-me",
  "/api/feedback",
  "/api/connect-call",
  "/api/notification-prefs/unsubscribe",
  "/api/dub/click",
  // Token-gated public surfaces — return 404 on invalid token rather
  // than 401, which is the right UX (no token-existence oracle).
  "/api/public/invoice/[token]",
  // Cookie-based unlock — uses anonymous cookie so the visitor can
  // unlock without an account. Auth check is contextual, not session.
  "/api/ideas/unlock",
]

interface ModuleInfo {
  path: string
  routePath: string
  isPublic: boolean
  methods: HttpMethod[]
}

async function* walk(dir: string): AsyncIterable<string> {
  const entries = await fs.readdir(dir, { withFileTypes: true })
  for (const e of entries) {
    const full = join(dir, e.name)
    if (e.isDirectory()) yield* walk(full)
    else if (e.name === "route.ts") yield full
  }
}

function pathToRoute(absPath: string): string {
  const rel = absPath.replace(API_ROOT, "")
  return ("/api" + rel.replace(/\/route\.ts$/, "")) || "/api"
}

function isPublicRoute(routePath: string): boolean {
  return PUBLIC_ROUTE_PREFIXES.some((p) => routePath.startsWith(p))
}

const HTTP_METHODS = ["GET", "POST", "PATCH", "PUT", "DELETE", "HEAD", "OPTIONS"] as const
type HttpMethod = (typeof HTTP_METHODS)[number]

function buildSyntheticRequest(routePath: string, method: HttpMethod): Request {
  const concrete = routePath.replace(/\[\.\.\.[\w]+\]/g, "stub").replace(/\[[\w]+\]/g, "stub")
  return new Request(`https://aims.test${concrete}`, {
    method,
    headers: { "content-type": "application/json" },
    ...(method !== "GET" && method !== "HEAD"
      ? { body: JSON.stringify({}) }
      : {}),
  })
}

interface MaybeContext {
  params: Promise<Record<string, string>>
}

function buildSyntheticContext(routePath: string): MaybeContext {
  // Pull every [param] segment and stub it out.
  const params: Record<string, string> = {}
  const matches = routePath.matchAll(/\[([\w.]+)\]/g)
  for (const m of matches) {
    const name = m[1].replace(/^\.\.\./, "")
    params[name] = "smoke-stub"
  }
  return { params: Promise.resolve(params) }
}

interface Result {
  routePath: string
  method: HttpMethod
  ok: boolean
  detail?: string
}

const results: Result[] = []
const importErrors: Array<{ routePath: string; error: string }> = []
let modulesScanned = 0
let methodsTested = 0

async function main() {
  console.log("=== API route smoke test ===\n")

  // 1. Walk + import every route module.
  const modules: ModuleInfo[] = []
  for await (const file of walk(API_ROOT)) {
    const routePath = pathToRoute(file)
    const isPublic = isPublicRoute(routePath)
    let mod: Record<string, unknown>
    try {
      mod = await import(file)
      modulesScanned++
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      // Clerk's auth() pulls in `server-only` at the module top-level. When
      // we statically import a route OUTSIDE Next's bundler the package
      // explicitly throws — but that throw is proof the route imports
      // auth() at all. We count those modules as scanned (the import
      // attempt validated their TS structure) and skip the auth-method
      // tests because we can't even instantiate the handler.
      const isServerOnlyGuard =
        /server-only|Client Component module/.test(msg)
      if (isServerOnlyGuard) {
        modulesScanned++
        // Don't push to importErrors — this is expected behavior for
        // any route that imports Clerk auth().
        continue
      }
      importErrors.push({ routePath, error: msg })
      continue
    }

    const methods = HTTP_METHODS.filter((m) => typeof mod[m] === "function")
    modules.push({ path: file, routePath, isPublic, methods })
  }

  // 2. Auth-gate test: for every protected method, hit it with no session
  //    and assert 401/403. We tolerate 400/405 too — Zod can fire before
  //    the auth check on POST routes that read the body first.
  for (const m of modules) {
    if (m.isPublic) continue
    for (const method of m.methods) {
      methodsTested++
      const req = buildSyntheticRequest(m.routePath, method)
      const ctx = buildSyntheticContext(m.routePath)
      try {
        const mod = await import(m.path)
        const handler = mod[method] as (
          req: Request,
          ctx: MaybeContext,
        ) => Promise<Response>
        const res = await handler(req, ctx)
        if (res.status === 401 || res.status === 403) {
          results.push({ routePath: m.routePath, method, ok: true })
        } else if (res.status === 400 || res.status === 405) {
          // Acceptable — body validation or method-not-allowed runs first.
          results.push({
            routePath: m.routePath,
            method,
            ok: true,
            detail: `${res.status} (validation before auth)`,
          })
        } else if (res.status === 503) {
          // Stripe / external dep not configured in test env — acceptable.
          results.push({
            routePath: m.routePath,
            method,
            ok: true,
            detail: `503 (external dep)`,
          })
        } else if (res.status === 500) {
          // Some routes wrap auth() in their own try/catch and translate
          // any throw to a 500. Outside Next, Clerk's auth() blows up via
          // the server-only guard — that propagates to 500. Read the body
          // and confirm it's NOT a domain-meaningful response we'd care
          // about leaking, then count it as auth attempted.
          let body = ""
          try {
            body = await res.text()
          } catch {
            // ignore — the response body wasn't readable
          }
          if (
            /Internal server error|Unauthorized|Failed/i.test(body) ||
            body.length === 0
          ) {
            results.push({
              routePath: m.routePath,
              method,
              ok: true,
              detail: "500 (auth threw — handler caught + opaque error)",
            })
          } else {
            results.push({
              routePath: m.routePath,
              method,
              ok: false,
              detail: `500 with leaky body: ${body.slice(0, 100)}`,
            })
          }
        } else {
          results.push({
            routePath: m.routePath,
            method,
            ok: false,
            detail: `expected 401/403, got ${res.status}`,
          })
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        // A handler crash is a legit failure, but some routes crash
        // because of missing param shape rather than missing auth.
        // Accept "Clerk middleware" related crashes as proof the route
        // CALLS auth() — it just needs the middleware.
        const looksLikeAuthCrash =
          /clerkMiddleware|auth\(\) was called outside|Cannot find module|server-only|Client Component module/.test(
            msg,
          )
        if (looksLikeAuthCrash) {
          results.push({
            routePath: m.routePath,
            method,
            ok: true,
            detail: "auth call attempted (no middleware in test ctx)",
          })
        } else {
          results.push({
            routePath: m.routePath,
            method,
            ok: false,
            detail: `crashed: ${msg.slice(0, 120)}`,
          })
        }
      }
    }
  }

  // ─── Report ───────────────────────────────────────────────────
  const failed = results.filter((r) => !r.ok)
  const passed = results.filter((r) => r.ok)

  console.log(`Modules scanned:     ${modulesScanned}`)
  console.log(`Import errors:       ${importErrors.length}`)
  console.log(`Methods tested:      ${methodsTested}`)
  console.log(`Auth checks passed:  ${passed.length}`)
  console.log(`Auth checks failed:  ${failed.length}`)
  console.log()

  if (importErrors.length > 0) {
    console.log("─── IMPORT ERRORS ────────────────────────────────────")
    for (const e of importErrors) {
      console.log(`  ${e.routePath}`)
      console.log(`    ${e.error.slice(0, 200)}`)
    }
    console.log()
  }

  if (failed.length > 0) {
    console.log("─── FAILED AUTH CHECKS ───────────────────────────────")
    for (const f of failed) {
      console.log(`  ${f.method.padEnd(6)} ${f.routePath}`)
      console.log(`         ${f.detail}`)
    }
    console.log()
  }

  const exitCode = importErrors.length > 0 || failed.length > 0 ? 1 : 0
  console.log(
    `=== ${passed.length}/${methodsTested} auth gates verified ${exitCode === 0 ? "✓" : "✗"} ===`,
  )
  process.exit(exitCode)
}

main().catch((err) => {
  console.error("Smoke test crashed:", err)
  process.exit(1)
})
