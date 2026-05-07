# Platform Handoff — As of 2026-05-07

**Purpose:** the canonical "what exists, what works, what doesn't, how to operate it" reference. Read this before changing anything you didn't build yourself.

**TL;DR:**
- ✅ All code on `main`. Both repos in sync. Production deployed.
- ✅ 174 pages, 220 API routes, 14 cron jobs, 24 editable email templates.
- 🟡 4 follow-up items deferred (silently-cancelled drips, Stripe role flip, Calendly cancel/reschedule, override audit log).
- 🔴 1 env var still needs to be set: `MIGHTY_WEBHOOK_SECRET` in all 3 Vercel envs.

---

## 1. Sync state — is everything pushed?

**Yes. Verified 2026-05-07.**

| Repo | Branch | HEAD commit | Notes |
|---|---|---|---|
| `AIMS-Product/AIOperatorCollective` | `main` | `c3a3453` | Canonical for collaboration. Where Jess + James + team work. |
| `AI-Marketing-Services/aims-platform` | `main` | `c3a3453` | Same content. Vercel deploy source. Mirror of the above. |
| Vercel project `aims-platform` | — | Building `c3a3453` | Auto-deploys on every push to `main`. |

The two GitHub repos are kept in sync via a mirror — same commits, same SHAs, same branches. **Pushing to either repo's `main` ends up on production.**

**Stale branches still on remote** (preserved, not deleted, for safety):
- `aioc-abandoned-application-email` — Jess's email rewrite + Adam's AIOC spell-out fix. Already on main. Branch can be deleted any time.
- `claude/daily-news-digest-r1jpM` — old Claude bot branch. Never merged. Inspect before deleting.
- `claude/fix-webhook-calendar-events-SWH4z` — old Claude bot branch. Never merged.
- `claude/refine-landing-page-copy-Ituuz` — old Claude bot branch. Never merged.
- `hardening/2026-03-19` — old hardening branch. Already merged.

If you don't recognize a branch, run `git log main..<branch> --oneline` to see what's on it before deleting.

---

## 2. Repo + deploy chain

```
┌─────────────────────────────────┐
│ Local clone (your laptop)        │
└──────────┬──────────────────────┘
           │ git push origin main
           ▼
┌─────────────────────────────────┐
│ AI-Marketing-Services/           │ ←─┐ mirror sync (both stay in lockstep)
│ aims-platform                    │   │
└──────────┬──────────────────────┘   │
           │                          │
           │ Vercel git integration   │
           ▼                          │
┌─────────────────────────────────┐   │
│ Vercel project: aims-platform    │   │
│ Team: aimanagingservices         │   │
│ URL: aims-platform.vercel.app    │   │
└─────────────────────────────────┘   │
                                      │
┌─────────────────────────────────┐   │
│ AIMS-Product/                    │ ──┘
│ AIOperatorCollective             │
│ (where team collaborates,        │
│  PRs, CodeRabbit, etc.)          │
└─────────────────────────────────┘
```

**Production URLs:**
- Vercel: `https://aims-platform.vercel.app`
- Custom domain: `https://www.aioperatorcollective.com` (and bare `aioperatorcollective.com`)

**Triggering a deploy manually** (if you've pushed but want to force a redeploy):
```bash
vercel --prod --yes
```

---

## 3. Architecture at a glance

| Layer | Tech | Purpose |
|---|---|---|
| **Frontend** | Next.js 16 (App Router), React 19, Tailwind CSS 3, shadcn/ui | All UI |
| **Auth** | Clerk | Sign-in, role gating, sessions |
| **Database** | Neon Postgres + Prisma 6 | All app data |
| **Payments** | Stripe (test mode currently) | Subscriptions, one-time, webhooks |
| **Email** | Resend | Outbound mail, all 24 templates |
| **AI** | Anthropic Claude (Sonnet + Haiku) | Audits, ROI, scoring, chatbot |
| **Web research** | Firecrawl + Tavily + Perplexity | Lead enrichment, audit research |
| **Scheduling** | Calendly | Apply → consult booking flow |
| **Community** | Mighty Networks | Curriculum, lessons, discussions |
| **CRM** | Close (sync) + native | Pipeline, deal tracking |
| **Hosting** | Vercel | Builds, serverless, edge |
| **Crons** | Vercel Cron | 14 scheduled jobs |
| **Rate limit / cache** | Upstash Redis | API rate limits, hot data |
| **File uploads** | Vercel Blob | Logos, PDFs, attachments |

**Roles defined in code** (Clerk `publicMetadata.role`):
1. `CLIENT` — paying member, sees `/portal/*`
2. `RESELLER` — white-label partner, sees `/reseller/*`
3. `INTERN` — fulfillment intern, sees `/intern/*`
4. `ADMIN` — team member, sees `/admin/*`
5. `SUPER_ADMIN` — Adam-level, sees everything + bootstrap powers

---

## 4. Feature inventory (everything that's built)

### Public marketing site (`/`)
- Homepage with operator-apprenticeship narrative + board-member section
- `/about`, `/why-aims`, `/pricing`, `/case-studies`, `/blog` (3 posts), `/contact`
- `/services/*` and `/industries/*` — service-arm and vertical landing pages
- `/marketplace` — full catalog of all 15 productized services with feature lists
- `/aims-platform` — platform overview page
- `/for/*` — vertical/role-specific landing variants
- `/solutions` — solutions overview
- `/get-started` — checkout entry point
- `/crm-onboarding` — guided CRM setup landing
- Legal: `/privacy`, `/terms`, `/cookies`, `/dpa`

### Lead magnets (8 tools, all at `/tools/*`)
1. **AI Readiness Quiz** (`/tools/ai-readiness-quiz`) — 6-email post-quiz drip ⚠️ silently cancelled
2. **ROI Calculator** (`/tools/roi-calculator`) — 6-email post-calculator drip ⚠️ silently cancelled
3. **Website Audit** (`/tools/website-audit`) — 5-email post-audit drip ⚠️ silently cancelled
4. **AI Opportunity Audit** (`/tools/ai-opportunity-audit`) — 2-email follow-up ✅ wired
5. **W-2 Operator Playbook** (`/tools/w2-playbook` via PDF gate) — 2-email follow-up ✅ wired
6. **Operator Vault** (`/tools/operator-vault`) — 5-email chapter drip ✅ wired
7. **Business Credit Score** (`/tools/business-credit-score`) — single-shot
8. **Executive Ops Audit** (`/tools/executive-ops-audit`) — single-shot
9. **Daily Signal** (`/tools/daily-signal`) — newsletter signup
10. **Stack Configurator + Segment Explorer** — single-shot, fall through to generic email

⚠️ Silently cancelled = the inline T+0 result email fires, but the multi-day drip queues are silently dropped by `process-email-queue` cron until handlers are wired (see Section 9).

### AI Operator Collective application flow
- `/apply` — 10-question Typeform-spec application
- Application submit creates a `Deal`, sends `aoc.application-received` email (BCC'd to Ryan)
- 30min–72h: abandoned-application reminder (one-shot)
- 2 / 5 / 9 days post-apply: booking reminders if not yet booked
- Calendly booking → post-booking confirmation (with PDF) → 3-email education drip + morning-of reminder

### Member portal (`/portal/*`, role: CLIENT)
- `/portal/dashboard` — main hub with onboarding pill, quests, quick actions, charts
- `/portal/onboard` — 5-week onboarding checklist (Foundation → Solutioning)
- `/portal/quests` — gamified achievements with feature unlocks
- `/portal/playbooks` — industry use-case library
- `/portal/marketplace` — services catalog
- `/portal/services/*` — per-service detail
- `/portal/audits/*`, `/portal/calculator`, `/portal/proposals`, `/portal/recordings`
- `/portal/crm` (full CRM — leads, scout, deals, scoring)
- `/portal/billing`, `/portal/invoices`, `/portal/templates`, `/portal/sequences`
- `/portal/follow-up-rules`, `/portal/booking`, `/portal/campaigns`
- `/portal/deal-assistant`, `/portal/ops-excellence`, `/portal/scripts`
- `/portal/content`, `/portal/client-updates`, `/portal/referrals`
- `/portal/signal`, `/portal/metrics`, `/portal/revenue`, `/portal/settings`, `/portal/support`

### Admin CRM (`/admin/*`, role: ADMIN+)
- `/admin/dashboard` — chart-heavy: revenue, pipeline funnel, action inbox
- `/admin/crm` — kanban pipeline, drag-drop deal stages
- `/admin/applications` — applicant review queue
- `/admin/follow-ups` — follow-up nudge inbox
- `/admin/mighty-invites` — Mighty Networks invite tracker
- `/admin/members` — all roles (CLIENT/RESELLER/INTERN)
- `/admin/plans` — plan/pricing management + comp grants
- `/admin/invoices` — invoice tracking
- `/admin/email-templates` — **the editor that lets non-engineers edit any email**
- `/admin/email-campaigns`, `/admin/community-sequence` — email campaign tools
- `/admin/funnel` — live conversion funnel
- `/admin/close` — Close CRM sync status
- `/admin/users`, `/admin/notifications`, `/admin/support`, `/admin/feedback`
- `/admin/chat-sessions` — AI chat session log
- `/admin/api-costs`, `/admin/usage` — spend dashboard
- `/admin/cron-status` — cron job health monitor
- `/admin/email-previews` — preview every catalog template
- `/admin/simulate` — fake lead/purchase generator (preview/dev only)
- `/admin/analytics` — UTM + conversion analytics
- `/admin/ideas` — lead-magnet ideation
- `/admin/audits` — audit submissions
- `/admin/whitelabel` — reseller domain manager
- `/admin/knowledge` — knowledge base ingestion
- `/admin/products`, `/admin/commission-ledger` — commerce + reseller comp

### Reseller portal (`/reseller/*`, role: RESELLER)
- `/reseller/dashboard`, `/reseller/leads`, `/reseller/commissions`
- `/reseller/settings/branding`, `/reseller/settings/domain` — white-label

### Intern OS (`/intern/*`, role: INTERN)
- `/intern/dashboard`, `/intern/tasks`, `/intern/clients`

### Background jobs (14 crons)
| Cron | Schedule | Purpose |
|---|---|---|
| `process-email-queue` | hourly | Fires queued sequence emails |
| `process-sequences` | every 30 min | Backup sequence dispatcher |
| `nurture-unbooked` | daily 15:00 UTC | Booking reminders day 2/5/9 |
| `abandoned-applications` | every 15 min | Mid-form abandonment nudge |
| `check-churn` | daily 9:00 UTC | At-risk member detection |
| `daily-digest` | weekday 8am UTC | Internal team digest |
| `daily-digest-operator` | weekday 12pm UTC | Per-operator digest |
| `signal-digest` | daily 10am UTC | Daily Signal newsletter |
| `weekly-rollup` | Mon 13:00 UTC | Weekly performance email |
| `follow-up-nudges` | daily 9:00 UTC | CRM follow-up reminders |
| `ingest-mighty` | every 6h | Pull new Mighty content into knowledge base |
| `mark-invoices-overdue` | daily 9:00 UTC | Flag overdue invoices |
| `grant-monthly-credits` | 1st of month 4am | Refresh plan credit budgets |
| `close-sync` | hourly | Pull from Close CRM |

---

## 5. Environment variables

All set in Vercel (Production / Preview / Development) **except where noted**.

### Critical (platform breaks if missing)
- `DATABASE_URL`, `DIRECT_URL` — Neon Postgres
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `CLERK_WEBHOOK_SECRET`
- `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`
- `RESEND_API_KEY` (current: `re_NKBbA…` — verified live)
- `ANTHROPIC_API_KEY`
- `NEXT_PUBLIC_APP_URL` (= `https://www.aioperatorcollective.com`)
- `CRON_SECRET` (gates all 14 cron endpoints)

### Integrations
- `CALENDLY_WEBHOOK_SECRET`, `CALENDLY_AOC_EVENT_TYPE_URIS` ✅
- `NEXT_PUBLIC_CALENDLY_MATT`, `NEXT_PUBLIC_CALENDLY_RYAN` ✅
- `MIGHTY_API_TOKEN`, `MIGHTY_NETWORK_ID` ✅ (now in all 3 envs)
- 🔴 **`MIGHTY_WEBHOOK_SECRET` — NOT SET. Inbound Mighty webhooks rejected until you add it.** Get value from Mighty Networks → Admin → Settings → Webhooks.
- `CLOSE_API_KEY`, `CLOSE_WEBHOOK_SECRET` ✅
- `FIRECRAWL_API_KEY`, `PERPLEXITY_API_KEY`, `TAVILY_API_KEY`
- `HUNTER_API_KEY`, `PROSPEO_API_KEY` (lead enrichment)
- `GOOGLE_PLACES_API_KEY`, `GOOGLE_MAPS_API_KEY`
- `EMAIL_BISON_API_KEY`
- `BLOB_READ_WRITE_TOKEN` (Vercel Blob uploads)
- `KV_*` / `REDIS_URL` (Upstash)
- `INTERNAL_NOTIFY_TO` (internal email recipient)
- `UNSUBSCRIBE_SECRET` (HMAC for unsubscribe URLs)
- `BOOTSTRAP_SECRET` (admin promotion endpoint)
- `VERCEL_TOKEN`, `VERCEL_PROJECT_ID`, `VERCEL_TEAM_ID` (whitelabel domain mgmt)

### Pulling envs to your local laptop
```bash
cd aims-platform
vercel env pull .env.local
```

### Adding a new env var
```bash
vercel env add MY_NEW_VAR production
vercel env add MY_NEW_VAR preview
vercel env add MY_NEW_VAR development
```

---

## 6. External integration cheat sheet

### Stripe (test mode currently)
- Dashboard: https://dashboard.stripe.com
- Webhook URL: `https://www.aioperatorcollective.com/api/webhooks/stripe`
- Events handled: `checkout.session.completed`, `customer.subscription.{created,updated,deleted}`, `invoice.{paid,payment_failed}`, `charge.refunded`
- Products + Prices configured via `/admin/products` UI

### Clerk
- Dashboard: https://dashboard.clerk.com
- Webhook URL: `https://www.aioperatorcollective.com/api/webhooks/clerk`
- Events handled: `user.created`, `user.updated`, `user.deleted`
- Roles via `publicMetadata.role` (set manually via Clerk dashboard or via `/admin/users/[userId]/role`)

### Resend
- Dashboard: https://resend.com
- Sending domain: `aioperatorcollective.com` (verify DNS records show green)
- From address: `noreply@aioperatorcollective.com`
- Reply-to: `support@aioperatorcollective.com`
- Test the API: `vercel env pull .env.local && node scripts/test-resend.ts`

### Calendly
- Webhook URL: `https://www.aioperatorcollective.com/api/webhooks/calendly`
- Events handled: **`invitee.created` only** — `canceled` and `rescheduled` are NOT handled (Section 9 deferred item)
- Live AOC consult cal: `https://calendly.com/d/cvnj-4rm-9t6/ai-operator-collective-consult-call`

### Mighty Networks
- Subdomain: `https://aioperatorcollective.mn.co`
- Webhook URL: `https://www.aioperatorcollective.com/api/webhooks/mighty`
- 🔴 Webhook will **reject all events** until `MIGHTY_WEBHOOK_SECRET` is set (intentional fail-closed)
- Member provisioning + invite emails fire from `/admin/deals/[id]/invite-to-mighty`

### Close CRM
- Webhook URL: `https://www.aioperatorcollective.com/api/webhooks/close`
- Hourly cron (`close-sync`) pulls leads + activities into our Deal model

---

## 7. Email pipeline

24 editable templates live in `src/lib/email/catalog.ts`. Edit any of them at `/admin/email-templates` (visual editor, no code required).

**Override system:** any saved override at `EmailTemplateOverride` is applied at send-time without redeploying. Reverting deletes the override and falls back to the codebase default.

**Sending order + cron schedule:** see `docs/EMAIL-TIMELINE.md` (full prose version with cron schedules + cross-bucket gotchas).

**4 drip sequences are silently cancelled today** (queued but not handled by `process-email-queue` cron):
- `post-quiz` (6 emails after AI Readiness Quiz)
- `post-calculator` (6 emails after ROI Calculator)
- `post-audit` (5 emails after Website Audit)
- `post-purchase` (6 emails after Stripe checkout)
- `partner-onboard` (5 emails — also never enrolled)

The inline T+0 result emails ARE wired and DO fire correctly. Only the multi-day follow-ups don't go out. See Section 9 for the wiring fix.

---

## 8. Known issues + limitations

### Functional gaps
1. **4 drip sequences silently dropped** — see Section 7 above.
2. **Stripe checkout doesn't flip Clerk role metadata.** After paid checkout, `Subscription` row exists but Clerk `publicMetadata.role` doesn't update. User must log out + back in to see new portal. (Fix is ~30 min: add `clerk.users.update()` in `handle-checkout-completed.ts`.)
3. **Calendly cancellations + reschedules unhandled.** Webhook only handles `invitee.created`. If applicant reschedules, morning-of fires for OLD time.
4. **No EmailTemplateOverride audit log.** Edits log to console only — no append-only DB trail. Bad for compliance.
5. **Onboarding milestone emails (4 of them) defined but never fired.** `fireMilestoneEmailIfNeeded` is wired in `lib/email/onboarding-milestones.ts` but never called.
6. **`ops.fulfillment-assignment` email defined but no production trigger.** Only the admin test-send route fires it.
7. **Mighty webhook is fail-closed without secret** (intentional, security audit C2). Set `MIGHTY_WEBHOOK_SECRET` to unblock.

### Performance / scale
1. **`getDealsByStage` returns full pipeline with no pagination.** Fine at ~50 deals; degrades past ~500.
2. **Marketing pages eager-import framer-motion.** ~50KB extra on every public page-load. Tolerable but worth lazy-loading later.
3. **`/admin/email-templates/[key]` runs full email render server-side per page load** (via dry-run). Adds ~200-1000ms to editor open. Acceptable.

### Operational
1. **Both repos sync via mirror.** Pushes to either propagate. Don't force-push to main.
2. **No `prisma/migrations` folder** — schema changes apply via `prisma db push` (no audit trail). Long-term, switch to `prisma migrate dev`.
3. **Production database is shared with Preview deploys.** Test-form submissions land in real prod data. Low-risk for a 10-tester beta but worth setting up Neon branches once volume grows.

### Security posture (after the 2026-05-06 audit)
- ✅ HTML sanitizer on email template editor (XSS closed)
- ✅ Test-send recipient locked to admin email
- ✅ All 6 webhooks verify signatures
- ✅ `escapeHtml` + `sanitizeHeaderText` on every customer-facing sender
- ✅ `simulate-*` routes return 404-before-auth in production
- ✅ All API routes auth-gated and role-gated correctly
- ✅ View-as cookie cannot escalate from non-admin → admin

---

## 9. Deferred work (explicit punch list)

These are deliberate "not done yet" items. Each has a fix path described below.

### A. Wire the 4 silently-cancelled drip sequences (~4–6 hours total)
**Where:** `src/app/api/cron/process-email-queue/route.ts:78-91` — extend the switch statement.
**Pattern to copy:** look at how `operator-vault`, `business-ai-audit`, `w2-playbook` are handled (each calls a `build*Email(emailIndex, meta)` function from `src/lib/email/*-sequence.ts`).
**For each drip you wire:** create the per-message builders + add a switch case + ensure the templateKeys exist in the catalog.

### B. Stripe checkout → Clerk role flip (~30 min)
**Where:** `src/lib/stripe/handlers/handle-checkout-completed.ts` after the user resolution step.
**Add:** `clerkClient.users.updateUser(userId, { publicMetadata: { role: "CLIENT" } })`.
**Optional:** call `clerkClient.sessions.revokeSession()` to force-refresh.

### C. Calendly invitee.canceled / .rescheduled handling (~1 hr)
**Where:** `src/app/api/webhooks/calendly/route.ts:150` — add cases.
**For canceled:** mark Deal `DEMO_CANCELED`, cancel pending `EmailQueueItem` rows by `recipientEmail + sequenceKey`.
**For rescheduled:** delete the existing morning-of queue item, schedule a new one at `newStartTime − 3h`.

### D. EmailTemplateOverride audit log (~1.5 hr)
**Where:** new model `EmailTemplateOverrideHistory(id, templateKey, subject, html, updatedById, updatedAt)`.
**Wire:** append a row on every PUT/DELETE in `/api/admin/email-templates/[key]/route.ts`.
**UI:** add a "Version history" tab in `TemplateEditorClient.tsx`.

### E. Wire `fireMilestoneEmailIfNeeded` to onboarding-step API (~15 min)
**Where:** `src/app/api/portal/onboarding/progress/route.ts` POST handler.
**Add:** before returning, fetch previous count + new count, call `fireMilestoneEmailIfNeeded({ userId, newCount, previousCount })` inside `void` so it doesn't block the response.

### F. Wire `sendFulfillmentAssignment` to admin assignment flow (~15 min)
**Where:** the API route that updates `Deal.assignedTo` (find it via Grep).
**Add:** fire `sendFulfillmentAssignment` after the assignment write succeeds.

---

## 10. Common tasks reference

### "I want to edit an email's copy"
Go to `/admin/email-templates` → click the email → edit in visual editor → Save. No deploy needed.

### "I want to send a test email"
On any template page, click "Send test" — defaults to your own admin email (locked server-side, can't override).

### "I want to add a new admin user"
Have an existing admin run `/api/admin/users/[userId]/role` PUT with `role: "ADMIN"`, OR set `publicMetadata.role: "ADMIN"` directly in Clerk dashboard.

### "I want to test-fire a Stripe checkout flow"
Use Stripe's test card numbers. Test mode is current. Webhook events for test cards land at the same handler.

### "I want to run a cron manually"
```bash
curl -H "Authorization: Bearer $CRON_SECRET" https://www.aioperatorcollective.com/api/cron/<cron-name>
```

### "I want to see what emails went out today"
Check Resend dashboard, OR query `db.apiCostLog` filtered by `provider = "resend"` and `createdAt > today`.

### "I want to add a blog post"
Drop a `.mdx` file in `content/blog/` with the frontmatter format shown in `docs/PROJECT-INDEX.md`. Auto-appears at `/blog/<slug>` after deploy.

### "I want to deploy"
Push to `main`. Vercel auto-deploys. To force a redeploy without commits: `vercel --prod --yes`.

### "I want to see why a build failed"
```bash
vercel inspect <deployment-url> --logs
```

### "I want to roll back production"
```bash
vercel rollback <previous-deployment-url> --yes
```

### "I need a fresh local copy"
```bash
git clone https://github.com/AIMS-Product/AIOperatorCollective.git
cd AIOperatorCollective
npm install
vercel link  # pick aims-platform under aimanagingservices team
vercel env pull .env.local
npx prisma generate
npm run dev  # localhost:3000
```

---

## 11. Runbook — what to do when X breaks

### "Production is down"
1. Check https://aims-platform.vercel.app/api/health — should return 200.
2. If 5xx: `vercel inspect <latest-prod-url> --logs` for stack trace.
3. If symptoms point at DB: check Neon dashboard for ongoing incident.
4. Worst case: `vercel rollback <previous-deployment-url> --yes` to revert.

### "Emails aren't sending"
1. Check Resend dashboard for 4xx/5xx delivery errors.
2. Confirm `RESEND_API_KEY` is set in Vercel env (and isn't `re_placeholder`).
3. Confirm sending domain `aioperatorcollective.com` shows Verified in Resend.
4. Query `apiCostLog` for recent `provider = "resend"` rows with `metadata.error` set.
5. The send pipeline catches and logs every Resend error — check Vercel logs for `[error] Resend send failed`.

### "Cron job didn't fire"
1. Visit `/admin/cron-status` — shows last run + next run for every cron.
2. Vercel Dashboard → Cron Jobs tab — shows cron history with status codes.
3. Re-fire manually with `curl -H "Authorization: Bearer $CRON_SECRET" <cron-url>`.

### "Stripe webhook isn't processing"
1. Stripe dashboard → Webhooks → look for failed deliveries.
2. Confirm `STRIPE_WEBHOOK_SECRET` matches the endpoint's signing secret.
3. Check Vercel logs for `[error] Stripe webhook signature failed`.

### "User can't sign in"
1. Clerk dashboard → search by email.
2. If user exists in Clerk but not in our DB, the Clerk webhook may have failed. Re-fire it from Clerk dashboard → Webhooks → Send test event.
3. If user exists in both but role is wrong: edit `publicMetadata.role` in Clerk dashboard, then have them log out + back in.

### "User says they didn't get the welcome email"
1. Resend dashboard → search by recipient.
2. If sent + delivered: check spam folder.
3. If not sent: check Vercel logs around their `user.created` Clerk webhook timestamp.
4. Re-fire manually: hit `/admin/email-previews` for the relevant template, paste their email, send.

### "Stripe charge succeeded but user has no portal access"
This is the known issue from Section 8.2 — Clerk role isn't auto-flipped. Fix manually:
1. Go to Clerk dashboard → user → Public metadata → set `role: "CLIENT"`
2. Have user log out + back in.
3. Long-term: implement deferred item B above.

### "Mighty webhook isn't firing"
Currently expected — `MIGHTY_WEBHOOK_SECRET` not set. Fix:
1. Mighty Networks → Admin → Settings → Webhooks → copy secret.
2. `vercel env add MIGHTY_WEBHOOK_SECRET production` (and `preview`, `development`).
3. Redeploy: `vercel --prod --yes`.

### "Calendly booking didn't trigger post-booking email"
1. Confirm `CALENDLY_AOC_EVENT_TYPE_URIS` env var matches the URI of the event type used.
2. Calendly dashboard → Webhooks → check if delivery succeeded.
3. If event type wasn't in the allowed list, the webhook returns 200 but skips processing.

### "I broke something with a bad commit"
```bash
git revert <bad-commit-sha>
git push origin main
# Vercel auto-deploys the revert
```
Or hard rollback:
```bash
vercel rollback <last-good-deployment> --yes
```

---

## 12. Who has access to what

### GitHub `AIMS-Product` org
- **Admin:** Jess (`Jess-AIMS`) — full org control + repo admin
- **Member:** Adam (`adamwolfe2`) — write on `AIOperatorCollective` repo, member on org (can't invite people — Jess does that)
- **Other members:** colmmurrer-eng, DomAims, joshuastein-MA, JV-AIMS

### Vercel `aimanagingservices` team
- Adam Wolfe (account: aimanagingservices) — full team admin
- Anyone added at the team level can see all 17 projects

### Neon
- Project: `aims-platform` (or similar — visible at console.neon.tech)
- Adam owns. Add Jess via Sharing tab if she'll do schema work.

### Stripe
- Currently in test mode. Adam owns. Invite team via Settings → Team.

### Resend
- Adam owns. Single domain (`aioperatorcollective.com`). Invite via Team.

### Clerk
- Adam owns. Single application. Invite team via Settings → Members.

### Mighty Networks
- The community subdomain `aioperatorcollective.mn.co`. Admin access via Mighty's own dashboard.

---

## 13. Recent work shipped (last 7 days)

In reverse chronological order (newest first):

| Date | Commit | Summary |
|---|---|---|
| 2026-05-07 | `c3a3453` | AIOC acronym spelled out in abandoned-application email |
| 2026-05-07 | `2bdfc00` | Generalized PROJECT-INDEX.md (removed personal names) |
| 2026-05-07 | `26f4eba` | Added PROJECT-INDEX.md (where everything lives) |
| 2026-05-07 | `855a4d2` | Pre-Jess audit: security + perf + UX fixes from 6-agent review (#2) |
| 2026-05-06 | `2956bb2` | Render templates in actual journey send-order |
| 2026-05-06 | `2b1a106` | WYSIWYG editor + prefilled defaults from real send pipeline |
| 2026-05-06 | `afb3d33` | See/edit/save every email template from the CRM |
| 2026-05-06 | `ed6d438` | Walk-before-run journey sequencing |
| 2026-05-06 | `f21df6e` | Mobile headline stacking fix |
| 2026-05-06 | `713acff` | 10-question Typeform application |
| 2026-05-06 | `2629a90` | Lead-magnet test directory doc |
| 2026-05-06 | `8bd401a` | Operator-apprenticeship landing copy rewrite |
| 2026-05-05 | `8fe6bde` | Auto-comp, sequence cron, admin Plans UI, smoke tests |
| 2026-05-04 | `4e27a59` | 7 new portal features — proposals, deal-assistant, templates |
| 2026-05-03 | `86894da` | Marketplace catalog with feature lists |
| 2026-05-03 | `86f59d3` | Plan-based subscription gating + credit system |

---

## 14. Where to find more docs

| Doc | Lives at | Purpose |
|---|---|---|
| `PROJECT-INDEX.md` | `docs/` | Where everything lives + how to add new content |
| `EMAIL-TIMELINE.md` | `docs/` | Full email order + cron schedules |
| `JOURNEY-PHILOSOPHY.md` | `docs/` | The walk-before-run model |
| `LEAD-MAGNETS.md` | `docs/` | All 8 lead magnets with test URLs |
| `AUDIT_REPORT_2026-05-06.md` | `docs/` | Most recent end-to-end audit |
| `MIGHTY-NETWORKS-API.md` | `docs/` | Mighty integration details |
| `mighty/CONTENT-FULL.md` | `docs/mighty/` | Full inventory of curriculum |
| `CLOSE_INTEGRATION.md` | `docs/` | Close CRM sync logic |
| `PRODUCTIZED-SERVICES-CATALOG.md` | `docs/` | The 15 services we sell |
| `AIMS-PLATFORM-BUILD-PROMPT.md` | `docs/` | Original architecture spec |
| `AIMS-DEEP-DIVE-SPEC.md` | `docs/` | UI implementation details |
