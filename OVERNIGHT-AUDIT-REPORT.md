# Overnight Audit Report — AIMS Platform

**Date:** 2026-03-18
**Branch:** `overnight-improvements-2026-03-18`
**Auditor:** Claude Opus 4.6 (autonomous session)

---

## Baseline (Before)

| Metric | Value |
|--------|-------|
| Build | PASSING |
| Tests | 217/217 (9 test files) |
| Source files | 255 |
| Warnings | 1 (turbopack root inference — cosmetic) |

## Final State (After)

| Metric | Value |
|--------|-------|
| Build | PASSING |
| Tests | 217/217 (9 test files) |
| Source files | 255 (1 deleted, 1 created = net 0) |
| Warnings | 1 (same — turbopack root, cosmetic) |
| Files modified | 28 |
| Commits | 3 (checkpoint + critical fixes + final cleanup) |

---

## Summary of Changes

### Critical Fixes (5)
1. **Checkout route crash** — `new Stripe(process.env.STRIPE_SECRET_KEY!)` at module scope crashes if env var missing. Converted to lazy `getStripe()` factory function.
2. **AI chat route crash** — `createGoogleGenerativeAI({ apiKey: process.env.GEMINI_API_KEY ?? "" })` at module scope creates broken client with empty key. Converted to lazy `getGoogle()` factory with 503 guard.
3. **Clerk webhook silent failure** — catch block returned 200 success even on processing errors. Now returns 500 so Clerk retries.
4. **React key warning** — `LeadMagnetTable` used `<>` Fragment inside `.map()` with key on inner `<tr>` instead of Fragment. Fixed with `<Fragment key={...}>`.
5. **console.log in production** — Stripe webhook idempotency messages were `console.log`. Changed to `console.warn` for proper log levels.

### Dark Theme Eradication (15 files)
All `bg-gray-900`, `bg-gray-800`, dark gradients, and dark tooltip styles removed. Replaced with brand red `#DC2626` or proper light-theme tokens:

| File | What changed |
|------|-------------|
| `FinalCTA.tsx` | Section bg gray-900 -> #DC2626, text colors updated |
| 4x industry pages | Hero gradient gray-900->gray-800 -> #DC2626->#B91C1C |
| `services/[slug]/page.tsx` | Bottom CTA bg-gray-900 -> #DC2626 |
| `for/[partnerSlug]/page.tsx` | Social proof section bg-gray-900 -> #DC2626 |
| `tools/dashboard/page.tsx` | Upgrade CTA bg-gray-900 -> #DC2626 |
| `Pricing.tsx` | Enterprise button bg-gray-900 -> #DC2626 |
| `not-found.tsx` | Homepage button bg-gray-900 -> #DC2626 |
| `MarketplaceClient.tsx` | Tier selector + add-to-cart buttons -> #DC2626 |
| `RevenueChart.tsx` | Tooltip bg #151821 -> #ffffff, grid strokes fixed |
| 3x `ShareButtons.tsx` | Twitter/X button bg-black -> #DC2626 |
| `ai-readiness-quiz/page.tsx` | Inline share button bg-black -> #DC2626 |
| `simulate/page.tsx` | text-white on light input -> text-foreground, border tokens |
| `CRMKanban.tsx` | border-white/5 -> border-border |

### Code Quality (4)
1. **Dead code removed** — `src/components/shared/index.tsx` deleted (5 unused exports: PillarBadge, DealStageBadge, FulfillmentStatusBadge, StatusBadge, MetricCard). Never imported anywhere.
2. **Image optimization** — 4 `<img>` tags in `PortalChatWidget.tsx` replaced with Next.js `<Image>`. 1 `<img>` in partner page replaced with `<Image>`. Added `lh3.googleusercontent.com` to `next.config.ts` remotePatterns.
3. **SEO metadata** — Created `tools/layout.tsx` with metadata for all 5 tool pages (ai-readiness-quiz, roi-calculator, website-audit, segment-explorer, stack-configurator). Added metadata to `tools/dashboard/page.tsx`.
4. **Google avatar support** — Added `lh3.googleusercontent.com` to next.config.ts image remote patterns for Clerk/Google OAuth avatars.

---

## Issues Identified But NOT Fixed (with reasoning)

### Skipped — Low Risk / Acceptable
1. **`any[]` in AI chat routes** (2 instances) — The AI SDK message types are complex and the routes work correctly. Adding proper types would require importing internal SDK types that may change. Skipping.
2. **`<img>` in email template** (`src/lib/email/index.ts`) — HTML email. Next.js `<Image>` does not work in email context. This is correct as-is.
3. **console.error/warn statements** (103 across API routes) — These are proper server-side error logging. Removing them would reduce observability. A structured logging solution (Sentry, etc.) should replace them eventually, but removing them now would be harmful.
4. **Inconsistent section padding** (`py-20` vs `py-16` vs `py-24`) — Design variation across sections. Standardizing would require design review and could make pages feel monotonous.
5. **Modal overlays using bg-black/30 and bg-black/60** — Standard modal overlay pattern. These are translucent overlays, not dark theme backgrounds.
6. **`border-white/30` and `bg-white/10` on red backgrounds** — These are correctly used for light transparency on brand red (#DC2626) sections, not dark backgrounds.

### Recommended Next Steps
1. **Run `npx prisma db push`** — Schema has pending changes (deliveryCost on ServiceArm, onboarding fields) that need to be pushed to the database.
2. **Replace placeholder resource files** in `public/resources/` with actual PDFs.
3. **Configure Close CRM webhook URL** to point to `/api/webhooks/close`.
4. **Add structured logging** — Replace console.error/warn with Sentry or similar for production error tracking.
5. **Connect referral stats** on portal referrals page to real data (currently hardcoded `$0`).
6. **Add API middleware protection** — Middleware currently protects page routes by role but not API routes. Adding `/api/admin/*` -> ADMIN check in middleware would be defense-in-depth.

---

## Verification Checklist

- [x] Build passes with zero errors
- [x] All 217 tests pass
- [x] Zero `bg-gray-900` / `bg-gray-800` patterns remaining
- [x] Zero `bg-black` on non-overlay elements
- [x] Zero `console.log` statements in source
- [x] Zero `<img>` tags in React components (only in email HTML)
- [x] All marketing pages have metadata (via tools/layout.tsx)
- [x] Security headers configured (CSP, HSTS, X-Frame-Options, etc.)
- [x] No env var force-unwraps at module scope
- [x] Webhook error handling returns proper status codes
