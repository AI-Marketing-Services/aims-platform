import { NextResponse } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { logger } from "@/lib/logger"
import { emitEvent, EVENT_TYPES } from "@/lib/events/emit"
import { sendInternalNotification } from "@/lib/email"

export const dynamic = "force-dynamic"

/**
 * POST /api/proposals/:shareToken/respond
 *
 * Public endpoint — recipient of the proposal clicks Accept or Reject
 * on the public share page. No auth (the share token IS the auth).
 *
 * On accept:
 *   - proposal.status → "ACCEPTED"
 *   - ClientDealActivity logged (PROPOSAL_ACCEPTED)
 *   - Deal stage advanced to ACTIVE_RETAINER if not already terminal
 *   - Auto-create a ClientInvoice draft for proposal.totalValue (operator
 *     can edit + send) — closes the proposal→invoice→cash loop without
 *     manual data re-entry
 *   - Operator notified via internal email
 *   - PROPOSAL_ACCEPTED event emitted to the universal log
 *
 * On reject (with optional reason):
 *   - proposal.status → "REJECTED"
 *   - ClientDealActivity logged with reason in description
 *   - PROPOSAL_REJECTED event emitted
 *   - Operator notified
 */
const responseSchema = z.object({
  action: z.enum(["accept", "reject"]),
  recipientName: z.string().max(120).optional(),
  reason: z.string().max(1000).optional(),
})

export async function POST(
  req: Request,
  { params }: { params: Promise<{ shareToken: string }> },
) {
  const { shareToken } = await params

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }
  const parsed = responseSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid response", issues: parsed.error.issues },
      { status: 400 },
    )
  }

  const proposal = await db.clientProposal.findUnique({
    where: { shareToken },
    include: {
      clientDeal: {
        include: {
          user: { select: { id: true, email: true, name: true } },
        },
      },
    },
  })
  if (!proposal) {
    return NextResponse.json({ error: "Proposal not found" }, { status: 404 })
  }

  // Idempotency — accepting/rejecting twice is harmless if status already
  // matches; otherwise refuse to flip a terminal-state proposal.
  if (
    proposal.status === "ACCEPTED" &&
    parsed.data.action === "accept"
  ) {
    return NextResponse.json({ ok: true, status: proposal.status, alreadyResponded: true })
  }
  if (
    proposal.status === "REJECTED" &&
    parsed.data.action === "reject"
  ) {
    return NextResponse.json({ ok: true, status: proposal.status, alreadyResponded: true })
  }
  if (
    proposal.status === "ACCEPTED" ||
    proposal.status === "REJECTED"
  ) {
    return NextResponse.json(
      { error: `Proposal is already ${proposal.status.toLowerCase()}` },
      { status: 409 },
    )
  }

  const newStatus = parsed.data.action === "accept" ? "ACCEPTED" : "REJECTED"
  const now = new Date()
  const reasonSuffix =
    parsed.data.reason?.trim() ? ` — ${parsed.data.reason.trim()}` : ""
  const recipientLabel =
    parsed.data.recipientName?.trim() ?? "the recipient"

  try {
    // Advance everything in a transaction so we never leave a half-state
    // (e.g. proposal accepted but no invoice + no activity log).
    const operator = proposal.clientDeal.user
    const dealId = proposal.clientDealId

    await db.$transaction(async (tx) => {
      // 1. Flip proposal status
      await tx.clientProposal.update({
        where: { id: proposal.id },
        data: { status: newStatus },
      })

      // 2. Log activity
      await tx.clientDealActivity.create({
        data: {
          clientDealId: dealId,
          type:
            newStatus === "ACCEPTED"
              ? "PROPOSAL_ACCEPTED"
              : "PROPOSAL_REJECTED",
          description:
            newStatus === "ACCEPTED"
              ? `Proposal accepted by ${recipientLabel}${reasonSuffix}`
              : `Proposal declined by ${recipientLabel}${reasonSuffix}`,
          metadata: {
            proposalId: proposal.id,
            proposalTitle: proposal.title,
            recipientName: parsed.data.recipientName ?? null,
            reason: parsed.data.reason ?? null,
          },
        },
      })

      // 3. On accept: advance deal stage if not terminal + create invoice draft
      if (newStatus === "ACCEPTED") {
        // Bump deal value to proposal value if deal value is unset
        await tx.clientDeal.update({
          where: { id: dealId },
          data: {
            stage:
              proposal.clientDeal.stage === "COMPLETED" ||
              proposal.clientDeal.stage === "LOST"
                ? proposal.clientDeal.stage
                : "ACTIVE_RETAINER",
            ...(proposal.clientDeal.value === 0
              ? { value: proposal.totalValue }
              : {}),
            wonAt: proposal.clientDeal.wonAt ?? now,
          },
        })

        // Auto-create draft invoice for the proposal's totalValue.
        // Operator can edit before sending. Closes the
        // proposal-→-cash loop without manual re-entry.
        if (proposal.totalValue > 0) {
          // Build a sequential invoice number for this operator.
          const lastInvoice = await tx.clientInvoice.findFirst({
            where: { userId: operator.id },
            orderBy: { createdAt: "desc" },
            select: { invoiceNumber: true },
          })
          const yearPart = new Date().getUTCFullYear()
          const lastNum =
            lastInvoice?.invoiceNumber?.match(/(\d+)$/)?.[1] ?? "000"
          const nextNum = String(parseInt(lastNum, 10) + 1).padStart(3, "0")
          const invoiceNumber = `INV-${yearPart}-${nextNum}`

          await tx.clientInvoice.create({
            data: {
              userId: operator.id,
              clientDealId: dealId,
              invoiceNumber,
              title: proposal.title,
              status: "DRAFT",
              currency: proposal.currency,
              recipientName: proposal.clientDeal.contactName ?? proposal.clientDeal.companyName,
              recipientEmail: proposal.clientDeal.contactEmail ?? "",
              recipientCompany: proposal.clientDeal.companyName,
              subtotal: proposal.totalValue,
              taxRate: 0,
              taxAmount: 0,
              total: proposal.totalValue,
              notes: `Auto-generated from accepted proposal: ${proposal.title}`,
              lineItems: {
                create: {
                  description: proposal.title,
                  quantity: 1,
                  unitPrice: proposal.totalValue,
                  amount: proposal.totalValue,
                },
              },
            },
          })
        }
      }
    })

    // Universal event log
    void emitEvent({
      actorId: operator.id,
      type:
        newStatus === "ACCEPTED"
          ? EVENT_TYPES.PROPOSAL_ACCEPTED
          : EVENT_TYPES.PROPOSAL_REJECTED,
      entityType: "ClientProposal",
      entityId: proposal.id,
      metadata: {
        action: parsed.data.action,
        proposalId: proposal.id,
        dealId,
        totalValue: proposal.totalValue,
        recipientName: parsed.data.recipientName ?? null,
        reason: parsed.data.reason ?? null,
      },
    })

    // Operator notification
    void sendInternalNotification({
      subject:
        newStatus === "ACCEPTED"
          ? `Proposal accepted: ${proposal.title}`
          : `Proposal declined: ${proposal.title}`,
      message:
        newStatus === "ACCEPTED"
          ? `${recipientLabel} accepted your proposal "${proposal.title}" for $${proposal.totalValue.toLocaleString()}. We've auto-created a draft invoice you can edit + send.${reasonSuffix}`
          : `${recipientLabel} declined your proposal "${proposal.title}".${reasonSuffix}`,
      urgency: newStatus === "ACCEPTED" ? "high" : "normal",
    }).catch((err) =>
      logger.warn("Proposal notification email failed (non-fatal)", {
        proposalId: proposal.id,
        error: err instanceof Error ? err.message : String(err),
      }),
    )

    return NextResponse.json({
      ok: true,
      status: newStatus,
      proposalId: proposal.id,
      invoiceCreated: newStatus === "ACCEPTED" && proposal.totalValue > 0,
    })
  } catch (err) {
    logger.error("Proposal respond failed", err, {
      shareToken,
      proposalId: proposal.id,
      action: parsed.data.action,
    })
    return NextResponse.json(
      { error: "Couldn't record your response. Please try again." },
      { status: 500 },
    )
  }
}
