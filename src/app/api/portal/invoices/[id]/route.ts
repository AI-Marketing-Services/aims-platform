import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { logger } from "@/lib/logger"
import { notify } from "@/lib/notifications"

async function getDbUser(clerkId: string) {
  return db.user.findUnique({ where: { clerkId }, select: { id: true } })
}

async function getInvoice(id: string, userId: string) {
  return db.clientInvoice.findFirst({
    where: { id, userId },
    include: { lineItems: { orderBy: { sortOrder: "asc" } } },
  })
}

const lineItemSchema = z.object({
  id: z.string().optional(),
  description: z.string().min(1),
  quantity: z.number().positive(),
  unitPrice: z.number().min(0),
  sortOrder: z.number().int().default(0),
})

const patchInvoiceSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  clientDealId: z.string().optional().nullable(),
  recipientName: z.string().optional().nullable(),
  recipientEmail: z.string().email().optional().nullable(),
  recipientCompany: z.string().optional().nullable(),
  currency: z.string().length(3).optional(),
  taxRate: z.number().min(0).max(100).optional(),
  notes: z.string().optional().nullable(),
  paymentTerms: z.string().optional().nullable(),
  dueAt: z.string().datetime({ offset: true }).optional().nullable(),
  status: z.enum(["DRAFT", "SENT", "PAID", "OVERDUE", "CANCELLED"]).optional(),
  stripePaymentLink: z.string().url().optional().nullable(),
  paidAt: z.string().datetime({ offset: true }).optional().nullable(),
  lineItems: z.array(lineItemSchema).optional(),
})

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const dbUser = await getDbUser(userId)
  if (!dbUser) return NextResponse.json({ error: "Not found" }, { status: 404 })

  try {
    const { id } = await params
    const invoice = await getInvoice(id, dbUser.id)
    if (!invoice) return NextResponse.json({ error: "Invoice not found" }, { status: 404 })
    return NextResponse.json({ invoice })
  } catch (err) {
    logger.error("Failed to fetch invoice", err, { userId })
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const dbUser = await getDbUser(userId)
  if (!dbUser) return NextResponse.json({ error: "Not found" }, { status: 404 })

  try {
    const { id } = await params
    const existing = await getInvoice(id, dbUser.id)
    if (!existing) return NextResponse.json({ error: "Invoice not found" }, { status: 404 })

    const body = await req.json()
    const parsed = patchInvoiceSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid data", issues: parsed.error.issues }, { status: 400 })
    }

    const { lineItems, dueAt, paidAt, ...rest } = parsed.data

    const taxRate = rest.taxRate ?? existing.taxRate

    let subtotal = existing.subtotal
    let taxAmount = existing.taxAmount
    let total = existing.total

    if (lineItems !== undefined) {
      subtotal = lineItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)
      taxAmount = subtotal * (taxRate / 100)
      total = subtotal + taxAmount

      // Delete all existing line items and recreate
      await db.clientInvoiceLineItem.deleteMany({ where: { invoiceId: id } })
    } else if (rest.taxRate !== undefined) {
      taxAmount = subtotal * (taxRate / 100)
      total = subtotal + taxAmount
    }

    const invoice = await db.clientInvoice.update({
      where: { id },
      data: {
        ...rest,
        subtotal,
        taxAmount,
        total,
        dueAt: dueAt !== undefined ? (dueAt ? new Date(dueAt) : null) : existing.dueAt,
        paidAt: paidAt !== undefined ? (paidAt ? new Date(paidAt) : null) : existing.paidAt,
        ...(lineItems !== undefined
          ? {
              lineItems: {
                create: lineItems.map((item, idx) => ({
                  description: item.description,
                  quantity: item.quantity,
                  unitPrice: item.unitPrice,
                  amount: item.quantity * item.unitPrice,
                  sortOrder: item.sortOrder ?? idx,
                })),
              },
            }
          : {}),
      },
      include: { lineItems: { orderBy: { sortOrder: "asc" } } },
    })

    // Notify when marked as paid
    if (parsed.data.status === "PAID" && existing.status !== "PAID") {
      const totalStr = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: existing.currency,
      }).format(existing.total)
      notify({
        userId: dbUser.id,
        channel: "IN_APP",
        type: "invoice_paid",
        title: "Invoice paid",
        message: `Invoice ${existing.invoiceNumber} (${totalStr}) marked as paid.`,
        metadata: { link: `/portal/invoices/${id}` },
      }).catch((err) => logger.error("Failed to create invoice_paid notification", err, { invoiceId: id }))
    }

    return NextResponse.json({ invoice })
  } catch (err) {
    logger.error("Failed to update invoice", err, { userId })
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const dbUser = await getDbUser(userId)
  if (!dbUser) return NextResponse.json({ error: "Not found" }, { status: 404 })

  try {
    const { id } = await params
    const invoice = await getInvoice(id, dbUser.id)
    if (!invoice) return NextResponse.json({ error: "Invoice not found" }, { status: 404 })
    if (invoice.status !== "DRAFT") {
      return NextResponse.json({ error: "Only DRAFT invoices can be deleted" }, { status: 409 })
    }

    await db.clientInvoice.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (err) {
    logger.error("Failed to delete invoice", err, { userId })
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
