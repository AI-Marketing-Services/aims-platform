import { Resend } from "resend"

function getResend() {
  return new Resend(process.env.RESEND_API_KEY ?? "re_placeholder")
}

const FROM_EMAIL = "AIMS <hello@aimanagingservices.com>"
const REPLY_TO = "support@aimanagingservices.com"

// ============ TRANSACTIONAL ============

export async function sendWelcomeEmail(params: {
  to: string
  name: string
  serviceName: string
  tier?: string
  portalUrl: string
}) {
  return getResend().emails.send({
    from: FROM_EMAIL,
    to: params.to,
    replyTo: REPLY_TO,
    subject: `Welcome to AIMS — Your ${params.serviceName} is live`,
    html: `
      <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto;">
        <img src="https://aimanagingservices.com/logo.png" alt="AIMS" width="120" style="margin-bottom: 24px;" />
        <h1 style="font-size: 24px; color: #0A0A0A;">Welcome aboard, ${params.name}!</h1>
        <p style="color: #4B5563; line-height: 1.6;">
          Your <strong>${params.serviceName}${params.tier ? ` (${params.tier})` : ""}</strong> subscription is now active.
          Here's what happens next:
        </p>
        <ol style="color: #4B5563; line-height: 2;">
          <li>Our team has been notified and will begin setup within 24 hours</li>
          <li>You'll receive a setup guide specific to your service</li>
          <li>Log into your portal to track progress and manage your account</li>
        </ol>
        <a href="${params.portalUrl}" style="display: inline-block; background: #DC2626; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 16px 0;">
          Go to Your Portal
        </a>
        <p style="color: #9CA3AF; font-size: 14px; margin-top: 32px;">
          Questions? Reply to this email or reach out at ${REPLY_TO}
        </p>
      </div>
    `,
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

  return getResend().emails.send({
    from: FROM_EMAIL,
    to: params.to,
    replyTo: REPLY_TO,
    subject: subjectMap[params.type] ?? "Your AIMS Results",
    html: `
      <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto;">
        <img src="https://aimanagingservices.com/logo.png" alt="AIMS" width="120" style="margin-bottom: 24px;" />
        <h1 style="font-size: 24px; color: #0A0A0A;">
          ${params.name ? `Hey ${params.name},` : "Hey there,"} your results are ready
        </h1>
        ${params.score ? `<p style="font-size: 48px; font-weight: 700; color: #DC2626; margin: 16px 0;">${params.score}/100</p>` : ""}
        <a href="${params.resultsUrl}" style="display: inline-block; background: #DC2626; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">
          View Full Results
        </a>
        <p style="color: #4B5563; line-height: 1.6; margin-top: 24px;">
          Want to talk through your results with our team?
        </p>
        <a href="https://aimanagingservices.com/get-started" style="color: #DC2626; font-weight: 600;">
          Book a free strategy call →
        </a>
      </div>
    `,
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
  return getResend().emails.send({
    from: FROM_EMAIL,
    to: params.to,
    replyTo: REPLY_TO,
    subject: `New client: ${params.clientName} — ${params.serviceName}`,
    html: `
      <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="font-size: 20px; color: #0A0A0A;">New fulfillment assignment</h1>
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
          <tr><td style="padding: 8px 0; color: #6B7280;">Client</td><td style="padding: 8px 0; font-weight: 600;">${params.clientName}</td></tr>
          <tr><td style="padding: 8px 0; color: #6B7280;">Service</td><td style="padding: 8px 0; font-weight: 600;">${params.serviceName}${params.tier ? ` (${params.tier})` : ""}</td></tr>
          <tr><td style="padding: 8px 0; color: #6B7280;">Email</td><td style="padding: 8px 0;">${params.clientEmail}</td></tr>
          ${params.clientWebsite ? `<tr><td style="padding: 8px 0; color: #6B7280;">Website</td><td style="padding: 8px 0;">${params.clientWebsite}</td></tr>` : ""}
        </table>
        <p style="color: #4B5563;">Check the admin portal for setup tasks and fulfillment checklist.</p>
      </div>
    `,
  })
}

// ============ NOTIFICATION HELPER ============

export async function sendInternalNotification(params: {
  subject: string
  message: string
  urgency?: "low" | "normal" | "high"
}) {
  // Send to admin team
  return getResend().emails.send({
    from: FROM_EMAIL,
    to: "team@aimanagingservices.com",
    subject: `[AIMS${params.urgency === "high" ? " URGENT" : ""}] ${params.subject}`,
    html: `<div style="font-family: monospace; padding: 16px;">${params.message}</div>`,
  })
}

// ============ SEQUENCE DEFINITIONS ============

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
} as const

export type SequenceKey = keyof typeof EMAIL_SEQUENCES
