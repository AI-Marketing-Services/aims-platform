import { Resend } from "resend"
import { db } from "@/lib/db"
import { logger } from "@/lib/logger"

export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
}

export function getResend() {
  if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY === "re_placeholder") {
    logger.warn("RESEND_API_KEY is not configured - emails will not be delivered")
  }
  return new Resend(process.env.RESEND_API_KEY ?? "re_placeholder")
}

// Wrapper that logs cost for every email sent via Resend (~$0.001/email on paid plan).
// Resend's `emails.send` returns `{ data, error }` on failure WITHOUT throwing — so
// without explicit error handling, failed sends would be invisible. We log loudly
// when `result.error` is present so triage during testing isn't blind.
export async function sendTrackedEmail(
  params: Parameters<ReturnType<typeof getResend>["emails"]["send"]>[0] & {
    serviceArm?: string
    clientId?: string
    /** Stable identifier — see src/lib/email/catalog.ts. When set,
     *  enables admin edits at /admin/email-templates to override
     *  subject + html at send-time. */
    templateKey?: string
  },
) {
  const { serviceArm, clientId, templateKey, ...emailParams } = params

  // Admin override hook — best-effort, falls back to defaults on any
  // DB hiccup so a broken override layer never blocks an outgoing
  // email.
  if (templateKey) {
    try {
      const { applyTemplateOverride } = await import("./overrides")
      Object.assign(
        emailParams,
        await applyTemplateOverride(templateKey, {
          subject: emailParams.subject as string | undefined,
          html: emailParams.html as string | undefined,
        }),
      )
    } catch (err) {
      logger.error("applyTemplateOverride failed — using code default", err, {
        templateKey,
      })
    }
  }

  const to = Array.isArray(emailParams.to) ? emailParams.to[0] : emailParams.to
  const result = await getResend().emails.send(emailParams)

  if (result.error) {
    logger.error("Resend send failed", result.error, {
      action: "sendTrackedEmail",
      to,
      subject: emailParams.subject,
      serviceArm: serviceArm ?? "email",
      templateKey,
    })
  }

  db.apiCostLog.create({
    data: {
      provider: "resend",
      model: "email",
      endpoint: "emails.send",
      tokens: 0,
      cost: 0.001,
      serviceArm: serviceArm ?? "email",
      clientId,
      metadata: {
        to,
        subject: emailParams.subject,
        templateKey: templateKey ?? null,
        ...(result.error ? { error: String(result.error.message ?? result.error) } : {}),
      },
    },
  }).catch(() => {})
  return result
}

import { buildUnsubscribeUrl } from "@/app/api/unsubscribe/route"
import { AIMS_FROM_EMAIL as FROM_EMAIL, AIMS_REPLY_TO as REPLY_TO } from "./senders"

// ─── Branded HTML wrapper ─────────────────────────────────────────────────────

export function emailLayout(content: string, preheader = "", recipientEmail?: string) {
  const unsubscribeHref = recipientEmail
    ? buildUnsubscribeUrl(recipientEmail)
    : "https://www.aioperatorcollective.com/unsubscribe"
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>AIMS</title>
</head>
<body style="margin:0;padding:0;background:#F5F5F5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  ${preheader ? `<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${preheader}&nbsp;&zwnj;&nbsp;</div>` : ""}
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#F5F5F5;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="background:#ffffff;border-radius:12px 12px 0 0;padding:28px 40px;border-bottom:1px solid #F0F0F0;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <img src="https://www.aioperatorcollective.com/logo.png" alt="AI Operator Collective" width="36" height="36"
                      style="display:inline-block;vertical-align:middle;margin-right:10px;" />
                    <span style="font-size:18px;font-weight:800;color:#111827;vertical-align:middle;letter-spacing:-0.5px;">AI Operator Collective</span>
                  </td>
                  <td align="right">
                    <span style="font-size:11px;color:#9CA3AF;letter-spacing:0.05em;text-transform:uppercase;">AI Operator Collective</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="background:#ffffff;padding:40px 40px 32px;">
              ${content}
            </td>
          </tr>

          <!-- Footer — compliance-minimum only. Dropped the "Questions?
               Reply to this email" block and the AIMS · AI-Powered
               Business Infrastructure line per product direction; the
               tone is already human/first-person at the signature so the
               corporate footer was redundant. CAN-SPAM still requires a
               physical address + unsubscribe; those stay. -->
          <tr>
            <td style="background:#F9FAFB;border-radius:0 0 12px 12px;padding:20px 40px;border-top:1px solid #F0F0F0;">
              <p style="margin:0 0 4px;font-size:11px;color:#9CA3AF;">
                Modern Amenities Group · 8 The Green, Suite A · Dover, DE 19901
              </p>
              <p style="margin:0;font-size:11px;color:#9CA3AF;">
                <a href="${unsubscribeHref}" style="color:#9CA3AF;text-decoration:underline;">Unsubscribe</a>
                · <a href="https://www.aioperatorcollective.com/privacy" style="color:#9CA3AF;text-decoration:underline;">Privacy Policy</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

export function btn(text: string, url: string) {
  return `<a href="${url}" style="display:inline-block;background:#981B1B;color:#ffffff;padding:13px 28px;border-radius:6px;text-decoration:none;font-weight:700;font-size:13px;letter-spacing:0.06em;text-transform:uppercase;margin:8px 0;">${text}</a>`
}

export function h1(text: string) {
  return `<h1 style="margin:0 0 16px;font-size:26px;font-weight:800;color:#111827;line-height:1.2;letter-spacing:-0.5px;">${text}</h1>`
}

export function p(text: string) {
  return `<p style="margin:0 0 16px;font-size:15px;color:#4B5563;line-height:1.7;">${text}</p>`
}

export function divider() {
  return `<hr style="border:none;border-top:1px solid #F0F0F0;margin:28px 0;" />`
}

// ─── Transactional emails ─────────────────────────────────────────────────────

/**
 * Operator signup welcome — fires on Clerk user.created webhook for
 * brand-new accounts (NOT for users who arrive via a paid checkout —
 * those get sendWelcomeEmail below). Orients them to the Today
 * dashboard, the 50-credit trial grant, and the 4 starter actions.
 */
export async function sendOperatorSignupWelcome(params: {
  to: string
  name: string | null
}) {
  const firstName = params.name?.split(" ")[0] ?? "there"
  const onboardUrl = "https://www.aioperatorcollective.com/portal/onboard"

  // Foundation-first welcome per Jess's "walk before run" spec.
  // Intentionally does NOT push the AI tools, lead magnets, or
  // diagnostic flows in the first email. We point straight at Week 1
  // (Foundation) so new members orient on mindset + community first;
  // the toolkit unlocks later, after they've built the operator's
  // judgment those tools amplify.
  const body = `
    ${h1(`Welcome aboard, ${firstName}`)}
    ${p(`You're in. The first thing to know: AIOC is built as an apprenticeship, not a tool dump. We'll walk before we run. Mindset first, then prospecting, then revenue activities, then problem diagnosis. The AI tools come in later — once you have the operator judgment that makes them useful instead of overwhelming.`)}
    <p style="margin:0 0 16px;font-size:15px;color:#4B5563;line-height:1.7;font-weight:600;color:#111827;">This week's focus: Foundation.</p>
    <ol style="margin:0 0 24px;padding-left:20px;color:#4B5563;line-height:1.9;font-size:15px;">
      <li><strong style="color:#111827;">Complete your profile + intro post</strong> — small room, real people. Say hello.</li>
      <li><strong style="color:#111827;">Start Module 1: AI Operator Foundations</strong> — five short lessons on what the work actually is.</li>
      <li><strong style="color:#111827;">Comment on two community threads</strong> — relationships compound here.</li>
    </ol>
    ${btn("Open your onboarding →", onboardUrl)}
    ${divider()}
    ${p(`<strong style="color:#111827;">What you'll unlock as you go:</strong>`)}
    <ul style="margin:0 0 24px;padding-left:20px;color:#4B5563;line-height:1.9;font-size:14px;">
      <li>Week 2 — <strong style="color:#111827;">Prospecting</strong> (find businesses worth talking to)</li>
      <li>Week 3 — <strong style="color:#111827;">Revenue activities</strong> (outreach, conversations, reps)</li>
      <li>Week 4 — <strong style="color:#111827;">Problem diagnosis</strong> (discovery frameworks, mapping pain)</li>
      <li>Week 5+ — <strong style="color:#111827;">Solutioning</strong> (now the AI toolkit + audits + ROI calculators come in)</li>
    </ul>
    ${p(`The sequence is intentional. Most AI courses start with the tools — then operators get overwhelmed and quit. We start with the operator. Reply with any questions; I read every one.`)}
  `
  return sendTrackedEmail({
    from: FROM_EMAIL,
    to: params.to,
    replyTo: REPLY_TO,
    subject: `Welcome to AI Operator Collective, ${firstName} — start with Week 1`,
    html: emailLayout(
      body,
      `You're in. We walk before we run — start with Foundation this week.`,
      params.to,
    ),
    serviceArm: "operator-signup",
    templateKey: "welcome.operator-signup",
  })
}

export async function sendWelcomeEmail(params: {
  to: string
  name: string
  serviceName: string
  tier?: string
  portalUrl: string
}) {
  const body = `
    ${h1(`Welcome aboard, ${params.name}!`)}
    ${p(`Your <strong style="color:#111827;">${params.serviceName}${params.tier ? ` (${params.tier} tier)` : ""}</strong> subscription is now active. Here's what happens next:`)}
    <ol style="margin:0 0 24px;padding-left:20px;color:#4B5563;line-height:2;font-size:15px;">
      <li>Our team has been notified and will begin setup within <strong style="color:#111827;">24 hours</strong></li>
      <li>You'll receive a setup guide specific to your service</li>
      <li>Log into your portal to track progress and manage your account</li>
    </ol>
    ${btn("Go to Your Portal →", params.portalUrl)}
    ${divider()}
    ${p(`Need help? Just reply to this email - we typically respond within 2 business hours.`)}
  `
  return sendTrackedEmail({
    from: FROM_EMAIL,
    to: params.to,
    replyTo: REPLY_TO,
    subject: `Welcome to AIMS - Your ${params.serviceName} is live`,
    html: emailLayout(body, `Your ${params.serviceName} is now active. Here's what to expect.`),
    templateKey: "welcome.paid-subscription",
  })
}

export async function sendLeadMagnetResults(params: {
  to: string
  name: string
  type: string
  score?: number
  resultsUrl: string
}) {
  const subjectMap: Record<string, string> = {
    "ai-readiness-quiz": `Your AI Readiness Score: ${params.score ?? "Ready"}`,
    "roi-calculator": "Your Custom ROI Report from AIMS",
    "website-audit": "Your Website Audit Results",
    "segment-explorer": "Your Audience Segments Report",
    "stack-configurator": "Your Recommended AI Stack",
  }

  const body = `
    ${h1(`${params.name ? `Hey ${params.name}  - ` : "Hey  - "} your results are ready`)}
    ${params.score ? `
      <div style="background:#FEF2F2;border-left:4px solid #981B1B;border-radius:6px;padding:20px 24px;margin:0 0 24px;">
        <p style="margin:0 0 4px;font-size:12px;font-weight:700;color:#981B1B;text-transform:uppercase;letter-spacing:0.08em;">Your Score</p>
        <p style="margin:0;font-size:48px;font-weight:800;color:#111827;line-height:1;">${params.score}<span style="font-size:20px;color:#6B7280;">/100</span></p>
      </div>
    ` : ""}
    ${p("We've analyzed your inputs and put together a personalized report with specific recommendations for your business.")}
    ${btn("View Full Results →", params.resultsUrl)}
    ${divider()}
    ${p(`Want to talk through your results with our team? We'll map the right AIMS services to your exact gaps - no pitch, just a working session.`)}
    <a href="https://www.aioperatorcollective.com/get-started" style="font-size:14px;color:#981B1B;font-weight:600;text-decoration:none;">
      Book a free strategy call →
    </a>
  `
  return sendTrackedEmail({
    from: FROM_EMAIL,
    to: params.to,
    replyTo: REPLY_TO,
    subject: subjectMap[params.type] ?? "Your AIMS Results",
    html: emailLayout(body, "Your personalized AIMS results are ready to view."),
  })
}

export async function sendFulfillmentAssignment(params: {
  to: string
  assigneeName: string
  clientName: string
  serviceName: string
  tier?: string
  clientEmail: string
  clientWebsite?: string
}) {
  const body = `
    ${h1(`New fulfillment assignment`)}
    ${p(`Hey ${params.assigneeName}, a new client has been assigned to you.`)}
    <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #E5E7EB;border-radius:8px;overflow:hidden;margin:0 0 24px;">
      ${[
        ["Client", params.clientName],
        ["Service", `${params.serviceName}${params.tier ? ` (${params.tier})` : ""}`],
        ["Email", params.clientEmail],
        ...(params.clientWebsite ? [["Website", params.clientWebsite]] : []),
      ].map(([label, value], i) => `
        <tr style="background:${i % 2 === 0 ? "#F9FAFB" : "#ffffff"};">
          <td style="padding:12px 16px;font-size:13px;color:#6B7280;width:120px;">${label}</td>
          <td style="padding:12px 16px;font-size:13px;font-weight:600;color:#111827;">${value}</td>
        </tr>
      `).join("")}
    </table>
    ${btn("Open Admin Portal →", "https://www.aioperatorcollective.com/admin")}
    ${p("Check the admin portal for setup tasks and the fulfillment checklist.")}
  `
  return sendTrackedEmail({
    from: FROM_EMAIL,
    to: params.to,
    replyTo: REPLY_TO,
    subject: `New client: ${params.clientName} - ${params.serviceName}`,
    html: emailLayout(body, `New fulfillment: ${params.clientName} signed up for ${params.serviceName}.`),
    templateKey: "ops.fulfillment-assignment",
  })
}

// ─── Notification helper ──────────────────────────────────────────────────────

export async function sendInternalNotification(params: {
  subject: string
  message: string
  urgency?: "low" | "normal" | "high"
}) {
  const urgencyBar = params.urgency === "high"
    ? `<div style="background:#981B1B;color:#ffffff;padding:10px 16px;border-radius:6px;font-size:13px;font-weight:700;margin-bottom:20px;">⚠ HIGH PRIORITY</div>`
    : params.urgency === "normal"
    ? `<div style="background:#FEF2F2;color:#981B1B;padding:10px 16px;border-radius:6px;font-size:13px;font-weight:600;margin-bottom:20px;">Notification</div>`
    : ""

  const body = `
    ${urgencyBar}
    ${h1(params.subject)}
    <pre style="background:#F9FAFB;border:1px solid #E5E7EB;border-radius:6px;padding:16px;font-size:13px;color:#374151;white-space:pre-wrap;overflow-wrap:break-word;">${params.message}</pre>
    ${btn("Open Admin Portal →", "https://www.aioperatorcollective.com/admin")}
  `
  // Default falls back to the SUPER_ADMIN inbox so the email always goes
  // somewhere real even when INTERNAL_NOTIFY_TO isn't set (test env, fresh
  // local dev). Production sets INTERNAL_NOTIFY_TO explicitly.
  const internalTo = process.env.INTERNAL_NOTIFY_TO ?? "adamwolfe102@gmail.com"
  return sendTrackedEmail({
    from: FROM_EMAIL,
    to: internalTo,
    subject: `[AIMS${params.urgency === "high" ? " URGENT" : ""}] ${params.subject}`,
    html: emailLayout(body),
  })
}

export async function sendCancellationEmail(params: {
  to: string
  name: string
  serviceName: string
  cancelledAt: Date
}) {
  const body = `
    ${h1(`We're sorry to see you go, ${params.name}`)}
    ${p(`Your <strong style="color:#111827;">${params.serviceName}</strong> subscription has been cancelled as of ${params.cancelledAt.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}.`)}
    ${p("If this was a mistake or you'd like to discuss continuing, just reply to this email — we'll make it right.")}
    ${divider()}
    ${p("If there's anything we could have done better, we'd genuinely love to hear it. Your feedback helps us improve.")}
    <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #E5E7EB;border-radius:8px;overflow:hidden;margin:0 0 24px;">
      <tr style="background:#F9FAFB;">
        <td style="padding:16px 20px;">
          <p style="margin:0 0 4px;font-size:12px;font-weight:700;color:#6B7280;text-transform:uppercase;letter-spacing:0.08em;">Want to restart?</p>
          <p style="margin:0 0 12px;font-size:14px;color:#374151;">You can reactivate at any time — pick up right where you left off.</p>
          <a href="https://www.aioperatorcollective.com/get-started" style="font-size:13px;color:#981B1B;font-weight:700;text-decoration:none;">Restart my subscription →</a>
        </td>
      </tr>
    </table>
  `
  return sendTrackedEmail({
    from: FROM_EMAIL,
    to: params.to,
    replyTo: REPLY_TO,
    subject: `Your ${params.serviceName} subscription has been cancelled`,
    html: emailLayout(body, `Your ${params.serviceName} subscription has been cancelled.`, params.to),
    templateKey: "lifecycle.cancellation",
  })
}

export async function sendRenewalEmail(params: {
  to: string
  name: string
  serviceName: string
  amount: number
  nextBillingDate: Date
  portalUrl: string
}) {
  const body = `
    ${h1(`Payment confirmed — ${params.serviceName}`)}
    ${p(`Hi ${params.name}, your renewal payment of <strong style="color:#111827;">$${params.amount.toLocaleString()}</strong> has been processed successfully.`)}
    <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #E5E7EB;border-radius:8px;overflow:hidden;margin:0 0 24px;">
      ${[
        ["Service", params.serviceName],
        ["Amount", `$${params.amount.toLocaleString()}/month`],
        ["Next billing date", params.nextBillingDate.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })],
      ].map(([label, value], i) => `
        <tr style="background:${i % 2 === 0 ? "#F9FAFB" : "#ffffff"};">
          <td style="padding:12px 16px;font-size:13px;color:#6B7280;width:160px;">${label}</td>
          <td style="padding:12px 16px;font-size:13px;font-weight:600;color:#111827;">${value}</td>
        </tr>
      `).join("")}
    </table>
    ${btn("View Portal →", params.portalUrl)}
    ${divider()}
    ${p("Thank you for continuing to grow with AIMS. If you have questions about your account or want to explore additional services, reply to this email any time.")}
  `
  return sendTrackedEmail({
    from: FROM_EMAIL,
    to: params.to,
    replyTo: REPLY_TO,
    subject: `Payment confirmed - ${params.serviceName} renewed`,
    html: emailLayout(body, `Your $${params.amount}/mo ${params.serviceName} subscription has been renewed.`, params.to),
    templateKey: "lifecycle.renewal",
  })
}

export async function sendPaymentFailedEmail(params: {
  to: string
  name: string
  serviceName: string
  amount: number
  retryDate?: Date
  updatePaymentUrl: string
}) {
  const body = `
    ${h1(`Action required: Payment failed`)}
    <div style="background:#FEF2F2;border-left:4px solid #EF4444;border-radius:6px;padding:16px 20px;margin:0 0 24px;">
      <p style="margin:0 0 4px;font-size:12px;font-weight:700;color:#EF4444;text-transform:uppercase;letter-spacing:0.08em;">Payment Failed</p>
      <p style="margin:0;font-size:14px;color:#374151;">We were unable to process your payment of <strong>$${params.amount.toLocaleString()}</strong> for <strong>${params.serviceName}</strong>.</p>
    </div>
    ${p("To keep your service running without interruption, please update your payment method.")}
    ${btn("Update Payment Method →", params.updatePaymentUrl)}
    ${divider()}
    ${params.retryDate ? p(`We'll automatically retry your payment on <strong>${params.retryDate.toLocaleDateString("en-US", { month: "long", day: "numeric" })}</strong>. Update your payment details before then to avoid any disruption.`) : ""}
    ${p("Need help? Reply to this email and we'll sort it out immediately.")}
  `
  return sendTrackedEmail({
    from: FROM_EMAIL,
    to: params.to,
    replyTo: REPLY_TO,
    subject: `Action required: Payment failed for ${params.serviceName}`,
    html: emailLayout(body, `Your payment of $${params.amount} for ${params.serviceName} failed. Action required.`, params.to),
    templateKey: "lifecycle.payment-failed",
  })
}

// ─── Sequence definitions ─────────────────────────────────────────────────────

export const EMAIL_SEQUENCES = {
  "post-quiz": {
    name: "AI Readiness Quiz Follow-up",
    emails: [
      { delay: 0, subject: "Your AI Readiness Results", templateKey: "quiz-results" },
      { delay: 2, subject: "What a business like yours looked like before AIMS", templateKey: "quiz-case-study" },
      { delay: 4, subject: "The product that matches your biggest gap", templateKey: "quiz-product-rec" },
      { delay: 7, subject: "What's a month of inaction costing you?", templateKey: "quiz-roi-angle" },
      { delay: 10, subject: "Your competitors are already doing this", templateKey: "quiz-competitive" },
      { delay: 14, subject: "Get your first month free if you start this week", templateKey: "quiz-offer" },
    ],
  },
  "post-calculator": {
    name: "ROI Calculator Follow-up",
    emails: [
      { delay: 0, subject: "Your personalized ROI report", templateKey: "calc-results" },
      { delay: 1, subject: "The cost of waiting", templateKey: "calc-cost-of-waiting" },
      { delay: 3, subject: "The AIMS product that solves your biggest cost center", templateKey: "calc-product-match" },
      { delay: 5, subject: "A business like yours saved $X/mo", templateKey: "calc-case-study" },
      { delay: 8, subject: "We built this for a similar business last month", templateKey: "calc-recent-win" },
      { delay: 12, subject: "Let's rebuild your ROI model live together", templateKey: "calc-book-call" },
    ],
  },
  "post-audit": {
    name: "Website Audit Follow-up",
    emails: [
      { delay: 0, subject: "Your website audit report", templateKey: "audit-results" },
      { delay: 1, subject: "Fix #1 from your audit", templateKey: "audit-fix-1" },
      { delay: 3, subject: "Fix #2: SEO without a team", templateKey: "audit-fix-2" },
      { delay: 5, subject: "Before and after: a similar business", templateKey: "audit-before-after" },
      { delay: 9, subject: "$97/month fixes everything on your audit report", templateKey: "audit-offer" },
    ],
  },
  "post-purchase": {
    name: "Client Onboarding",
    emails: [
      { delay: 0, subject: "Welcome to AIMS", templateKey: "onboard-welcome" },
      { delay: 1, subject: "Your setup guide", templateKey: "onboard-setup" },
      { delay: 3, subject: "Feature spotlight", templateKey: "onboard-features" },
      { delay: 7, subject: "How's everything going?", templateKey: "onboard-checkin" },
      { delay: 14, subject: "Ready for the next level?", templateKey: "onboard-upsell-1" },
      { delay: 30, subject: "30 days in: here's what's next", templateKey: "onboard-upsell-2" },
    ],
  },
  "partner-onboard": {
    name: "Partner Onboarding",
    emails: [
      { delay: 0, subject: "Welcome to the AIMS partner program", templateKey: "partner-welcome" },
      { delay: 2, subject: "How to close your first deal", templateKey: "partner-sales-guide" },
      { delay: 4, subject: "Your partner landing page is live", templateKey: "partner-landing" },
      { delay: 7, subject: "Your referral tracking dashboard", templateKey: "partner-dashboard" },
      { delay: 14, subject: "How partners are selling AIMS", templateKey: "partner-case-study" },
    ],
  },
  "operator-vault": {
    name: "AI Operator Vault Drip",
    emails: [
      { delay: 1, subject: "Chapter 2: The cold email sequence AIMS actually uses", templateKey: "operator-vault-ch2" },
      { delay: 3, subject: "Chapter 3: The discovery script that books follow-up calls", templateKey: "operator-vault-ch3" },
      { delay: 6, subject: "Chapter 4: Pricing in ranges + the MSA we pre-filled for you", templateKey: "operator-vault-ch4" },
      { delay: 10, subject: "Chapter 5: The delivery playbook that turns month 1 into year 1", templateKey: "operator-vault-ch5" },
      { delay: 14, subject: "Last call — alpha cohort review window is closing", templateKey: "operator-vault-closing" },
    ],
  },
  "business-ai-audit": {
    name: "Business AI Audit Follow-up",
    emails: [
      { delay: 5, subject: "Your in-house team vs. an Operator Collective member", templateKey: "business-audit-build-vs-buy" },
      { delay: 12, subject: "Last note from the Collective — then I'll stop emailing", templateKey: "business-audit-closing" },
    ],
  },
  "w2-playbook": {
    name: "W-2 Playbook Follow-up",
    emails: [
      { delay: 5, subject: "Why most W-2 operators stall at $2k/mo (and how to break through)", templateKey: "w2-playbook-stall" },
      { delay: 12, subject: "Last play, then I'll stop emailing you", templateKey: "w2-playbook-closing" },
    ],
  },
  "post-booking-education": {
    name: "Post-Booking Education (AOC)",
    emails: [
      { delay: 1, subject: "The 4 moves our best operators make early", templateKey: "aoc-day-1-playbook-moves" },
      { delay: 2, subject: "The 10 AI tools I actually use every day", templateKey: "aoc-day-2-tools" },
      { delay: 3, subject: "5 prompts that save operators 10+ hours/week", templateKey: "aoc-day-3-prompts" },
    ],
  },
} as const

export type SequenceKey = keyof typeof EMAIL_SEQUENCES
