/**
 * AI Operator Collective — Drip Sequence
 *
 * This file is the single source of truth for the post-signup email drip that
 * follows Chapter 1 of the AI Operator Playbook Vault. It's structured so the
 * admin visualization page and the process-email-queue cron both read from the
 * same definition — if you edit the schedule or the copy here, everything else
 * updates automatically.
 *
 * Sequence flow (from the moment someone submits the lead form):
 *   T+0m    → sendOperatorVaultEmail() fires immediately (Chapter 1 + community invite)
 *   T+1d    → Chapter 2: the cold email sequence
 *   T+3d    → Chapter 3: the discovery script
 *   T+6d    → Chapter 4: pricing in ranges + pre-filled MSA
 *   T+10d   → Chapter 5: the delivery playbook
 *   T+14d   → Final: alpha cohort review window closing
 *
 * The copy below is scaffold copy. Every subject line and body has a
 * // TODO(copy): marker so they're easy to find and refine later. The
 * community invite link is resolved from env at send time via getCommunityInviteUrl().
 */

import { escapeHtml } from "./index"

// ─── Community invite URL resolver ──────────────────────────────────────────

/**
 * Resolves the community invite URL at send time. Priority:
 *   1. COMMUNITY_INVITE_URL env var (set this to the real Skool/Circle/portal invite)
 *   2. Fallback to the landing page application anchor so nothing ever breaks
 */
export function getCommunityInviteUrl(): string {
  return (
    process.env.COMMUNITY_INVITE_URL ??
    process.env.NEXT_PUBLIC_COMMUNITY_INVITE_URL ??
    "https://aioperatorcollective.com/#apply"
  )
}

// ─── Sequence definition ────────────────────────────────────────────────────

export interface OperatorVaultStep {
  index: number
  delayDays: number
  key: string
  subject: string
  preview: string
  purpose: string
}

export const OPERATOR_VAULT_SEQUENCE: {
  key: "operator-vault"
  name: string
  description: string
  steps: OperatorVaultStep[]
} = {
  key: "operator-vault",
  name: "AI Operator Vault Drip",
  description:
    "Chapters 2–5 of the Playbook Vault plus a final cohort-closing email. Fires after the Chapter 1 email is sent inline on form submit.",
  steps: [
    {
      index: 0,
      delayDays: 1,
      key: "chapter-2-cold-email",
      subject: "Chapter 2: The cold email sequence AIMS actually uses",
      preview: "Multi-domain warmup, ICP targeting, and the 4-email sequence structure.",
      purpose: "Reinforce vault value, keep the opens going, remind about community invite.",
    },
    {
      index: 1,
      delayDays: 3,
      key: "chapter-3-discovery",
      subject: "Chapter 3: The discovery script that books follow-up calls",
      preview: "Diagnose before you pitch — the 7 questions every AIMS call opens with.",
      purpose: "Build trust via education, soft-nudge the application.",
    },
    {
      index: 2,
      delayDays: 6,
      key: "chapter-4-pricing-msa",
      subject: "Chapter 4: Pricing in ranges + the MSA we pre-filled for you",
      preview: "The pricing calculator structure and a real MSA template you can steal.",
      purpose: "Deliver tangible assets, position the paid program as the logical next step.",
    },
    {
      index: 3,
      delayDays: 10,
      key: "chapter-5-delivery",
      subject: "Chapter 5: The delivery playbook that turns month 1 into year 1",
      preview: "How AIMS operators turn single engagements into recurring retainers.",
      purpose: "Last educational email, strong apply CTA.",
    },
    {
      index: 4,
      delayDays: 14,
      key: "cohort-closing",
      subject: "Last call — alpha cohort review window is closing",
      preview: "Your application is still open. Here's what decides it.",
      purpose: "Final conversion push. Creates urgency around the application review window.",
    },
  ],
}

// ─── Email template builder ─────────────────────────────────────────────────

interface BuildResult {
  subject: string
  html: string
}

/**
 * Builds the HTML + subject for a given step of the operator-vault sequence.
 * Returns null if the index is out of range (caller should mark as cancelled).
 */
export function buildOperatorVaultEmail(
  emailIndex: number,
  metadata: Record<string, unknown> = {}
): BuildResult | null {
  const step = OPERATOR_VAULT_SEQUENCE.steps[emailIndex]
  if (!step) return null

  const rawName = (metadata.name as string | undefined) ?? ""
  const firstName = escapeHtml(rawName.trim().split(" ")[0] ?? "")
  const greeting = firstName ? `${firstName},` : "Operator,"

  const inviteUrl = getCommunityInviteUrl()
  const applyUrl = "https://aioperatorcollective.com/#apply"

  switch (step.key) {
    case "chapter-2-cold-email":
      return {
        subject: step.subject,
        // TODO(copy): refine Chapter 2 copy once final vault content is written.
        html: section({
          greeting,
          kicker: "Chapter 02 · Cold Email",
          headline: "The cold email sequence AIMS uses internally.",
          intro:
            "Most cold email fails because people optimize the wrong layer. Deliverability beats copy. Copy beats volume. Volume beats nothing. Here's how we stack it.",
          plays: [
            {
              title: "Multi-domain warmup is non-negotiable.",
              body: "Spin up 2–3 sending domains, warm them for 14 days before you touch a single prospect. Every operator who skips this step burns their primary domain inside a month.",
            },
            {
              title: "ICP targeting > volume.",
              body: "500 hand-picked accounts outperform 5,000 scraped ones. Period. Spend an afternoon building a list you'd be proud to show a friend and send to that list only.",
            },
            {
              title: "4-email sequence, not 8.",
              body: "Open with a specific observation. Follow up with a soft reframe. Third email is a case study. Fourth email is a breakup. Anything past that is a volume strategy, not a sales strategy.",
            },
          ],
          cta: { label: "Join the community", url: inviteUrl },
          ctaNote: "Your invite is open — jump in whenever you're ready.",
          footer: `Chapter 3 drops in 2 days. It's the discovery script the AIMS team uses on every first call. <a href="${applyUrl}" style="color:#C4972A;font-weight:600;text-decoration:none;">Application open here</a> if you're ready to move.`,
        }),
      }

    case "chapter-3-discovery":
      return {
        subject: step.subject,
        // TODO(copy): refine Chapter 3 copy with the real AIMS discovery script.
        html: section({
          greeting,
          kicker: "Chapter 03 · Discovery",
          headline: "Diagnose before you pitch.",
          intro:
            "The discovery call is the single most leveraged hour in your business. If you treat it like a demo, you lose. If you treat it like a diagnosis, the prospect closes themselves.",
          plays: [
            {
              title: "Open with a specific observation, not small talk.",
              body: "\"I noticed your team has been posting case studies every Tuesday — that's rare\" beats \"How's your week?\" every single time. It tells them you actually looked.",
            },
            {
              title: "Ask about the workflow, not the outcome.",
              body: "Outcomes are easy to lie about. Workflows aren't. \"Walk me through the last time you closed a deal — what happened the day before?\" gets you the real bottleneck in 60 seconds.",
            },
            {
              title: "Never quote on the first call unless they push.",
              body: "The sentence that closes deals: \"Engagements in this space typically range from $X to $Y depending on scope — let's scope yours properly before I quote.\" Advisor posture, not vendor posture.",
            },
          ],
          cta: { label: "Join the community", url: inviteUrl },
          ctaNote: "Come share your first discovery call recording — the group will tear it apart for you (in the good way).",
          footer: `Chapter 4 drops in 3 days. <a href="${applyUrl}" style="color:#C4972A;font-weight:600;text-decoration:none;">Application open here</a>.`,
        }),
      }

    case "chapter-4-pricing-msa":
      return {
        subject: step.subject,
        // TODO(copy): refine Chapter 4 with actual pricing calculator screenshots + real MSA excerpt.
        html: section({
          greeting,
          kicker: "Chapter 04 · Pricing & Paper",
          headline: "Stop underpricing. Steal our MSA.",
          intro:
            "Chronic underpricing is the #1 killer of service businesses. It's not a confidence problem — it's a tooling problem. Two tools, fixed forever.",
          plays: [
            {
              title: "Price in ranges, always.",
              body: "The pricing calculator inside the cohort takes scope + hours + client size and spits out a range with a 40% margin baked in. Your quote is always the middle of that range. Never a round number, never a single number.",
            },
            {
              title: "Every prospect sees the ROI math before they see the quote.",
              body: "Labor hours saved × blended cost × payback months, minus your fee. You compute it with them, live, on the call. They're not reacting to your price — they're reacting to the number they just calculated.",
            },
            {
              title: "Pre-filled MSA, SOW, and AI Readiness Assessment.",
              body: "Real documents from real AIMS engagements. Cohort members don't draft contracts from scratch — they fill in the blanks. Legal review is a one-time cost, not a per-client cost.",
            },
          ],
          cta: { label: "Join the community", url: inviteUrl },
          ctaNote: "The cohort vault includes the live pricing calculator and the editable MSA. Grab them both on your first login.",
          footer: `One more chapter after this. <a href="${applyUrl}" style="color:#C4972A;font-weight:600;text-decoration:none;">Apply to the alpha cohort</a> — the review window is still open.`,
        }),
      }

    case "chapter-5-delivery":
      return {
        subject: step.subject,
        // TODO(copy): refine Chapter 5 with retention / recurring revenue frameworks.
        html: section({
          greeting,
          kicker: "Chapter 05 · Delivery",
          headline: "Turn month 1 into year 1.",
          intro:
            "Landing the client is the easy half. The hard half is the 30-day window where most service businesses lose the engagement. Here's how AIMS operators compound a single SOW into a 12-month retainer.",
          plays: [
            {
              title: "Scope less than you want to.",
              body: "Underscope the first engagement on purpose. Ship in 14 days. The day you deliver is the day the conversation about expansion starts — and you have momentum on your side.",
            },
            {
              title: "Case study production is part of the engagement.",
              body: "Baseline metrics captured on day 1. Before/after snapshot baked into the contract. Every engagement ends with a written case study — which is how AIMS operators sell the next client for free.",
            },
            {
              title: "Expansion happens in the weekly standup, not in a sales call.",
              body: "Every week you meet with the client you surface one adjacent problem you noticed. You don't sell it — you mention it. By week 8, they're the ones asking how to expand scope.",
            },
          ],
          cta: { label: "Join the community", url: inviteUrl },
          ctaNote: "The hot seat format inside the community is where members workshop their month-1 client plans before they ship them.",
          footer: `This is the last Chapter in the free sequence. If you want the live version — the calculators, the contracts, the co-close support — <a href="${applyUrl}" style="color:#C4972A;font-weight:600;text-decoration:none;">apply to the alpha cohort</a>.`,
        }),
      }

    case "cohort-closing":
      return {
        subject: step.subject,
        // TODO(copy): refine cohort-closing with real deadline + seat count when available.
        html: section({
          greeting,
          kicker: "Final Notice",
          headline: "The alpha cohort review window is closing.",
          intro:
            "Two weeks ago you pulled the Playbook Vault. If you've been thinking about the full cohort, this is the honest last nudge before we stop reaching out.",
          plays: [
            {
              title: "Who this is a no-brainer for.",
              body: "Corporate operators with 10+ years of domain expertise, displaced or semi-displaced W-2 professionals, and anyone who's tried to DIY an AI services business and hit a wall on pricing, pipeline, or positioning.",
            },
            {
              title: "Who this isn't for.",
              body: "Passive income seekers, people looking for a course they'll abandon, and anyone expecting a guarantee. We don't make income claims and we don't offer guarantees. The work is on you.",
            },
            {
              title: "What happens after you apply.",
              body: "A real operator (not a VA) reviews your application within 24 hours. If there's alignment, we book a 30-minute call — no pitch, working session only. If there's not, we say so cleanly and you keep every chapter of the Vault anyway.",
            },
          ],
          cta: { label: "Apply to the alpha cohort", url: applyUrl },
          ctaNote: "No payment today. No credit card. Just a form + a real review.",
          footer: `Whether you apply or not, the Vault is yours to keep. If you want the community invite link again, it's <a href="${inviteUrl}" style="color:#C4972A;font-weight:600;text-decoration:none;">right here</a>.`,
        }),
      }

    default:
      return null
  }
}

// ─── HTML section helper ────────────────────────────────────────────────────

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
    <div style="background:#F9FAFB;border-left:3px solid #C4972A;border-radius:6px;padding:18px 22px;margin:0 0 14px;">
      <p style="margin:0 0 4px;font-size:11px;font-weight:700;color:#C4972A;text-transform:uppercase;letter-spacing:0.08em;">Play 0${i + 1}</p>
      <p style="margin:0 0 6px;font-size:15px;font-weight:700;color:#111827;">${play.title}</p>
      <p style="margin:0;font-size:13px;color:#4B5563;line-height:1.65;">${play.body}</p>
    </div>`
    )
    .join("")

  return `
    <p style="margin:0 0 14px;font-size:14px;color:#4B5563;">Hey ${args.greeting}</p>

    <div style="background:#0b0d12;border:1px solid #C4972A;border-radius:10px;padding:22px 24px;margin:0 0 24px;">
      <p style="margin:0 0 6px;font-size:11px;font-weight:700;color:#C4972A;text-transform:uppercase;letter-spacing:0.12em;">${args.kicker}</p>
      <p style="margin:0;font-size:22px;font-weight:800;color:#F0EBE0;line-height:1.25;">${args.headline}</p>
    </div>

    <p style="margin:0 0 20px;font-size:15px;color:#4B5563;line-height:1.7;">${args.intro}</p>

    ${playsHtml}

    <div style="text-align:center;margin:32px 0 8px;">
      <a href="${args.cta.url}" style="display:inline-block;background:#C4972A;color:#ffffff;padding:14px 32px;border-radius:6px;text-decoration:none;font-weight:700;font-size:13px;letter-spacing:0.06em;text-transform:uppercase;">${args.cta.label}</a>
    </div>
    <p style="margin:0 0 24px;text-align:center;font-size:12px;color:#6B7280;font-style:italic;">${args.ctaNote}</p>

    <hr style="border:none;border-top:1px solid #F0F0F0;margin:28px 0;" />

    <p style="margin:0 0 6px;font-size:13px;color:#4B5563;line-height:1.65;">${args.footer}</p>
    <p style="margin:16px 0 0;font-size:13px;color:#4B5563;line-height:1.65;">— The AI Operator Collective Team</p>
    <p style="margin:2px 0 0;font-size:11px;color:#9CA3AF;">Powered by AIMS · Operated by Modern Amenities LLC</p>

    <p style="margin:24px 0 0;font-size:11px;color:#9CA3AF;line-height:1.55;font-style:italic;">
      Disclosure: The AI Operator Collective makes no income, earnings, or client outcome claims. Your results depend entirely on your own execution, market, and effort.
    </p>
  `
}
