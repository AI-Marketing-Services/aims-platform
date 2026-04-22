import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { randomBytes } from "crypto"
import { db } from "@/lib/db"
import { logger } from "@/lib/logger"
import { sendTrackedEmail } from "@/lib/email"

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.aioperatorcollective.com"
const FROM_EMAIL = "hello@aioperatorcollective.com"

async function getDbUser(clerkId: string) {
  return db.user.findUnique({
    where: { clerkId },
    select: {
      id: true,
      memberProfile: {
        select: { businessName: true, brandColor: true, logoUrl: true },
      },
    },
  })
}

function buildInvoiceEmail(opts: {
  invoiceNumber: string
  title: string
  recipientName: string | null
  total: number
  currency: string
  dueAt: Date | null
  shareToken: string
  operatorName: string
  brandColor: string
}): string {
  const {
    invoiceNumber,
    title,
    recipientName,
    total,
    currency,
    dueAt,
    shareToken,
    operatorName,
    brandColor,
  } = opts

  const invoiceUrl = `${BASE_URL}/invoice/${shareToken}`
  const greeting = recipientName ? `Hi ${recipientName},` : "Hello,"
  const dueStr = dueAt
    ? dueAt.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
    : "Upon receipt"
  const totalStr = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(total)

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Invoice ${invoiceNumber}</title>
</head>
<body style="margin:0;padding:0;background:#F5F5F5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#F5F5F5;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="background:#ffffff;border-radius:12px 12px 0 0;padding:28px 40px;border-bottom:2px solid ${brandColor};">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <span style="font-size:18px;font-weight:800;color:#111827;">${operatorName}</span>
                  </td>
                  <td align="right">
                    <span style="font-size:12px;font-weight:700;color:${brandColor};letter-spacing:0.08em;text-transform:uppercase;">${invoiceNumber}</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="background:#ffffff;padding:40px 40px 32px;">
              <h1 style="margin:0 0 8px;font-size:24px;font-weight:800;color:#111827;">${title}</h1>
              <p style="margin:0 0 24px;font-size:14px;color:#6B7280;">Invoice from ${operatorName}</p>

              <p style="margin:0 0 20px;font-size:15px;color:#374151;line-height:1.7;">${greeting}</p>
              <p style="margin:0 0 20px;font-size:15px;color:#374151;line-height:1.7;">
                Please find your invoice attached. Here's a summary:
              </p>

              <!-- Summary card -->
              <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #E5E7EB;border-radius:8px;overflow:hidden;margin:0 0 28px;">
                <tr style="background:#F9FAFB;">
                  <td style="padding:12px 20px;font-size:13px;color:#6B7280;width:160px;">Invoice #</td>
                  <td style="padding:12px 20px;font-size:13px;font-weight:600;color:#111827;">${invoiceNumber}</td>
                </tr>
                <tr style="background:#ffffff;">
                  <td style="padding:12px 20px;font-size:13px;color:#6B7280;">Amount Due</td>
                  <td style="padding:12px 20px;font-size:13px;font-weight:700;color:#111827;">${totalStr}</td>
                </tr>
                <tr style="background:#F9FAFB;">
                  <td style="padding:12px 20px;font-size:13px;color:#6B7280;">Due Date</td>
                  <td style="padding:12px 20px;font-size:13px;font-weight:600;color:#111827;">${dueStr}</td>
                </tr>
              </table>

              <!-- CTA -->
              <table cellpadding="0" cellspacing="0" border="0" style="margin:0 0 28px;">
                <tr>
                  <td style="border-radius:6px;background:${brandColor};">
                    <a href="${invoiceUrl}"
                       style="display:inline-block;padding:13px 32px;font-size:13px;font-weight:700;color:#ffffff;text-decoration:none;letter-spacing:0.06em;text-transform:uppercase;">
                      View &amp; Pay Invoice
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:0;font-size:13px;color:#9CA3AF;">
                Or copy this link: <a href="${invoiceUrl}" style="color:${brandColor};">${invoiceUrl}</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#F9FAFB;border-radius:0 0 12px 12px;padding:20px 40px;border-top:1px solid #F0F0F0;">
              <p style="margin:0;font-size:11px;color:#9CA3AF;">
                This invoice was sent by ${operatorName} via AIMS · AI Managing Services
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

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const dbUser = await getDbUser(userId)
  if (!dbUser) return NextResponse.json({ error: "Not found" }, { status: 404 })

  try {
    const { id } = await params

    const invoice = await db.clientInvoice.findFirst({
      where: { id, userId: dbUser.id },
      include: { lineItems: true },
    })
    if (!invoice) return NextResponse.json({ error: "Invoice not found" }, { status: 404 })
    if (invoice.status === "PAID" || invoice.status === "CANCELLED") {
      return NextResponse.json({ error: "Cannot send a paid or cancelled invoice" }, { status: 409 })
    }
    if (!invoice.recipientEmail) {
      return NextResponse.json({ error: "Recipient email is required to send" }, { status: 422 })
    }

    const shareToken = invoice.shareToken ?? randomBytes(20).toString("hex")
    const operatorName =
      dbUser.memberProfile?.businessName ?? "AI Operator Collective"
    const brandColor = dbUser.memberProfile?.brandColor ?? "#C4972A"

    const updated = await db.clientInvoice.update({
      where: { id },
      data: {
        status: "SENT",
        sentAt: new Date(),
        shareToken,
      },
    })

    const emailHtml = buildInvoiceEmail({
      invoiceNumber: invoice.invoiceNumber,
      title: invoice.title,
      recipientName: invoice.recipientName,
      total: invoice.total,
      currency: invoice.currency,
      dueAt: invoice.dueAt,
      shareToken,
      operatorName,
      brandColor,
    })

    await sendTrackedEmail({
      from: FROM_EMAIL,
      to: invoice.recipientEmail,
      subject: `Invoice ${invoice.invoiceNumber} from ${operatorName}`,
      html: emailHtml,
      serviceArm: "invoices",
    })

    // Log activity on deal if linked
    if (invoice.clientDealId) {
      await db.clientDealActivity.create({
        data: {
          clientDealId: invoice.clientDealId,
          type: "INVOICE_SENT",
          description: `Invoice ${invoice.invoiceNumber} sent to ${invoice.recipientEmail}`,
        },
      }).catch((err: unknown) => {
        logger.warn("Failed to log invoice activity", { invoiceId: id, err: String(err) })
      })
    }

    return NextResponse.json({ invoice: updated })
  } catch (err) {
    logger.error("Failed to send invoice", err, { userId })
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
