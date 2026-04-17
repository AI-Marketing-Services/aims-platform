# Close CRM Integration

## Overview

AIMS shares the Vendingpreneurs Close workspace with other brands
(Ben Kelly / Vendingpreneurs). To keep our CRM isolated, every lead
in Close carries a custom field called **BTC Business Line** — when
set to `AI Operator Collective (AOC)` the lead belongs to us.

Two-way sync, filtered by that partition:

- **Outbound**: applicants from `/apply` are pushed to Close with
  BTC Business Line pre-stamped to AOC. Stage changes on the AIMS
  kanban mirror to Close status.
- **Inbound**: every AOC-tagged Close lead is imported into our Deal
  table. Stage changes + won opportunities update our CRM.

Vending and BK leads are never touched.

## Workspace identifiers (verified 2026-04-17)

| Key                        | Value                                                             |
| -------------------------- | ----------------------------------------------------------------- |
| Workspace                  | Vendingpreneurs                                                   |
| BTC Business Line field ID | `cf_aJlNlilQZIgLLuhcymNN8fiOzewnFxrbWjLZFPmsucO`                  |
| AOC choice value           | `"AI Operator Collective (AOC)"`                                  |
| Other choice values        | `"Ben Kelly (BK)"`, `"Vendingpreneurs (VP)"`                      |

Query string format (Close search + webhook filter):
```
custom.cf_aJlNlilQZIgLLuhcymNN8fiOzewnFxrbWjLZFPmsucO:"AI Operator Collective (AOC)"
```

## Lead status -> AIMS DealStage mapping

| Close status ID     | Label                   | AIMS stage            |
| ------------------- | ----------------------- | --------------------- |
| `stat_Ewxdu...`     | 🆕 New                  | APPLICATION_SUBMITTED |
| `stat_nN6uL...`     | Webinar Lead            | APPLICATION_SUBMITTED |
| `stat_lGHx...`      | ☎️ Call Booked          | CONSULT_BOOKED        |
| `stat_2SmO...`      | 🕛 Reschedule           | CONSULT_BOOKED        |
| `stat_kY1a...`      | 📞 Follow Up            | CONSULT_COMPLETED     |
| `stat_mRxb...`      | 🗓️ Long Term Follow Up | CONSULT_COMPLETED     |
| `stat_vL6L...`      | 📄 Contract Sent        | CONSULT_COMPLETED     |
| `stat_0oW3i...`     | 🏆 Closed / Won         | MEMBER_JOINED         |
| `stat_aR2j...`      | 💔 Lost                 | LOST                  |
| `stat_5Cqlg...`     | 👻 No Show              | LOST                  |
| `stat_hWIG...`      | 🔻 Canceled (by Lead)   | LOST                  |
| `stat_l8AT...`      | 💤 Non-responsive       | LOST                  |
| `stat_U9MI...`      | Do Not Contact          | LOST                  |
| `stat_LP7GD...`     | Off Ramp                | LOST                  |
| `stat_YV4Zn...`     | 🌎 Outside the US       | LOST                  |

Full table lives in `src/lib/close.ts` as `CLOSE_STATUS_ID_TO_AIMS_STAGE`.

## Environment variables

| Env var                | Required | Purpose                          |
| ---------------------- | -------- | -------------------------------- |
| `CLOSE_API_KEY`        | yes      | API-key auth for every Close call |
| `CLOSE_WEBHOOK_SECRET` | yes      | HMAC-style verification on inbound webhooks |

Set both in Vercel prod env (`aims-platform` project).

## Files

| File                                                     | Purpose                                      |
| -------------------------------------------------------- | -------------------------------------------- |
| `src/lib/close.ts`                                       | HTTP client, partition helpers, constants    |
| `src/lib/close/sync.ts`                                  | Close -> AIMS upsert engine                  |
| `src/app/api/webhooks/close/route.ts`                    | Inbound webhook (partition-filtered)         |
| `src/app/api/admin/close/sync/route.ts`                  | Admin-triggered pull (POST)                  |
| `src/app/api/cron/close-sync/route.ts`                   | Hourly incremental pull                      |
| `src/app/(admin)/admin/close/page.tsx`                   | Admin dashboard UI + Sync-now button         |

## How sync upserts work

Inbound sync matching order:
1. `Deal.closeLeadId` direct match
2. `Deal.contactEmail` case-insensitive match
3. Else create a new Deal with `source: "close-import"`

Stage rules:
- Stages only bump forward in the AIMS funnel (APPLICATION_SUBMITTED ->
  CONSULT_BOOKED -> CONSULT_COMPLETED -> MIGHTY_INVITED -> MEMBER_JOINED).
  Close can't regress a deal that's already further along.
- `LOST` is always honoured (terminal override).

Revenue rules:
- Opportunities attached to a Close lead are pulled via
  `listLeadOpportunities`. Sum of `value` where `date_won != null`
  becomes the deal's `mrr` and `value` (normalised from cents to
  dollars).

## Cron schedule

Configured in `vercel.json`:
```json
{ "path": "/api/cron/close-sync", "schedule": "0 * * * *" }
```
Runs hourly. Pulls leads updated in the last 2h so we never miss an
edit between firings.

Log output lives in `apiCostLog` where `provider = "cron"` and
`model = "close-sync"`. Surfaced on `/admin/close` and
`/admin/cron-status`.

## Webhook configuration (Close dashboard)

Settings → Webhooks → **Add Endpoint**:

- **URL**: `https://www.aioperatorcollective.com/api/webhooks/close`
- **Events**: `lead.status_change`, `lead.updated`
- **Signing secret**: paste into `CLOSE_WEBHOOK_SECRET` env var

Every inbound event:
1. HMAC verify against `CLOSE_WEBHOOK_SECRET`
2. Fetch the lead (webhook payload doesn't include custom fields)
3. Reject if `BTC Business Line != "AI Operator Collective (AOC)"`
4. Map status → AIMS stage → update Deal

## Testing locally

```bash
# 1. Put the API key in .env.local
echo 'CLOSE_API_KEY=api_...' >> .env.local

# 2. Hit the manual sync endpoint (logged in as admin in browser):
curl -X POST http://localhost:3000/api/admin/close/sync \
  -H "Content-Type: application/json" \
  --cookie "<admin session cookie>" \
  -d '{ "includeOpportunities": true }'

# 3. Or via the admin UI:
open http://localhost:3000/admin/close
# Click "Sync now"
```

## Known gotchas

- **Shared workspace.** Never call `listLeads` without the BTC filter
  or we'd pollute AIMS with vending data. Use `listAOCLeads`.
- **Webhook payloads lack custom fields.** We must fetch the lead to
  verify partition — don't short-circuit.
- **Opportunity value units.** Close stores as cents; we normalise
  to dollars in `upsertDealFromCloseLead`.
- **Lead status labels have emojis.** Match on `status_id`, not
  `status_label`, to be rename-proof.
