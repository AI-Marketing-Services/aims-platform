import { emailLayout, escapeHtml, h1, p, btn, divider, sendTrackedEmail } from "./index"
import { AOC_FROM_EMAIL } from "./senders"
import { db } from "@/lib/db"
import { logger } from "@/lib/logger"

const PORTAL_URL = "https://aioperatorcollective.com/portal"

function buildMilestoneEmail(params: {
  firstName: string
  recipientEmail: string
  subject: string
  headline: string
  body: string
  ctaLabel: string
  ctaUrl: string
  preheader: string
}) {
  const html = emailLayout(
    `
    ${h1(escapeHtml(params.headline))}
    ${p(params.body)}
    <div style="text-align:center;margin:0 0 32px;">
      ${btn(params.ctaLabel, params.ctaUrl)}
    </div>
    ${divider()}
    <p style="margin:16px 0 0;font-size:14px;color:#4B5563;line-height:1.6;">
      Adam<br/>
      <span style="color:#9CA3AF;font-size:12px;">AI Operator Collective</span>
    </p>
    `,
    params.preheader,
    params.recipientEmail
  )
  return { subject: params.subject, html }
}

type MilestoneKey = "first_step" | "week1_done" | "half_done" | "complete"

async function alreadySentMilestone(email: string, milestone: MilestoneKey): Promise<boolean> {
  const sequenceKey = `onboarding-milestone-${milestone}`
  const recent = await db.emailQueueItem.findFirst({
    where: { recipientEmail: email, sequenceKey },
  })
  return !!recent
}

async function recordMilestoneSent(email: string, milestone: MilestoneKey) {
  const sequenceKey = `onboarding-milestone-${milestone}`
  await db.emailQueueItem.create({
    data: {
      recipientEmail: email,
      sequenceKey,
      emailIndex: 0,
      scheduledFor: new Date(),
      status: "sent",
    },
  })
}

export async function fireMilestoneEmailIfNeeded({
  userId,
  newCount,
  previousCount,
}: {
  userId: string
  newCount: number
  previousCount: number
}) {
  const MILESTONES: Array<{ threshold: number; key: MilestoneKey }> = [
    { threshold: 1, key: "first_step" },
    { threshold: 4, key: "week1_done" },
    { threshold: 6, key: "half_done" },
    { threshold: 12, key: "complete" },
  ]

  // Find the highest milestone just crossed
  const justCrossed = MILESTONES.filter(
    (m) => previousCount < m.threshold && newCount >= m.threshold
  ).at(-1)

  if (!justCrossed) return

  const user = await db.user.findUnique({
    where: { id: userId },
    select: { email: true, name: true },
  })
  if (!user) return

  const recipientEmail = user.email
  const firstName = user.name?.split(" ")[0] ?? "there"

  const alreadySent = await alreadySentMilestone(recipientEmail, justCrossed.key)
  if (alreadySent) return

  const EMAIL_CONTENT: Record<MilestoneKey, ReturnType<typeof buildMilestoneEmail>> = {
    first_step: buildMilestoneEmail({
      firstName,
      recipientEmail,
      subject: `${firstName}, you just completed your first step`,
      headline: `${firstName}, you're off the starting line.`,
      preheader: "The hardest part is starting. You just did.",
      body: `You just completed your first onboarding step in the AI Operator OS. The hardest part is starting — and you just did.<br/><br/>Keep the momentum going. There are 11 more steps, and each one unlocks something useful: tools, templates, and the frameworks that top operators use to land and keep clients.`,
      ctaLabel: "Continue Onboarding",
      ctaUrl: `${PORTAL_URL}/onboard`,
    }),
    week1_done: buildMilestoneEmail({
      firstName,
      recipientEmail,
      subject: `Nice work, ${firstName} — Week 1 is done`,
      headline: "Week 1 complete. The toolkit is open.",
      preheader: "You unlocked the Automation and Outreach tool tier.",
      body: `You finished the first four onboarding steps. That means you've unlocked the Automation &amp; Outreach tool tier in your AI Operator Toolkit — Make, n8n, Instantly, Apify, Descript, and Loom are all now accessible.<br/><br/>These are the tools that operators use to build repeatable client delivery systems. Head to the Toolkit to explore them.`,
      ctaLabel: "Open the Toolkit",
      ctaUrl: `${PORTAL_URL}/tools`,
    }),
    half_done: buildMilestoneEmail({
      firstName,
      recipientEmail,
      subject: `${firstName}, you're halfway there`,
      headline: "6 of 12 steps done. You're in the top half.",
      preheader: "Halfway through onboarding. More tools just unlocked.",
      body: `Most members stall around step 3 or 4. You've made it to step 6 — that puts you in the top half of all operators who've gone through this.<br/><br/>More importantly, completing these steps keeps unlocking your Toolkit. You now have access to n8n, Instantly, and the automation tools that your best clients will pay for. The full suite unlocks at step 12.`,
      ctaLabel: "See What's Unlocked",
      ctaUrl: `${PORTAL_URL}/tools`,
    }),
    complete: buildMilestoneEmail({
      firstName,
      recipientEmail,
      subject: `${firstName}, you've completed the AI Operator OS onboarding`,
      headline: `${firstName}, full access is yours.`,
      preheader: "All 12 steps done. Every tool in the vault is now unlocked.",
      body: `You finished all 12 onboarding steps. Every tool in the AI Operator Toolkit is now unlocked, including Vapi, Relevance AI, Close CRM, PandaDoc, and the full finance stack.<br/><br/>These are the tools that operators use to build $5k–$20k/mo consulting businesses. The next step: get your first or next client in the CRM, generate a proposal with the AI generator, and track your pipeline value.<br/><br/>If you want to talk through your business or get a second set of eyes on your first proposal — reply to this email. A real person reads every reply.`,
      ctaLabel: "Open Your CRM",
      ctaUrl: `${PORTAL_URL}/crm`,
    }),
  }

  const emailContent = EMAIL_CONTENT[justCrossed.key]
  if (!emailContent) return

  try {
    await sendTrackedEmail({
      from: AOC_FROM_EMAIL,
      to: recipientEmail,
      subject: emailContent.subject,
      html: emailContent.html,
      serviceArm: "onboarding-milestones",
      clientId: userId,
    })
    await recordMilestoneSent(recipientEmail, justCrossed.key)
    logger.info("Milestone email sent", { userId, milestone: justCrossed.key, email: recipientEmail })
  } catch (err) {
    logger.error("Failed to send milestone email", err, { userId, milestone: justCrossed.key })
  }
}
