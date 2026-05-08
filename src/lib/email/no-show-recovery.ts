/**
 * No-show recovery email.
 *
 * Fires when Calendly fires `invitee.no_show.marked` (sales team flips the
 * "mark as no-show" toggle in Calendly after the call window passes
 * without the applicant attending). Single-shot transactional email — not
 * a sequence.
 *
 * Goal: low-pressure re-engagement. The applicant still wants the value or
 * they wouldn't have applied — give them a frictionless rebook path before
 * they emotionally write us off.
 */
import {
  sendTrackedEmail,
  emailLayout,
  h1,
  p,
  btn,
  escapeHtml,
} from "./index"
import { getCalendarUrl } from "@/lib/collective-application"
import { AOC_FROM_EMAIL as FROM_EMAIL, AOC_REPLY_TO as REPLY_TO } from "./senders"

interface SendNoShowRecoveryParams {
  to: string
  name: string
  tier?: "hot" | "warm" | "cold" | null
}

export async function sendNoShowRecoveryEmail(params: SendNoShowRecoveryParams) {
  const { to, name, tier } = params
  const safeName = escapeHtml(name || "").trim()
  const firstName = safeName.split(" ")[0] || "there"
  const calUrl = getCalendarUrl(tier ?? "cold")

  const subject = `${firstName}, we missed you — easy to rebook`
  const preview = "No pressure, just one click to grab another slot."

  const html = `
    ${h1("We missed you on the call.")}
    ${p(`Hey ${firstName} — looks like the timing didn&apos;t line up. Happens.`)}
    ${p(
      "If you&apos;re still curious about the AI Operator Collective, I&apos;d love to actually talk. The call is 20 minutes, no pitch deck, no pressure. We walk through where AI is actually working for operators in the network and figure out together if it&apos;s a fit."
    )}
    ${btn("Grab another time", calUrl)}
    ${p(
      "If the timing&apos;s just off right now, hit reply and let me know — we can usually find something that works."
    )}
    <p style="margin:32px 0 0;font-size:13px;color:#4B5563;line-height:1.6;">
      Matt<br/>
      <span style="color:#9CA3AF;font-size:12px;">AI Operator Collective</span>
    </p>
  `

  return sendTrackedEmail({
    from: FROM_EMAIL,
    to,
    replyTo: REPLY_TO,
    subject,
    html: emailLayout(html, preview),
    serviceArm: "ai-operator-collective",
    templateKey: "aoc.no-show-recovery",
  })
}
