# AI Operator Collective — Lead Magnets

Click each link to test the live tool on production. Every tool ends in either:

- **Form submission** that fires a templated email (see "Triggers email" column), or
- **Subscription opt-in** (Daily Signal), or
- **Reference page** (the `/tools` hub, dashboard, AI OS landing).

After each test submission, the matching email lands in `adamwolfe102@gmail.com` (or whatever email you enter). Verify the send in [Resend → Emails](https://resend.com/emails).

> **🚦 Jess note (2026-05-06)**: lead magnets are TOP-OF-FUNNEL hooks for **cold visitors** on the public site. They're not appropriate for new members in their first weeks — that would feel overwhelming and break the apprenticeship sequence. New members go through Foundation → Prospecting → Revenue → Diagnosis FIRST; the diagnostic-style magnets only get surfaced inside the portal once a member reaches the **Solutioning** phase (Week 5+). See [JOURNEY-PHILOSOPHY.md](./JOURNEY-PHILOSOPHY.md). The new "Send phase" column below shows when each is appropriate to push to a member.

---

## 🚪 Tools hub (start here)

| Tool | Link | What it does |
|---|---|---|
| **Tools hub** | [aioperatorcollective.com/tools](https://www.aioperatorcollective.com/tools) | Branded directory of every lead magnet with cards + descriptions. Use this to navigate between tools without typing URLs. |
| **Results dashboard** | [aioperatorcollective.com/tools/dashboard](https://www.aioperatorcollective.com/tools/dashboard) | Per-visitor view of every tool result they've submitted (cookie-keyed). Useful after submitting a few. |

---

## 📊 Quiz / scorecard lead magnets (interactive — submit to see email)

| # | Tool | Link | Send phase | Triggers email | What it does |
|---|---|---|---|---|---|
| 1 | **AI Readiness Quiz** | [/tools/ai-readiness-quiz](https://www.aioperatorcollective.com/tools/ai-readiness-quiz) | 🟢 **Public + Prospecting** | `sendQuizResultsEmail` | 7 questions. Returns a 0-100 readiness score + 3 recommendations. Self-assessment, OK early. |
| 2 | **ROI Calculator** | [/tools/roi-calculator](https://www.aioperatorcollective.com/tools/roi-calculator) | 🟣 **Solutioning** (Week 5+) | `sendCalculatorResultsEmail` | Inputs: team size, hourly rate, manual hours/week. Numbers-heavy — not appropriate for new members. |
| 3 | **Website Audit** | [/tools/website-audit](https://www.aioperatorcollective.com/tools/website-audit) | 🟣 **Solutioning** | `sendAuditResultsEmail` | Submit any URL. Diagnostic; only useful once a member knows what to do with the score. |
| 4 | **Business Credit Score** | [/tools/business-credit-score](https://www.aioperatorcollective.com/tools/business-credit-score) | 🟣 **Solutioning** | `sendCreditScoreEmail` | D&B / Experian commercial check. Late-funnel. |
| 5 | **Executive Operations Audit** | [/tools/executive-ops-audit](https://www.aioperatorcollective.com/tools/executive-ops-audit) | 🟣 **Solutioning** | `sendOpsAuditEmail` | C-suite-grade ops audit. Heavy diagnostic; needs operator context to land. |
| 6 | **AI Opportunity Audit** | [/tools/ai-opportunity-audit](https://www.aioperatorcollective.com/tools/ai-opportunity-audit) | 🟣 **Solutioning** | `sendBusinessAIAuditEmail` | Heaviest tool. Custom AI report. Surface ONLY after a member has discovery reps under their belt. |

---

## 📥 Download / opt-in lead magnets

| # | Tool | Link | Send phase | Delivers | What it does |
|---|---|---|---|---|---|
| 7 | **AI Operator Playbook** | [/tools/ai-playbook](https://www.aioperatorcollective.com/tools/ai-playbook) | 🟢 **Foundation** (Week 1) | PDF via `sendAIPlaybookEmail` | 12 plays for W-2 → AI operator transition. Foundational; safe early. |
| 8 | **Daily Signal** | [/tools/daily-signal](https://www.aioperatorcollective.com/tools/daily-signal) | 🟡 **Revenue** (Week 3) | Daily SMS + email digest | Daily intel briefing. Best once a member is doing prospecting reps. |
| 9 | **AI Operating System** | [/tools/ai-operating-system](https://www.aioperatorcollective.com/tools/ai-operating-system) | 🟢 **Foundation** | Free playbook + onboarding sequence | Top-of-funnel landing for the OS framework. Foundational. |

---

## 🧰 Reference / discovery tools (no email — exploration only)

| # | Tool | Link | Send phase | What it does |
|---|---|---|---|---|
| 10 | **Audience Segment Explorer** | [/tools/segment-explorer](https://www.aioperatorcollective.com/tools/segment-explorer) | 🟠 **Prospecting** (Week 2) | Browse the ICPs AIMS targets. Reference for prospecting + discovery practice. |
| 11 | **AI Stack Configurator** | [/tools/stack-configurator](https://www.aioperatorcollective.com/tools/stack-configurator) | 🟣 **Solutioning** | Pick your service + scale; get a tool-stack recommendation. Late-funnel. |

---

## 🗓 Phase-to-magnet mapping (for the email sequencer)

When sending a lead magnet to a member (vs. a public visitor on `/tools/*`), the system at `src/lib/journey/phases.ts` checks:

```ts
isMagnetUnlocked(magnetKey, currentPhase) // true if member has reached the magnet's required phase
```

| Phase | Member sees / receives |
|---|---|
| 🟢 **Foundation** (Week 1) | AI Playbook · AI Operating System · Operator Vault · W2 Playbook |
| 🟠 **Prospecting** (Week 2) | + AI Readiness Quiz · Segment Explorer |
| 🟡 **Revenue Activities** (Week 3) | + Daily Signal |
| 🔵 **Problem Diagnosis** (Week 4) | (no new magnets — this is where discovery framework lessons live, not tools) |
| 🟣 **Solutioning** (Week 5+) | **Everything**: Website Audit · ROI Calculator · Credit Score · Executive Ops Audit · AI Opportunity Audit · Stack Configurator |

This gating applies to:
1. The **email sequence** sent to new members after acceptance
2. The **portal** lead-magnet surface (Toolkit / Tools page)

Public visitors hitting `/tools/*` directly are unaffected — they see everything. The gating is about what we **proactively send** to members, not what's reachable on the open web.

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

This document is generated from the route map under `src/app/(marketing)/tools/*` and `src/app/(landing)/tools/*`, plus the phase mapping in `src/lib/journey/phases.ts`. If you add a new lead magnet, drop a row here AND add it to `LEAD_MAGNET_PHASE` in the journey lib so the gating system knows when to surface it.

Last updated: 2026-05-06
