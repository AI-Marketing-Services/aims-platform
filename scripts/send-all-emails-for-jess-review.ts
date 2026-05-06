/**
 * Send EVERY customer-facing email template to a single inbox so Jess
 * can review them in order.
 *
 * Each email goes out with:
 *   - "Adam Wolfe" as the recipient name
 *   - A subject prefix `[AIMS Demo Review #NN]` so the batch is grouped
 *     and visually distinct from any prior test sends
 *   - "(START HERE)" prefix on email #01 so Jess knows where to begin
 *
 * Order is the natural user journey: lead magnets → AOC apply funnel →
 * portal onboarding milestones → subscription lifecycle → support.
 *
 * Usage:
 *   ./node_modules/.bin/tsx --env-file=.env.local scripts/send-all-emails-for-jess-review.ts [--to=email@example.com]
 *
 * Defaults to adamwolfe102@gmail.com.
 */

const demoArgTo = process.argv.find((a) => a.startsWith("--to="))?.split("=")[1]
const DEMO_TO = demoArgTo ?? "adamwolfe102@gmail.com"
const DEMO_NAME = "Adam Wolfe"
const DEMO_APP = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.aioperatorcollective.com"

interface DemoResult {
  index: number
  label: string
  ok: boolean
  id?: string
  detail?: string
}

const demoResults: DemoResult[] = []

// Optional filter: --only=6 or --only=6,11,15 sends just those indexes.
// Used to backfill specific templates after a partial earlier run.
const onlyArg = process.argv.find((a) => a.startsWith("--only="))?.split("=")[1]
const ONLY_INDEXES: Set<number> | null = onlyArg
  ? new Set(onlyArg.split(",").map((n) => parseInt(n.trim(), 10)).filter(Number.isFinite))
  : null

// Each template's sender returns either { data, error } (raw Resend) or a
// custom { ok, error? } shape (collective-invite). Normalise here.
async function sendDemo(
  index: number,
  label: string,
  fn: () => Promise<unknown>,
) {
  if (ONLY_INDEXES && !ONLY_INDEXES.has(index)) return
  try {
    const r = (await fn()) as
      | { data?: { id?: string }; error?: unknown }
      | { ok?: boolean; error?: unknown }
      | undefined
    const error = (r as { error?: unknown } | undefined)?.error
    if (error) {
      const msg = typeof error === "string" ? error : JSON.stringify(error)
      demoResults.push({ index, label, ok: false, detail: msg.slice(0, 200) })
      console.error(`  #${String(index).padStart(2, "0")}  FAIL  ${label}\n         ${msg.slice(0, 200)}`)
      return
    }
    const id = (r as { data?: { id?: string } } | undefined)?.data?.id
    demoResults.push({ index, label, ok: true, id })
    console.log(`  #${String(index).padStart(2, "0")}  ok    ${label}${id ? `  ${id}` : ""}`)
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err)
    demoResults.push({ index, label, ok: false, detail })
    console.error(`  #${String(index).padStart(2, "0")}  FAIL  ${label}\n         ${detail.slice(0, 200)}`)
  }
}

/**
 * Pass-through wrapper. Originally we monkey-patched `sendTrackedEmail`
 * to prefix every subject with `[AIMS Demo Review #NN]`, but ESM exports
 * are read-only at runtime so the reassignment fails. Instead the
 * cover-letter email below explains the order, and Gmail naturally
 * groups + timestamps the rest in send sequence.
 */
async function withSubjectPrefix<T>(
  _index: number,
  fn: () => Promise<T>,
): Promise<T> {
  return fn()
}

/**
 * Send the cover letter Jess opens FIRST. Subject is the visual flag
 * that this is the email-review batch, not real prod traffic. Body
 * lists every email she'll see, in the order she'll see them, with a
 * one-line description of when each one fires in the user journey.
 */
async function sendCoverLetter() {
  const { sendTrackedEmail, emailLayout, h1, p } = await import(
    "../src/lib/email"
  )
  const { AIMS_FROM_EMAIL } = await import("../src/lib/email/senders")

  const items: Array<[string, string]> = [
    ["#01", "AI Readiness Quiz results — sent after they take the quiz"],
    ["#02", "ROI Calculator results — sent after they use the calculator"],
    ["#03", "Website Audit results — sent after they submit a URL to audit"],
    ["#04", "Business Credit Score results — sent after they get a score"],
    ["#05", "Executive Ops Audit results — sent after they take the ops audit"],
    ["#06", "AI Opportunity Audit — sent after they get an AI opportunity report"],
    ["#07", "W2 → Operator Playbook — sent when they download the W2 playbook"],
    ["#08", "AI Playbook (PDF attached) — sent when they download the OS playbook"],
    ["#09", "Operator Vault unlock — sent when they unlock the vault"],
    ["#10", "AOC: Application received — sent right after they submit the apply form"],
    ["#11", "AOC: Abandoned application nudge — sent if they start but don't finish"],
    ["#12", "AOC: Booking reminder Day 2 — first nudge to pick a call time"],
    ["#13", "AOC: Booking reminder Day 5 — second nudge"],
    ["#14", "AOC: Booking reminder Day 9 — final nudge before going quiet"],
    ["#15", "AOC: Post-booking confirmation — sent after they pick a call time"],
    ["#16", "Onboarding: Mighty Collective invite — sent after they close (paid)"],
    ["#17", "Portal: Operator signup welcome — sent on first login to the portal"],
    ["#18", "Portal: Paid subscription welcome — sent after Stripe checkout"],
    ["#19", "Onboarding milestone: 1 of 12 steps done"],
    ["#20", "Onboarding milestone: Week 1 done (4 of 12)"],
    ["#21", "Onboarding milestone: Halfway (6 of 12)"],
    ["#22", "Onboarding milestone: All 12 steps complete"],
    ["#23", "Lifecycle: Renewal receipt — sent on monthly auto-renew"],
    ["#24", "Lifecycle: Cancellation confirmed — sent when they cancel"],
    ["#25", "Lifecycle: Payment failed — sent if their card is declined"],
    ["#26", "Operations: Fulfillment assignment — intern → operator handoff"],
    ["#27", "Support: Ticket received — confirmation to client"],
    ["#28", "Support: Reply from team — when we respond to their ticket"],
    ["#29", "Support: Ticket resolved — when their ticket is closed"],
  ]

  const list = items
    .map(
      ([n, desc]) =>
        `<li style="margin:0 0 6px;font-size:14px;color:#374151;line-height:1.7;"><strong style="color:#111827;">${n}</strong> &nbsp; ${desc}</li>`,
    )
    .join("")

  const html = emailLayout(
    `${h1("Email review for Jess — START HERE")}
    ${p(`Hey Jess — this is the cover letter for the email-template review batch. The next 29 emails arriving in this inbox are every customer-facing email AIMS / AI Operator Collective sends. They land below this email in send order. Read top-to-bottom.`)}
    ${p(`To make navigation easy, the order matches the natural user journey: first the lead-magnet results (someone takes a quiz), then the AOC apply funnel (they submit an application + get nudges to book), then post-purchase onboarding, then subscription lifecycle, then support.`)}
    <ol style="margin:0 0 24px;padding-left:0;list-style:none;">${list}</ol>
    ${p(`Reply to any of them with feedback — copy tweaks, broken links, anything that feels off. We're shipping this to 10 beta testers tomorrow so the bar is "no embarrassment when a stranger reads it."`)}
    ${p(`Thanks for the eyes,<br/>Adam`)}`,
    "Cover letter for the 29-email review batch — read in order below.",
  )

  return sendTrackedEmail({
    from: AIMS_FROM_EMAIL,
    to: DEMO_TO,
    subject: "(START HERE) AIMS Email Review — 29 templates ahead, in order",
    html,
    serviceArm: "demo-review",
  })
}

/**
 * Minimal valid PDF placeholder — used only for sendAIPlaybookEmail's
 * attachment param. ~150 bytes; opens as an empty single-page PDF in
 * any reader so Jess can see the attachment hook works.
 */
const PLACEHOLDER_PDF = Buffer.from(
  `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] >>
endobj
xref
0 4
0000000000 65535 f
0000000009 00000 n
0000000058 00000 n
0000000113 00000 n
trailer
<< /Size 4 /Root 1 0 R >>
startxref
174
%%EOF
`,
)

async function runDemoSend() {
  if (!process.env.RESEND_API_KEY) {
    console.error("[FAIL] RESEND_API_KEY missing — source .env.local first")
    process.exit(1)
  }

  console.log(`=== Sending every email template for Jess review ===`)
  console.log(`Recipient: ${DEMO_NAME} <${DEMO_TO}>`)
  console.log(`Total emails: 1 cover letter + 29 templates = 30\n`)

  // ─── 0. Cover letter (START HERE) ────────────────────────────────
  console.log("─── (START HERE) cover letter ───────────────────────")
  await sendDemo(0, "(START HERE) Cover letter — read top-down", () =>
    sendCoverLetter(),
  )

  // Brief pause so the cover letter timestamps before the templates.
  // Gmail's thread sort uses received-time; a 2s gap guarantees the
  // cover letter shows up first in the inbox view.
  await new Promise((r) => setTimeout(r, 2000))

  console.log("\n─── Lead magnet results (top of funnel) ─────────────")

  // 1. AI Readiness Quiz results — START HERE
  await sendDemo(1, "Lead magnet — AI Readiness Quiz results", () =>
    withSubjectPrefix(1, async () => {
      const { sendQuizResultsEmail } = await import("../src/lib/email/lead-magnet-results")
      return sendQuizResultsEmail({
        to: DEMO_TO,
        name: DEMO_NAME,
        score: 87,
        resultsUrl: `${DEMO_APP}/tools/ai-readiness-quiz/results/demo`,
        data: { source: "demo" },
      })
    }),
  )

  // 2. ROI Calculator results
  await sendDemo(2, "Lead magnet — ROI Calculator results", () =>
    withSubjectPrefix(2, async () => {
      const { sendCalculatorResultsEmail } = await import(
        "../src/lib/email/lead-magnet-results"
      )
      return sendCalculatorResultsEmail({
        to: DEMO_TO,
        name: DEMO_NAME,
        resultsUrl: `${DEMO_APP}/tools/roi-calculator/results/demo`,
        data: { source: "demo" },
        results: { monthlySavings: 12500, hoursSaved: 80 },
      })
    }),
  )

  // 3. Website Audit results
  await sendDemo(3, "Lead magnet — Website Audit results", () =>
    withSubjectPrefix(3, async () => {
      const { sendAuditResultsEmail } = await import(
        "../src/lib/email/lead-magnet-results"
      )
      return sendAuditResultsEmail({
        to: DEMO_TO,
        name: DEMO_NAME,
        score: 72,
        resultsUrl: `${DEMO_APP}/tools/website-audit/results/demo`,
        data: { source: "demo" },
        results: { url: "https://example.com" },
      })
    }),
  )

  // 4. Business Credit Score results
  await sendDemo(4, "Lead magnet — Business Credit Score", () =>
    withSubjectPrefix(4, async () => {
      const { sendCreditScoreEmail } = await import(
        "../src/lib/email/lead-magnet-results"
      )
      return sendCreditScoreEmail({
        to: DEMO_TO,
        name: DEMO_NAME,
        score: 78,
        resultsUrl: `${DEMO_APP}/tools/business-credit-score/results/demo`,
      })
    }),
  )

  // 5. Executive Ops Audit results
  await sendDemo(5, "Lead magnet — Executive Ops Audit", () =>
    withSubjectPrefix(5, async () => {
      const { sendOpsAuditEmail } = await import(
        "../src/lib/email/lead-magnet-results"
      )
      return sendOpsAuditEmail({
        to: DEMO_TO,
        name: DEMO_NAME,
        score: 64,
        resultsUrl: `${DEMO_APP}/tools/executive-ops-audit/results/demo`,
        data: { source: "demo" },
      })
    }),
  )

  // 6. AI Opportunity (Business AI) Audit
  await sendDemo(6, "Lead magnet — AI Opportunity Audit", () =>
    withSubjectPrefix(6, async () => {
      const { sendBusinessAIAuditEmail } = await import(
        "../src/lib/email/lead-magnet-results"
      )
      return sendBusinessAIAuditEmail({
        to: DEMO_TO,
        name: DEMO_NAME,
        resultsUrl: `${DEMO_APP}/tools/ai-opportunity-audit/results/demo`,
        data: { source: "demo" },
        results: {
          report: {
            companyName: "Adam Wolfe Industries",
            opportunityScore: 81,
            opportunities: [
              {
                rank: 1,
                title: "AI cold-email pipeline",
                problem:
                  "Manual outreach is capping new pipeline at ~5 net-new conversations a week.",
                solution:
                  "Layer in a Smartlead/Instantly + Apollo workflow with AI personalisation. Net pipeline lift: 4-6× within 30 days.",
              },
              {
                rank: 2,
                title: "Inbox auto-triage",
                problem:
                  "Discovery + warm-lead replies are getting buried in a 200-email/day inbox.",
                solution:
                  "Connect Gmail to a Claude-powered triage agent that drafts replies, routes to a Slack channel, and books calendar holds.",
              },
              {
                rank: 3,
                title: "Proposal AI co-pilot",
                problem:
                  "Each proposal eats 3-4 hours of senior time and still varies in quality.",
                solution:
                  "Run audit responses through a proposal generator that pulls scope from the calculator and auto-drafts the SOW + pricing tiers.",
              },
            ],
            priorityMove: {
              title: "Stand up the cold-email pipeline first.",
              rationale:
                "Biggest near-term lever — your inbound lookalike data already shows clear ICP matches.",
              firstStep:
                "Pull your top-50 closed-won companies, build the Apollo lookalike, and queue the first 200 sends.",
            },
          },
        },
      })
    }),
  )

  // 7. W2 Playbook results
  await sendDemo(7, "Lead magnet — W2 → Operator Playbook", () =>
    withSubjectPrefix(7, async () => {
      const { sendW2PlaybookEmail } = await import(
        "../src/lib/email/lead-magnet-results"
      )
      return sendW2PlaybookEmail({
        to: DEMO_TO,
        name: DEMO_NAME,
        resultsUrl: `${DEMO_APP}/tools/w2-playbook`,
        data: { source: "demo" },
      })
    }),
  )

  // 8. AI Playbook PDF (attaches a placeholder PDF)
  await sendDemo(8, "Lead magnet — AI Playbook (PDF attached)", () =>
    withSubjectPrefix(8, async () => {
      const { sendAIPlaybookEmail } = await import("../src/lib/email/ai-playbook")
      return sendAIPlaybookEmail({
        to: DEMO_TO,
        name: DEMO_NAME,
        pdfBuffer: PLACEHOLDER_PDF,
      })
    }),
  )

  // 9. Operator Vault unlock
  await sendDemo(9, "Lead magnet — Operator Vault unlock", () =>
    withSubjectPrefix(9, async () => {
      const { sendOperatorVaultEmail } = await import(
        "../src/lib/email/operator-vault"
      )
      return sendOperatorVaultEmail({ to: DEMO_TO, name: DEMO_NAME })
    }),
  )

  console.log("\n─── AOC apply → book funnel ─────────────────────────")

  // 10. Application received (post-submit)
  await sendDemo(10, "AOC — Application received (post-submit)", () =>
    withSubjectPrefix(10, async () => {
      const { sendApplicationReceivedEmail } = await import(
        "../src/lib/email/abandoned-application"
      )
      return sendApplicationReceivedEmail({
        to: DEMO_TO,
        name: DEMO_NAME,
        calLink: "https://calendly.com/aioperatorcollective/discovery",
      })
    }),
  )

  // 11. Abandoned application nudge
  await sendDemo(11, "AOC — Abandoned application nudge", () =>
    withSubjectPrefix(11, async () => {
      const { sendAbandonedApplicationEmail } = await import(
        "../src/lib/email/abandoned-application"
      )
      return sendAbandonedApplicationEmail({ to: DEMO_TO, name: DEMO_NAME })
    }),
  )

  // 12-14. Booking reminders day 2 / 5 / 9
  const bookingReminders = [
    { idx: 12, day: 2 as const },
    { idx: 13, day: 5 as const },
    { idx: 14, day: 9 as const },
  ]
  for (const { idx, day } of bookingReminders) {
    await sendDemo(idx, `AOC — Booking reminder day ${day}`, () =>
      withSubjectPrefix(idx, async () => {
        const { sendBookingReminderEmail } = await import(
          "../src/lib/email/booking-reminder"
        )
        return sendBookingReminderEmail({
          to: DEMO_TO,
          name: DEMO_NAME,
          day,
          tier: "warm",
        })
      }),
    )
  }

  // 15. Post-booking confirmation (after they pick a time)
  await sendDemo(15, "AOC — Post-booking confirmation", () =>
    withSubjectPrefix(15, async () => {
      const { sendPostBookingConfirmationEmail } = await import(
        "../src/lib/email/post-booking-education"
      )
      return sendPostBookingConfirmationEmail({
        to: DEMO_TO,
        name: DEMO_NAME,
        eventStartTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        meetingUrl: "https://meet.google.com/demo",
        rescheduleUrl: "https://calendly.com/aioperatorcollective/reschedule/demo",
        cancelUrl: "https://calendly.com/aioperatorcollective/cancel/demo",
      })
    }),
  )

  console.log("\n─── Member onboarding + welcomes ────────────────────")

  // 16. Mighty Collective invite (after they close)
  await sendDemo(16, "Onboarding — Mighty Collective invite", () =>
    withSubjectPrefix(16, async () => {
      const { sendCollectiveInviteEmail } = await import(
        "../src/lib/email/collective-invite"
      )
      const r = await sendCollectiveInviteEmail({
        to: DEMO_TO,
        firstName: DEMO_NAME,
        tier: "innerCircle",
        customMessage:
          "Welcome aboard, Adam! Excited to have you in the Inner Circle.",
      })
      // Adapt to the standard { error? } shape so the recorder works.
      return r.ok ? { data: { id: undefined } } : { error: r.error }
    }),
  )

  // 17. Operator portal first-login welcome
  await sendDemo(17, "Portal — Operator signup welcome", () =>
    withSubjectPrefix(17, async () => {
      const { sendOperatorSignupWelcome } = await import("../src/lib/email")
      return sendOperatorSignupWelcome({ to: DEMO_TO, name: DEMO_NAME })
    }),
  )

  // 18. Paid subscription welcome
  await sendDemo(18, "Portal — Paid subscription welcome (Pro plan)", () =>
    withSubjectPrefix(18, async () => {
      const { sendWelcomeEmail } = await import("../src/lib/email")
      return sendWelcomeEmail({
        to: DEMO_TO,
        name: DEMO_NAME,
        serviceName: "Pro Plan",
        tier: "Pro",
        portalUrl: `${DEMO_APP}/portal/dashboard`,
      })
    }),
  )

  console.log("\n─── Onboarding milestones (4 variants) ──────────────")

  // 19-22. Milestone emails — first_step, week1_done, half_done, complete.
  // These are normally sent by fireMilestoneEmailIfNeeded via dedup queue;
  // we replicate the published copy directly so Jess sees all four.
  const milestones = [
    {
      idx: 19,
      label: "Milestone — First step (1/12 onboarding steps done)",
      subject: `${DEMO_NAME}, you just completed your first step`,
      headline: `${DEMO_NAME}, you're off the starting line.`,
      body: `You just completed your first onboarding step in the AI Operator OS. The hardest part is starting — and you just did.<br/><br/>Keep the momentum going.`,
      cta: { label: "Continue Onboarding", url: `${DEMO_APP}/portal/onboard` },
    },
    {
      idx: 20,
      label: "Milestone — Week 1 done (4/12 onboarding steps)",
      subject: `Nice work, ${DEMO_NAME} — Week 1 is done`,
      headline: "Week 1 complete. The toolkit is open.",
      body: `You finished the first four onboarding steps. That means you've unlocked the Automation &amp; Outreach tool tier.`,
      cta: { label: "Open the Toolkit", url: `${DEMO_APP}/portal/tools` },
    },
    {
      idx: 21,
      label: "Milestone — Halfway (6/12 onboarding steps)",
      subject: `${DEMO_NAME}, you're halfway there`,
      headline: "6 of 12 steps done. You're in the top half.",
      body: `Most members stall around step 3 or 4. You've made it to step 6.`,
      cta: { label: "See What's Unlocked", url: `${DEMO_APP}/portal/tools` },
    },
    {
      idx: 22,
      label: "Milestone — Complete (12/12 onboarding steps)",
      subject: `${DEMO_NAME}, you've completed the AI Operator OS onboarding`,
      headline: `${DEMO_NAME}, full access is yours.`,
      body: `You finished all 12 onboarding steps. Every tool in the AI Operator Toolkit is now unlocked.`,
      cta: { label: "Open Your CRM", url: `${DEMO_APP}/portal/crm` },
    },
  ] as const

  for (const m of milestones) {
    await sendDemo(m.idx, m.label, () =>
      withSubjectPrefix(m.idx, async () => {
        const { sendTrackedEmail, emailLayout, h1, p, btn, divider } = await import(
          "../src/lib/email"
        )
        const { AOC_FROM_EMAIL } = await import("../src/lib/email/senders")
        const html = emailLayout(
          `${h1(m.headline)}${p(m.body)}<div style="text-align:center;margin:0 0 32px;">${btn(m.cta.label, m.cta.url)}</div>${divider()}<p style="margin:16px 0 0;font-size:14px;color:#4B5563;line-height:1.6;">Adam<br/><span style="color:#9CA3AF;font-size:12px;">AI Operator Collective</span></p>`,
          m.headline,
          DEMO_TO,
        )
        return sendTrackedEmail({
          from: AOC_FROM_EMAIL,
          to: DEMO_TO,
          subject: m.subject,
          html,
          serviceArm: "onboarding-milestones",
        })
      }),
    )
  }

  console.log("\n─── Subscription lifecycle ──────────────────────────")

  // 23. Renewal receipt
  await sendDemo(23, "Lifecycle — Renewal receipt", () =>
    withSubjectPrefix(23, async () => {
      const { sendRenewalEmail } = await import("../src/lib/email")
      return sendRenewalEmail({
        to: DEMO_TO,
        name: DEMO_NAME,
        serviceName: "Pro Plan",
        amount: 97,
        nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        portalUrl: `${DEMO_APP}/portal/billing`,
      })
    }),
  )

  // 24. Cancellation confirmation
  await sendDemo(24, "Lifecycle — Cancellation confirmed", () =>
    withSubjectPrefix(24, async () => {
      const { sendCancellationEmail } = await import("../src/lib/email")
      return sendCancellationEmail({
        to: DEMO_TO,
        name: DEMO_NAME,
        serviceName: "Pro Plan",
        cancelledAt: new Date(),
      })
    }),
  )

  // 25. Payment failed
  await sendDemo(25, "Lifecycle — Payment failed (action required)", () =>
    withSubjectPrefix(25, async () => {
      const { sendPaymentFailedEmail } = await import("../src/lib/email")
      return sendPaymentFailedEmail({
        to: DEMO_TO,
        name: DEMO_NAME,
        serviceName: "Pro Plan",
        amount: 97,
        retryDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        updatePaymentUrl: `${DEMO_APP}/portal/billing`,
      })
    }),
  )

  console.log("\n─── Operations + support ────────────────────────────")

  // 26. Fulfillment task assignment (intern → operator workflow)
  await sendDemo(26, "Operations — Fulfillment assignment (intern→operator)", () =>
    withSubjectPrefix(26, async () => {
      const { sendFulfillmentAssignment } = await import("../src/lib/email")
      return sendFulfillmentAssignment({
        to: DEMO_TO,
        assigneeName: DEMO_NAME,
        clientName: "Acme Co",
        serviceName: "Cold Outbound Engine",
        tier: "Pro",
        clientEmail: "ops@acme.example",
        clientWebsite: "https://acme.example",
      })
    }),
  )

  // 27. Support ticket confirmation (to client)
  await sendDemo(27, "Support — Ticket confirmation (sent to client)", () =>
    withSubjectPrefix(27, async () => {
      const { sendTicketConfirmationEmail } = await import(
        "../src/lib/email/support"
      )
      return sendTicketConfirmationEmail({
        to: DEMO_TO,
        name: DEMO_NAME,
        subject: "Cannot connect Stripe in billing settings",
        ticketId: "TK-DEMO-001",
      })
    }),
  )

  // 28. Support reply notification (to client)
  await sendDemo(28, "Support — Reply from team (to client)", () =>
    withSubjectPrefix(28, async () => {
      const { sendReplyNotificationToClient } = await import(
        "../src/lib/email/support"
      )
      return sendReplyNotificationToClient({
        to: DEMO_TO,
        clientName: DEMO_NAME,
        subject: "Cannot connect Stripe in billing settings",
        replyMessage:
          "Adam — I just pushed a fix for the Stripe Connect bug you flagged. Can you log out, log back in, and try again? Should be smooth now.",
        authorName: "Matt",
        ticketId: "TK-DEMO-001",
      })
    }),
  )

  // 29. Support ticket status change (resolved)
  await sendDemo(29, "Support — Ticket resolved", () =>
    withSubjectPrefix(29, async () => {
      const { sendTicketStatusChangeEmail } = await import(
        "../src/lib/email/support"
      )
      return sendTicketStatusChangeEmail({
        to: DEMO_TO,
        clientName: DEMO_NAME,
        subject: "Cannot connect Stripe in billing settings",
        newStatus: "resolved",
        resolutionNote:
          "Stripe Connect is now reachable from /portal/billing → Connect bank. Confirmed working in Adam's account at 4:12pm.",
        ticketId: "TK-DEMO-001",
      })
    }),
  )

  // ─── Report ───────────────────────────────────────────────────────
  const failed = demoResults.filter((r) => !r.ok)
  console.log()
  console.log(
    `=== ${demoResults.length - failed.length}/${demoResults.length} sent ${failed.length === 0 ? "✓" : `(${failed.length} failed)`} ===`,
  )
  if (failed.length > 0) {
    console.log("\nFailed:")
    for (const f of failed) {
      console.log(`  #${String(f.index).padStart(2, "0")}  ${f.label}`)
      console.log(`        ${f.detail}`)
    }
    process.exit(1)
  }
}

runDemoSend().catch((err) => {
  console.error("Send-all crashed:", err)
  process.exit(1)
})
