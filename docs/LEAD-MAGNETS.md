# AI Operator Collective — Lead Magnets

Click each link to test the live tool on production. Every tool ends in either:

- **Form submission** that fires a templated email (see "Triggers email" column), or
- **Subscription opt-in** (Daily Signal), or
- **Reference page** (the `/tools` hub, dashboard, AI OS landing).

After each test submission, the matching email lands in `adamwolfe102@gmail.com` (or whatever email you enter). Verify the send in [Resend → Emails](https://resend.com/emails).

---

## 🚪 Tools hub (start here)

| Tool | Link | What it does |
|---|---|---|
| **Tools hub** | [aioperatorcollective.com/tools](https://www.aioperatorcollective.com/tools) | Branded directory of every lead magnet with cards + descriptions. Use this to navigate between tools without typing URLs. |
| **Results dashboard** | [aioperatorcollective.com/tools/dashboard](https://www.aioperatorcollective.com/tools/dashboard) | Per-visitor view of every tool result they've submitted (cookie-keyed). Useful after submitting a few. |

---

## 📊 Quiz / scorecard lead magnets (interactive — submit to see email)

| # | Tool | Link | Triggers email | What it does |
|---|---|---|---|---|
| 1 | **AI Readiness Quiz** | [/tools/ai-readiness-quiz](https://www.aioperatorcollective.com/tools/ai-readiness-quiz) | `sendQuizResultsEmail` | 7 questions. Returns a 0-100 readiness score + 3 recommendations. |
| 2 | **ROI Calculator** | [/tools/roi-calculator](https://www.aioperatorcollective.com/tools/roi-calculator) | `sendCalculatorResultsEmail` | Inputs: team size, hourly rate, manual hours/week. Outputs monthly + annual savings. |
| 3 | **Website Audit** | [/tools/website-audit](https://www.aioperatorcollective.com/tools/website-audit) | `sendAuditResultsEmail` | Submit any URL. AI scans the site and grades conversion-readiness 0-100. |
| 4 | **Business Credit Score** | [/tools/business-credit-score](https://www.aioperatorcollective.com/tools/business-credit-score) | `sendCreditScoreEmail` | Free check of business credit (D&B / Experian Commercial). Score + improvement plan. |
| 5 | **Executive Operations Audit** | [/tools/executive-ops-audit](https://www.aioperatorcollective.com/tools/executive-ops-audit) | `sendOpsAuditEmail` | C-suite-grade ops audit. 12 dimensions scored, top 3 fixes, executive summary email. |
| 6 | **AI Opportunity Audit** | [/tools/ai-opportunity-audit](https://www.aioperatorcollective.com/tools/ai-opportunity-audit) | `sendBusinessAIAuditEmail` | Heaviest tool. Submit website + describe business; AI generates a custom opportunity report with priority moves + 3 ranked opportunities. |

---

## 📥 Download / opt-in lead magnets

| # | Tool | Link | Delivers | What it does |
|---|---|---|---|---|
| 7 | **AI Operator Playbook** | [/tools/ai-playbook](https://www.aioperatorcollective.com/tools/ai-playbook) | PDF attachment via `sendAIPlaybookEmail` | 12 plays for W-2 → AI operator transition. Email with PDF attached. |
| 8 | **Daily Signal** | [/tools/daily-signal](https://www.aioperatorcollective.com/tools/daily-signal) | Daily SMS + email digest | Opt-in to a daily intel briefing. Confirmation page at [/tools/daily-signal/confirmed](https://www.aioperatorcollective.com/tools/daily-signal/confirmed). |
| 9 | **AI Operating System** | [/tools/ai-operating-system](https://www.aioperatorcollective.com/tools/ai-operating-system) | Free playbook + onboarding sequence | Top-of-funnel landing for the OS framework — lives under `/(landing)/tools` so it shares the AOC navigation chrome. |

---

## 🧰 Reference / discovery tools (no email — exploration only)

| # | Tool | Link | What it does |
|---|---|---|---|
| 10 | **Audience Segment Explorer** | [/tools/segment-explorer](https://www.aioperatorcollective.com/tools/segment-explorer) | Browse the ICPs AIMS targets. Reference for prospecting + discovery practice. |
| 11 | **AI Stack Configurator** | [/tools/stack-configurator](https://www.aioperatorcollective.com/tools/stack-configurator) | Pick your service + scale; get a tool-stack recommendation (Claude / Vapi / Apollo / etc.). |

---

## 🔗 Adjacent funnel surfaces

| Surface | Link | Purpose |
|---|---|---|
| **Apply form** | [/apply](https://www.aioperatorcollective.com/apply) | The AOC application — fires `sendApplicationReceivedEmail` on submit. |
| **Apply (embed variant)** | [/embed/apply](https://www.aioperatorcollective.com/embed/apply) | Same form for embedding on partner sites; suppresses the AOC chrome. |
| **Marketplace** | [/marketplace](https://www.aioperatorcollective.com/marketplace) | Public service catalog (separate from `/portal/marketplace`). |

---

## 🧪 How to test a tool end-to-end

1. Click any link above.
2. Fill the form with a real email you control (use **adamwolfe102@gmail.com** to keep things in one inbox).
3. Submit.
4. You should land on `/tools/<toolname>/results/<submissionId>` with the immediate UI result.
5. Within ~10 seconds, the matching email lands in your inbox (verify via the "Triggers email" column above).
6. Cross-check on Resend at [resend.com/emails](https://resend.com/emails) — every send shows `delivered` / `opened` status.

If anything doesn't fire, check the server logs at:

```bash
vercel logs --token $VERCEL_TOKEN aims-platform.vercel.app | grep "lead-magnets\|sendTrackedEmail"
```

---

## 📝 What's NOT a lead magnet (clarifications)

These look like tools but aren't customer-facing magnets:

- `/portal/tools` — the **operator's curated tool list** inside the authed portal (Vapi, Claude, Loom, etc.). Not a lead magnet — it's a feature of the platform.
- `/admin/lead-magnets` — admin-only view of all submissions (auth-gated).

---

## 📅 Last reviewed

This document is generated from the route map under `src/app/(marketing)/tools/*` and `src/app/(landing)/tools/*`. If you add a new lead magnet, drop a row here and re-deploy.

Last updated: 2026-05-06
