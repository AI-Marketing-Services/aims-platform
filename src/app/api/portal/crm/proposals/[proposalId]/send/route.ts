import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { logger } from "@/lib/logger"
import { sendTrackedEmail, escapeHtml } from "@/lib/email"
import { z } from "zod"
import { getOrCreateDbUserByClerkId } from "@/lib/auth/ensure-user"

const sendSchema = z.object({
  recipientEmail: z.string().email(),
  recipientName: z.string().max(120).optional(),
  message: z.string().max(1000).optional(),
})

async function getDbUserId(clerkId: string): Promise<string | null> {
  const user = await getOrCreateDbUserByClerkId(clerkId)
  return user.id
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ proposalId: string }> },
) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const dbUserId = await getDbUserId(userId)
  if (!dbUserId) return NextResponse.json({ error: "User not found" }, { status: 404 })

  const { proposalId } = await params
  const proposal = await db.clientProposal.findFirst({
    where: { id: proposalId, clientDeal: { userId: dbUserId } },
    include: {
      clientDeal: {
        include: {
          user: {
            include: { memberProfile: { select: { businessName: true, brandColor: true, oneLiner: true } } },
          },
        },
      },
    },
  })
  if (!proposal) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const body = await req.json().catch(() => ({}))
  const parsed = sendSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "Invalid parameters" }, { status: 400 })

  const { recipientEmail, recipientName, message } = parsed.data
  const profile = proposal.clientDeal.user.memberProfile
  const operatorName = profile?.businessName ?? "AI Operator"
  const brandColor = profile?.brandColor ?? "#C4972A"
  const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "https://aioperatorcollective.com"}/proposals/${proposal.shareToken}`

  const safeOperatorName = escapeHtml(operatorName)
  const safeOneLiner = profile?.oneLiner ? escapeHtml(profile.oneLiner) : ""
  const safeRecipientName = recipientName ? escapeHtml(recipientName) : ""
  const safeMessage = message ? escapeHtml(message).replace(/\n/g, "<br>") : ""
  const safeCompanyName = escapeHtml(proposal.clientDeal.companyName)
  const safeProposalTitle = escapeHtml(proposal.title)

  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr><td align="center" style="padding:32px 16px">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,.08)">
        <!-- Header -->
        <tr><td style="background:${brandColor};padding:24px 32px">
          <p style="margin:0;font-size:20px;font-weight:700;color:#fff">${safeOperatorName}</p>
          ${safeOneLiner ? `<p style="margin:4px 0 0;font-size:13px;color:rgba(255,255,255,0.8)">${safeOneLiner}</p>` : ""}
        </td></tr>
        <!-- Body -->
        <tr><td style="padding:32px">
          <p style="margin:0 0 8px;font-size:14px;color:#374151">Hi${safeRecipientName ? ` ${safeRecipientName}` : ""},</p>
          ${safeMessage ? `<p style="margin:0 0 20px;font-size:14px;color:#374151;line-height:1.6">${safeMessage}</p>` : `<p style="margin:0 0 20px;font-size:14px;color:#374151;line-height:1.6">Please find your proposal for <strong>${safeCompanyName}</strong> at the link below.</p>`}
          <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:.05em">Proposal</p>
          <p style="margin:0 0 20px;font-size:16px;font-weight:700;color:#111827">${safeProposalTitle}</p>
          <a href="${shareUrl}" style="display:inline-block;background:${brandColor};color:#fff;font-size:14px;font-weight:600;text-decoration:none;padding:12px 24px;border-radius:8px">
            View Proposal →
          </a>
          <p style="margin:24px 0 0;font-size:12px;color:#9ca3af">
            Or copy this link: <a href="${shareUrl}" style="color:${brandColor}">${shareUrl}</a>
          </p>
        </td></tr>
        <!-- Footer -->
        <tr><td style="padding:16px 32px;border-top:1px solid #f3f4f6">
          <p style="margin:0;font-size:11px;color:#9ca3af">
            Sent by ${safeOperatorName} via AI Operator Collective
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`

  try {
    await sendTrackedEmail({
      from: `${operatorName} via AIMS <noreply@aioperatorcollective.com>`,
      replyTo: proposal.clientDeal.user.email,
      to: recipientEmail,
      subject: `Proposal: ${proposal.title}`,
      html,
      serviceArm: "crm-proposals",
      clientId: dbUserId,
    })

    // Update proposal status to SENT if it was DRAFT
    if (proposal.status === "DRAFT") {
      await db.clientProposal.update({
        where: { id: proposalId },
        data: { status: "SENT" },
      })
    }

    // Log activity
    await db.clientDealActivity.create({
      data: {
        clientDealId: proposal.clientDealId,
        type: "EMAIL",
        description: `Proposal emailed to ${recipientEmail}`,
      },
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    logger.error("Failed to send proposal email", err, { userId, proposalId })
    return NextResponse.json({ error: "Failed to send email" }, { status: 500 })
  }
}
