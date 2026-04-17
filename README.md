# AIMS Platform

AIMS (AI Managing Services) — full-stack AI services marketplace with CRM, client portal, productized services, reseller program, intern OS, and the AI Operator Collective community.

## Stack

- **Framework:** Next.js 16 (App Router, Turbopack)
- **Language:** TypeScript (strict)
- **Auth:** Clerk
- **DB:** Neon Postgres + Prisma 6 (via `@prisma/adapter-neon`)
- **Payments:** Stripe
- **AI:** Anthropic + Google (AI SDK)
- **Email:** Resend
- **Rate limit:** Upstash Redis + Upstash Ratelimit
- **Community:** Mighty Networks API (AI Operator Collective)
- **CRM:** Close
- **PM:** Asana
- **Short links:** dub.co
- **PDF:** pdfkit
- **Styling:** Tailwind 3.4 + shadcn/ui + framer-motion
- **Testing:** Vitest + jsdom

## Prerequisites

- Node 20+ and npm
- Postgres (Neon recommended)
- Clerk workspace, Stripe account, Resend project, Upstash Redis
- Optional: Close, Asana, Mighty Networks, dub.co, Firecrawl, Tavily

## Setup

```bash
# 1. Install deps
npm install

# 2. Copy env template and fill in real values
cp .env.example .env.local

# 3. Apply schema to your DB
npx prisma db push

# 4. (Optional) seed development data
npm run db:seed

# 5. Start dev server
npm run dev
```

## Scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | Next dev server on :3000 |
| `npm run build` | Prisma generate + Next build |
| `npm start` | Boot production build |
| `npm run lint` | `next lint` (uses `eslint.config.mjs`) |
| `npm test` | Run Vitest unit + integration suite |
| `npm run test:watch` | Watch mode |
| `npm run db:push` | Push schema changes to DB |
| `npm run db:generate` | Regenerate Prisma Client |
| `npm run db:seed` | Seed dev data |
| `npm run db:studio` | Prisma Studio GUI |
| `npm run stripe:setup` | One-time Stripe product/price scaffold |

To see the bundle composition: `ANALYZE=true npm run build`.

## Architecture (top-level)

```
src/
├── app/
│   ├── (marketing)/   — public site (homepage, tools, blog, pricing, etc.)
│   ├── (landing)/     — AI Operator Collective application funnel
│   ├── (auth)/        — Clerk sign-in / sign-up
│   ├── (portal)/      — CLIENT dashboard
│   ├── (reseller)/    — RESELLER dashboard
│   ├── (intern)/      — INTERN ops
│   ├── (admin)/       — ADMIN CRM, revenue, fulfillment, funnel, etc.
│   ├── api/           — route handlers (webhooks, admin, portal, cron, ai, …)
│   ├── embed/         — iframe-safe embed pages (relaxed frame-ancestors CSP)
│   ├── error.tsx      — route error boundary
│   ├── global-error.tsx  — root fallback (outside layout)
│   ├── layout.tsx     — root layout + Clerk + Toaster + skip-to-content
│   └── sitemap.ts / robots.ts
├── components/        — reusable UI (marketing, community, portal, admin, shared, tools)
├── lib/               — integrations (stripe, close, asana, mighty, dub, email, ai, pdf)
├── data/              — static datasets (e.g. segment-explorer)
└── middleware.ts      — Clerk auth + defense-in-depth role gating per route
```

Route-group error boundaries live at `(marketing)/error.tsx`, `(portal)/portal/error.tsx`, `(admin)/admin/error.tsx`, `(intern)/intern/error.tsx`, `(reseller)/reseller/error.tsx`.

## Auth model

- Clerk session metadata carries `role: CLIENT | RESELLER | INTERN | ADMIN | SUPER_ADMIN`.
- `middleware.ts` redirects unauthenticated users to `/sign-in` and returns 403 on cross-role API access.
- API routes additionally call `requireAdmin()` (`src/lib/auth.ts`) for belt-and-suspenders.

## Testing

- Unit + integration tests run with Vitest (see `vitest.config.ts`, `tests/setup.ts`).
- `tests/api-security.test.ts` enforces that every `/api/admin/**` route checks admin role and does not leak error internals — failing this test blocks merges.
- Component smoke tests and route-structure invariants under `tests/*`.

## Deployment

- Production target: Vercel.
- Crons run through Vercel Cron; each cron endpoint requires `Authorization: Bearer ${CRON_SECRET}`.
- Static security headers (CSP, HSTS, X-Frame-Options, Permissions-Policy) configured in `next.config.ts`.
- `/embed/*` paths relax `X-Frame-Options` so Mighty Networks can host them.

## Spec / design docs

- `docs/AIMS-PLATFORM-BUILD-PROMPT.md` — architecture, all 15 service arms, route map
- `docs/AIMS-DEEP-DIVE-SPEC.md` — UI implementation details
- `docs/AIMS-AUTONOMOUS-BUILD-PLAN.md` — repo manifest, Close/Paperclip integration, env var reference
- `docs/MIGHTY-NETWORKS-API.md` — Mighty Networks integration guide
- `docs/PRODUCTIZED-SERVICES-CATALOG.md` — service arm catalog
- `ARCHITECTURE_NOTES.md` — living notes captured during hardening passes
