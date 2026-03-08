import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getResend } from "@/lib/email"

export const maxDuration = 60

export async function GET(req: Request) {
  // Verify cron secret on production
  const authHeader = req.headers.get("authorization")
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const pending = await db.emailQueueItem.findMany({
    where: {
      status: "pending",
      scheduledFor: { lte: new Date() },
    },
    take: 50,
    orderBy: { scheduledFor: "asc" },
  })

  if (!pending.length) {
    return NextResponse.json({ processed: 0 })
  }

  let sent = 0
  let failed = 0

  for (const item of pending) {
    try {
      // If recipient has an active subscription, cancel nurture sequences (they converted)
      const user = await db.user.findFirst({
        where: { email: item.recipientEmail },
        include: { subscriptions: { where: { status: "ACTIVE" }, take: 1 } },
      })

      const nurtureSequences = ["post-quiz", "post-calculator", "post-audit"]
      if (user?.subscriptions.length && nurtureSequences.includes(item.sequenceKey)) {
        await db.emailQueueItem.update({ where: { id: item.id }, data: { status: "cancelled" } })
        continue
      }

      const emailContent = buildEmailContent(item.sequenceKey, item.emailIndex, item.metadata as Record<string, unknown>)
      if (!emailContent) {
        await db.emailQueueItem.update({ where: { id: item.id }, data: { status: "cancelled" } })
        continue
      }

      await getResend().emails.send({
        from: "AIMS <hello@aimseos.com>",
        to: item.recipientEmail,
        subject: emailContent.subject,
        html: emailContent.html,
      })

      await db.emailQueueItem.update({
        where: { id: item.id },
        data: { status: "sent", sentAt: new Date() },
      })
      sent++
    } catch (err) {
      console.error(`Failed to send email queue item ${item.id}:`, err)
      await db.emailQueueItem.update({ where: { id: item.id }, data: { status: "failed" } })
      failed++
    }
  }

  return NextResponse.json({ processed: pending.length, sent, failed })
}

interface EmailContent {
  subject: string
  html: string
}

function buildEmailContent(
  sequenceKey: string,
  emailIndex: number,
  metadata: Record<string, unknown> = {}
): EmailContent | null {
  const score = metadata.score as number | undefined
  const name = (metadata.name as string) || "there"
  const monthlySavings = metadata.monthlySavings as number | undefined
  const auditScore = metadata.auditScore as number | undefined
  const serviceName = (metadata.serviceName as string) || "AIMS Service"
  const portalUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "https://aimseos.com"}/portal/dashboard`
  const strategyUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "https://aimseos.com"}/get-started`

  const wrap = (content: string) => `<!DOCTYPE html><html><head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:32px 16px;background:#F5F5F5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;">
<tr><td style="background:#DC2626;padding:20px 32px;">
  <span style="font-size:18px;font-weight:800;color:#fff;">AIMS</span>
  <span style="float:right;font-size:11px;color:#fca5a5;text-transform:uppercase;letter-spacing:0.05em;">AI Managing Services</span>
</td></tr>
<tr><td style="padding:32px;">${content}</td></tr>
<tr><td style="padding:20px 32px;background:#F9FAFB;border-top:1px solid #F0F0F0;">
  <p style="margin:0;font-size:12px;color:#9CA3AF;">AIMS · <a href="https://aimseos.com" style="color:#9CA3AF;">aimseos.com</a></p>
</td></tr>
</table></body></html>`

  if (sequenceKey === "post-quiz" && emailIndex === 0) {
    return {
      subject: `Your AI Readiness Score: ${score ?? "Ready"}/100`,
      html: wrap(`
        <h1 style="font-size:24px;font-weight:800;color:#111827;margin:0 0 16px;">Hey ${name} — your AI readiness results are in</h1>
        ${score ? `<div style="background:#FEF2F2;border-left:4px solid #DC2626;border-radius:6px;padding:20px;margin:0 0 24px;">
          <p style="margin:0 0 4px;font-size:12px;font-weight:700;color:#DC2626;text-transform:uppercase;">Your Score</p>
          <p style="margin:0;font-size:48px;font-weight:800;color:#111827;line-height:1;">${score}<span style="font-size:20px;color:#6B7280;">/100</span></p>
        </div>` : ""}
        <p style="font-size:15px;color:#4B5563;line-height:1.7;margin:0 0 16px;">We analyzed your inputs and identified your biggest AI growth opportunities. Your full breakdown is ready to view.</p>
        <a href="${strategyUrl}?ref=quiz-email" style="display:inline-block;background:#DC2626;color:#fff;padding:13px 28px;border-radius:6px;text-decoration:none;font-weight:700;font-size:13px;text-transform:uppercase;margin:8px 0;">View Full Results →</a>
        <p style="font-size:14px;color:#6B7280;margin:24px 0 0;">Want to talk through your results? <a href="${strategyUrl}" style="color:#DC2626;font-weight:600;">Book a free strategy call →</a></p>
      `),
    }
  }

  if (sequenceKey === "post-calculator" && emailIndex === 0) {
    return {
      subject: `You could save $${monthlySavings ?? "X,XXX"}/month with AI`,
      html: wrap(`
        <h1 style="font-size:24px;font-weight:800;color:#111827;margin:0 0 16px;">Hey ${name} — here's your custom ROI report</h1>
        ${monthlySavings ? `<div style="background:#FEF2F2;border-left:4px solid #DC2626;border-radius:6px;padding:20px;margin:0 0 24px;">
          <p style="margin:0 0 4px;font-size:12px;font-weight:700;color:#DC2626;text-transform:uppercase;">Projected Monthly Savings</p>
          <p style="margin:0;font-size:42px;font-weight:800;color:#111827;line-height:1;">$${monthlySavings.toLocaleString()}<span style="font-size:16px;color:#6B7280;">/mo</span></p>
        </div>` : ""}
        <p style="font-size:15px;color:#4B5563;line-height:1.7;margin:0 0 16px;">Based on your inputs, we built a personalized ROI model showing exactly where AI automation pays off fastest for your business.</p>
        <a href="${strategyUrl}?ref=calc-email" style="display:inline-block;background:#DC2626;color:#fff;padding:13px 28px;border-radius:6px;text-decoration:none;font-weight:700;font-size:13px;text-transform:uppercase;margin:8px 0;">View Your ROI Report →</a>
        <p style="font-size:14px;color:#6B7280;margin:24px 0 0;">Every month you wait costs you. <a href="${strategyUrl}" style="color:#DC2626;font-weight:600;">Let's rebuild your ROI model live →</a></p>
      `),
    }
  }

  if (sequenceKey === "post-audit" && emailIndex === 0) {
    return {
      subject: `Your website scored ${auditScore ?? "XX"}/100 — here are the fixes`,
      html: wrap(`
        <h1 style="font-size:24px;font-weight:800;color:#111827;margin:0 0 16px;">Hey ${name} — your website audit is complete</h1>
        ${auditScore !== undefined ? `<div style="background:#FEF2F2;border-left:4px solid #DC2626;border-radius:6px;padding:20px;margin:0 0 24px;">
          <p style="margin:0 0 4px;font-size:12px;font-weight:700;color:#DC2626;text-transform:uppercase;">Website Score</p>
          <p style="margin:0;font-size:48px;font-weight:800;color:#111827;line-height:1;">${auditScore}<span style="font-size:20px;color:#6B7280;">/100</span></p>
        </div>` : ""}
        <p style="font-size:15px;color:#4B5563;line-height:1.7;margin:0 0 16px;">We identified the critical issues hurting your SEO, conversions, and AI search visibility. Your full audit report with prioritized fixes is ready.</p>
        <a href="${strategyUrl}?ref=audit-email" style="display:inline-block;background:#DC2626;color:#fff;padding:13px 28px;border-radius:6px;text-decoration:none;font-weight:700;font-size:13px;text-transform:uppercase;margin:8px 0;">View Full Audit Report →</a>
        <p style="font-size:14px;color:#6B7280;margin:24px 0 0;">We can fix everything on your report starting at $97/mo. <a href="${process.env.NEXT_PUBLIC_APP_URL ?? "https://aimseos.com"}/marketplace" style="color:#DC2626;font-weight:600;">See how →</a></p>
      `),
    }
  }

  if (sequenceKey === "post-purchase" && emailIndex === 0) {
    return {
      subject: `Welcome to AIMS — your ${serviceName} is being set up`,
      html: wrap(`
        <h1 style="font-size:24px;font-weight:800;color:#111827;margin:0 0 16px;">Welcome aboard, ${name}!</h1>
        <p style="font-size:15px;color:#4B5563;line-height:1.7;margin:0 0 16px;">Your <strong>${serviceName}</strong> subscription is confirmed. Here's what happens next:</p>
        <ol style="margin:0 0 24px;padding-left:20px;color:#4B5563;line-height:2;font-size:15px;">
          <li>Our team begins setup within <strong style="color:#111827;">24 hours</strong></li>
          <li>You'll receive a setup guide and onboarding call invite</li>
          <li>Track progress in your <a href="${portalUrl}" style="color:#DC2626;">AIMS portal</a></li>
        </ol>
        <a href="${portalUrl}" style="display:inline-block;background:#DC2626;color:#fff;padding:13px 28px;border-radius:6px;text-decoration:none;font-weight:700;font-size:13px;text-transform:uppercase;margin:8px 0;">Go to Your Portal →</a>
        <p style="font-size:14px;color:#6B7280;margin:24px 0 0;">Questions? Reply to this email — we respond within 2 business hours.</p>
      `),
    }
  }

  if (sequenceKey === "partner-onboard" && emailIndex === 0) {
    return {
      subject: "Welcome to the AIMS Partner Program",
      html: wrap(`
        <h1 style="font-size:24px;font-weight:800;color:#111827;margin:0 0 16px;">Welcome to the AIMS Partner Program, ${name}!</h1>
        <p style="font-size:15px;color:#4B5563;line-height:1.7;margin:0 0 16px;">You're now part of a network of partners earning 20% recurring commissions on every AIMS client you refer.</p>
        <p style="font-size:15px;color:#4B5563;line-height:1.7;margin:0 0 24px;"><strong>How to close your first deal:</strong></p>
        <ol style="margin:0 0 24px;padding-left:20px;color:#4B5563;line-height:2;font-size:15px;">
          <li>Share your referral link with business owners in your network</li>
          <li>They book a strategy call — you earn 20% of their monthly spend</li>
          <li>Commissions paid monthly, automatically</li>
        </ol>
        <a href="${process.env.NEXT_PUBLIC_APP_URL ?? "https://aimseos.com"}/reseller/dashboard" style="display:inline-block;background:#DC2626;color:#fff;padding:13px 28px;border-radius:6px;text-decoration:none;font-weight:700;font-size:13px;text-transform:uppercase;margin:8px 0;">View Your Partner Dashboard →</a>
      `),
    }
  }

  // All other emails in a sequence use the subject from EMAIL_SEQUENCES
  return null
}
