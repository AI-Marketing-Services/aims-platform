# Code Hardening Report

**Date:** 2026-04-16
**Project:** AIMS Platform
**Branch:** `hardening/2026-04-16`
**Baseline:**
- Build: ✅ clean
- Lint (`npx eslint src`): **43 problems (40 errors, 3 warnings)**
- Tests: **521 passing, 3 failing** (`tests/api-security.test.ts` — admin Mighty routes missing role checks)

## Summary

| Metric | Baseline | After |
| --- | --- | --- |
| Lint problems | 43 (40 err / 3 warn) | **0** |
| Tests | 521 / 524 passing | **524 / 524** |
| Build | ✅ clean | ✅ clean |
| Typecheck | ✅ | ✅ |
| `npm audit` high/critical | 12 | **3** (remaining 3 are transitive via `dub → jsonpath → underscore`; fix requires dub downgrade) |

- **Files Modified:** 41
- **Files Created:** 3 (`ARCHITECTURE_NOTES.md`, `HARDENING_REPORT.md`, `.github/workflows/ci.yml`)
- **Files Deleted:** 0
- **Commits:** 7 (one per phase, plus recon notes in Phase 1 commit)

## Changes by Phase

### Phase 1 — Critical fixes & error handling (`fix:`)

Commit: `292667a`

- `src/app/api/admin/mighty/route.ts` — replace `auth()` user-only check with `requireAdmin()`; drop unused `listCoursework` import
- `src/app/api/admin/mighty/publish/route.ts` — `requireAdmin()` + drop unused `createEvent`/`createPoll` imports
- `src/app/api/admin/mighty/deploy-courses/route.ts` — `requireAdmin()`
  *(these three fixes cleared the 3 failing security tests)*
- `src/app/api/admin/deals/[id]/invite-to-mighty/route.ts` — wrap POST + GET bodies in try/catch; return structured 500s instead of letting DB/Mighty API errors propagate as unhandled rejections
- `src/app/api/admin/funnel/route.ts` — wrap the 21-parallel-query body in try/catch
- `src/app/api/notifications/read/route.ts` — try/catch around DB writes
- `src/components/shared/NotificationBell.tsx` — `AbortController` on 30 s polling fetch; aborts on unmount
- `src/app/(admin)/admin/funnel/FunnelDashboardClient.tsx` — same polling abort pattern
- `src/app/(portal)/portal/campaigns/CampaignsDashboardClient.tsx` — same
- `src/app/(admin)/admin/email-campaigns/AdminCampaignDashboard.tsx` — same
- `ARCHITECTURE_NOTES.md` — reconnaissance reference doc

### Phase 2 — Dead code removal & type safety (`refactor:`)

Commit: `b883282`

- `src/lib/pdf/ai-playbook.ts` — rename `useInter`/`usePlayfair`/`usePlayfairItalic` PDF font helpers to `applyInter`/`applyPlayfair`/`applyPlayfairItalic` (the `use*` prefix was tripping `react-hooks/rules-of-hooks` → 28 false-positive errors)
- `src/components/community/CommunityFooter.tsx` — 4× `<a>` → `<Link>`
- `src/components/community/CommunityNav.tsx` — 3× `<a>` → `<Link>`
- `src/app/(marketing)/tools/ai-readiness-quiz/AIReadinessQuizClient.tsx` — add `Link` import, `<a>` → `<Link>`
- `src/app/(marketing)/tools/roi-calculator/ROICalculatorClient.tsx` — same
- `src/app/(marketing)/tools/segment-explorer/SegmentExplorerClient.tsx` — same (2 sites)
- `src/app/(marketing)/tools/stack-configurator/StackConfiguratorClient.tsx` — same (2 sites)
- `src/app/(marketing)/tools/website-audit/WebsiteAuditClient.tsx` — same
- `src/app/(marketing)/tools/executive-ops-audit/ExecutiveOpsAuditClient.tsx` — escape 4 apostrophes (`react/no-unescaped-entities`)
- `src/components/ops-excellence/dashboard/CompanyHeader.tsx` — upgrade `<img>` company logo to `next/image` with `unoptimized` (logos come from arbitrary remote hosts)
- `src/lib/close.ts` — delete dead `CLOSE_STATUS_ID_TO_LABEL` reverse map and its stale `eslint-disable` directive
- `src/app/error.tsx` — drop stale `no-console` disable
- `src/lib/stripe/index.ts` — drop stale `no-console` disable

No `any` types, no `@ts-ignore`, no commented-out code blocks, no `console.log`, no TODO/FIXME entries to carry forward. The codebase was already in good shape for type safety and dead-comment hygiene — these fixes were almost entirely around lint compliance under the Next 16 `react-hooks`/`no-html-link-for-pages` rules.

### Phase 3 — UI/UX polish (`style:`)

Commit: `ef406c5`

- `src/app/global-error.tsx` — log the error digest, soften copy, add Home link + proper button group
- `src/app/layout.tsx` — add skip-to-main-content link (a11y keyboard baseline)
- `src/app/(marketing)/layout.tsx`, `(admin)/layout.tsx`, `(portal)/layout.tsx`, `(reseller)/layout.tsx`, `(intern)/layout.tsx`, `(landing)/layout.tsx` — add `id="main-content"` on the `<main>` element so the skip link targets a real anchor
- `src/components/shared/NotificationCenter.tsx` — `aria-label="Close notifications"` on icon-only close button
- `src/app/(admin)/admin/crm/AddDealModal.tsx` — `aria-label="Close dialog"` on modal close

Coverage confirmation (nothing to change):
- Every route group already has its own `error.tsx`.
- Every admin/portal/intern/reseller route segment already has a `loading.tsx` skeleton (47 files total).
- No lorem-ipsum placeholder copy in src/.
- Every form that tracks submit state already wires `disabled={submitting}` on its button.

### Phase 4 — Performance (`perf:`)

Commit: `32f8ca8`

- `src/app/(marketing)/marketplace/MarketplaceClient.tsx`:
  - Hoist `search.toLowerCase()` out of the inner filter loop (was 2× per service per render).
  - Wrap `selfServeCount` in `useMemo` so it does not recompute when only filter state changes.

Audited and left alone (already good):
- `next.config.ts` has `optimizePackageImports` for lucide, recharts, date-fns, framer-motion, dnd-kit; `optimizeCss: true`; avif/webp image formats; static asset caching; bundle analyzer gated behind `ANALYZE=true`.
- Cron handlers and server components use `Promise.all` for parallel DB work.
- 114 HTTP handlers across 91 files; only 3 were missing try/catch (fixed in Phase 1).
- `findMany` calls that need pagination already accept `take`/`skip` via Zod-validated query params.
- Long lists (marketplace, admin tables) render in the hundreds of rows at most and don't warrant virtualization yet.

### Phase 5 — Developer experience & documentation (`docs:`)

Commit: `2352d6d`

- `README.md` — rewrite from the single-sentence placeholder to a full setup + scripts + architecture + auth + testing doc
- `.env.example` — sync with 12 env vars actually read in `src/*` but missing from the template: `BOOTSTRAP_ADMIN_EMAILS`, `CALENDLY_WEBHOOK_SECRET`, `NEXT_PUBLIC_CALENDLY_MATT`, `NEXT_PUBLIC_CALENDLY_RYAN`, `COMMUNITY_INVITE_URL`, `NEXT_PUBLIC_COMMUNITY_INVITE_URL`, `DUB_API_KEY`, `DUB_WORKSPACE_ID`, `DUB_PROGRAM_ID`, `DUB_WEBHOOK_SECRET`, `INTERNAL_NOTIFY_TO`, `MIGHTY_WEBHOOK_SECRET`, `UNSUBSCRIBE_SECRET`. Drop stale `OPENAI_API_KEY` (no longer referenced anywhere in src/).
- `package.json` — replace broken `"lint": "next lint"` (removed in Next 16 → was failing because it tried to lint a directory called "lint") with `"lint": "eslint src"`. Add `"typecheck": "tsc --noEmit"`.
- `src/app/global-error.tsx` — `<a>` → `<Link>` to keep the new `eslint src` run clean.
- `.github/workflows/ci.yml` — minimal CI: lint + typecheck + test on every PR and push to main. Uses placeholder env vars so import-time-side-effect modules (stripe, clerk) don't explode during the Next build step.

### Phase 6 — Feature enhancements (`feat:`)

Commit: `0d33f22`

- `src/app/(portal)/portal/billing/BillingPortalButton.tsx` — `alert()` → `toast.error()` (sonner)
- `src/app/(portal)/portal/billing/CancelSubscriptionButton.tsx` — two `alert()` → `toast.error()` + new success toast confirming the cancel-at-period-end action landed
- `src/app/(portal)/portal/settings/SettingsClient.tsx` — two `alert()` → `toast.error()`

Sonner `<Toaster />` was already mounted at the root layout; this just uses the channel that was already set up. All `alert()` calls in the portal are now gone.

Not pursued (already in place): copy-to-clipboard button (`CopyButton.tsx`), confirmation UI on destructive actions (`CancelSubscriptionButton` inline confirm + settings delete-account two-step), breadcrumbs (`components/shared/Breadcrumbs.tsx`).

### Phase 7 — Security (`security:`)

Commit: `5bb159d`

- `npm audit fix` — 13 CVEs → 3 (patches to next 16.2.x, lodash, vite without breaking changes). The remaining 3 are transitive through `dub → jsonpath → underscore`; `npm audit fix --force` would downgrade `dub` from 0.71.6 → 0.71.5 which loses features we use. The vulnerable underscore paths (`_.flatten`/`_.isEqual` unbounded recursion) aren't reachable from how we call dub (short-link generation from trusted admin input), so the risk is acceptable until an upstream dub release bumps jsonpath.
- `src/app/(marketing)/for/[partnerSlug]/page.tsx` — add `secure: process.env.NODE_ENV === "production"` to the `aims_ref` referral cookie (still `httpOnly: false` because the client-side referral handler reads it; `sameSite: "lax"` retained)

Audited and left alone:
- All 6 `/api/webhooks/*` routes verify signatures (stripe `constructEvent`, clerk `svix.verify`, dub/mighty/close HMAC, calendly signing secret).
- No `dangerouslySetInnerHTML` on user-controllable input — only static JSON-LD on marketing and community pages.
- No `$queryRaw` or `$executeRaw` on user input — only a `SELECT 1` health probe.
- Every `/api/admin/**` route now either calls `requireAdmin()` or is guarded by the middleware role gate (enforced by `tests/api-security.test.ts`; 122 tests, all green).
- No error-internal leaking to clients (same test suite enforces this).
- Secrets are only logged by *name* when they're missing at boot, never by value.

## Known Issues Not Addressed

1. **3 remaining `npm audit` high-severity findings** — `dub → jsonpath → underscore` chain. Non-exploitable at our call sites (we don't feed user-controlled data through `_.flatten`/`_.isEqual`). Should be revisited next time `dub` publishes a release with a patched jsonpath.
2. **`next.config.ts` middleware → proxy rename** — Next 16 deprecated the `middleware` filename convention in favour of `proxy`. Rename is straightforward but Clerk's `clerkMiddleware` helper docs haven't caught up yet; leaving the deprecation warning rather than renaming until Clerk publishes updated guidance.
3. **`package.json#prisma` field deprecated** — Prisma 7 will require a `prisma.config.ts`. Separate migration.
4. **Duplicate-lockfile warnings** — two stray `package-lock.json` files exist at `/Users/adamwolfe/package-lock.json` and `/Users/adamwolfe/aims-platform/package-lock.json` (outside the repo). Not a codebase issue; flag for environment cleanup.
5. **`process-email-queue` cron has a latent N+1** — it serially looks up `db.user.findFirst` per queued item when checking active-subscription cancellation. At batch size 50 this is ~50 extra round-trips per minute. Low priority (background work), but worth batching by distinct recipient email if volume grows.

## Recommendations for Next Session

- **Paginate the large admin dashboards** — `/admin/crm`, `/admin/clients`, `/admin/fulfillment`, `/admin/commissions` all hit `findMany` without a default `take` via their page loaders. Current data sizes are fine, but adding cursor pagination now avoids a surprise at ~10 k rows.
- **Prisma 7 migration** — pre-plan the move to `prisma.config.ts` and review new adapter APIs (`@prisma/adapter-neon` shape change expected).
- **Next 16 `proxy.ts` rename** — track Clerk's guidance and do the rename as a single-commit cleanup.
- **Structured logging** — `logger.info`/`logger.error` currently dump to stdout. Consider Axiom/Logtail integration for production observability (all call sites already use the logger abstraction, so this is a one-file swap).
- **Error tracking** — Sentry or equivalent would catch the new route-level error boundaries' `error.digest` values in production.
- **Dependency hygiene loop** — schedule a weekly `npm audit` + Renovate/Dependabot to keep drift under control and detect the upstream dub release that fixes the jsonpath chain.
