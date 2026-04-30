/**
 * Auto-mark a ClientInvoice paid when the operator's customer pays via
 * the Stripe payment link generated from the invoice.
 *
 * Wires `checkout.session.completed` events whose `metadata.source ===
 * "client-invoice"` (set by the invoice send endpoint when generating
 * the payment link) back to the originating ClientInvoice. Flips status
 * to PAID, stamps paidAt, logs activity, fires operator notification.
 *
 * Idempotent — re-running on a PAID invoice is a no-op.
 */
import type Stripe from "stripe"
import { db } from "@/lib/db"
import { logger } from "@/lib/logger"
import { sendInternalNotification } from "@/lib/email"
import { emitEvent, EVENT_TYPES } from "@/lib/events/emit"

export async function handleClientInvoicePaid(
  session: Stripe.Checkout.Session,
): Promise<void> {
  if (session.metadata?.source !== "client-invoice") return

  const invoiceId = session.metadata.invoiceId
  if (!invoiceId) {
    logger.warn("client-invoice checkout missing invoiceId metadata", {
      sessionId: session.id,
    })
    return
  }

  const invoice = await db.clientInvoice.findUnique({
    where: { id: invoiceId },
    include: {
      user: { select: { id: true, email: true } },
      clientDeal: { select: { id: true, companyName: true } },
    },
  })
  if (!invoice) {
    logger.warn("Stripe paid event for unknown ClientInvoice", { invoiceId })
    return
  }
  if (invoice.status === "PAID") {
    // Idempotent — already processed
    return
  }

  await db.$transaction(async (tx) => {
    await tx.clientInvoice.update({
      where: { id: invoiceId },
      data: {
        status: "PAID",
        paidAt: new Date(),
        stripeSessionId: session.id,
      },
    })

    if (invoice.clientDealId) {
      await tx.clientDealActivity.create({
        data: {
          clientDealId: invoice.clientDealId,
          type: "INVOICE_PAID",
          description: `Invoice ${invoice.invoiceNumber} paid · $${invoice.total.toLocaleString()} ${invoice.currency}`,
          metadata: {
            invoiceId: invoice.id,
            invoiceNumber: invoice.invoiceNumber,
            amount: invoice.total,
            currency: invoice.currency,
            stripeSessionId: session.id,
          },
        },
      })
    }
  })

  void emitEvent({
    actorId: invoice.user.id,
    type: EVENT_TYPES.INVOICE_PAID,
    entityType: "ClientInvoice",
    entityId: invoice.id,
    metadata: {
      amount: invoice.total,
      currency: invoice.currency,
      dealId: invoice.clientDealId,
      companyName: invoice.clientDeal?.companyName,
    },
  })

  void sendInternalNotification({
    subject: `💰 Invoice paid: ${invoice.invoiceNumber}`,
    message: `${invoice.recipientCompany ?? invoice.recipientName ?? "Client"} just paid invoice ${invoice.invoiceNumber} — $${invoice.total.toLocaleString()} ${invoice.currency}.`,
    urgency: "high",
  }).catch((err) =>
    logger.warn("Invoice-paid notification email failed (non-fatal)", {
      invoiceId,
      error: err instanceof Error ? err.message : String(err),
    }),
  )

  logger.info("ClientInvoice auto-marked PAID via Stripe webhook", {
    invoiceId,
    amount: invoice.total,
    sessionId: session.id,
  })
}
