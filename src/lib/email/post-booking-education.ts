import {
  sendTrackedEmail,
  escapeHtml,
  emailLayout,
  h1,
  p,
  btn,
} from "./index"
import { AOC_FROM_EMAIL as FROM_EMAIL, AOC_REPLY_TO as REPLY_TO, RYAN_SALES_BCC } from "./senders"

export interface EmailContent {
  subject: string
  html: string
}

function appUrl(): string {
  // Hard-coded to the canonical domain. We previously read from
  // NEXT_PUBLIC_APP_URL but that env is still set to the retired
  // aimseos.com domain in Vercel prod, which made every email CTA 404.
  // Changing it here removes the dependency on a prod env update.
  return "https://www.aioperatorcollective.com"
}

function playCard(num: string, title: string, body: string): string {
  return `
    <div style="border-left:3px solid #981B1B;padding:14px 18px;margin:0 0 14px;background:#F9FAFB;border-radius:0 6px 6px 0;">
      <p style="margin:0 0 4px;font-size:11px;font-weight:700;color:#981B1B;text-transform:uppercase;letter-spacing:0.08em;">${num}</p>
      <p style="margin:0 0 6px;font-size:15px;font-weight:700;color:#111827;">${title}</p>
      <p style="margin:0;font-size:13px;color:#4B5563;line-height:1.65;">${body}</p>
    </div>
  `
}

function formatCallTime(value?: string | null): string | null {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null

  return date.toLocaleString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  })
}

function callDetails(params: {
  eventStartTime?: string | null
  meetingUrl?: string | null
  rescheduleUrl?: string | null
}): string {
  const rows: string[] = []
  const formattedTime = formatCallTime(params.eventStartTime)

  if (formattedTime) {
    rows.push(`<strong style="color:#111827;">Time:</strong> ${escapeHtml(formattedTime)}`)
  } else {
    rows.push(
      `<strong style="color:#111827;">Time:</strong> Check your Calendly confirmation for the exact time.`
    )
  }

  rows.push(`<strong style="color:#111827;">With:</strong> Ryan from the AIOC team`)

  if (params.meetingUrl) {
    const safeMeetingUrl = escapeHtml(params.meetingUrl)
    rows.push(
      `<strong style="color:#111827;">Where:</strong> <a href="${safeMeetingUrl}" style="color:#981B1B;font-weight:700;">Join the call</a>`
    )
  } else {
    rows.push(
      `<strong style="color:#111827;">Where:</strong> Check your Calendly confirmation for the meeting link.`
    )
  }

  if (params.rescheduleUrl) {
    const safeRescheduleUrl = escapeHtml(params.rescheduleUrl)
    rows.push(
      `<strong style="color:#111827;">Reschedule:</strong> <a href="${safeRescheduleUrl}" style="color:#981B1B;font-weight:700;">Use this link if the time no longer works</a>`
    )
  }

  return p(rows.join("<br/>"))
}

/* -------------------------------------------------------------------------- */
/*  Day 0 — sent IMMEDIATELY after booking via Calendly webhook               */
/*          (skips the queue so the applicant gets confirmation immediately)   */
/* -------------------------------------------------------------------------- */

export async function sendPostBookingConfirmationEmail(params: {
  to: string
  name: string
  eventStartTime?: string | null
  meetingUrl?: string | null
  rescheduleUrl?: string | null
  cancelUrl?: string | null
}) {
  const safeName = escapeHtml(params.name || "").trim()
  const firstName = safeName.split(" ")[0] || "there"

  const nextStepsUrl = `${appUrl()}/apply/next-steps?email=${encodeURIComponent(params.to)}`

  const body = `
    ${h1(`${firstName}, you're on the calendar.`)}
    ${callDetails({
      eventStartTime: params.eventStartTime,
      meetingUrl: params.meetingUrl,
      rescheduleUrl: params.rescheduleUrl,
    })}
    ${p(`Hey ${firstName}, Jess here. Before you speak with Ryan, I want you thinking about the right things.`)}

    ${p("You raised your hand because you see AI changing work and you do not want to sit on the sidelines watching it happen.")}

    ${p("That is the right instinct.")}

    ${p("But the useful question is not <em>which AI tools should I learn?</em>")}

    ${p("The useful question is:")}

    ${p("<strong style='color:#111827;'>What business problems do I understand well enough to start solving?</strong>")}

    ${p("Bring raw material to the call, not a polished plan.")}

    ${playCard(
      "1.",
      "The work environments you understand",
      "Think about the industries, departments, roles, or business types you have seen up close. Your background is not random. It may be the starting point."
    )}
    ${playCard(
      "2.",
      "The little fires you have noticed",
      "Manual reports. Missed follow-up. Messy handoffs. Repeated customer questions. Workarounds everyone accepts because \"that's just how it works.\""
    )}
    ${playCard(
      "3.",
      "What you want this skill set to help you build toward",
      "More useful skills. Better business conversations. More agency in a market being reshaped by AI. You do not need the whole answer yet, but have an honest starting point."
    )}

    ${btn("Review the prep page", nextStepsUrl)}

    <p style="margin:32px 0 0;font-size:13px;color:#4B5563;line-height:1.6;">
      Jess<br/>
      <span style="color:#9CA3AF;font-size:12px;">AI Operator Collective</span>
    </p>
    <p style="margin:24px 0 0;font-size:11px;color:#9CA3AF;line-height:1.55;font-style:italic;">
      If the time no longer works, use the reschedule link above instead of missing it.
    </p>
  `

  return sendTrackedEmail({
    from: FROM_EMAIL,
    to: params.to,
    bcc: RYAN_SALES_BCC,
    replyTo: REPLY_TO,
    subject: `${firstName}, your AIOC call is confirmed`,
    html: emailLayout(
      body,
      "Here's what to think through before you speak with Ryan."
    ),
    serviceArm: "ai-operator-collective",
    templateKey: "aoc.post-booking-confirmation",
  })
}

/* -------------------------------------------------------------------------- */
/*  Days 1–3 + Meeting Morning — routed through the shared email queue         */
/* -------------------------------------------------------------------------- */

export function buildPostBookingEducationEmail(
  emailIndex: number,
  metadata: Record<string, unknown>
): EmailContent | null {
  const name = (metadata.name as string) || "there"
  const firstName = escapeHtml(name).split(" ")[0] || "there"
  const nextStepsUrl = `${appUrl()}/apply/next-steps`
  const eventStartTime = (metadata.eventStartTime as string | null) || null
  const meetingUrl = (metadata.meetingUrl as string | null) || null
  const rescheduleUrl = (metadata.rescheduleUrl as string | null) || null

  if (emailIndex === 0) {
    // Day 1 — Problem-first reframe
    return {
      subject: "Tools are not the product",
      html: `
        ${h1("Tools are not the product.")}
        ${p(`Hi ${firstName},`)}
        ${p("Most people start with AI tools because tools are easy to see.")}

        ${p("Claude. ChatGPT. Zapier. Make. Agents. Automations. Whatever is shiny this week.")}

        ${p("Tools matter.")}

        ${p("But they are not the product.")}

        ${p("A business does not care that you know a tool. A business cares whether you understand a problem worth solving.")}

        ${p("That is the core of how we think about AIOC.")}

        ${p("AI is gasoline.")}

        ${p("Your job is to find the fire.")}

        ${playCard(
          "1.",
          "A business problem has weight",
          "Missed leads. Slow follow-up. Reports built by hand. Customer questions answered from scratch. Internal handoffs that keep breaking."
        )}
        ${playCard(
          "2.",
          "A tool is only useful after diagnosis",
          "If there is no real business pain underneath, AI just makes a cleaner demo. Interesting, maybe. Valuable, not necessarily."
        )}
        ${playCard(
          "3.",
          "Operators learn to see the fire",
          "The skill is noticing where time, money, attention, or opportunity is leaking, then using AI to make that problem smaller, faster, cheaper, or less painful."
        )}

        ${p("Before your call with Ryan, think of one or two business problems you have seen up close.")}

        ${p("Not \"AI ideas.\"")}

        ${p("Business problems.")}

        ${p("That is the better starting point.")}

        ${btn("Review the prep page", nextStepsUrl)}

        <p style="margin:32px 0 0;font-size:13px;color:#4B5563;line-height:1.6;">
          Jess<br/>
          <span style="color:#9CA3AF;font-size:12px;">AI Operator Collective</span>
        </p>
      `,
    }
  }

  if (emailIndex === 1) {
    // Day 2 — Work history as raw material
    return {
      subject: "Your background is raw material",
      html: `
        ${h1("Your background is not dead weight.")}
        ${p(`Hi ${firstName},`)}
        ${p("If you are coming from a W2 role, a corporate job, or a generalist background, it can be easy to assume you are behind.")}

        ${p("You may look at AI engineers, automation builders, or people posting polished case studies online and think:")}

        ${p("<em>I do not have that kind of technical background.</em>")}

        ${p("That may be true.")}

        ${p("It is also not the whole story.")}

        ${p("A lot of useful AI work starts with understanding how businesses actually operate.")}

        ${p("And if you have spent years inside a company, you have seen things that matter.")}

        ${playCard(
          "1.",
          "You have seen the mess",
          "Meetings that should have been docs. Reports nobody trusts. Handoffs that break every week. Follow-up that depends on memory. Systems people work around instead of using."
        )}
        ${playCard(
          "2.",
          "You know the language of work",
          "You understand how people explain problems, avoid problems, inherit problems, and quietly tolerate problems. That is useful."
        )}
        ${playCard(
          "3.",
          "AIOC helps turn that into capability",
          "The goal is not to make you an AI influencer. The goal is to help you build a practical skill set you can take into real business conversations."
        )}

        ${p("Before your call, write down two or three business types, roles, or work environments you understand better than the average person.")}

        ${p("That is raw material.")}

        ${p("Bring it with you.")}

        ${btn("Review the prep page", nextStepsUrl)}

        <p style="margin:32px 0 0;font-size:13px;color:#4B5563;line-height:1.6;">
          Jess<br/>
          <span style="color:#9CA3AF;font-size:12px;">AI Operator Collective</span>
        </p>
      `,
    }
  }

  if (emailIndex === 2) {
    // Day 3 — Call preparation
    return {
      subject: "What Ryan will ask about",
      html: `
        ${h1("Bring raw material, not a perfect plan.")}
        ${p(`Hi ${firstName},`)}
        ${p("For your call with Ryan, you do not need to show up as an expert.")}

        ${p("You do not need a finished offer.")}

        ${p("You do not need a perfect niche, a logo, a website, or a 47-step plan.")}

        ${p("The point of the conversation is to understand where you are starting and whether AIOC is the right next room.")}

        ${p("Here is what Ryan will be listening for.")}

        ${playCard(
          "1.",
          "What are you building toward?",
          "More agency. More useful skills. Better business conversations. A practical path into AI-enabled work. Be honest about what you want this to make possible."
        )}
        ${playCard(
          "2.",
          "What raw material do you already have?",
          "Your work history, industry exposure, operational experience, relationships, curiosity, and the business problems you have seen up close."
        )}
        ${playCard(
          "3.",
          "Are you ready for reps?",
          "AIOC is not passive content. It is practice: noticing problems, talking to businesses, mapping workflows, thinking through ROI, and learning how useful AI solutions actually get shaped."
        )}

        ${p("Each cohort is small, so fit matters.")}

        ${p("That is a good thing.")}

        ${p("It means the call is not about convincing everyone. It is about figuring out who is ready for this kind of work now.")}

        ${btn("Review the prep page", nextStepsUrl)}

        <p style="margin:32px 0 0;font-size:13px;color:#4B5563;line-height:1.6;">
          Jess<br/>
          <span style="color:#9CA3AF;font-size:12px;">AI Operator Collective</span>
        </p>
      `,
    }
  }

  if (emailIndex === 3) {
    // Meeting morning — final reminder
    return {
      subject: `${firstName}, your AIOC call is today`,
      html: `
        ${h1("Your AIOC call is today.")}
        ${p(`Hi ${firstName},`)}
        ${p("Quick reminder that your AIOC strategy conversation with Ryan is today.")}

        ${callDetails({ eventStartTime, meetingUrl, rescheduleUrl })}

        ${p("If screen sharing is part of the call, join from a computer if you can.")}

        ${p("Before you join, have these three things in mind:")}

        ${playCard("1.", "Two or three work environments you understand", "Industries, departments, roles, companies, or business types you have seen up close.")}
        ${playCard("2.", "One or two little fires you have noticed", "Manual work, missed follow-up, messy handoffs, repeated questions, broken reporting, or other business problems that keep costing time and attention.")}
        ${playCard("3.", "What you want this skill set to help you build toward", "You do not need a perfect answer. Just an honest one.")}

        ${p("Otherwise, Ryan will see you soon.")}

        ${btn("Review the prep page", nextStepsUrl)}

        <p style="margin:32px 0 0;font-size:13px;color:#4B5563;line-height:1.6;">
          Jess<br/>
          <span style="color:#9CA3AF;font-size:12px;">AI Operator Collective</span>
        </p>
      `,
    }
  }

  return null
}

/* -------------------------------------------------------------------------- */
/*  Sequence definition for EMAIL_SEQUENCES / queueEmailSequence              */
/* -------------------------------------------------------------------------- */

export const POST_BOOKING_EDUCATION_SEQUENCE = {
  name: "Post-Booking Education (AOC)",
  emails: [
    { delay: 1, subject: "Tools are not the product", templateKey: "aoc-day-1-problem-first" },
    { delay: 2, subject: "Your background is raw material", templateKey: "aoc-day-2-raw-material" },
    { delay: 3, subject: "What Ryan will ask about", templateKey: "aoc-day-3-call-prep" },
  ],
} as const
