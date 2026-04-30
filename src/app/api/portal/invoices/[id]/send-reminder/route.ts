import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { logger } from "@/lib/logger"
import { sendTrackedEmail, emailLayout, h1, p, btn, divider, escapeHtml } from "@/lib/email"
import { ensureDbUserIdForApi } from "@/lib/auth/ensure-user"

export const dynamic = "force-dynamic"

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.aioperatorcollective.com"
const FROM_EMAIL = "hello@aioperatorcollective.com"

/**
 * POST /api/portal/invoices/[id]/send-reminder
 *
 * Sends a friendly payment reminder for an unpaid invoice. Tone matches
 * status:
 *   SENT (not yet due) → soft 'just a heads up' nudge
 *   OVERDUE            → firmer 'this is now past due' nudge
 *
 * Refuses to send for DRAFT (operator should send the original first),
 * PAID (no need), or CANCELLED. Logs to the deal activity timeline.
 *
 * Recipient + share token + operator branding all reused from the
 * original send. No new shareToken — same URL, same payment link.
 */
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const dbUserId = await ensureDbUserIdForApi()
  if (!dbUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  const invoice = await db.clientInvoice.findFirst({
    where: { id, userId: dbUserId },
    include: {
      user: {
        select: {
          memberProfile: { select: { businessName: true, brandColor: true } },
          name: true,
        },
      },
    },
  })
  if (!invoice) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 })
  }
  if (invoice.status === "DRAFT") {
    return NextResponse.json(
      { error: "Send the invoice first before sending a reminder." },
      { status: 409 },
    )
  }
  if (invoice.status === "PAID" || invoice.status === "CANCELLED") {
    return NextResponse.json(
      { error: `Cannot remind on a ${invoice.status.toLowerCase()} invoice.` },
      { status: 409 },
    )
  }
  if (!invoice.recipientEmail) {
    return NextResponse.json(
      { error: "Recipient email missing." },
      { status: 422 },
    )
  }
  if (!invoice.shareToken) {
    return NextResponse.json(
      { error: "Invoice has no share token — re-send the original first." },
      { status: 409 },
    )
  }

  const isOverdue = invoice.status === "OVERDUE"
  const operatorName =
    invoice.user.memberProfile?.businessName ?? invoice.user.name ?? "your operator"
  const totalStr = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: invoice.currency,
  }).format(invoice.total)
  const invoiceUrl = `${BASE_URL}/invoice/${invoice.shareToken}`
  const greeting = invoice.recipientName ? `Hi ${invoice.recipientName},` : "Hello,"

  const subject = isOverdue
    ? `Reminder: Invoice ${invoice.invoiceNumber} is past due`
    : `Reminder: Invoice ${invoice.invoiceNumber}`

  const body = isOverdue
    ? `
        ${h1(`Quick payment reminder`)}
        ${p(`${escapeHtml(greeting)}`)}
        ${p(`This is a friendly nudge — invoice <strong>${escapeHtml(invoice.invoiceNumber)}</strong> for <strong>${totalStr}</strong> is now past its due date. If you've already sent payment, please ignore this note (or just hit reply with the date and we'll match it up).`)}
        ${btn("View & pay invoice →", invoiceUrl)}
        ${divider()}
        ${p(`Questions or need an alternative payment method? Just reply — I'm happy to sort it out.`)}
        ${p(`Thanks,<br/>${escapeHtml(operatorName)}`)}
      `
    : `
        ${h1(`Just a heads-up`)}
        ${p(`${escapeHtml(greeting)}`)}
        ${p(`Quick reminder — invoice <strong>${escapeHtml(invoice.invoiceNumber)}</strong> for <strong>${totalStr}</strong> is awaiting payment. The link below has the details + a one-click pay option whenever you're ready.`)}
        ${btn("View invoice →", invoiceUrl)}
        ${divider()}
        ${p(`Thanks,<br/>${escapeHtml(operatorName)}`)}
      `

  try {
    await sendTrackedEmail({
      from: FROM_EMAIL,
      to: invoice.recipientEmail,
      subject,
      html: emailLayout(body, subject, invoice.recipientEmail),
      serviceArm: "invoices",
    })

    if (invoice.clientDealId) {
      await db.clientDealActivity
        .create({
          data: {
            clientDealId: invoice.clientDealId,
            type: "INVOICE_SENT",
            description: `Reminder sent for ${invoice.invoiceNumber} (${invoice.status})`,
            metadata: {
              reminder: true,
              invoiceId: invoice.id,
              invoiceNumber: invoice.invoiceNumber,
              status: invoice.status,
            },
          },
        })
        .catch((err) =>
          logger.warn("Failed to log reminder activity", { err: String(err) }),
        )
    }

    return NextResponse.json({ ok: true, sentTo: invoice.recipientEmail })
  } catch (err) {
    logger.error("Failed to send invoice reminder", err, {
      invoiceId: id,
      userId: dbUserId,
    })
    return NextResponse.json(
      { error: "Couldn't send reminder. Try again." },
      { status: 500 },
    )
  }
}
