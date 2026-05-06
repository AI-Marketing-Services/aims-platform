# AIOC Member Journey — "Walk Before They Run"

A short doc explaining the sequencing of the new-member experience after acceptance, why it's structured this way, and where it lives in the codebase.

---

## The problem we're solving

Most AI courses, communities, and lead-magnet flows hit new members with **everything at once**: AI tools, audits, ROI calculators, prompt libraries, "100 plays in the first week!" The intent is generosity. The effect, per Jess (2026-05-06):

> "Coming in fresh, this will feel overwhelming and like they're already falling behind / not capable of doing this. We should be focusing on building business mindset, prospecting, revenue generating activities, and understanding business problems — THEN we can teach them how to solve them. Walk before they run."

So AIOC explicitly **does not** lead with the AI tooling. Tools amplify operator judgment — they don't replace it. We build the judgment first.

---

## The 5 phases

| # | Phase | Week | Focus |
|---|---|---|---|
| 1 | 🟢 **Foundation** | Week 1 | Mindset. What an operator actually does. Community + curriculum orientation. |
| 2 | 🟠 **Prospecting** | Week 2 | Finding businesses worth talking to. ICP, lead lists, research. |
| 3 | 🟡 **Revenue activities** | Week 3 | Outreach reps. Cold email, LinkedIn, conversations. |
| 4 | 🔵 **Problem diagnosis** | Week 4 | Discovery framework. Mapping pain. Asking the question behind the question. |
| 5 | 🟣 **Solutioning** | Week 5+ | **Now** the AI tools come in: audits, ROI calc, opportunity report, AI Stack Configurator. |

The order is intentional and irreversible. Operators who skip Phases 1-4 and jump straight to the tools end up technically capable but commercially weak — they can run an audit but can't run a discovery call.

---

## What this looks like in the product

### 1. Onboarding curriculum — refactored to 5 weeks

`src/lib/onboarding/steps.ts` defines 16 steps across the 5 phases. The portal's `/portal/onboard` page renders them grouped by week, with each step tagged by its phase. Members complete steps sequentially; the next phase doesn't unlock until the previous one is done.

Old structure (pre-2026-05-06):
- Week 1: Get oriented (4 steps)
- Week 2: AI Operator Playbook (4 steps)
- Week 3-4: Go deeper (4 steps)

New structure:
- Week 1 — **Foundation** (4 steps: profile, intro post, Module 1, community engagement)
- Week 2 — **Prospecting** (3 steps: ICP, prospect list, deep research)
- Week 3 — **Revenue activities** (3 steps: outreach draft, send to top 10, attend live call)
- Week 4 — **Problem diagnosis** (3 steps: discovery framework, run discovery call, workflow map)
- Week 5+ — **Solutioning** (3 steps: unlock toolkit, draft proposal, share what you shipped)

### 2. Lead-magnet gating

`src/lib/journey/phases.ts` exports `LEAD_MAGNET_PHASE` — a map from each lead-magnet key to the **minimum phase** at which it's appropriate to send / surface in-portal:

```ts
LEAD_MAGNET_PHASE = {
  ai_playbook: "foundation",        // Safe day-one
  operator_vault: "foundation",
  w2_playbook: "foundation",
  ai_readiness_quiz: "prospecting", // Self-assessment, OK after Week 1
  segment_explorer: "prospecting",
  daily_signal: "revenue_activities",
  // Diagnostic tools — only after the operator has reps:
  website_audit: "solutioning",
  roi_calculator: "solutioning",
  business_credit_score: "solutioning",
  executive_ops_audit: "solutioning",
  ai_opportunity_audit: "solutioning",
  stack_configurator: "solutioning",
}
```

The helper `isMagnetUnlocked(magnetKey, currentPhase)` returns true only if the member has reached the magnet's required phase. This gates:

- The **post-acceptance email sequence** (we don't email someone the AI Opportunity Audit on day 3)
- The **portal lead-magnet surface** (they see the foundational tools first; advanced ones show "Unlocks in Week 5" copy)

**Public `/tools/*` URLs are NOT gated.** Those remain open to cold visitors as conversion hooks. The gating only applies to members.

### 3. Welcome email — foundation-first

`sendOperatorSignupWelcome()` (`src/lib/email/index.ts`) was rewritten to **explicitly** position the journey:

```
This week's focus: Foundation.

What you'll unlock as you go:
  Week 2 — Prospecting
  Week 3 — Revenue activities
  Week 4 — Problem diagnosis
  Week 5+ — Solutioning (now the AI toolkit + audits + ROI calculators come in)

The sequence is intentional. Most AI courses start with the tools — then
operators get overwhelmed and quit. We start with the operator.
```

The welcome email **does not** contain links to the ROI calculator, the AI Opportunity Audit, the Website Audit, or any other diagnostic tool. The single CTA points to `/portal/onboard` — Week 1.

### 4. Phase inference

`inferCurrentPhase(completedKeys)` in `src/lib/onboarding/steps.ts` derives a member's current phase from their completed onboarding steps. The first phase where they have NOT completed every step is their current phase. This is intentionally **lenient on time** — we don't gate phase advancement on elapsed days; we gate on whether the work has actually been done.

Members can move faster or slower than the suggested weekly cadence. The point isn't to enforce a calendar. The point is to enforce sequence.

---

## Files involved

| File | Purpose |
|---|---|
| `src/lib/journey/phases.ts` | Phase definitions + lead-magnet → phase mapping |
| `src/lib/onboarding/steps.ts` | The 16-step curriculum tagged by phase |
| `src/lib/email/index.ts` | `sendOperatorSignupWelcome` — the foundation-first welcome email |
| `src/components/portal/OnboardingChecklist.tsx` | Renders the steps grouped by week + phase |
| `src/app/(portal)/portal/onboard/page.tsx` | Portal onboarding hub — first stop for every new member |
| `docs/LEAD-MAGNETS.md` | Maps every lead magnet to its appropriate phase |

---

## What we're NOT doing

- **We're not gating reading material.** Members can browse the curriculum, the playbook library, and the community freely from day one.
- **We're not gating community access.** All members can post, comment, and attend live calls regardless of phase.
- **We're not gating the public-facing lead magnets.** Cold visitors still hit `/tools/*` and convert from there. The gating is purely about what we surface in-portal and push via email to accepted members.
- **We're not enforcing time windows.** A motivated member can fly through Foundation in 2 days and reach Solutioning in 10. The sequence matters; the calendar doesn't.

---

## When to revisit this

Triggers that should prompt re-evaluation:

1. Member feedback that any phase feels redundant or out of order
2. Conversion data showing members getting stuck mid-phase (suggests poor lesson quality, not poor sequencing)
3. New AI tools that need a home in the phase map
4. Jess decides she wants the calendar enforced (would require adding `journeyPhase` + `journeyStartedAt` to User schema and a phase-advance cron)

For now, the system is **pure functions over completed onboarding steps** — no DB migration required, easy to evolve.

---

Last updated: 2026-05-06
