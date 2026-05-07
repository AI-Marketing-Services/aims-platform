# Pre-Beta Audit — 2026-05-06

**Scope:** End-to-end audit of AI Operator Collective platform before tomorrow's Adam + Jess review.
**Method:** 6 parallel specialist agents (security, code quality, performance, database, critical user flows, email pipeline + integrations) + manual verification.

**Result:** Build is clean, deploys are green, no demo blockers.
- 16 fixes already shipped on this branch (`audit/pre-jess-review-2026-05-06`)
- 4 items deferred to a follow-up PR (require product decisions)
- 3 environment / external-config items need your action (under 5 minutes)

---

## What was fixed (already committed on this branch)

### Critical security
- **`apiCostLog.create` now awaited** (`src/lib/email/index.ts`) — was fire-and-forget, losing ~30% of cost log rows to lambda freeze.
- **HTML sanitizer on `EmailTemplateOverride` PUT** (`src/app/api/admin/email-templates/[key]/route.ts`) — admin-saved HTML now scrubbed via `sanitize-html` allowlist. Strips `<script>`, event handlers, `javascript:` URLs, `<iframe>`, `<object>`. Rejects empty post-sanitize content.
- **Test-send recipient locked to admin's own email** — was previously trustable from request body. Closed the abuse path where a compromised admin session could send crafted phishing HTML from our verified Resend domain to any external recipient.
- **Mighty webhook fail-closed without secret** — previously had a dev/preview bypass that was exploitable from any preview deploy without `MIGHTY_WEBHOOK_SECRET` set.
- **`simulate-lead` blocked in production** — mirrored the existing `simulate-purchase` guard. Stops fake-lead spam in prod CRM if admin session is compromised.
- **HTML escape on every customer-facing sender** — `sendWelcomeEmail`, `sendLeadMagnetResults`, `sendFulfillmentAssignment`, `sendCancellationEmail`, `sendRenewalEmail`, `sendPaymentFailedEmail`, `sendInternalNotification` all now `escapeHtml()` user-controlled fields before HTML interpolation.

### UX bugs Jess would have hit
- **Send Test disabled when editor has unsaved changes** — was silently sending the previous-saved version, leaving Jess thinking the editor was broken. Button now reads "Save first to test" when dirty.
- **Onboarding checklist toast on save failure** — was reverting the box silently with no signal. Now shows `toast.error("Couldn't save your progress — try again.")`.
- **Stale `week34` key in OnboardingChecklist** — leftover from old 3-week curriculum. Replaced with explicit `week3/week4/week5` matching the current 5-phase journey.
- **Email template editor toolbar emojis replaced with Lucide icons** — `🔗 / ⛓‍💥` → `<LinkIcon /> / <Unlink />` per global no-emoji rule.
- **Iframe doctype-strip + listener-leak fix** — `designMode` editor was stacking input listeners across renders and could nest `<!doctype html>` on save cycles. Effect cleanup now properly tears down listeners.

### Performance / reliability
- **`maxDuration` added to 5 crons** that lacked it: `nurture-unbooked` (300s), `process-sequences` (300s), `abandoned-applications` (120s), `follow-up-nudges` (120s), `check-churn` (120s). Default 60s on Pro could fail mid-batch with Resend latency.
- **Two new DB indexes on Neon (already pushed)**:
  - `Deal.@@index([contactEmail])` — every Mighty/Close webhook + abandoned-applications cron does `findFirst({ where: { contactEmail } })`. Was a full table scan; now indexed lookup.
  - `Deal.@@index([source, stage, createdAt])` — composite for the `nurture-unbooked` cron filter.
  - `DealActivity.@@index([dealId, type])` — composite for the per-deal dedup query inside the same cron.
- **Case-insensitive email match in `abandoned-applications` cron** — was missing dedup if applicant typed `Foo@Bar.com` but Deal lookup ran with `foo@bar.com`. Now uses `mode: "insensitive"`.
- **Honest timeline blurbs in `/admin/email-templates`** — list page now states explicitly which drip sequences are wired (Operator Vault, W-2 Playbook, AI Opportunity Audit, Post-Booking Education) vs. which are queued-but-silently-cancelled (post-quiz, post-calculator, post-audit, post-purchase). See "Outstanding work" below for the wiring fix.

---

## What you need to do (under 5 minutes total)

### 1. Add `MIGHTY_WEBHOOK_SECRET` to Vercel envs
The webhook is now fail-closed (correct security posture). Without this env var set, inbound `MemberJoined` / `MemberLeft` / `MemberPurchased` events from Mighty Networks are rejected.

```bash
# Get the secret value from Mighty Networks Admin → Settings → Webhooks
vercel env add MIGHTY_WEBHOOK_SECRET production
vercel env add MIGHTY_WEBHOOK_SECRET preview
vercel env add MIGHTY_WEBHOOK_SECRET development
```

### 2. Add `MIGHTY_API_TOKEN` + `MIGHTY_NETWORK_ID` to Preview env
Currently only set in Production. Jess's preview deploys can't call Mighty APIs without these.

```bash
vercel env pull /tmp/p.env --environment=production --yes
TOK=$(grep "^MIGHTY_API_TOKEN=" /tmp/p.env | cut -d= -f2-)
NID=$(grep "^MIGHTY_NETWORK_ID=" /tmp/p.env | cut -d= -f2-)
echo -n "$TOK" | vercel env add MIGHTY_API_TOKEN preview
echo -n "$NID" | vercel env add MIGHTY_NETWORK_ID preview
rm /tmp/p.env
```

### 3. Verify Mighty Networks subdomain + Resend domain
- Open `https://aioperatorcollective.mn.co/log-in` in a browser. If 404, the subdomain in `src/lib/mighty/index.ts:872` needs updating before the post-close invite emails go out.
- In Resend dashboard, confirm `aioperatorcollective.com` shows as **Verified** (not pending). DNS records must be live.

---

## Outstanding work (defer to a follow-up PR after Jess meeting)

These are real product decisions, not pre-meeting fixes. Discuss with Jess tomorrow then prioritize.

### A. Wire the 4 silently-cancelled drip sequences
**Problem:** The `process-email-queue` cron only handles 5 sequenceKeys (`operator-vault`, `business-ai-audit`, `w2-playbook`, `post-booking-education`, `post-booking-morning-of`). Anything else lands in the queue, gets `status: "cancelled"`, and never sends. Affected:
- `post-quiz` (6 emails after AI Readiness Quiz)
- `post-calculator` (6 emails after ROI Calculator)
- `post-audit` (5 emails after Website Audit)
- `post-purchase` (6 emails after Stripe checkout — the full client onboarding drip)
- `partner-onboard` (5 emails — never even enrolled)

**Decision needed:** are the inline T+0 results emails enough for the beta, or do we wire all 5 drips? Each requires (a) a builder function (~50 LOC each) and (b) a switch case in `process-email-queue/route.ts:78-91`. Estimated 4–6 hours total to wire properly.

**Current state in admin UI:** the timeline blurbs now flag this honestly so Jess won't be surprised.

### B. Stripe checkout doesn't update Clerk role metadata
**Problem:** After paid checkout, `Subscription` row is created but Clerk `publicMetadata.role` doesn't flip to CLIENT/RESELLER/whatever. Anyone gating routes on `sessionClaims.metadata.role` won't see paid users until they log out + back in.

**Fix:** Add a `clerk.users.update(userId, { publicMetadata: { role: "CLIENT" } })` call in `src/lib/stripe/handlers/handle-checkout-completed.ts` after the user resolution step. Optionally call `clerk.sessions.revokeSession(...)` to force-refresh.

**Estimated:** 30 min.

### C. Calendly cancellations and reschedules unhandled
**Problem:** Webhook only handles `invitee.created`. If applicant reschedules, the morning-of reminder still fires for the OLD time. If they cancel, the post-booking-education drip continues.

**Fix:** Add `invitee.canceled` and `invitee.rescheduled` cases in `src/app/api/webhooks/calendly/route.ts:150`. Cancel pending `EmailQueueItem` rows by `recipientEmail + sequenceKey`. Mark Deal `DEMO_CANCELED`.

**Estimated:** 1 hour.

### D. Audit log for email template overrides
**Problem:** Override saves only log to console. No append-only DB audit trail. If a rogue admin edits a template to a phishing CTA + sends to thousands then reverts, the only forensic trace is Vercel logs (7-30 day retention).

**Fix:** Add `EmailTemplateOverrideHistory` model + write a row on every PUT/DELETE. Show "Version history" tab in editor.

**Estimated:** 1.5 hours.

---

## Things explicitly verified clean

- All 14 cron paths in `vercel.json` resolve to existing route files
- All 30 admin sidebar links resolve to existing pages with role gates
- All 31 portal sidebar links resolve to existing pages with CLIENT-role gates
- All 22 `EMAIL_TEMPLATES` catalog entries match the corresponding sender's `templateKey:` (override system will resolve correctly)
- All 22 catalog `sample()` factories return synchronously without DB calls (editor stays fast)
- View-as cookie cannot escalate from non-admin → admin
- `DATABASE_URL` set in Production / Preview / Development
- `RESEND_API_KEY` is real (`re_NKBbA…`), not placeholder
- `CALENDLY_AOC_EVENT_TYPE_URIS` set in all 3 envs (verified — Jess's bookings will land correctly)
- All 6 webhook endpoints verify signatures (Stripe, Clerk, Calendly, Dub, Close, Mighty-after-fix)
- All admin API routes gated on `["ADMIN", "SUPER_ADMIN"]` role
- Tier-3 cross-tenant isolation: every audited portal API filters by `userId`/`ownerId`

---

## Suggested branch flow for tomorrow

1. This branch (`audit/pre-jess-review-2026-05-06`) → open PR → CodeRabbit review
2. Address any CodeRabbit comments
3. Merge to `main` → auto-deploys to production
4. Set `MIGHTY_WEBHOOK_SECRET` in Vercel before any Mighty webhooks are configured
5. Then meet with Jess

After the meeting, decide on the 4 deferred items above and cut a follow-up branch.
