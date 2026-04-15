/**
 * W-2 Playbook — Follow-up Sequence
 *
 * Intentionally short. We do not run aggressive drip campaigns — the goal is to
 * deliver real value with the minimum number of emails so we don't end up in
 * spam folders or burning trust with prospects.
 *
 * Sequence flow (from the moment the email gate is submitted):
 *   T+0     → sendW2PlaybookEmail() fires inline (welcome + playbook link)
 *   T+5d    → Why most W-2 operators stall at $2k/mo (the highest-value follow-up)
 *   T+12d   → Honest closing — "keep the playbook, last note"
 *
 * That's it. Three total emails per lead, including the inline delivery. No more.
 *
 * The cron at process-email-queue/route.ts dispatches T+5d and T+12d via
 * buildW2PlaybookEmail(emailIndex, metadata).
 */

import { escapeHtml } from "./index"

const COLLECTIVE_BASE = "https://aioperatorcollective.com"
const APPLY_URL = `${COLLECTIVE_BASE}/#apply`
const PLAYBOOK_URL = `${COLLECTIVE_BASE}/tools/ai-playbook`

// ─── Sequence definition ────────────────────────────────────────────────

export interface W2PlaybookStep {
  index: number
  delayDays: number
  key: string
  subject: string
  preview: string
  purpose: string
}

export const W2_PLAYBOOK_SEQUENCE: {
  key: "w2-playbook"
  name: string
  description: string
  steps: W2PlaybookStep[]
} = {
  key: "w2-playbook",
  name: "W-2 Playbook Follow-up",
  description:
    "Post-download follow-up for W-2 professionals who grabbed the AI Operator Playbook. Two emails only — no aggressive drip. Fires after the inline welcome email.",
  steps: [
    {
      index: 0,
      delayDays: 5,
      key: "stall",
      subject: "Why most W-2 operators stall at $2k/mo (and how to break through)",
      preview: "It's not the offer. It's the underlying business model.",
      purpose: "The single highest-value follow-up — names the real wall and shows the unlock.",
    },
    {
      index: 1,
      delayDays: 12,
      key: "closing",
      subject: "Last play, then I'll stop emailing you",
      preview: "Honest closing. Keep the playbook either way.",
      purpose: "Final conversion push without being pushy. After this, no more emails to this lead.",
    },
  ],
}

// ─── Email builder ──────────────────────────────────────────────────────

interface BuildResult {
  subject: string
  html: string
}

export function buildW2PlaybookEmail(
  emailIndex: number,
  metadata: Record<string, unknown> = {}
): BuildResult | null {
  const step = W2_PLAYBOOK_SEQUENCE.steps[emailIndex]
  if (!step) return null

  const rawName = (metadata.name as string | undefined) ?? ""
  const firstName = escapeHtml(rawName.trim().split(" ")[0] ?? "")
  const greeting = firstName ? `${firstName},` : "operator,"

  switch (step.key) {
    case "stall":
      return {
        subject: step.subject,
        html: section({
          greeting,
          kicker: "The $2k Wall",
          headline: "The trap most W-2 operators hit at month 3.",
          intro:
            "There's a very predictable point in the journey from W-2 to AI operator where almost everyone stalls. It's not the first sale. It's not the second sale. It's the moment you realize your offer is structurally limited to about $2,000–$3,000 per month per client — and you're maxed out on hours.",
          plays: [
            {
              title: "Symptom: 'I'm landing clients but I can't quit my job.'",
              body: "If your offer is built around your hours, it caps at the number of hours you have outside your W-2. Most operators hit this around month 3. They look at the math and decide AI services isn't viable. The math is right — for the offer they built. The offer is wrong.",
            },
            {
              title: "Root cause: you priced for time, not outcome.",
              body: "Time-based pricing is the default trap because it's how W-2 work taught you to think. Outcome pricing is a different brain entirely. The Collective spends an entire week of the curriculum specifically on the unlearning process — it's the single most valuable thing we teach because it's where we lose the most people in the first 90 days if we don't catch it early.",
            },
            {
              title: "Fix: productize the audit, then the implementation.",
              body: "The operators who break through stop selling 'their time' and start selling a fixed-scope deliverable that uses AI to compress what used to be a 60-hour engagement into a 6-hour build. The price stays the same. The hours collapse. The margin opens. That's the whole game.",
            },
          ],
          cta: { label: "Apply to the alpha cohort", url: APPLY_URL },
          ctaNote: "This is the curriculum's main unlock. We've watched operators 5x their margin in 30 days once they get it.",
          footer: `One more email in this sequence — coming in about a week. After that I'll stop emailing. The full playbook lives <a href="${PLAYBOOK_URL}" style="color:#981B1B;font-weight:600;text-decoration:none;">here</a>.`,
        }),
      }

    case "closing":
      return {
        subject: step.subject,
        html: section({
          greeting,
          kicker: "Final Note",
          headline: "Last email — then I'll stop emailing.",
          intro:
            "Two weeks ago you grabbed the AI Operator Playbook. I want to close the loop honestly — and stop emailing if this isn't the right time. Here's what I'd tell you if we were talking on a porch.",
          plays: [
            {
              title: "The playbook is yours forever. No paywall, no expiry.",
              body: `Bookmark <a href="${PLAYBOOK_URL}" style="color:#981B1B;font-weight:600;text-decoration:none;">the playbook</a> — it stays live indefinitely. Even if you never engage with the Collective, every play in it is yours to run.`,
            },
            {
              title: "Who the Collective is genuinely a fit for.",
              body: "Corporate operators with real experience and real domain expertise who want to compress 18 months of trial-and-error into 90 days of structured rollout. Not a course you watch. Not a community you lurk in. A working community where members workshop each other's offers, audits, and first clients in real time.",
            },
            {
              title: "Who it's not for.",
              body: "Anyone looking for passive income. Anyone expecting a guarantee. Anyone who wants to figure it out solo before joining (you'll figure it out faster inside, that's the entire point). We don't make income claims and we don't sell shortcuts.",
            },
          ],
          cta: { label: "Apply to the alpha cohort", url: APPLY_URL },
          ctaNote: "No payment to apply. No credit card. Just a form + a real review by an operator within 24 hours.",
          footer: `Whether you apply or not — thanks for grabbing the playbook. I hope it actually helps you make the move.`,
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
      <p style="margin:0 0 4px;font-size:11px;font-weight:700;color:#981B1B;text-transform:uppercase;letter-spacing:0.08em;">Play 0${i + 1}</p>
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
      Disclosure: The AI Operator Collective makes no income, earnings, or client outcome claims. Your results depend entirely on your own execution, market, and effort.
    </p>
  `
}
