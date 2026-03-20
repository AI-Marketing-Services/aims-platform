# Codebase Cleanup Report — 2026-03-19

## Before / After

| Metric           | Before | After  | Delta   |
|------------------|--------|--------|---------|
| Source files      | 375    | 240    | -135    |
| Lines of code     | 41,149 | 35,295 | -5,854  |
| Prod dependencies | 34     | 29     | -5      |
| Dev dependencies  | 16     | 14     | -2      |
| API routes        | 54     | 49     | -5      |
| Pages             | 68     | 65     | -3      |
| Components        | 38     | 35     | -3      |

## Phase 1: Dead File Elimination (-3,003 LOC, 18 files)

### Deleted orphaned files (zero imports):
- `src/components/marketing/Pricing.tsx` — cart-based pricing component (cart removed from product)
- `src/components/shared/CartContext.tsx` — React context for shopping cart
- `src/components/shared/CartDrawer.tsx` — cart slide-out drawer
- `src/lib/env.ts` — typed env var helpers
- `src/lib/hooks/animations.ts` — animation utility hooks
- `src/lib/services-pricing.ts` — pricing data constants
- `src/lib/db/onboarding-schemas.ts` — Zod schemas for onboarding
- `src/types/index.ts` — type re-exports

### Deleted orphaned pages:
- `src/app/(marketing)/pricing/` — removed pricing page (all CTAs now go to consultation)
- `src/app/(marketing)/crm-onboarding/` — 2 files, orphaned onboarding wizard
- `src/app/(marketing)/features/ultimate-vendingpreneur-snapshot/` — orphaned feature page

### Deleted orphaned API routes:
- `src/app/api/checkout/route.ts` — Stripe checkout (replaced by portal billing)
- `src/app/api/subscriptions/route.ts` — duplicate checkout endpoint
- `src/app/api/portal/onboarding/route.ts` — unreferenced onboarding API
- `src/app/api/admin/metrics/route.ts` — unreferenced metrics endpoint
- `src/app/api/admin/clients/export/route.ts` — unreferenced export endpoint

### Cleaned utils.ts:
Removed 7 unused exports: `formatNumber`, `formatRelativeDate`, `slugify`, `generateReferralCode`, `PILLAR_CONFIG`, `DEAL_STAGE_CONFIG`, `FULFILLMENT_ASSIGNMENTS`

## Phase 2: Dependency Pruning (-7 packages)

### Production (5 removed):
- `@hookform/resolvers` — zero imports
- `@neondatabase/serverless` — zero imports
- `@stripe/stripe-js` — zero imports (server-side Stripe only)
- `class-variance-authority` — zero imports
- `react-hook-form` — zero imports

### Dev (2 removed):
- `@testing-library/jest-dom` — zero imports
- `@testing-library/react` — zero imports

## Phase 3: Deduplication (-49 LOC, 8 files)

### Consolidated into `lib/utils.ts`:
- `timeAgo()` — 5 near-identical copies replaced with single import
  - portal/dashboard, admin/cron-status, admin/crm/DealDetail, admin/clients/ClientDetail, NotificationCenter
- `getInitials()` — 2 identical copies replaced with single import
  - CRMKanban, FulfillmentPipeline

## Phase 4: Structural Cleanup

- Removed 5 empty directories left behind by file deletions

## Build Verification

All phases verified with clean `npm run build` — zero TypeScript errors, zero warnings.
