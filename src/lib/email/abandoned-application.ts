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
    ${h1(`${firstName}, totally understand if you got busy.`)}
    ${p(
      `Hey ${firstName}, Matt here from the AI Operator Collective. I noticed you started your application but didn't get a chance to finish it. Totally understand, life gets in the way.`
    )}
    ${p(
      "I just wanted to make sure you had a chance to finish up. Most of the operators I talk to are stuck in the same place: AI is moving fast, you know you should be using it, but between your day job, the LinkedIn noise, and a hundred tools claiming to be \"the one,\" it's hard to know where to even start. That's exactly why we built the Collective."
    )}
    ${p(
      "Once you finish the application and book a quick call with us, I'll send you our AI Operator Playbook (a PDF we normally keep inside the community), plus my personal list of the 10 AI tools I actually use every day, and the 5 prompts that save me the most time each week. All free, whether or not you end up joining."
    )}
    ${p(
      `It's only 3 minutes to finish. Just a few short questions and a call time that works for you.`
    )}
    ${btn("Finish my application", applyUrl)}
    ${p(
      `If now isn't the right moment, no hard feelings at all. Just reply and tell me what's getting in the way and I'll figure out how to help. Either way, looking forward to meeting you, ${firstName}.`
    )}
    <p style="margin:32px 0 0;font-size:13px;color:#4B5563;line-height:1.6;">
      Matt<br/>
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
    subject: `${firstName}, you didn't finish your application`,
    html: emailLayout(body, "3 minutes to finish, and your playbook is on the other side."),
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
