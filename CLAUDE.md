# CLAUDE.md — AIMS Platform

## Project Overview
Full-stack AI services marketplace built with Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui, Clerk auth, Neon/Prisma, and Stripe.

## Commands
```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run lint         # ESLint
npx prisma db push   # Push schema to DB
npx prisma generate  # Regenerate client
npx prisma studio    # DB GUI
```

## Architecture
- `app/(marketing)/` — Public pages (no auth)
- `app/(auth)/` — Clerk sign-in/sign-up
- `app/(portal)/` — Client dashboard (role: CLIENT)
- `app/(reseller)/` — Reseller portal (role: RESELLER)
- `app/(intern)/` — Intern OS (role: INTERN)
- `app/(admin)/` — Admin CRM & dashboards (role: ADMIN)
- `app/api/` — API routes (webhooks, CRUD, AI)
- `components/marketing/` — Public site components
- `components/portal/` — Portal components
- `components/admin/` — Admin components
- `components/shared/` — Cross-cutting components
- `components/ui/` — shadcn/ui base
- `lib/db/` — Prisma client + query helpers
- `lib/stripe/` — Stripe helpers
- `lib/ai/` — Claude/Firecrawl integrations
- `lib/email/` — Resend templates + sequences
- `lib/utils.ts` — General utilities

## Coding Standards
- TypeScript strict, no `any`
- Server components by default, `"use client"` only when needed
- Server Actions for mutations
- Zod validation on all inputs
- Prisma for all DB access
- Proper error handling with try/catch
- Loading states with Suspense
- Mobile-first responsive design

## Design System
- Primary: #DC2626 (AIMS crimson)
- Background: #FAFAFA (light), #0D0F14 (dark for portals)
- Font: Geist via next/font
- Pillar colors: Marketing=#16A34A, Sales=#2563EB, Operations=#EA580C, Finance=#9333EA
- Cards: white bg, subtle border, 12px radius, hover lift
- Animations: Framer Motion, fade-up on scroll, stagger grids

## Key Patterns
- Reference `wholesail` repo for: auth, DB schema, Stripe webhooks, dashboard layouts
- Reference `trackr` repo for: interactive demos, AI research pipeline, card UI
- Reference `marketingskills` repo for: page copy, SEO, CRO best practices
- Reference `everything-claude-code` repo for: coding standards, component patterns

## Env Vars Required
DATABASE_URL, CLERK keys, STRIPE keys, ANTHROPIC_API_KEY, FIRECRAWL_API_KEY, RESEND_API_KEY, UPSTASH_REDIS keys
