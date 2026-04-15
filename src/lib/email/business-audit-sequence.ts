/**
 * Business AI Audit — Drip Sequence
 *
 * Intentionally short. We do not run aggressive drip campaigns — the goal is to
 * deliver real value with the minimum number of emails so we don't end up in
 * spam folders or burning trust with high-ticket prospects.
 *
 * Sequence flow (from the moment the email gate is submitted):
 *   T+0     → sendBusinessAIAuditEmail() fires inline (delivers full report link)
 *   T+5d    → Build-vs-buy honest framing (the highest-leverage follow-up)
 *   T+12d   → Honest closing — "your audit is yours either way, last note"
 *
 * That's it. Three total emails per lead, including the inline delivery. No more.
 *
 * The cron at process-email-queue/route.ts dispatches T+5d and T+12d via
 * buildBusinessAIAuditEmail(emailIndex, metadata).
 */

import { escapeHtml } from "./index"

// ─── URLs ────────────────────────────────────────────────────────────────

const COLLECTIVE_BASE = "https://aioperatorcollective.com"
const APPLY_URL = `${COLLECTIVE_BASE}/#apply`

function getResultsUrl(submissionId: string | undefined): string {
  if (!submissionId) return COLLECTIVE_BASE
  return `${COLLECTIVE_BASE}/tools/ai-opportunity-audit/results/${submissionId}`
}

// ─── Sequence definition ────────────────────────────────────────────────

export interface BusinessAuditStep {
  index: number
  delayDays: number
  key: string
  subject: string
  preview: string
  purpose: string
}

export const BUSINESS_AI_AUDIT_SEQUENCE: {
  key: "business-ai-audit"
  name: string
  description: string
  steps: BusinessAuditStep[]
} = {
  key: "business-ai-audit",
  name: "Business AI Audit Follow-up",
  description:
    "Post-audit follow-up for business owners who completed the AI Opportunity Audit. Two emails only — no aggressive drip. Fires after the inline report-delivery email.",
  steps: [
    {
      index: 0,
      delayDays: 5,
      key: "build-vs-buy",
      subject: "Your in-house team vs. an Operator Collective member",
      preview: "Honest framing on when to build internally and when not to.",
      purpose: "The single highest-leverage follow-up — positions the Collective as implementation partner, not a course.",
    },
    {
      index: 1,
      delayDays: 12,
      key: "closing",
      subject: "Last note from the Collective — then I'll stop emailing",
      preview: "Honest closing. Your audit is yours either way.",
      purpose: "Final conversion push without being pushy. After this, no more emails to this lead.",
    },
  ],
}

// ─── Email builder ──────────────────────────────────────────────────────

interface BuildResult {
  subject: string
  html: string
}

/**
 * Builds the HTML + subject for a given step of the business-ai-audit sequence.
 * Returns null if the index is out of range (caller should mark as cancelled).
 */
export function buildBusinessAIAuditEmail(
  emailIndex: number,
  metadata: Record<string, unknown> = {}
): BuildResult | null {
  const step = BUSINESS_AI_AUDIT_SEQUENCE.steps[emailIndex]
  if (!step) return null

  const rawName = (metadata.name as string | undefined) ?? ""
  const firstName = escapeHtml(rawName.trim().split(" ")[0] ?? "")
  const greeting = firstName ? `${firstName},` : "there,"

  const company = (metadata.company as string | undefined) ?? "your company"
  const industry = (metadata.industry as string | undefined) ?? "your industry"
  const submissionId = metadata.submissionId as string | undefined
  const resultsUrl = getResultsUrl(submissionId)

  // Reference unused imports so industry/company stay visible to future steps if added back
  void industry

  switch (step.key) {
    case "build-vs-buy":
      return {
        subject: step.subject,
        html: section({
          greeting,
          kicker: "Build vs. Buy-In",
          headline: `Should ${escapeHtml(company)} build this in-house?`,
          intro: `Quick honest framing. Not every business should outsource AI implementation. Here's how we decide who actually benefits from joining the Operator Collective vs. who should hire internally.`,
          plays: [
            {
              title: "Build in-house if you have a senior engineer who's already shipped AI workflows in production.",
              body: "If someone on your team has already deployed even one production AI workflow with proper error handling, monitoring, and human-in-the-loop controls, you have the foundation. Hire two more like them and they'll figure it out.",
            },
            {
              title: "Bring in operators if you've never shipped AI past the demo stage.",
              body: "The gap between 'this looks cool in a Loom' and 'this runs reliably for 6 months' is the entire job. The Collective is where operators who've already crossed that gap workshop your specific build with you.",
            },
            {
              title: "Don't hire a consulting firm — they hand you a deck.",
              body: "We're not a consulting firm. The Collective is a community of operators shipping AI inside real businesses. You get real working playbooks from people whose money is on the line, not a 60-page strategy doc.",
            },
          ],
          cta: { label: "Apply to the Collective", url: APPLY_URL },
          ctaNote: "Application is reviewed by a real operator within 24 hours. No pitch calls, no calendar tag.",
          footer: `One more email in this sequence — coming in about a week. After that I'll stop emailing. Your audit lives <a href="${resultsUrl}" style="color:#981B1B;font-weight:600;text-decoration:none;">here</a>.`,
        }),
      }

    case "closing":
      return {
        subject: step.subject,
        html: section({
          greeting,
          kicker: "Final Note",
          headline: "Last email from the Collective — then I'll stop emailing.",
          intro: `Two weeks ago you ran an AI opportunity audit on ${escapeHtml(company)}. I want to close the loop honestly — and stop emailing if this isn't the right time.`,
          plays: [
            {
              title: "Your audit is yours forever. No paywall, no expiry.",
              body: `Bookmark <a href="${resultsUrl}" style="color:#981B1B;font-weight:600;text-decoration:none;">your report</a> — it stays live indefinitely. Even if you never engage with the Collective, every recommendation in it is yours to run.`,
            },
            {
              title: "Who the Collective is genuinely a fit for.",
              body: "Operators with real revenue who can see the AI moves but don't have a senior in-house person who's shipped this before. We're the community for people who want to compress 18 months of trial-and-error into 90 days of structured rollout.",
            },
            {
              title: "Who it's not for.",
              body: "Anyone looking for a course they'll watch and abandon. Anyone expecting a guarantee. Anyone who wants done-for-you instead of done-with-you. We make no income claims and we don't sell shortcuts. The work is on you — we just compress the learning curve.",
            },
          ],
          cta: { label: "Apply to the alpha cohort", url: APPLY_URL },
          ctaNote: "No payment to apply. No credit card. Just a form + a real review by an operator.",
          footer: `Whether you apply or not, the audit is yours. Thanks for letting us scan ${escapeHtml(company)}.`,
        }),
      }

    default:
      return null
  }
}

// ─── HTML section helper (matched to operator-vault visual style) ───────

interface SectionArgs {
  greeting: string
  kicker: string
  headline: string
  intro: string
  plays: Array<{ title: string; body: string }>
  cta: { label: string; url: string }
  ctaNote: string
  footer: string
}

function section(args: SectionArgs): string {
  const playsHtml = args.plays
    .map(
      (play, i) => `
    <div style="background:#F9FAFB;border-left:3px solid #981B1B;border-radius:6px;padding:18px 22px;margin:0 0 14px;">
      <p style="margin:0 0 4px;font-size:11px;font-weight:700;color:#981B1B;text-transform:uppercase;letter-spacing:0.08em;">Insight 0${i + 1}</p>
      <p style="margin:0 0 6px;font-size:15px;font-weight:700;color:#111827;">${play.title}</p>
      <p style="margin:0;font-size:13px;color:#4B5563;line-height:1.65;">${play.body}</p>
    </div>`
    )
    .join("")

  return `
    <p style="margin:0 0 14px;font-size:14px;color:#4B5563;">Hey ${args.greeting}</p>

    <div style="background:#0b0d12;border:1px solid #981B1B;border-radius:10px;padding:22px 24px;margin:0 0 24px;">
      <p style="margin:0 0 6px;font-size:11px;font-weight:700;color:#981B1B;text-transform:uppercase;letter-spacing:0.12em;">${args.kicker}</p>
      <p style="margin:0;font-size:22px;font-weight:800;color:#F0EBE0;line-height:1.25;">${args.headline}</p>
    </div>

    <p style="margin:0 0 20px;font-size:15px;color:#4B5563;line-height:1.7;">${args.intro}</p>

    ${playsHtml}

    <div style="text-align:center;margin:32px 0 8px;">
      <a href="${args.cta.url}" style="display:inline-block;background:#981B1B;color:#ffffff;padding:14px 32px;border-radius:6px;text-decoration:none;font-weight:700;font-size:13px;letter-spacing:0.06em;text-transform:uppercase;">${args.cta.label}</a>
    </div>
    <p style="margin:0 0 24px;text-align:center;font-size:12px;color:#6B7280;font-style:italic;">${args.ctaNote}</p>

    <hr style="border:none;border-top:1px solid #F0F0F0;margin:28px 0;" />

    <p style="margin:0 0 6px;font-size:13px;color:#4B5563;line-height:1.65;">${args.footer}</p>
    <p style="margin:16px 0 0;font-size:13px;color:#4B5563;line-height:1.65;">— The AI Operator Collective Team</p>
    <p style="margin:2px 0 0;font-size:11px;color:#9CA3AF;">Powered by AIMS · Operated by Modern Amenities LLC</p>

    <p style="margin:24px 0 0;font-size:11px;color:#9CA3AF;line-height:1.55;font-style:italic;">
      Disclosure: The AI Operator Collective makes no income, earnings, or client outcome claims. Tool capabilities and pricing change frequently — verify before purchase. Your results depend entirely on your own execution, market, and effort.
    </p>
  `
}
