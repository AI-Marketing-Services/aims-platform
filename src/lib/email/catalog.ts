/**
 * Catalog of every editable email template the platform sends.
 *
 * `templateKey` is the stable string identifier — never change once
 * shipped. The admin UI at /admin/email-templates uses this catalog
 * to render the list, fetch the override for the selected template,
 * and send a test.
 *
 * Each entry declares:
 *   - displayName: shown in the admin list
 *   - description: 1-line context for the editor (when it fires)
 *   - phase:      Jess's journey phase (foundation/prospecting/etc.)
 *                 — used to filter the admin list and to flag any
 *                 templates the team is NOT supposed to send early
 *   - sample():   produces realistic args for the corresponding
 *                 `send*Email` function so we can render a preview
 *                 and let the admin fire a real test send
 *   - send():     wraps the actual sender so the admin send-test
 *                 endpoint can fire ANY template uniformly
 */

import type { JourneyPhaseKey } from "@/lib/journey/phases"

export interface TemplateCatalogEntry {
  templateKey: string
  displayName: string
  description: string
  phase: JourneyPhaseKey | "transactional"
  /**
   * Returns args that produce a believable preview / test send when
   * passed to the matching `send*Email` function.
   */
  sample: (recipient: string) => Record<string, unknown>
  /** Fires the matching `send*Email` with `args`. */
  send: (args: Record<string, unknown>) => Promise<unknown>
}

const APP =
  process.env.NEXT_PUBLIC_APP_URL ?? "https://www.aioperatorcollective.com"

export const EMAIL_TEMPLATES: TemplateCatalogEntry[] = [
  // ─── Foundation / signup ─────────────────────────────────────────────
  {
    templateKey: "welcome.operator-signup",
    displayName: "Operator Signup Welcome",
    description:
      "Fires on first portal login. Foundation-first framing — points new members at /portal/onboard, NOT at lead magnets.",
    phase: "foundation",
    sample: (to) => ({ to, name: "Adam Wolfe" }),
    send: async (args) => {
      const { sendOperatorSignupWelcome } = await import("./index")
      return sendOperatorSignupWelcome(args as { to: string; name: string | null })
    },
  },
  {
    templateKey: "welcome.paid-subscription",
    displayName: "Paid Subscription Welcome",
    description:
      "Fires when checkout.session.completed lands for a tier (Pro / Operator) sub. Confirms plan + sends to portal.",
    phase: "transactional",
    sample: (to) => ({
      to,
      name: "Adam Wolfe",
      serviceName: "Pro Plan",
      tier: "Pro",
      portalUrl: `${APP}/portal/dashboard`,
    }),
    send: async (args) => {
      const { sendWelcomeEmail } = await import("./index")
      return sendWelcomeEmail(
        args as {
          to: string
          name: string
          serviceName: string
          tier?: string
          portalUrl: string
        },
      )
    },
  },

  // ─── AOC apply funnel ────────────────────────────────────────────────
  {
    templateKey: "aoc.application-received",
    displayName: "AOC: Application Received",
    description:
      "Fires immediately after someone submits the apply form. BCC'd to Ryan for funnel-tracking.",
    phase: "foundation",
    sample: (to) => ({
      to,
      name: "Adam Wolfe",
      calLink: "https://calendly.com/aioperatorcollective/discovery",
    }),
    send: async (args) => {
      const { sendApplicationReceivedEmail } = await import(
        "./abandoned-application"
      )
      return sendApplicationReceivedEmail(
        args as { to: string; name: string; calLink: string },
      )
    },
  },
  {
    templateKey: "aoc.application-abandoned",
    displayName: "AOC: Abandoned Application Nudge",
    description:
      "Fires for partial-submit applicants who didn't finish. Sent ~24h after they bounced.",
    phase: "foundation",
    sample: (to) => ({ to, name: "Adam Wolfe" }),
    send: async (args) => {
      const { sendAbandonedApplicationEmail } = await import(
        "./abandoned-application"
      )
      return sendAbandonedApplicationEmail(args as { to: string; name: string })
    },
  },
  {
    templateKey: "aoc.booking-reminder.day-2",
    displayName: "AOC: Booking Reminder — Day 2",
    description:
      "Fires from the nurture-unbooked cron at day 2 if the applicant hasn't booked.",
    phase: "foundation",
    sample: (to) => ({ to, name: "Adam Wolfe", day: 2, tier: "warm" }),
    send: async (args) => {
      const { sendBookingReminderEmail } = await import("./booking-reminder")
      return sendBookingReminderEmail(
        args as {
          to: string
          name: string
          day: 2 | 5 | 9
          tier?: "hot" | "warm" | "cold"
        },
      )
    },
  },
  {
    templateKey: "aoc.booking-reminder.day-5",
    displayName: "AOC: Booking Reminder — Day 5",
    description:
      "Fires from the nurture-unbooked cron at day 5 if the applicant hasn't booked.",
    phase: "foundation",
    sample: (to) => ({ to, name: "Adam Wolfe", day: 5, tier: "warm" }),
    send: async (args) => {
      const { sendBookingReminderEmail } = await import("./booking-reminder")
      return sendBookingReminderEmail(
        args as {
          to: string
          name: string
          day: 2 | 5 | 9
          tier?: "hot" | "warm" | "cold"
        },
      )
    },
  },
  {
    templateKey: "aoc.booking-reminder.day-9",
    displayName: "AOC: Booking Reminder — Day 9 (final)",
    description:
      "Final booking nudge before we go silent. Fires day 9 from the nurture-unbooked cron.",
    phase: "foundation",
    sample: (to) => ({ to, name: "Adam Wolfe", day: 9, tier: "warm" }),
    send: async (args) => {
      const { sendBookingReminderEmail } = await import("./booking-reminder")
      return sendBookingReminderEmail(
        args as {
          to: string
          name: string
          day: 2 | 5 | 9
          tier?: "hot" | "warm" | "cold"
        },
      )
    },
  },
  {
    templateKey: "aoc.post-booking-confirmation",
    displayName: "AOC: Post-Booking Confirmation",
    description:
      "Fires after Calendly webhook reports event_scheduled. Sets expectations + reschedule/cancel links.",
    phase: "foundation",
    sample: (to) => ({
      to,
      name: "Adam Wolfe",
      eventStartTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      meetingUrl: "https://meet.google.com/demo",
      rescheduleUrl: "https://calendly.com/aioperatorcollective/reschedule/demo",
      cancelUrl: "https://calendly.com/aioperatorcollective/cancel/demo",
    }),
    send: async (args) => {
      const { sendPostBookingConfirmationEmail } = await import(
        "./post-booking-education"
      )
      return sendPostBookingConfirmationEmail(
        args as {
          to: string
          name: string
          eventStartTime?: string | null
          meetingUrl?: string | null
          rescheduleUrl?: string | null
          cancelUrl?: string | null
        },
      )
    },
  },
  {
    templateKey: "aoc.collective-invite",
    displayName: "AOC: Collective Invite (post-close)",
    description:
      "Fires after a closed-won deal — branded invite email with 30-day roadmap and Mighty login link.",
    phase: "foundation",
    sample: (to) => ({
      to,
      firstName: "Adam",
      tier: "innerCircle",
      customMessage: null,
    }),
    send: async (args) => {
      const { sendCollectiveInviteEmail } = await import("./collective-invite")
      return sendCollectiveInviteEmail(
        args as {
          to: string
          firstName?: string | null
          tier?: "community" | "accelerator" | "innerCircle"
          customMessage?: string | null
        },
      )
    },
  },

  // ─── Lead magnets — public conversion hooks ──────────────────────────
  {
    templateKey: "lead-magnet.ai-readiness-quiz",
    displayName: "Lead Magnet: AI Readiness Quiz Results",
    description:
      "Fires after someone submits the AI Readiness Quiz at /tools/ai-readiness-quiz.",
    phase: "prospecting",
    sample: (to) => ({
      to,
      name: "Adam Wolfe",
      score: 87,
      resultsUrl: `${APP}/tools/ai-readiness-quiz/results/demo`,
      data: { source: "demo" },
    }),
    send: async (args) => {
      const { sendQuizResultsEmail } = await import("./lead-magnet-results")
      return sendQuizResultsEmail(
        args as {
          to: string
          name: string
          score: number | undefined
          resultsUrl: string
          data: Record<string, unknown>
        },
      )
    },
  },
  {
    templateKey: "lead-magnet.roi-calculator",
    displayName: "Lead Magnet: ROI Calculator Results",
    description:
      "Fires after someone runs the ROI Calculator. SOLUTIONING-phase tool — don't send to new members.",
    phase: "solutioning",
    sample: (to) => ({
      to,
      name: "Adam Wolfe",
      resultsUrl: `${APP}/tools/roi-calculator/results/demo`,
      data: { source: "demo" },
      results: { monthlySavings: 12500, hoursSaved: 80 },
    }),
    send: async (args) => {
      const { sendCalculatorResultsEmail } = await import("./lead-magnet-results")
      return sendCalculatorResultsEmail(
        args as {
          to: string
          name: string
          resultsUrl: string
          data: Record<string, unknown>
          results: Record<string, unknown> | undefined
        },
      )
    },
  },
  {
    templateKey: "lead-magnet.website-audit",
    displayName: "Lead Magnet: Website Audit Results",
    description:
      "Fires after a website audit submission. SOLUTIONING — diagnostic.",
    phase: "solutioning",
    sample: (to) => ({
      to,
      name: "Adam Wolfe",
      score: 72,
      resultsUrl: `${APP}/tools/website-audit/results/demo`,
      data: { source: "demo" },
      results: { url: "https://example.com" },
    }),
    send: async (args) => {
      const { sendAuditResultsEmail } = await import("./lead-magnet-results")
      return sendAuditResultsEmail(
        args as {
          to: string
          name: string
          score: number | undefined
          resultsUrl: string
          data: Record<string, unknown>
          results: Record<string, unknown> | undefined
        },
      )
    },
  },
  {
    templateKey: "lead-magnet.business-credit-score",
    displayName: "Lead Magnet: Business Credit Score",
    description:
      "Fires after a business credit-score lookup. SOLUTIONING — late-funnel.",
    phase: "solutioning",
    sample: (to) => ({
      to,
      name: "Adam Wolfe",
      score: 78,
      resultsUrl: `${APP}/tools/business-credit-score/results/demo`,
    }),
    send: async (args) => {
      const { sendCreditScoreEmail } = await import("./lead-magnet-results")
      return sendCreditScoreEmail(
        args as {
          to: string
          name?: string
          score?: number
          resultsUrl: string
        },
      )
    },
  },
  {
    templateKey: "lead-magnet.executive-ops-audit",
    displayName: "Lead Magnet: Executive Ops Audit",
    description:
      "Fires after an Exec Ops Audit submission. SOLUTIONING — diagnostic.",
    phase: "solutioning",
    sample: (to) => ({
      to,
      name: "Adam Wolfe",
      score: 64,
      resultsUrl: `${APP}/tools/executive-ops-audit/results/demo`,
      data: { source: "demo" },
    }),
    send: async (args) => {
      const { sendOpsAuditEmail } = await import("./lead-magnet-results")
      return sendOpsAuditEmail(
        args as {
          to: string
          name?: string
          score?: number
          resultsUrl: string
          data?: Record<string, unknown>
        },
      )
    },
  },
  {
    templateKey: "lead-magnet.ai-opportunity-audit",
    displayName: "Lead Magnet: AI Opportunity Audit",
    description:
      "Heaviest lead magnet. Custom AI report. SOLUTIONING-phase tool only.",
    phase: "solutioning",
    sample: (to) => ({
      to,
      name: "Adam Wolfe",
      resultsUrl: `${APP}/tools/ai-opportunity-audit/results/demo`,
      data: { source: "demo" },
      results: {
        report: {
          companyName: "Adam Wolfe Industries",
          opportunityScore: 81,
          opportunities: [
            {
              rank: 1,
              title: "AI cold-email pipeline",
              problem: "Manual outreach caps pipeline at 5/week.",
              solution:
                "Layer in AI-personalised cold sequencing. 4-6× pipeline lift in 30 days.",
            },
          ],
          priorityMove: {
            title: "Stand up the cold-email pipeline first.",
            rationale: "Biggest near-term lever.",
            firstStep: "Build the lookalike, queue 200 sends.",
          },
        },
      },
    }),
    send: async (args) => {
      const { sendBusinessAIAuditEmail } = await import("./lead-magnet-results")
      return sendBusinessAIAuditEmail(
        args as {
          to: string
          name: string
          resultsUrl: string
          data?: Record<string, unknown>
          results?: Record<string, unknown>
        },
      )
    },
  },
  {
    templateKey: "lead-magnet.w2-playbook",
    displayName: "Lead Magnet: W2 → Operator Playbook",
    description: "Fires for the W2 transition playbook download.",
    phase: "foundation",
    sample: (to) => ({
      to,
      name: "Adam Wolfe",
      resultsUrl: `${APP}/tools/w2-playbook`,
      data: { source: "demo" },
    }),
    send: async (args) => {
      const { sendW2PlaybookEmail } = await import("./lead-magnet-results")
      return sendW2PlaybookEmail(
        args as {
          to: string
          name: string
          resultsUrl: string
          data?: Record<string, unknown>
        },
      )
    },
  },
  {
    templateKey: "lead-magnet.operator-vault",
    displayName: "Lead Magnet: Operator Vault unlock",
    description: "Free-resources email after vault unlock submission.",
    phase: "foundation",
    sample: (to) => ({ to, name: "Adam Wolfe" }),
    send: async (args) => {
      const { sendOperatorVaultEmail } = await import("./operator-vault")
      return sendOperatorVaultEmail(args as { to: string; name: string })
    },
  },

  // ─── Subscription lifecycle ──────────────────────────────────────────
  {
    templateKey: "lifecycle.renewal",
    displayName: "Lifecycle: Renewal Receipt",
    description:
      "Fires on subscription_cycle invoice.paid for active subs. Confirms charge + next billing date.",
    phase: "transactional",
    sample: (to) => ({
      to,
      name: "Adam Wolfe",
      serviceName: "Pro Plan",
      amount: 97,
      nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      portalUrl: `${APP}/portal/billing`,
    }),
    send: async (args) => {
      const { sendRenewalEmail } = await import("./index")
      return sendRenewalEmail(
        args as {
          to: string
          name: string
          serviceName: string
          amount: number
          nextBillingDate: Date
          portalUrl: string
        },
      )
    },
  },
  {
    templateKey: "lifecycle.cancellation",
    displayName: "Lifecycle: Cancellation Confirmed",
    description:
      "Fires on customer.subscription.deleted. Confirms cancellation + offers reactivation.",
    phase: "transactional",
    sample: (to) => ({
      to,
      name: "Adam Wolfe",
      serviceName: "Pro Plan",
      cancelledAt: new Date(),
    }),
    send: async (args) => {
      const { sendCancellationEmail } = await import("./index")
      return sendCancellationEmail(
        args as {
          to: string
          name: string
          serviceName: string
          cancelledAt: Date
        },
      )
    },
  },
  {
    templateKey: "lifecycle.payment-failed",
    displayName: "Lifecycle: Payment Failed",
    description: "Fires on invoice.payment_failed with retry guidance.",
    phase: "transactional",
    sample: (to) => ({
      to,
      name: "Adam Wolfe",
      serviceName: "Pro Plan",
      amount: 97,
      retryDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      updatePaymentUrl: `${APP}/portal/billing`,
    }),
    send: async (args) => {
      const { sendPaymentFailedEmail } = await import("./index")
      return sendPaymentFailedEmail(
        args as {
          to: string
          name: string
          serviceName: string
          amount: number
          retryDate?: Date
          updatePaymentUrl: string
        },
      )
    },
  },

  // ─── Operations + support ────────────────────────────────────────────
  {
    templateKey: "ops.fulfillment-assignment",
    displayName: "Ops: Fulfillment Assignment",
    description:
      "Fires when an intern picks up a client task. Notifies the operator with full context.",
    phase: "transactional",
    sample: (to) => ({
      to,
      assigneeName: "Adam Wolfe",
      clientName: "Acme Co",
      serviceName: "Cold Outbound Engine",
      tier: "Pro",
      clientEmail: "ops@acme.example",
      clientWebsite: "https://acme.example",
    }),
    send: async (args) => {
      const { sendFulfillmentAssignment } = await import("./index")
      return sendFulfillmentAssignment(
        args as {
          to: string
          assigneeName: string
          clientName: string
          serviceName: string
          tier?: string
          clientEmail: string
          clientWebsite?: string
        },
      )
    },
  },
  {
    templateKey: "support.ticket-confirmation",
    displayName: "Support: Ticket Confirmation",
    description: "Fires immediately after a client submits a support ticket.",
    phase: "transactional",
    sample: (to) => ({
      to,
      name: "Adam Wolfe",
      subject: "Cannot connect Stripe in billing settings",
      ticketId: "TK-DEMO-001",
    }),
    send: async (args) => {
      const { sendTicketConfirmationEmail } = await import("./support")
      return sendTicketConfirmationEmail(
        args as { to: string; name: string; subject: string; ticketId: string },
      )
    },
  },
  {
    templateKey: "support.reply-to-client",
    displayName: "Support: Reply From Team",
    description: "Fires when a team member replies to a support ticket.",
    phase: "transactional",
    sample: (to) => ({
      to,
      clientName: "Adam Wolfe",
      subject: "Cannot connect Stripe in billing settings",
      replyMessage: "Adam — pushed a fix. Try again and let us know.",
      authorName: "Matt",
      ticketId: "TK-DEMO-001",
    }),
    send: async (args) => {
      const { sendReplyNotificationToClient } = await import("./support")
      return sendReplyNotificationToClient(
        args as {
          to: string
          clientName: string
          subject: string
          replyMessage: string
          authorName: string
          ticketId: string
        },
      )
    },
  },
  {
    templateKey: "support.ticket-resolved",
    displayName: "Support: Ticket Resolved",
    description:
      "Fires when a support ticket transitions to resolved/closed. Includes resolution note.",
    phase: "transactional",
    sample: (to) => ({
      to,
      clientName: "Adam Wolfe",
      subject: "Cannot connect Stripe in billing settings",
      newStatus: "resolved",
      resolutionNote:
        "Stripe Connect is now reachable from /portal/billing → Connect bank.",
      ticketId: "TK-DEMO-001",
    }),
    send: async (args) => {
      const { sendTicketStatusChangeEmail } = await import("./support")
      return sendTicketStatusChangeEmail(
        args as {
          to: string
          clientName: string
          subject: string
          newStatus: string
          resolutionNote?: string | null
          ticketId: string
        },
      )
    },
  },
]

/** O(1) lookup by templateKey. */
const BY_KEY: Record<string, TemplateCatalogEntry> = Object.fromEntries(
  EMAIL_TEMPLATES.map((t) => [t.templateKey, t]),
)

export function getTemplateEntry(
  templateKey: string,
): TemplateCatalogEntry | null {
  return BY_KEY[templateKey] ?? null
}
