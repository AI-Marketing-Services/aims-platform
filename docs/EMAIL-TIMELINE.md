# AIMS Platform — Email Timeline

**Audience:** Jess (and anyone editing email copy).
**Use this to:** know exactly which email fires when, and what triggers it, before rewriting any copy.

---

## How to read this doc

- Every email has a **templateKey** — that's the same key you'll see in the admin editor at `/admin/email-templates/[key]`.
- "Day" means **delay from the trigger event**, not calendar day. T+0 = "fires immediately."
- "Trigger" is the exact event that fires it (Stripe webhook, cron job, form submit, manual admin action).
- "File" is where the send code lives, in case anyone needs to dig deeper.

### Cron schedules (in UTC)

These crons control all the "delayed" emails:

| Cron | Schedule | What it does |
|------|----------|--------------|
| `process-email-queue` | every hour | Fires anything in the email queue whose `scheduledFor` time has passed. **Every drip in this doc rides on this cron** — so a "T+2 days" email sends within 1 hour of the 48-hour mark. |
| `nurture-unbooked` | daily 15:00 UTC | Sends booking reminders to AOC applicants who haven't booked. |
| `abandoned-applications` | every 15 min | Sends the "your playbook is waiting" nudge to people who started the application form but didn't finish. |
| `process-sequences` | every 30 min | Backup dispatcher for sequence enrollments. |

### One important rule everywhere: 90-day re-enrollment block

If a user re-submits the same form (re-applies, re-downloads, re-purchases) within 90 days, they will **not** re-enter the same drip. This is hardcoded in `queueEmailSequence` to stop accidental double-sends.

---

## 1. Foundation — Signup → Week 1

| Day | Email (templateKey) | What it says | Trigger | File |
|-----|---------------------|--------------|---------|------|
| T+0 | `welcome.operator-signup` | Confirms account, points to `/portal/onboard`, "walk before run" framing | Clerk `user.created` webhook (first portal sign-up only) | `src/app/api/webhooks/clerk/route.ts` → `src/lib/email/index.ts` |

**Onboarding milestones (currently DEAD CODE — defined but not wired):**

| When | Email | Status |
|------|-------|--------|
| 1 step done | `onboarding-milestone-first_step` — "off the starting line" | ⚠️ Never fires automatically |
| 4 steps done | `onboarding-milestone-week1_done` — "Week 1 complete, Toolkit unlocked" | ⚠️ Never fires automatically |
| 6 steps done | `onboarding-milestone-half_done` — "halfway there" | ⚠️ Never fires automatically |
| 12 steps done | `onboarding-milestone-complete` — "full access yours" | ⚠️ Never fires automatically |

> These four milestone emails are scaffolded but `fireMilestoneEmailIfNeeded` is never called from the onboarding-step API. They sit in `src/lib/email/onboarding-milestones.ts` waiting to be wired up.

---

## 2. Application + Booking (AOC)

This is the path someone takes when they apply to the AI Operator Collective from the marketing site.

### 2a. Application form path

| Day | Email (templateKey) | What it says | Trigger |
|-----|---------------------|--------------|---------|
| T+0 | `aoc.application-received` | Confirms submission + Cal link to book consult. **BCC'd to Ryan for funnel tracking.** | Form submitted at `/apply` → `POST /api/community/apply` |
| T+30min – 72h (only if they abandoned mid-form) | `aoc.application-abandoned` | Warm "your playbook is waiting" nudge. **Sent once, then 90-day cooldown.** | `abandoned-applications` cron (every 15 min) |
| T+2 days (if no booking yet) | `aoc.booking-reminder.day-2` | First booking nudge | `nurture-unbooked` cron (daily 15:00 UTC) |
| T+5 days (if still no booking) | `aoc.booking-reminder.day-5` | Second nudge | Same cron |
| T+9 days (if still no booking) | `aoc.booking-reminder.day-9` | Final nudge — "going silent now" tone | Same cron |

**Booking nudges stop firing if** the deal stage advances past `APPLICATION_SUBMITTED`, OR if the deal has a `DEMO_COMPLETED` or `MIGHTY_MEMBER_JOINED` activity.

### 2b. Post-booking path (after they book a Cal call)

| Day | Email (templateKey) | What it says | Trigger |
|-----|---------------------|--------------|---------|
| T+0 (immediate) | `aoc.post-booking-confirmation` | Confirms the call, shows call details, and frames the raw material to bring before speaking with Ryan | Calendly webhook `invitee.created` |
| T+1 day | `aoc-day-1-problem-first` | "Tools are not the product" | Queued at booking, fired by `process-email-queue` cron |
| T+2 days | `aoc-day-2-raw-material` | "Your background is raw material" | Same |
| T+3 days | `aoc-day-3-call-prep` | "What Ryan will ask about" | Same |
| 3h before scheduled call | `post-booking-morning-of` | Morning-of reminder with call details. Skipped if call is < 30 min away. | Computed from Cal event start time |

### 2c. After they close (manual)

| Day | Email (templateKey) | What it says | Trigger |
|-----|---------------------|--------------|---------|
| Manual | `aoc.collective-invite` | Branded invite + 30-day roadmap + Mighty Networks login | **Admin clicks "Invite to Mighty" button on the deal** (NOT automatic). |

---

## 3. Lead Magnets

Each lead magnet sends one immediate "results" email and (for some) enrolls the lead into a multi-day drip sequence.

### 3a. AI Readiness Quiz → `post-quiz` drip (6 emails)

| Day | Email | What it says |
|-----|-------|--------------|
| T+0 | `lead-magnet.ai-readiness-quiz` | Your AI Readiness Results (with score) |
| T+2 | `quiz-case-study` | "What a business like yours looked like before AIMS" |
| T+4 | `quiz-product-rec` | "The product that matches your biggest gap" |
| T+7 | `quiz-roi-angle` | "What's a month of inaction costing you?" |
| T+10 | `quiz-competitive` | "Your competitors are already doing this" |
| T+14 | `quiz-offer` | "Get your first month free if you start this week" |

### 3b. ROI Calculator → `post-calculator` drip (6 emails)

| Day | Email | What it says |
|-----|-------|--------------|
| T+0 | `lead-magnet.roi-calculator` | Your personalized ROI report |
| T+1 | `calc-cost-of-waiting` | "The cost of waiting" |
| T+3 | `calc-product-match` | "The AIMS product that solves your biggest cost center" |
| T+5 | `calc-case-study` | "A business like yours saved $X/mo" |
| T+8 | `calc-recent-win` | "We built this for a similar business last month" |
| T+12 | `calc-book-call` | "Let's rebuild your ROI model live together" |

### 3c. Website Audit → `post-audit` drip (5 emails)

| Day | Email | What it says |
|-----|-------|--------------|
| T+0 | `lead-magnet.website-audit` | Your website audit report |
| T+1 | `audit-fix-1` | "Fix #1 from your audit" |
| T+3 | `audit-fix-2` | "Fix #2: SEO without a team" |
| T+5 | `audit-before-after` | "Before and after: a similar business" |
| T+9 | `audit-offer` | "$97/month fixes everything on your audit report" |

### 3d. Operator Vault / AI Playbook Vault → `operator-vault` drip (6 emails)

> ⚠️ **Heads up: there are TWO separate "AI Operator" magnets** that look similar:
> - **Operator Vault landing form** (`/api/community/lead`) → fires the `operator-vault` 6-email chapter drip below.
> - **AI Playbook PDF gate** (`/api/lead-magnets/ai-playbook`) → reuses the `post-quiz` drip from section 3a.

| Day | Email | What it says |
|-----|-------|--------------|
| T+0 | `lead-magnet.operator-vault` | Chapter 1 + community invite |
| T+1 | `operator-vault-ch2` | "Chapter 2: cold email sequence AIMS uses" |
| T+3 | `operator-vault-ch3` | "Chapter 3: discovery script" |
| T+6 | `operator-vault-ch4` | "Chapter 4: pricing in ranges + MSA" |
| T+10 | `operator-vault-ch5` | "Chapter 5: delivery playbook" |
| T+14 | `operator-vault-closing` | "Last call — alpha cohort review window is closing" |

### 3e. W-2 Playbook → `w2-playbook` drip (3 emails total)

| Day | Email | What it says |
|-----|-------|--------------|
| T+0 | `lead-magnet.w2-playbook` | Welcome + playbook link |
| T+5 | `w2-playbook-stall` | "Why most W-2 operators stall at $2k/mo" |
| T+12 | `w2-playbook-closing` | "Last play, then I'll stop emailing you" |

### 3f. AI Opportunity Audit → `business-ai-audit` drip (3 emails total)

| Day | Email | What it says |
|-----|-------|--------------|
| T+0 | `lead-magnet.ai-opportunity-audit` | Full custom audit report |
| T+5 | `business-audit-build-vs-buy` | "Your in-house team vs. an Operator Collective member" |
| T+12 | `business-audit-closing` | "Last note from the Collective" |

### 3g. Single-shot magnets (no follow-up drip)

These send the results email and stop. No nurture sequence.

| Magnet | Email | Why no drip |
|--------|-------|-------------|
| Business Credit Score | `lead-magnet.business-credit-score` | Single-touch tool |
| Executive Ops Audit | `lead-magnet.executive-ops-audit` | Single-touch tool |
| Segment Explorer | (generic fallback) | Not in `SEQUENCE_MAP` |
| Stack Configurator | (generic fallback) | Not in `SEQUENCE_MAP` |

---

## 4. Lifecycle / Billing

Fires off Stripe webhooks for paid plans (Pro / Operator).

| Day | Email (templateKey) | What it says | Trigger |
|-----|---------------------|--------------|---------|
| T+0 (purchase moment) | `welcome.paid-subscription` | Confirms plan, sends to portal | Stripe `checkout.session.completed` |
| T+0 | `onboard-welcome` (queued copy) | Welcome (drip starts) | `post-purchase` sequence index 0 |
| T+1 | `onboard-setup` | "Your setup guide" | `post-purchase` index 1 |
| T+3 | `onboard-features` | "Feature spotlight" | `post-purchase` index 2 |
| T+7 | `onboard-checkin` | "How's everything going?" | `post-purchase` index 3 |
| T+14 | `onboard-upsell-1` | "Ready for the next level?" | `post-purchase` index 4 |
| T+30 | `onboard-upsell-2` | "30 days in: here's what's next" | `post-purchase` index 5 |
| Each renewal | `lifecycle.renewal` | Confirms charge + next billing date | Stripe `invoice.paid` (skips first invoice) |
| On payment failure | `lifecycle.payment-failed` | Retry guidance | Stripe `invoice.payment_failed` |
| On cancellation | `lifecycle.cancellation` | Confirms cancel + reactivation link | Stripe `customer.subscription.deleted` |

> When an admin manually flips a user to `CLIENT` role via the admin panel, the `post-purchase` drip is enrolled but **the inline welcome email is NOT sent** — only the queued sequence runs.

---

## 5. Ops + Support

Internal/operational emails — usually triggered by team actions, not customer behavior.

| Day | Email (templateKey) | Recipient | Trigger |
|-----|---------------------|-----------|---------|
| T+0 (member opens ticket) | `support.ticket-confirmation` | Member | `POST /api/support/tickets` |
| T+0 (team replies) | `support.reply-to-client` | Member | `POST /api/admin/tickets/[id]/reply` |
| T+0 (status flipped to resolved/closed) | `support.ticket-resolved` | Member | `POST /api/admin/tickets/[id]/status` |
| T+0 (assignment) | `ops.fulfillment-assignment` | Intern/operator | ⚠️ Currently **only** fired by the admin test-email route — no production trigger wired up. |

---

## Gotchas & known issues

1. **Onboarding milestone emails are dead code** — the four "milestone" emails (first_step, week1_done, half_done, complete) exist in `src/lib/email/onboarding-milestones.ts` but are never called from any production code path. They will not fire automatically until someone wires `fireMilestoneEmailIfNeeded` into the onboarding-step API.
2. **Two separate "AI Operator" lead magnets** route to different drips — see section 3d. If you change copy, change the right one.
3. **AOC apply lives at `/api/community/apply`**, not `/api/aoc/apply`.
4. **`sendFulfillmentAssignment` is unwired** outside the admin test route — operators don't actually get this email when they're assigned a client. Needs to be wired into the admin "assign" action.
5. **90-day cooldown** on every drip — re-submitting the same form within 90 days won't re-enter the same drip.
6. **All "+N day" sends drift up to 1 hour late** — they fire on the next `process-email-queue` cron run after their scheduled timestamp.
7. **Application-received email is BCC'd to Ryan** for funnel tracking.
8. **Multi-product cart** = one welcome email + one drip enrollment (not one per item).
9. **Manual collective invite** — the post-close "Welcome to the Collective" email (`aoc.collective-invite`) is NOT automatic. An admin has to click "Invite to Mighty" on the deal in the CRM.

---

## How to edit the actual copy

Don't edit the `.ts` files unless you want to ship code. Instead:

1. Go to **`/admin/email-templates`** in the admin panel.
2. Click any template (uses the `templateKey` from this doc).
3. Edit subject + body in the visual editor.
4. **Save** — your version overrides the code default at send-time.
5. **Send Test** to your own inbox before relying on it.

Reverting deletes the override and falls back to whatever ships in the codebase.
