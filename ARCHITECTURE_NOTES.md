# ARCHITECTURE_NOTES.md

**Captured:** 2026-04-16
**Branch:** hardening/2026-04-16
**Purpose:** Reference map for the hardening pass — what exists today, what baselines look like.

---

## Stack

- **Framework:** Next.js 16.2 (Turbopack) + App Router
- **Language:** TypeScript (strict)
- **Package manager:** npm
- **DB:** Neon Postgres via Prisma 6 (`@prisma/adapter-neon`)
- **Auth:** Clerk (`@clerk/nextjs` ^7)
- **Payments:** Stripe 17
- **AI:** `@ai-sdk/anthropic`, `@ai-sdk/google`, `@anthropic-ai/sdk`, `ai` SDK
- **Email:** Resend 4
- **Rate limit:** Upstash Redis + Upstash Ratelimit
- **Community:** Mighty Networks API (custom lib in `src/lib/mighty`)
- **CRM:** Close (`src/lib/close.ts`)
- **PM:** Asana (`src/lib/asana.ts`)
- **Short links:** dub.co
- **PDF:** pdfkit
- **Styling:** Tailwind 3.4 + shadcn/ui + framer-motion
- **Testing:** Vitest 4 + jsdom
- **Analytics:** `@vercel/analytics`, `@vercel/speed-insights`

## Route map (top level)

### Public
- `/` — Landing
- `/marketplace`, `/services`, `/services/[slug]` (SSG with generateStaticParams)
- `/tools/*` — Lead magnets (playbook, audits, calculators, quiz, segment explorer, stack configurator)
- `/for/[vertical]`, `/industries/*`, `/case-studies/*`, `/careers`
- `/about`, `/why-aims`, `/privacy`, `/terms`, `/pricing`
- `/apply` — Collective application funnel
- `/sign-in`, `/sign-up` (Clerk)

### Protected (by role, enforced in middleware)
- `/portal/*` — CLIENT dashboard (billing, campaigns, services, support, referrals, onboarding, ops-excellence)
- `/reseller/*` — RESELLER dashboard (clients, commissions, resources)
- `/intern/*` — INTERN OS (dashboard, sprints, tasks)
- `/admin/*` — CRM, clients, deals, applications, revenue, fulfillment, funnel, email, partners, cron-status, vendors, services, simulate, support

### API surface (src/app/api)
Top-level groups: `admin`, `ai`, `community`, `cron`, `deals`, `health`, `intake`, `intern`, `lead-magnets`, `notifications`, `ops-excellence`, `partners`, `portal`, `referrals`, `reseller`, `services`, `support`, `unsubscribe`, `user`, `webhooks`.

## Auth flow

- Clerk middleware (`src/middleware.ts`) runs on every request.
- Public paths listed explicitly; otherwise enforces sign-in.
- Role claimed in `sessionClaims.metadata.role`: CLIENT | RESELLER | INTERN | ADMIN | SUPER_ADMIN.
- Middleware provides **defense-in-depth** role gating at both page and `/api/*` scopes.
- `src/lib/auth.ts` exposes `requireAdmin()` for in-route role verification (tests assert every admin route calls this).

## Data flow highlights

- Prisma schema (`prisma/schema.prisma`) is 1124 lines — large domain model.
- `src/lib/db/{index,queries,chat-sessions}.ts` — shared query helpers.
- Server components by default, Server Actions for mutations, Zod for input validation.
- Webhooks under `/api/webhooks/*` (Clerk, Stripe, Resend, etc.).

## Third-party integrations

- **Clerk** — auth
- **Stripe** — payments + webhooks
- **Neon** — Postgres
- **Upstash** — Redis + rate limiting
- **Anthropic / Google** — AI SDK
- **Resend** — transactional email
- **Close** — CRM
- **Asana** — project management
- **Mighty Networks** — community (AI Operator Collective)
- **dub.co** — short links for referrals/campaigns
- **Firecrawl** — site scraping for audit tools
- **Vercel** — Analytics + Speed Insights

## Env vars (from .env.example / CLAUDE.md)

`DATABASE_URL`, `CLERK_*`, `STRIPE_*`, `ANTHROPIC_API_KEY`, `FIRECRAWL_API_KEY`, `RESEND_API_KEY`, `UPSTASH_REDIS_*`, plus Mighty, Close, Asana, Dub, Google.

## Baseline (pre-hardening)

- **Build:** ✅ clean (Next 16.2 Turbopack, 193 static pages generated, 28.2s compile). Warnings: deprecated `package.json#prisma`, Next warning about `middleware` being renamed to `proxy` (Next 16), multiple-lockfile warning because of a stray `package-lock.json` at `/Users/adamwolfe/` and `/Users/adamwolfe/aims-platform/`.
- **Lint (`npx eslint src`):** 43 problems — 40 errors, 3 warnings.
  - Bulk (~28): false-positive `react-hooks/rules-of-hooks` errors in `src/lib/pdf/ai-playbook.ts`. Helper functions named `useInter`/`usePlayfair` (PDF font helpers) confuse the rule.
  - 7 `no-html-link-for-pages` errors in `CommunityFooter.tsx`, `CommunityNav.tsx`.
  - 1 unused-vars rule-not-found error in `src/lib/close.ts:190` (`@typescript-eslint/no-unused-vars` disable on line that doesn't have that violation).
  - 3 warnings: 2 unused `eslint-disable` directives (`error.tsx:15`, `stripe/index.ts:5`), 1 `no-img-element` in `CompanyHeader.tsx`.
- **Tests (`vitest run`):** 521 passing, **3 failing** — all in `tests/api-security.test.ts`:
  - `app/api/admin/mighty/route.ts` — missing admin role check (uses `auth()` only).
  - `app/api/admin/mighty/publish/route.ts` — same.
  - `app/api/admin/mighty/deploy-courses/route.ts` — same.
  These three routes check for a signed-in user but not for admin role. Middleware covers it at the edge, but the tests want in-route `requireAdmin()` for belt-and-suspenders. I'll fix in Phase 1 (closely related to error handling; the auth guard is the error-path that's missing).

## Existing error boundaries

- `src/app/error.tsx` — route-level error boundary (has `eslint-disable` for `no-console`).
- `src/app/global-error.tsx` — root-level fallback, minimal, uses inline hex colours (not design tokens).
- `src/app/not-found.tsx` — 404 page.

## Known warnings worth noting for later phases

1. Multiple `package-lock.json` at parent dir and grandparent dir — Next 16 warns. Not a codebase issue; leaving for the user.
2. `middleware.ts` → Next 16 prefers `proxy.ts`. Big refactor, not in scope unless trivial rename proves safe.
3. `package.json#prisma` deprecated — move to `prisma.config.ts` is Prisma 7 migration, out of scope here.
4. The whole `src/lib/pdf/ai-playbook.ts` has 28 linter noise errors from `useFoo` naming convention. Easy fix: rename helpers to lose the `use` prefix.

## Existing reports (kept for history)

- `HARDENING_REPORT.md`, `CLEANUP_REPORT.md`, `PERFORMANCE_REPORT.md`, `OVERNIGHT-AUDIT-REPORT.md` — all dated 2026-03-21. I'll overwrite `HARDENING_REPORT.md` at the end of this pass with the 2026-04-16 summary.
