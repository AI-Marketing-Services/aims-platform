/**
 * One-off script to send a preview of the collective-invite email.
 * Run: RESEND_API_KEY=re_xxx npx tsx scripts/send-test-invite-email.ts
 */
import { Resend } from "resend"
import { emailLayout, escapeHtml, h1, p, btn, divider } from "../src/lib/email/index"
import { AOC_FROM_EMAIL as FROM_EMAIL } from "../src/lib/email/senders"

const TO = "adamwolfe102@gmail.com"
const FIRST_NAME = "Adam"
const TIER: "community" | "accelerator" | "innerCircle" = "community"
const MIGHTY_NETWORK_URL = "https://aioperatorcollective.mn.co"

function mightyLoginUrl(email: string) {
  return `${MIGHTY_NETWORK_URL}/log-in?email=${encodeURIComponent(email)}`
}

function buildEmail() {
  const firstName = escapeHtml(FIRST_NAME)
  const tierLabel = TIER === "accelerator"
    ? "the Accelerator"
    : TIER === "innerCircle"
    ? "the Inner Circle"
    : "the AI Operator Collective"

  const loginUrl = mightyLoginUrl(TO)
  const communityUrl = MIGHTY_NETWORK_URL
  const curriculumUrl = `${communityUrl}/spaces/23411754`
  const welcomeSpaceUrl = `${communityUrl}/spaces/23459013`
  const callsUrl = `${communityUrl}/spaces/23411755`
  const chatUrl = `${communityUrl}/spaces/23411753`

  const roadmapWeek = (
    label: string,
    title: string,
    items: Array<{ action: string; detail: string; url?: string }>
  ) => {
    const rows = items
      .map(
        (item) => `
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid #F0F0F0;vertical-align:top;">
            <p style="margin:0 0 2px;font-size:14px;font-weight:700;color:#111827;">
              ${item.url ? `<a href="${item.url}" style="color:#111827;text-decoration:none;">${item.action}</a>` : item.action}
            </p>
            <p style="margin:0;font-size:13px;color:#6B7280;line-height:1.5;">${item.detail}</p>
          </td>
        </tr>`
      )
      .join("")

    return `
      <div style="margin:0 0 24px;">
        <div style="background:#981B1B;border-radius:6px 6px 0 0;padding:10px 16px;">
          <p style="margin:0;font-size:10px;font-weight:700;color:rgba(255,255,255,0.7);text-transform:uppercase;letter-spacing:0.1em;">${label}</p>
          <p style="margin:2px 0 0;font-size:15px;font-weight:700;color:#ffffff;">${title}</p>
        </div>
        <div style="border:1px solid #E5E7EB;border-top:none;border-radius:0 0 6px 6px;padding:4px 16px 4px;">
          <table width="100%" cellpadding="0" cellspacing="0">${rows}</table>
        </div>
      </div>`
  }

  const body = `
    ${h1(`${firstName}, you're in.`)}
    ${p(`Welcome to ${tierLabel}. Your account is live and waiting — tap the button below and Mighty will send a one-click login link to <strong style="color:#111827;">${escapeHtml(TO)}</strong>. No password, no approval queue.`)}

    <div style="text-align:center;margin:0 0 32px;">
      ${btn("Open the Collective", loginUrl)}
      <p style="margin:8px 0 0;font-size:12px;color:#9CA3AF;font-style:italic;">The login link Mighty sends expires after one use — save this email if you want to request a fresh one later.</p>
    </div>

    ${divider()}

    <p style="margin:0 0 20px;font-size:17px;font-weight:700;color:#111827;">Your 30-day roadmap</p>
    ${p("Here's the path that gives new operators the fastest start. Nothing is mandatory — but members who follow this sequence consistently show up more confident, more connected, and more ready to take action.")}

    ${roadmapWeek("Days 1 – 7", "Get oriented", [
      {
        action: "Complete your profile",
        detail: "Add your photo, one-line bio, and what you build or operate. A complete profile gets you 3× more responses when you post.",
        url: `${communityUrl}/profile`,
      },
      {
        action: "Post your intro in the Welcome space",
        detail: "Tell the community who you are, what you're working on, and what you want to get out of this. Tag someone you want to meet.",
        url: welcomeSpaceUrl,
      },
      {
        action: "Explore the activity feed",
        detail: "Scroll the last 7 days of posts. Comment on at least two threads that resonate — this is how relationships start here.",
        url: `${communityUrl}/feed`,
      },
      {
        action: "Jump into the Chat space",
        detail: "Introduce yourself in the #general channel and watch the real-time conversations already happening.",
        url: chatUrl,
      },
    ])}

    ${roadmapWeek("Days 8 – 14", "Explore the AI Operator Playbook", [
      {
        action: "Start Module 1: AI Operator Foundations",
        detail: "This is the backbone. Five short lessons that define what an AI Operator actually does and how to position yourself.",
        url: curriculumUrl,
      },
      {
        action: "Work through the Beginner Track",
        detail: "\"AI for Your Business\" + \"Finding and Landing Clients\" + \"Marketing Yourself\" — plain-English, tool-forward, actionable this week.",
        url: curriculumUrl,
      },
      {
        action: "Explore the Case Study Library",
        detail: "Four real operator projects with full problem / solution / results / pricing breakdowns. Read at least one end-to-end.",
        url: curriculumUrl,
      },
      {
        action: "Ask your first question in the community",
        detail: "Post something you're stuck on or curious about. The best thing about this room is that people actually answer.",
        url: `${communityUrl}/feed`,
      },
    ])}

    ${roadmapWeek("Days 15 – 30", "Go deeper & engage", [
      {
        action: "RSVP and attend a live call",
        detail: "Check Calls + Events for the next open session. These are where the real operator-to-operator conversations happen — show up, ask a question.",
        url: callsUrl,
      },
      {
        action: "Continue into the Intermediate Track",
        detail: "Automation Playbooks, AI-Powered Sales & Marketing, Pricing & GTM — work through whichever module matches your current bottleneck.",
        url: curriculumUrl,
      },
      {
        action: "Share a win, an insight, or a question",
        detail: "Post something you learned or shipped in the last two weeks. Teaching accelerates your own learning faster than anything else.",
        url: `${communityUrl}/feed`,
      },
      {
        action: "Reply to this email with what you want to build",
        detail: "A real person reads every reply. If you tell us what you're working on, we'll point you to the exact resources that match.",
      },
    ])}

    ${divider()}

    <p style="margin:0 0 6px;font-size:14px;color:#4B5563;line-height:1.7;">
      The community is only as good as the operators in it. Glad you're here.
    </p>
    <p style="margin:16px 0 0;font-size:14px;color:#4B5563;line-height:1.6;">
      Adam<br/>
      <span style="color:#9CA3AF;font-size:12px;">AI Operator Collective</span>
    </p>
    <p style="margin:20px 0 0;font-size:11px;color:#9CA3AF;line-height:1.55;">
      Having trouble getting in? Reply to this email — a real person reads every reply and we'll sort you out within the hour.
    </p>
  `

  return {
    subject: `${firstName}, welcome to the AI Operator Collective — your 30-day roadmap`,
    html: emailLayout(body, "You're in. Here's your login link and 30-day roadmap for getting the most out of the Collective."),
  }
}

async function main() {
  const key = process.env.RESEND_API_KEY
  if (!key || key === "re_placeholder") {
    console.error("RESEND_API_KEY not set. Run: RESEND_API_KEY=re_xxx npx tsx scripts/send-test-invite-email.ts")
    process.exit(1)
  }

  const resend = new Resend(key)
  const { subject, html } = buildEmail()

  console.log(`Sending to ${TO}...`)
  const result = await resend.emails.send({
    from: FROM_EMAIL,
    to: TO,
    subject,
    html,
  })

  if (result.error) {
    console.error("Send failed:", result.error)
    process.exit(1)
  }

  console.log("Sent! ID:", result.data?.id)
}

main()
