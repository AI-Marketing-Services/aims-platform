/**
 * Branded invitation emails.
 *
 * Replaces the Clerk default invitation email — which renders as plain
 * white-on-black with a generic "Accept invitation" button and zero
 * AIOC branding — with a polished email rendered through our existing
 * `emailLayout` so it inherits the same crimson theme as every other
 * platform email.
 *
 * The flow:
 * 1. `/api/admin/users/invite` calls `clerk.invitations.createInvitation`
 *    with `notify: false` (Clerk creates the invitation record but does
 *    not send the email).
 * 2. We pull `invitation.url` off the response and feed it here.
 * 3. This module renders + sends the branded email via Resend.
 */
import { sendTrackedEmail, emailLayout, btn, h1, p, divider } from "./index"
import {
  AOC_FROM_EMAIL as FROM_EMAIL,
  AOC_REPLY_TO as REPLY_TO,
} from "./senders"

interface SendOperatorInvitationParams {
  to: string
  /** Personalized greeting. Falls back to "there" when null. */
  firstName?: string | null
  /** Used in the welcome line; falls back to firstName if null. */
  fullName?: string | null
  /** Role granted on accept — surfaced in the email so the operator
   *  knows what they're being invited as. */
  role: string
  /** Clerk-issued invitation URL (one-time, signs them up + assigns the role). */
  invitationUrl: string
  /** Optional: who sent the invite. Surfaces a "Invited by Adam Wolfe" line. */
  invitedBy?: string | null
}

const ROLE_DESCRIPTIONS: Record<string, string> = {
  CLIENT: "Member access",
  RESELLER: "Operator access",
  INTERN: "Intern access",
  ADMIN: "Admin access",
  SUPER_ADMIN: "Super-admin access",
}

export async function sendOperatorInvitationEmail(
  params: SendOperatorInvitationParams,
) {
  const greeting = params.firstName?.trim() || "there"
  const accessLabel =
    ROLE_DESCRIPTIONS[params.role] ?? `${params.role} access`

  const inviterLine = params.invitedBy?.trim()
    ? `<p style="margin:0 0 16px;font-size:13px;color:#737373;line-height:1.6;">Invited by ${escapeHtml(
        params.invitedBy.trim(),
      )}</p>`
    : ""

  const body = `
    ${h1(`You're in, ${escapeHtml(greeting)}`)}
    ${inviterLine}
    ${p(
      `You've been invited to join the <strong style="color:#111827;">AI Operator Collective</strong> with <strong style="color:#981B1B;">${escapeHtml(
        accessLabel,
      )}</strong>. The Collective is an apprenticeship for operators building real AI revenue — mindset, prospecting, discovery, then the toolkit. Small room, real people, real conversations.`,
    )}
    ${p(
      `Click below to set up your account and land in your dashboard. The link is single-use and expires in 30 days.`,
    )}

    <div style="text-align:center;margin:32px 0;">
      ${btn("Accept your invitation", escapeHtml(params.invitationUrl))}
    </div>

    <p style="margin:0 0 8px;font-size:13px;color:#737373;line-height:1.6;">
      Button not working? Paste this URL into your browser:
    </p>
    <p style="margin:0 0 24px;font-size:12px;color:#981B1B;line-height:1.5;word-break:break-all;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;">
      <a href="${escapeHtml(
        params.invitationUrl,
      )}" style="color:#981B1B;text-decoration:underline;">${escapeHtml(
        params.invitationUrl,
      )}</a>
    </p>

    ${divider()}

    ${p(
      `<strong style="color:#111827;">What happens next:</strong>`,
    )}
    <ol style="margin:0 0 24px;padding-left:20px;color:#4B5563;line-height:1.9;font-size:14px;">
      <li><strong style="color:#111827;">Set up your account</strong> — create a password, fill in your profile.</li>
      <li><strong style="color:#111827;">Land in your dashboard</strong> — your role is preset, so you'll see exactly the tools you need on day one.</li>
      <li><strong style="color:#111827;">Start with onboarding</strong> — a quick walkthrough of what to do first.</li>
    </ol>

    <p style="margin:24px 0 0;font-size:13px;color:#737373;line-height:1.7;">
      Questions? Reply to this email and a human on our team will get back to you.
    </p>
  `

  return sendTrackedEmail({
    from: FROM_EMAIL,
    to: params.to,
    replyTo: REPLY_TO,
    subject: `${params.firstName ? `${params.firstName}, you're` : "You're"} invited to AI Operator Collective`,
    html: emailLayout(
      body,
      `Your invitation to the AI Operator Collective is waiting — set up your account in 30 seconds.`,
      params.to,
    ),
    serviceArm: "auth",
    templateKey: "auth.invitation",
  })
}

/**
 * Minimal HTML-entity escaper for user-controlled strings (firstName,
 * inviter name) embedded into the templated email. Defends against
 * stored XSS in the rendered HTML.
 */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}
