/**
 * Timeline metadata for every customer-facing email.
 *
 * The catalog (catalog.ts) tells us WHAT a template is and HOW to
 * send it. This file tells us WHEN it fires and what triggers it —
 * so the admin "Email Templates" page can render the templates in
 * actual journey order, with day offsets, instead of an alphabetical
 * dump.
 *
 * If you add a new template to the catalog, add a row here too —
 * the admin page falls back to "Other / Unscheduled" for any
 * templateKey not listed below.
 *
 * For the long-form prose version, see docs/EMAIL-TIMELINE.md.
 */

export type BucketKey =
  | "foundation"
  | "application"
  | "post-booking"
  | "post-close"
  | "lead-magnet-quiz"
  | "lead-magnet-calculator"
  | "lead-magnet-audit"
  | "lead-magnet-vault"
  | "lead-magnet-w2"
  | "lead-magnet-business-audit"
  | "lead-magnet-other"
  | "lifecycle"
  | "ops-support"

export interface TimelineBucket {
  key: BucketKey
  label: string
  /** Plain-English explanation of what this bucket covers. */
  blurb: string
}

/** Display order for the page. */
export const TIMELINE_BUCKETS: TimelineBucket[] = [
  {
    key: "foundation",
    label: "Foundation — Account signup",
    blurb:
      "Fires when someone creates an account. Foundation-first framing — no lead-magnet pushes, no diagnostics.",
  },
  {
    key: "application",
    label: "AOC Application — Apply path",
    blurb:
      "From the moment someone submits the application form through the booking-reminder cadence (day 2 → 5 → 9).",
  },
  {
    key: "post-booking",
    label: "AOC Application — After they book",
    blurb:
      "Triggered when Calendly fires invitee.created. Confirms the call + a 3-day education drip.",
  },
  {
    key: "post-close",
    label: "AOC — Post-close (manual)",
    blurb:
      "Fires when an admin clicks Invite to Mighty on a closed-won deal. Not automatic.",
  },
  {
    key: "lead-magnet-quiz",
    label: "Lead Magnet — AI Readiness Quiz drip",
    blurb:
      "Inline results email fires immediately. Note: the 6-email post-quiz nurture drip is enrolled in the queue but NOT yet wired in process-email-queue — those follow-ups are silently cancelled until the handler is added.",
  },
  {
    key: "lead-magnet-calculator",
    label: "Lead Magnet — ROI Calculator drip",
    blurb:
      "Inline ROI report fires immediately. Note: the 6-email post-calculator drip is queued but NOT wired — follow-ups silently cancelled until the handler is added.",
  },
  {
    key: "lead-magnet-audit",
    label: "Lead Magnet — Website Audit drip",
    blurb:
      "Inline audit report fires immediately. Note: the 5-email post-audit drip is queued but NOT wired — follow-ups silently cancelled until the handler is added.",
  },
  {
    key: "lead-magnet-vault",
    label: "Lead Magnet — Operator Vault drip",
    blurb:
      "Inline Chapter 1 + 5-email chapter sequence — drip IS wired and sends Chapters 2–5 + closing email.",
  },
  {
    key: "lead-magnet-w2",
    label: "Lead Magnet — W-2 Playbook drip",
    blurb: "Welcome email + 2-email follow-up sequence — drip IS wired.",
  },
  {
    key: "lead-magnet-business-audit",
    label: "Lead Magnet — AI Opportunity Audit drip",
    blurb: "Custom audit report + 2-email follow-up sequence — drip IS wired.",
  },
  {
    key: "lead-magnet-other",
    label: "Lead Magnets — Single-shot",
    blurb:
      "Single result email, no follow-up sequence (Business Credit Score, Executive Ops Audit).",
  },
  {
    key: "lifecycle",
    label: "Lifecycle — Billing & subscription",
    blurb:
      "Welcome (T+0) + renewal receipt + payment-failed + cancellation. Note: the 6-email post-purchase onboarding drip is enrolled but NOT wired in process-email-queue — follow-ups silently cancelled until the handler is added.",
  },
  {
    key: "ops-support",
    label: "Ops & Support",
    blurb:
      "Internal ops emails (fulfillment-assignment is not yet fired by production code, only by admin test-send) and member-facing support ticket lifecycle emails.",
  },
]

export interface TimelineRow {
  templateKey: string
  /** Human-friendly delay label: "T+0", "T+2 days", "Manual", "Each renewal". */
  dayOffset: string
  /** 1-line trigger description shown next to the row. */
  trigger: string
  /** Sort within the bucket. */
  order: number
  /** Optional warning flag — surfaces a small notice on the row. */
  notice?: string
}

/**
 * Per-template timeline metadata. Entries grouped by bucket via the
 * `bucket` map below.
 */
export const TIMELINE: Record<BucketKey, TimelineRow[]> = {
  foundation: [
    {
      templateKey: "welcome.operator-signup",
      dayOffset: "T+0",
      trigger: "Clerk user.created webhook (first sign-up only).",
      order: 1,
    },
  ],

  application: [
    {
      templateKey: "aoc.application-received",
      dayOffset: "T+0",
      trigger:
        "POST /api/community/apply — fires immediately after submit. BCC'd to Ryan.",
      order: 1,
    },
    {
      templateKey: "aoc.application-abandoned",
      dayOffset: "T+30min – 72h",
      trigger:
        "abandoned-applications cron (every 15 min). Only if they started but didn't finish.",
      order: 2,
    },
    {
      templateKey: "aoc.booking-reminder.day-2",
      dayOffset: "T+2 days",
      trigger:
        "nurture-unbooked cron (daily 15:00 UTC) — only if they haven't booked yet.",
      order: 3,
    },
    {
      templateKey: "aoc.booking-reminder.day-5",
      dayOffset: "T+5 days",
      trigger: "Same cron — second nudge if still no booking.",
      order: 4,
    },
    {
      templateKey: "aoc.booking-reminder.day-9",
      dayOffset: "T+9 days",
      trigger:
        "Same cron — final nudge with explicit going-silent tone.",
      order: 5,
    },
  ],

  "post-booking": [
    {
      templateKey: "aoc.post-booking-confirmation",
      dayOffset: "T+0",
      trigger:
        "Calendly invitee.created webhook — fires immediately on booking.",
      order: 1,
    },
    // The 3 chapter drips (aoc-day-1/2/3) live in the queue, not the
    // catalog (no per-message override surface today). Listed here as
    // context for the team but no editor row appears for them.
  ],

  "post-close": [
    {
      templateKey: "aoc.collective-invite",
      dayOffset: "Manual",
      trigger:
        "Admin clicks Invite to Mighty on a closed-won deal. Not automatic.",
      order: 1,
    },
  ],

  "lead-magnet-quiz": [
    {
      templateKey: "lead-magnet.ai-readiness-quiz",
      dayOffset: "T+0",
      trigger:
        "Quiz submitted at /tools/ai-readiness-quiz. Also kicks off the 6-email post-quiz drip.",
      order: 1,
    },
  ],

  "lead-magnet-calculator": [
    {
      templateKey: "lead-magnet.roi-calculator",
      dayOffset: "T+0",
      trigger:
        "Calculator submitted at /tools/roi-calculator. Also kicks off the 6-email drip.",
      order: 1,
    },
  ],

  "lead-magnet-audit": [
    {
      templateKey: "lead-magnet.website-audit",
      dayOffset: "T+0",
      trigger:
        "Audit submitted at /tools/website-audit. Also kicks off the 5-email drip.",
      order: 1,
    },
  ],

  "lead-magnet-vault": [
    {
      templateKey: "lead-magnet.operator-vault",
      dayOffset: "T+0",
      trigger:
        "Vault unlock submitted at /tools/operator-vault. Kicks off the 6-email chapter drip.",
      order: 1,
    },
  ],

  "lead-magnet-w2": [
    {
      templateKey: "lead-magnet.w2-playbook",
      dayOffset: "T+0",
      trigger:
        "W-2 playbook gate submitted. Kicks off the 2-email follow-up sequence.",
      order: 1,
    },
  ],

  "lead-magnet-business-audit": [
    {
      templateKey: "lead-magnet.ai-opportunity-audit",
      dayOffset: "T+0",
      trigger:
        "AI Opportunity Audit submitted. Kicks off the 2-email follow-up sequence.",
      order: 1,
    },
  ],

  "lead-magnet-other": [
    {
      templateKey: "lead-magnet.business-credit-score",
      dayOffset: "T+0",
      trigger:
        "Business credit score quiz submitted. Single email — no follow-up drip.",
      order: 1,
    },
    {
      templateKey: "lead-magnet.executive-ops-audit",
      dayOffset: "T+0",
      trigger:
        "Executive ops audit submitted. Single email — no follow-up drip.",
      order: 2,
    },
  ],

  lifecycle: [
    {
      templateKey: "welcome.paid-subscription",
      dayOffset: "T+0",
      trigger:
        "Stripe checkout.session.completed. Also enrols the 6-email post-purchase drip.",
      order: 1,
    },
    {
      templateKey: "lifecycle.renewal",
      dayOffset: "Each renewal",
      trigger:
        "Stripe invoice.paid (skipped on first invoice and $0 invoices).",
      order: 2,
    },
    {
      templateKey: "lifecycle.payment-failed",
      dayOffset: "On failure",
      trigger: "Stripe invoice.payment_failed.",
      order: 3,
    },
    {
      templateKey: "lifecycle.cancellation",
      dayOffset: "On cancel",
      trigger: "Stripe customer.subscription.deleted.",
      order: 4,
    },
  ],

  "ops-support": [
    {
      templateKey: "support.ticket-confirmation",
      dayOffset: "T+0",
      trigger:
        "Member opens a support ticket via POST /api/support/tickets.",
      order: 1,
    },
    {
      templateKey: "support.reply-to-client",
      dayOffset: "T+0",
      trigger:
        "Team replies via the admin support panel.",
      order: 2,
    },
    {
      templateKey: "support.ticket-resolved",
      dayOffset: "T+0",
      trigger:
        "Admin flips ticket status to resolved or closed.",
      order: 3,
    },
    {
      templateKey: "ops.fulfillment-assignment",
      dayOffset: "T+0",
      trigger:
        "Fires when a member is assigned to an intern/operator.",
      order: 4,
      notice:
        "Currently only wired to the admin test-email route — not yet fired by production assignment flow.",
    },
  ],
}

/**
 * Build a flat lookup so any caller can ask "what bucket is this
 * templateKey in, and what's its row metadata?" without re-walking
 * the nested constant.
 */
export const TIMELINE_INDEX: Record<
  string,
  { bucket: BucketKey; row: TimelineRow }
> = (() => {
  const out: Record<string, { bucket: BucketKey; row: TimelineRow }> = {}
  for (const bucket of Object.keys(TIMELINE) as BucketKey[]) {
    for (const row of TIMELINE[bucket]) {
      out[row.templateKey] = { bucket, row }
    }
  }
  return out
})()
