import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { createHash, randomBytes } from "crypto"
import { z } from "zod"
import { Resend } from "resend"
import { db } from "@/lib/db"
import { logger } from "@/lib/logger"
import { getOrCreateDbUserByClerkId } from "@/lib/auth/ensure-user"

const inviteSchema = z.object({
  email: z.string().email(),
  name: z.string().optional(),
})

async function getDbUserId(clerkId: string): Promise<string | null> {
  const user = await getOrCreateDbUserByClerkId(clerkId)
  return user.id
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const dbUserId = await getDbUserId(userId)
  if (!dbUserId) return NextResponse.json({ error: "User not found" }, { status: 404 })

  const { id: dealId } = await params

  const deal = await db.clientDeal.findFirst({
    where: { id: dealId, userId: dbUserId },
    select: { id: true, companyName: true },
  })
  if (!deal) return NextResponse.json({ error: "Not found" }, { status: 404 })

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const parsed = inviteSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data", issues: parsed.error.issues }, { status: 400 })
  }

  const { email, name } = parsed.data

  try {
    // Revoke any existing active access for this deal + email
    await db.clientPortalAccess.updateMany({
      where: {
        clientDealId: dealId,
        guestEmail: email,
        revokedAt: null,
      },
      data: { revokedAt: new Date() },
    })

    const rawToken = randomBytes(32).toString("hex")
    const tokenHash = createHash("sha256").update(rawToken).digest("hex")
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

    await db.clientPortalAccess.create({
      data: {
        userId: dbUserId,
        clientDealId: dealId,
        guestEmail: email,
        guestName: name ?? null,
        tokenHash,
        expiresAt,
      },
    })

    // Fetch operator brand info for email
    const memberProfile = await db.memberProfile.findUnique({
      where: { userId: dbUserId },
      select: { businessName: true, brandColor: true, logoUrl: true },
    })

    const operatorName = memberProfile?.businessName ?? "Your operator"
    const brandColor = memberProfile?.brandColor ?? "#C4972A"
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ""
    const magicLink = `${appUrl}/client-portal/${rawToken}`

    // Send email via Resend
    if (process.env.RESEND_API_KEY) {
      const resend = new Resend(process.env.RESEND_API_KEY)
      const recipientName = name ? `, ${name}` : ""

      await resend.emails.send({
        from: "noreply@aioperatorcollective.com",
        to: email,
        subject: `${operatorName} has shared your project portal`,
        html: buildPortalInviteEmail({
          operatorName,
          brandColor,
          recipientName,
          magicLink,
          company: deal.companyName ?? "your project",
        }),
      })
    }

    // Log activity
    await db.clientDealActivity.create({
      data: {
        clientDealId: dealId,
        type: "PORTAL_INVITED",
        description: `Client portal invite sent to ${email}`,
        metadata: { guestEmail: email, guestName: name ?? null },
      },
    })

    return NextResponse.json({ ok: true, token: rawToken })
  } catch (err) {
    logger.error("Failed to invite client to portal", err, { userId, dealId })
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}

interface EmailParams {
  operatorName: string
  brandColor: string
  recipientName: string
  magicLink: string
  company: string
}

function buildPortalInviteEmail(p: EmailParams): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Your Project Portal</title>
</head>
<body style="margin:0;padding:0;background:#08090D;font-family:'DM Sans',Arial,sans-serif;color:#F0EBE0;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#08090D;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#141923;border-radius:8px;overflow:hidden;border:1px solid rgba(196,151,42,0.2);">
          <tr>
            <td style="background:${p.brandColor};height:4px;"></td>
          </tr>
          <tr>
            <td style="padding:40px 48px;">
              <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#F0EBE0;">${p.operatorName}</h1>
              <p style="margin:0 0 32px;font-size:14px;color:#9CA3AF;">has shared your project portal with you</p>

              <p style="margin:0 0 16px;font-size:16px;color:#F0EBE0;">Hi${p.recipientName},</p>
              <p style="margin:0 0 24px;font-size:15px;color:#D1D5DB;line-height:1.6;">
                You now have access to your dedicated project portal for <strong style="color:#F0EBE0;">${p.company}</strong>.
                View your project status, proposals, and invoices in one place.
              </p>

              <table cellpadding="0" cellspacing="0" style="margin:0 0 32px;">
                <tr>
                  <td style="background:${p.brandColor};border-radius:6px;padding:14px 28px;">
                    <a href="${p.magicLink}" style="color:#08090D;font-size:15px;font-weight:700;text-decoration:none;display:block;">
                      Open My Project Portal
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 8px;font-size:13px;color:#6B7280;">
                Or copy this link into your browser:
              </p>
              <p style="margin:0 0 32px;font-size:12px;color:#9CA3AF;word-break:break-all;">
                ${p.magicLink}
              </p>

              <p style="margin:0;font-size:12px;color:#4B5563;">
                This link expires in 30 days. If you didn&apos;t expect this email, you can safely ignore it.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 48px;border-top:1px solid rgba(255,255,255,0.05);">
              <p style="margin:0;font-size:11px;color:#4B5563;text-align:center;">
                Powered by <a href="https://aioperatorcollective.com" style="color:#C4972A;text-decoration:none;">AI Operator Collective</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}
