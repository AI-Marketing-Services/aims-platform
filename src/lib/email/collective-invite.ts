import {
  sendTrackedEmail,
  escapeHtml,
  emailLayout,
  h1,
  p,
  btn,
} from "./index"
import { AOC_FROM_EMAIL as FROM_EMAIL, AOC_REPLY_TO as REPLY_TO } from "./senders"
import { mightyLoginUrl, MIGHTY_NETWORK_URL } from "@/lib/mighty"

/**
 * Sent the moment an admin provisions a Collective member.
 *
 * Unlike Mighty's default invite email, this one is fully branded from
 * noreply@aioperatorcollective.com (our verified Resend domain), skips
 * the "Pending Approval" screen entirely (member is pre-provisioned), and
 * lands the applicant straight inside the community after a single
 * magic-link click.
 */
export async function sendCollectiveInviteEmail(params: {
  to: string
  firstName?: string | null
  tier?: "community" | "accelerator" | "innerCircle"
  customMessage?: string | null
}): Promise<{ ok: boolean; error?: string }> {
  const firstNameRaw = params.firstName?.trim() || ""
  const firstName = escapeHtml(firstNameRaw).split(" ")[0] || "there"
  const tierLabel =
    params.tier === "accelerator"
      ? "the Accelerator tier"
      : params.tier === "innerCircle"
      ? "the Inner Circle"
      : "the AI Operator Collective"

  const loginUrl = mightyLoginUrl(params.to)
  const feedUrl = `${MIGHTY_NETWORK_URL}/feed`

  const customBlock = params.customMessage?.trim()
    ? `
      <div style="border-left:3px solid #981B1B;padding:14px 18px;margin:0 0 16px;background:#F9FAFB;border-radius:0 6px 6px 0;">
        <p style="margin:0;font-size:14px;color:#374151;line-height:1.7;white-space:pre-wrap;">${escapeHtml(params.customMessage.trim())}</p>
      </div>
    `
    : ""

  const body = `
    ${h1(`${firstName}, you're in.`)}
    ${p(`Welcome to ${tierLabel}. Your account is already live — no approval to wait on, no application to fill out. One click and you're inside.`)}

    ${customBlock}

    ${p("<strong style='color:#111827;'>How to log in:</strong>")}
    ${p("Tap the button below. Mighty will email you a one-click login link for this address (" + escapeHtml(params.to) + "). The link expires after you use it, so save this email if you want to re-open the community later without re-requesting the link.")}

    ${btn("Open the Collective", loginUrl)}

    ${p("<strong style='color:#111827;'>What to do in your first 15 minutes:</strong>")}
    <ol style="margin:0 0 20px;padding-left:20px;color:#4B5563;line-height:2;font-size:14px;">
      <li><strong style="color:#111827;">Set your profile.</strong> First name, last name, photo, one-line bio on what you build or operate.</li>
      <li><strong style="color:#111827;">Head to the Welcome space.</strong> Post a quick intro — what you're working on, what brought you in, what you want to get out of the Collective.</li>
      <li><strong style="color:#111827;">Skim the Curriculum + Playbooks space.</strong> Start with the foundation modules. They're short. Watch one, apply it, come back for the next.</li>
      <li><strong style="color:#111827;">Check Calls + Events.</strong> RSVP for the next live session. They're where the real operator-to-operator conversations happen.</li>
    </ol>

    ${p(`Prefer to browse without signing in first? <a href="${feedUrl}" style="color:#981B1B;font-weight:600;">Jump straight to the activity feed →</a>`)}

    <p style="margin:32px 0 0;font-size:13px;color:#4B5563;line-height:1.6;">
      Adam<br/>
      <span style="color:#9CA3AF;font-size:12px;">AI Operator Collective</span>
    </p>
    <p style="margin:24px 0 0;font-size:11px;color:#9CA3AF;line-height:1.55;font-style:italic;">
      Having trouble getting in? Reply to this email — a real person reads every reply and we'll get you sorted in under an hour.
    </p>
  `

  try {
    const res = await sendTrackedEmail({
      from: FROM_EMAIL,
      to: params.to,
      replyTo: REPLY_TO,
      subject: `${firstName}, you're inside the AI Operator Collective`,
      html: emailLayout(
        body,
        "You're in. Here's your login link + what to do in your first 15 minutes."
      ),
      serviceArm: "ai-operator-collective",
    })
    return { ok: !!res }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown send error"
    return { ok: false, error: message }
  }
}
