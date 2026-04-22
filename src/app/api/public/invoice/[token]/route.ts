import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { logger } from "@/lib/logger"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  try {
    const { token } = await params

    const invoice = await db.clientInvoice.findUnique({
      where: { shareToken: token },
      select: {
        invoiceNumber: true,
        title: true,
        recipientName: true,
        recipientEmail: true,
        recipientCompany: true,
        status: true,
        currency: true,
        subtotal: true,
        taxRate: true,
        taxAmount: true,
        total: true,
        notes: true,
        paymentTerms: true,
        stripePaymentLink: true,
        dueAt: true,
        sentAt: true,
        paidAt: true,
        createdAt: true,
        lineItems: {
          orderBy: { sortOrder: "asc" },
          select: {
            description: true,
            quantity: true,
            unitPrice: true,
            amount: true,
            sortOrder: true,
          },
        },
        user: {
          select: {
            memberProfile: {
              select: {
                businessName: true,
                brandColor: true,
                logoUrl: true,
                tagline: true,
                oneLiner: true,
              },
            },
          },
        },
      },
    })

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 })
    }

    const { user, ...invoiceData } = invoice
    const profile = user?.memberProfile

    return NextResponse.json({
      invoice: invoiceData,
      operator: {
        businessName: profile?.businessName ?? "AI Operator Collective",
        brandColor: profile?.brandColor ?? "#C4972A",
        logoUrl: profile?.logoUrl ?? null,
        tagline: profile?.tagline ?? profile?.oneLiner ?? null,
      },
    })
  } catch (err) {
    logger.error("Failed to fetch public invoice", err)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
