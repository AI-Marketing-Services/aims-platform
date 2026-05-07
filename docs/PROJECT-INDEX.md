# Project Index — Where Everything Lives

**Audience:** Jess (and anyone adding new content).
**Use this to:** find where stuff lives, find the file you need to edit, know the format/pattern before you start a new thing.

---

## TL;DR — "I want to add a [thing], where does it go?"

| Thing | Where to add it | Format |
|---|---|---|
| **Blog post** (public marketing) | `content/blog/your-slug.mdx` | Markdown with frontmatter |
| **Email copy** (any of the 24 templates) | `/admin/email-templates` in the admin panel | WYSIWYG editor — no code |
| **A new email template** (a brand new one) | `src/lib/email/your-template.ts` + register in `src/lib/email/catalog.ts` | TypeScript helper that returns HTML |
| **An onboarding checklist step** (member portal) | `src/lib/onboarding/steps.ts` | Add an entry to the `ONBOARDING_STEPS` array |
| **A quest** (gamified achievement) | `src/lib/quests/registry.ts` | Add an entry to the `QUESTS` array |
| **A lesson/module** for the curriculum | Currently lives inside Mighty Networks → see `docs/mighty/CONTENT-FULL.md` | Mighty's own editor |
| **An industry playbook** (for AI services pitching) | `src/lib/playbooks/manifest.ts` | Add an entry to `PLAYBOOK_MANIFEST` |
| **A lead magnet result page** (e.g. quiz, audit) | `src/app/(landing)/tools/your-tool/page.tsx` + `src/app/(landing)/tools/your-tool/results/[submissionId]/page.tsx` | Next.js page + result handler |
| **Marketing landing copy** (homepage, why-aims, etc.) | `src/components/marketing/*.tsx` | React components |
| **Application form question** | `src/lib/collective-application.ts` | Add to the `QUESTIONS` array |
| **Pricing copy** | `src/app/(marketing)/pricing/page.tsx` | React component |
| **Admin sidebar nav item** | `src/components/admin/AdminSidebar.tsx` | Add to `ADMIN_NAV` array |
| **Member portal nav item** | `src/components/portal/Sidebar.tsx` | Add to portal nav array |

---

## Top-level layout

```
aims-platform/
├── content/blog/         ← Marketing blog posts (.mdx files)
├── docs/                 ← All long-form documentation (this folder)
├── prisma/               ← Database schema (only engineers touch)
├── src/
│   ├── app/              ← Every PAGE on the site (Next.js App Router)
│   ├── components/       ← Reusable UI building blocks
│   ├── data/             ← Static data files (industries, segments, etc.)
│   └── lib/              ← Business logic (emails, quests, playbooks, integrations)
└── public/               ← Static assets (logos, images)
```

The two folders that contain almost everything Jess will care about:
- **`src/app/`** — every page on the site (one folder = one URL path)
- **`src/lib/`** — content that's rendered on those pages (emails, quests, lessons, etc.)

---

## `src/app/` — pages organized by route group

Each folder in parentheses is a "route group" — it groups related pages without affecting the URL. Think of them as the major surfaces of the platform:

| Folder | URL prefix | Who sees it | Examples |
|---|---|---|---|
| `(marketing)/` | `/` (public) | Anyone on the internet | `/`, `/about`, `/pricing`, `/blog`, `/case-studies`, `/why-aims` |
| `(landing)/apply/` | `/apply` | Anyone who clicks "Apply" | The 10-question application form |
| `(landing)/tools/` | `/tools/*` | Anyone (lead magnets) | `/tools/ai-readiness-quiz`, `/tools/roi-calculator`, `/tools/website-audit` |
| `(auth)/` | `/sign-in`, `/sign-up` | Anyone | Clerk auth pages |
| `(portal)/portal/` | `/portal/*` | Members (CLIENT role) | `/portal/dashboard`, `/portal/onboard`, `/portal/quests`, `/portal/playbooks` |
| `(reseller)/reseller/` | `/reseller/*` | Resellers (RESELLER role) | `/reseller/dashboard`, `/reseller/settings/branding` |
| `(intern)/intern/` | `/intern/*` | Interns (INTERN role) | `/intern/dashboard` |
| `(admin)/admin/` | `/admin/*` | You + Jess (ADMIN role) | `/admin/dashboard`, `/admin/crm`, `/admin/email-templates`, `/admin/applications` |
| `api/` | `/api/*` | Backend (no UI) | Webhooks, form submits, cron jobs |

---

## "I want to add a community resource" — the most likely paths

Jess, when you say "community resources," I'm guessing you mean one of these. Pick the one that matches and follow that section:

### A. A new written guide / article (member-facing)
**The platform doesn't currently have a member-only blog or knowledge base.** The closest existing thing is the public blog at `/blog`. Two options:

1. **Quickest:** put it in Mighty Networks. The whole curriculum lives there now (see `docs/mighty/CONTENT-FULL.md` for the existing inventory). New content goes via Mighty's own editor.
2. **Longer-term:** if we want a member-only `/portal/library` or `/portal/resources` page on the platform, that's a small build (~2 hours). Tell me if you want that and I'll wire it up.

### B. A blog post (public marketing site)
1. Create `content/blog/your-post-slug.mdx`
2. Frontmatter format:
   ```mdx
   ---
   title: "5 Signs Your Business Needs an AI Audit"
   description: "Not sure if AI can help your business? These 5 warning signs mean you're leaving money on the table."
   date: "2026-05-07"
   author: "Jess Mayo"
   category: "Getting Started"
   image: "/blog/your-image.jpg"
   ---

   ## Section heading

   Body paragraph here.

   ### Subheading

   - Bullet points work
   - Like this
   ```
3. Body uses standard Markdown. No code knowledge required.
4. The post auto-appears at `/blog/your-post-slug` on next deploy.
5. **Existing examples** to copy from: `content/blog/5-signs-your-business-needs-an-ai-audit.mdx`, `content/blog/how-we-built-a-cold-outbound-engine-that-books-30-meetings-per-month.mdx`.

### C. An onboarding step (the checklist members see at `/portal/onboard`)
1. Open `src/lib/onboarding/steps.ts`
2. Find the `ONBOARDING_STEPS` array
3. Add a new entry. Copy the format of an existing one — every step has:
   - `key` — a stable ID (snake_case, never rename later)
   - `week` — `"week1"` through `"week5"` (matches the journey phases)
   - `title` — what shows in the list
   - `description` — 1-line "what this is and why"
   - `ctaLabel` — button text ("Open lesson", "Read article", etc.)
   - `href` — where the button takes them (Mighty space, internal portal page, external URL)
   - `phaseKey` — which journey phase it belongs to (foundation / prospecting / revenue_activities / problem_diagnosis / solutioning)

### D. A new email
Two paths depending on whether you want to **edit existing copy** or **add a brand-new email**:

**Edit an existing email** (24 templates):
- Go to `/admin/email-templates`
- Click any row → visual editor opens with the live default copy prefilled
- Edit subject + body in the WYSIWYG → Save
- Future sends use your version automatically
- See `docs/EMAIL-TIMELINE.md` for the full sending order

**Add a brand-new email** (this requires Adam or Codex):
1. Create `src/lib/email/your-email.ts` — a function that returns HTML
2. Register it in `src/lib/email/catalog.ts` (so it shows up in the admin editor)
3. Add a row in `src/lib/email/timeline.ts` (so it shows up in the right journey bucket on the email-templates page)
4. Pattern to copy: see `src/lib/email/abandoned-application.ts` — it's the simplest sender.

### E. A new quest (gamified achievement on `/portal/quests`)
1. Open `src/lib/quests/registry.ts`
2. Add an entry to the `QUESTS` array. Each quest has:
   - `key` — stable ID
   - `title` + `description`
   - `category` — `"MAIN"` (gates features) or `"SIDE"` (optional)
   - `tier` — 0–4 for main quests
   - `triggerEvent` — what action completes it (e.g. `"audit_run"`, `"first_audit_completed"`)
   - `unlocksFeatureKey` — which feature it unlocks (or `null`)
3. Existing examples in the same file are the cleanest reference.

### F. A new playbook (industry-specific AI-services use case)
1. Open `src/lib/playbooks/manifest.ts`
2. Add an entry to `PLAYBOOK_MANIFEST`. Each playbook has:
   - `industry` — "Auto Dealerships", "HVAC", etc.
   - `useCases` — array of 3–6 use cases per industry
   - Each use case has: `title`, `problem`, `solution`, `tools`, `monthlyValue`, `difficulty`, `pitchLine`

### G. A new lead magnet (quiz / audit / calculator)
This is bigger — it touches 4 files:
1. **The form page** at `src/app/(landing)/tools/your-magnet/page.tsx`
2. **The results page** at `src/app/(landing)/tools/your-magnet/results/[submissionId]/page.tsx`
3. **The submit handler** at `src/app/api/lead-magnets/submit/route.ts` (add a case to the switch)
4. **The results email** at `src/lib/email/lead-magnet-results.ts` (add a `sendXxxEmail` function)

Easiest reference to copy: the AI Readiness Quiz (across all 4 files).

---

## `src/lib/` — where the smart stuff lives

| Folder | What lives here |
|---|---|
| `email/` | Every email send function + the catalog + override system |
| `quests/` | Quest definitions (gamification) |
| `onboarding/` | The 5-week checklist members work through |
| `journey/` | Journey phases (foundation → prospecting → revenue → diagnosis → solutioning) |
| `playbooks/` | Industry-specific AI services use cases |
| `ai/` | All AI calls (Claude, Firecrawl, scoring) |
| `stripe/` | Subscription + checkout handlers |
| `mighty/` | Mighty Networks API integration |
| `close/` | Close CRM integration |
| `db/` | Database query helpers |
| `auth.ts` | Role + session helpers |
| `collective-application.ts` | The 10-question apply form definition |
| `blog.ts` | Reads MDX files from `content/blog/` |

---

## `src/components/` — reusable UI pieces

| Folder | What's in here |
|---|---|
| `admin/` | Everything the admin panel uses (sidebar, tables, dialogs) |
| `portal/` | Member portal UI (onboarding checklist, quest panel, dashboard cards) |
| `marketing/` | Public landing page sections (Hero, Benefits, FAQ, ServicesGrid) |
| `community/` | The apply form |
| `shared/` | Things used everywhere (Breadcrumbs, NotificationBell, BugReportWidget) |
| `ui/` | shadcn/ui base components (Button, Card, Input — generic primitives) |
| `quests/` | Quest UI |
| `tools/` | Lead magnet form components |

---

## Documentation files (the `docs/` folder)

If you want to read more before changing anything, here's what each doc covers:

| Doc | What's in it |
|---|---|
| **`PROJECT-INDEX.md`** (this file) | Where everything lives |
| `EMAIL-TIMELINE.md` | The exact order every email fires + cron schedule |
| `JOURNEY-PHILOSOPHY.md` | The 5-phase walk-before-run model (Jess wrote this) |
| `LEAD-MAGNETS.md` | All 8 lead magnets with clickable test URLs |
| `AUDIT_REPORT_2026-05-06.md` | Most recent end-to-end audit (security/perf/UX) |
| `AIMS-PLATFORM-BUILD-PROMPT.md` | Original architecture spec (engineer-focused) |
| `AIMS-DEEP-DIVE-SPEC.md` | UI implementation details |
| `MIGHTY-NETWORKS-API.md` | How we talk to Mighty (auth, webhooks, content fetch) |
| `mighty/CONTENT-FULL.md` | Full inventory of curriculum already in Mighty |
| `mighty/CONTENT-INVENTORY.md` | Shorter summary of Mighty content |
| `PRODUCTIZED-SERVICES-CATALOG.md` | The 15 AI services we sell |
| `CLOSE_INTEGRATION.md` | Close CRM sync logic |
| `DAILY-SIGNAL-PRD.md` | The Daily Signal newsletter product spec |

---

## Formatting conventions (what to copy when building new)

The platform follows a few stylistic rules — match these so anything new fits in:

### Visual style
- **Primary color**: `#C4972A` (AIMS gold) — `bg-primary`, `text-primary`
- **Background**: `#08090D` (ink/near-black) — `bg-background`
- **Card**: `#141923` (surface) — `bg-card`
- **Text**: `#F0EBE0` (cream) — `text-foreground`
- **Fonts**: DM Sans (body), Cormorant Garamond (big headings), DM Mono (code/labels)
- **Borders**: 2px corner radius — `rounded-2xl` for cards, `rounded-xl` for inputs
- **NO emojis** in code or UI unless explicitly requested
- **Mobile-first** — every page must work at 375px (iPhone SE width)

### Tone (when writing copy)
- **First-person from operators**, not corporate
- **Operator-facing** language — "you," not "users" or "members"
- **Specific over generic** — name the actual thing, not the category
- **Walk-before-run** sequencing — Foundation → Prospecting → Revenue → Diagnosis → Solutioning. Don't push solutioning content to people still on Foundation.

### Code conventions (if you're touching code)
- TypeScript strict (no `any`)
- Server components by default — only add `"use client"` when you need interactivity
- Use `<Suspense>` for any data fetching that takes >100ms
- Validate every form input with Zod
- Never delete data — soft-delete with a `deletedAt` field

---

## Where to put new community-facing content (Jess-specific guidance)

Based on what I think you mean by "community resources," here's the call I'd make for each kind of resource:

| Resource | Where it should go | Why |
|---|---|---|
| **A how-to guide for members** | Mighty (a Lesson inside the existing module structure) | That's where the rest of the curriculum lives. Members already check Mighty for content. |
| **A public-facing case study or thought-leadership post** | `content/blog/*.mdx` (the public blog) | Drives SEO + acquisition. New visitors find these. |
| **A "play of the week" or weekly drop** | Either Mighty (a discussion post) OR a new email template | Email if it's outbound; Mighty if it's a community conversation starter. |
| **A new tool/calculator/quiz** | New lead magnet (see section G above) | Lives at `/tools/your-thing` and feeds the lead-magnet email pipeline. |
| **A worksheet/template/PDF** | Upload to Vercel Blob, link from a Mighty Lesson | We don't currently have a "Resources" page on the portal. Ask if you want one. |
| **A lesson script/outline for a video** | Mighty (attached to the module that contains the video) | Same place the video itself lives. |

If you have a specific resource in mind and you're not sure which of the above it is, drop it in Slack with a one-line description and I'll point you at the file.

---

## Things you can't add without a code change

Some things require Adam, Codex, or Claude to wire up because they touch the database or business logic:

- New journey phase (we have 5; adding a 6th means schema + UI changes)
- New role type (CLIENT, RESELLER, INTERN, ADMIN, SUPER_ADMIN are all that exist)
- New cron job
- New webhook endpoint
- New database table or column
- New navigation top-level item

For everything else (copy, blog posts, email content, onboarding steps, quests, playbooks, lead magnet copy) — you can edit directly via the admin UI or by editing the right file and opening a PR.
