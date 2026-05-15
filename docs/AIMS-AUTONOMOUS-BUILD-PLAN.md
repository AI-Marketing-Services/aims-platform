# AIMS Platform — Autonomous Build Plan & Operations Reference

---

## Repo Copy Manifest

Files to port/adapt from reference repos when building features:

### FROM wholesail (github.com/adamwolfe2/wholesail)
| Feature | Source File | Target | Notes |
|---------|------------|--------|-------|
| DB adapter | lib/db/index.ts | src/lib/db/index.ts | Neon HTTP adapter pattern |
| Stripe service | lib/stripe/*.ts | src/lib/stripe/index.ts | 7-file layer → merged to single file |
| Auth middleware | middleware.ts | src/middleware.ts | createRouteMatcher pattern — DONE |
| Dashboard layout | components/admin-dashboard.tsx | src/app/(admin)/layout.tsx | Sidebar + dark mode — DONE |
| Pipeline board | components/pipeline-board.tsx | src/app/(admin)/crm/CRMKanban.tsx | Static version built, DnD in progress |
| Logo ticker | components/tech-marquee.tsx | src/components/marketing/LogoTicker.tsx | CSS scroll animation — DONE |
| Intake wizard | components/intake-wizard.tsx | src/app/(marketing)/get-started/page.tsx | Multi-step checkout |

### FROM trackr (github.com/adamwolfe2/trackr)
| Feature | Source File | Target | Notes |
|---------|------------|--------|-------|
| Research stream | components/tools/research-stream.tsx | src/app/(marketing)/tools/website-audit/page.tsx | 6-step animated progress — DONE (mock) |
| Kanban board | components/tools/kanban-board.tsx | src/app/(admin)/crm/CRMKanban.tsx | @dnd-kit pattern with drag overlay |
| Integration logos | public/integrations/*.svg | public/integrations/ | 43 logos copied — DONE |
| Firecrawl service | lib/services/firecrawl.ts | src/lib/ai/firecrawl.ts | For website audit backend |
| Tavily search | lib/services/tavily.ts | src/lib/ai/tavily.ts | For segment explorer |

### FROM taskspace (github.com/adamwolfe2/taskspace)
| Feature | Source File | Target | Notes |
|---------|------------|--------|-------|
| Task kanban | components/kanban-board.tsx | src/app/(intern)/tasks/page.tsx | 5-column task board |
| Task card | components/task-card.tsx | src/app/(intern)/tasks/ | Priority badge, due date, linked items |
| EOD submission | components/ai-eod-submission.tsx | src/app/(intern)/eod-report/page.tsx | Adam's exact format |
| EOD status bar | components/eod-status-bar.tsx | src/components/intern/ | Shows daily submission status |
| Time tracker | components/time-tracker.tsx | src/app/(intern)/tasks/ | Actual hours tracking |
| Slack integration | lib/integrations/slack.ts | src/lib/notifications.ts | EOD → #aimseod channel |

---

## Paperclip Agent Configs

### Agent 1: CEO Intelligence Agent
**Purpose**: Daily briefing + strategic monitoring
**Trigger**: Cron daily at 7am ET
**Actions**:
- Pull MRR from Stripe API
- Pull new leads from Deals table (last 24h)
- Pull EOD summaries from yesterday's EODReport records
- Pull ApiCostLog totals (last 24h)
- Compose briefing via Claude Haiku
- Post to #aims-channel Slack: "Good morning Adam. Here's your daily briefing..."

### Agent 2: Platform Builder Agent
**Purpose**: Autonomous code implementation for queued tasks
**Trigger**: Manual or Notion task status change → "Ready to Build"
**Actions**:
- Read task spec from Notion
- Check existing codebase for related files
- Write/edit files
- Run build check
- Commit and push
- Update Notion task to "In Review"

### Agent 3: Fulfillment Ops Agent
**Purpose**: Ensure new subscriptions get set up within 24 hours
**Trigger**: Webhook on Subscription.fulfillmentStatus = PENDING_SETUP
**Actions**:
- Check if setup tasks are created (FulfillmentTask records)
- Send assignment email to defaultAssignee
- Post to #aims-channel: "New client [name] needs [service] setup. Assigned to [assignee]."
- Check back in 24h — if still PENDING_SETUP, escalate to Adam

### Agent 4: Lead Qualifier Agent
**Purpose**: Score and route inbound leads from lead magnets
**Trigger**: POST /api/lead-magnets/submit fires
**Actions**:
- Read submission data + score
- Classify lead tier (Hot/Warm/Cold) based on score + company size + industry
- Update Deal.priority accordingly
- If Hot: post to Slack immediately, create URGENT priority deal
- If Warm: add to 7-day drip sequence
- If Cold: add to 30-day nurture sequence

### Agent 5: Content Writer Agent
**Purpose**: Weekly content production for Ailyn
**Trigger**: Cron Monday 9am ET
**Actions**:
- Pull content calendar from Notion
- For each piece: fetch relevant AIMS service data, generate draft via Claude Sonnet
- Create Notion pages with drafts
- Notify Ailyn via Slack DM

### Agent 6: CRM Monitor Agent
**Purpose**: Keep pipeline healthy and flag stale deals
**Trigger**: Cron daily at 9am ET
**Actions**:
- Find deals where updatedAt > 5 days and stage NOT IN (ACTIVE_CLIENT, CHURNED, LOST)
- Find deals where stage = AT_RISK with no activity in 3 days
- Post summary to #aims-channel: "Pipeline health check — [N] stale deals, [N] at-risk"
- Set DealPriority = URGENT on at-risk deals

---

## Close CRM Integration Spec

AIMS uses the Close CRM MCP for outbound pipeline management alongside the internal AIMS CRM.

### Sync Rules
- Lead created in AIMS CRM → optionally push to Close (for outbound reps)
- Close opportunity won → webhook → update AIMS Deal to ACTIVE_CLIENT
- Close email activity → sync to AIMS DealActivity

### Close MCP Tools Available
- `lead_search` — find leads by email/company
- `create_lead` — create new lead
- `create_opportunity` — attach opportunity to lead
- `activity_search` — find recent activities
- `fetch_pipeline_and_opportunity_statuses` — sync pipeline stages

### Field Mapping: AIMS Deal → Close Lead
| AIMS Field | Close Field |
|-----------|-------------|
| contactName | Lead.name |
| contactEmail | Lead.contacts[0].email |
| company | Lead.company |
| phone | Lead.contacts[0].phone |
| stage | Opportunity.status |
| value | Opportunity.value |
| channelTag | Lead.custom_fields.channel_tag |
| source | Lead.custom_fields.source |

---

## Fulfillment Automation Chain (Full Detail)

```
1. Prospect clicks "Get Started" on /services/[slug]
2. Routed to /get-started?service=[slug]&tier=[tier]
3. Completes business info form (company, website, industry, locations, goal)
4. Creates Clerk account (or logs in)
5. Redirected to Stripe Checkout
6. Stripe: payment succeeds
7. Stripe fires: checkout.session.completed → POST /api/webhooks/stripe
8. handleSubscriptionCreated():
   a. db.subscription.create({ userId, serviceArmId, stripeSubId, status: ACTIVE, tier, monthlyAmount })
   b. db.fulfillmentTask.createMany() from serviceArm.setupSteps (2-day intervals)
   c. db.deal.update({ stage: ACTIVE_CLIENT, closedAt: now })
   d. db.dealServiceArm.create({ dealId, serviceArmId, tier, monthlyPrice, status: 'active' })
9. sendWelcomeEmail() → Resend → client email
10. notifyNewPurchase() → Slack → #aims-channel
11. (Future) GHL API → provision subaccount → assign snapshot
12. (Future) sendFulfillmentAssignment() → assignee email with client details
13. Client lands on /portal/dashboard with success banner
14. Fulfillment team sees task in /admin/crm/[dealId] and /admin/dashboard
```

---

## Complete Environment Variables

```bash
# ============ DATABASE ============
DATABASE_URL="postgresql://neondb_owner:...@ep-hidden-meadow-a4qtahc0-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require"
DIRECT_URL="postgresql://neondb_owner:...@ep-hidden-meadow-a4qtahc0.us-east-1.aws.neon.tech/neondb?sslmode=require"

# ============ CLERK AUTH ============
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/portal/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/portal/dashboard

# ============ STRIPE ============
STRIPE_SECRET_KEY=sk_test_...  (use sk_live_ in production)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# ============ AI ============
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...

# ============ SCRAPING ============
FIRECRAWL_API_KEY=fc-...

# ============ EMAIL ============
RESEND_API_KEY=re_...

# ============ CACHE ============
UPSTASH_REDIS_REST_URL=https://...upstash.io
UPSTASH_REDIS_REST_TOKEN=...

# ============ NOTIFICATIONS ============
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...

# ============ CRON ============
CRON_SECRET=...

# ============ APP ============
NEXT_PUBLIC_APP_URL=https://aimseos.com
```

---

## Notes for Future Sessions

1. Stripe keys are placeholder — need real test keys from Stripe dashboard before checkout works
2. CLERK_WEBHOOK_SECRET is set in Vercel only — **DO NOT commit the value to git.** The previously-committed value at this line was rotated on 2026-05-15 after a security audit. Live value exists in Vercel prod env + the Clerk dashboard endpoint at `https://www.aioperatorcollective.com/api/webhooks/clerk`.
3. Domain: aimseos.com — DNS A record `@` → `76.76.21.21`, CNAME `www` → `cname.vercel-dns.com` (Porkbun)
4. Vercel project ID: `prj_5zC3XD872gBSKJrjMQAG4kzxzJy1` (team: `team_jNDVLuWxahtHSJVrGdHLOorp`)
5. Neon DB: `ep-hidden-meadow-a4qtahc0` in us-east-1
6. Slack channels: #aims-channel (C097AGUH2KX), #aimseod (C0A4ZRGT8LD)
