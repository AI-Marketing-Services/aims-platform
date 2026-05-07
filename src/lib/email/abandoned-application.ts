import { sendTrackedEmail, escapeHtml, emailLayout, h1, p, btn } from "./index"
import { AOC_FROM_EMAIL as FROM_EMAIL, AOC_REPLY_TO as REPLY_TO, RYAN_SALES_BCC } from "./senders"

export async function sendAbandonedApplicationEmail(params: {
  to: string
  name: string
}) {
  const safeName = escapeHtml(params.name || "").trim()
  const firstName = safeName.split(" ")[0] || "there"
  const applyUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "https://aioperatorcollective.com"}/apply`

  const body = `
    ${h1(`${firstName}, your AI Operator Collective application is still open.`)}
    ${p(
      `Hi ${firstName}, Jess here from the AI Operator Collective. You started your application, but it looks like you did not get a chance to finish it.`
    )}
    ${p(
      "Totally understandable. These things usually happen between meetings, errands, tabs, and the small daily chaos of being a person with a laptop."
    )}
    ${p(
      "I just wanted to make sure you had an easy way back in."
    )}
    ${p(
      "The Collective is application-only because the room is small. Each cohort is limited to 10 people, and we are looking for people who are serious about building useful AI skills around real business problems, not just collecting more tools."
    )}
    ${p("The application helps us understand a few things:")}
    <ul style="margin:0 0 24px;padding-left:20px;color:#4B5563;line-height:1.9;font-size:15px;">
      <li>What kind of work you have done.</li>
      <li>What you want this AI skill set to help you build toward.</li>
      <li>How much time you can realistically commit.</li>
      <li>Whether you are ready to practice business conversations, discovery, and outreach.</li>
    </ul>
    ${p("You do not need a perfect plan to finish it.")}
    ${p("You just need enough honest context for us to understand where you are starting.")}
    ${btn("Finish my application", applyUrl)}
    ${p(
      "If now is not the right moment, no hard feelings. The worst move is forcing urgency where there is none."
    )}
    ${p(
      "But if you are paying attention to AI because you want more agency in what comes next, finishing the application is the cleanest next step."
    )}
    <p style="margin:32px 0 0;font-size:13px;color:#4B5563;line-height:1.6;">
      Jess<br/>
      <span style="color:#9CA3AF;font-size:12px;">AI Operator Collective</span>
    </p>
    <p style="margin:24px 0 0;font-size:11px;color:#9CA3AF;line-height:1.55;font-style:italic;">
      Sent because you started an application at aioperatorcollective.com. You'll only receive this reminder once.
    </p>
  `

  return sendTrackedEmail({
    from: FROM_EMAIL,
    to: params.to,
    bcc: RYAN_SALES_BCC,
    replyTo: REPLY_TO,
    subject: `${firstName}, your AI Operator Collective application is still open`,
    html: emailLayout(body, "No pressure. Just finish the application if this still feels like the right next step."),
    serviceArm: "ai-operator-collective",
    templateKey: "aoc.application-abandoned",
  })
}

/* -------------------------------------------------------------------------- */
/*  Application received — sent immediately when someone completes the form   */
/*  (before or without booking a call). BCC'd to sales so Ryan tracks the     */
/*  journey from form submit → booking.                                        */
/* -------------------------------------------------------------------------- */

export async function sendApplicationReceivedEmail(params: {
  to: string
  name: string
  calLink: string
}) {
  const safeName = escapeHtml(params.name || "").trim()
  const firstName = safeName.split(" ")[0] || "there"

  const body = `
    ${h1(`Got it, ${firstName}. Application received.`)}
    ${p(
      `Hey ${firstName}, Matt here. Your application just came through and I'll personally review it within 24 hours. In the meantime, the fastest way to move forward is to grab a time on the calendar below so we can talk.`
    )}
    ${p(
      "The call is 45 minutes. We'll talk through your goals, where AI actually creates leverage for someone in your position, and whether the Collective is the right fit. No sales pressure — if it's not the right move for you right now, I'll tell you."
    )}
    ${btn("Book your strategy call now", params.calLink)}
    ${p(
      `If you already grabbed a time, you're all set — look for a confirmation email from Calendly and I'll see you on the call.`
    )}
    <p style="margin:32px 0 0;font-size:13px;color:#4B5563;line-height:1.6;">
      Matt<br/>
      <span style="color:#9CA3AF;font-size:12px;">AI Operator Collective</span>
    </p>
  `

  return sendTrackedEmail({
    from: FROM_EMAIL,
    to: params.to,
    bcc: RYAN_SALES_BCC,
    replyTo: REPLY_TO,
    subject: `${firstName}, your application is in — grab a call time`,
    html: emailLayout(
      body,
      "Application received. Book your strategy call to move forward.",
      params.to
    ),
    serviceArm: "ai-operator-collective",
    templateKey: "aoc.application-received",
  })
}
