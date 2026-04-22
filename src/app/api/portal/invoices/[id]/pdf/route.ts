import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import PDFDocument from "pdfkit"
import { db } from "@/lib/db"
import { logger } from "@/lib/logger"

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

function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount)
}

async function buildInvoicePDF(opts: {
  invoiceNumber: string
  title: string
  recipientName: string | null
  recipientEmail: string | null
  recipientCompany: string | null
  currency: string
  subtotal: number
  taxRate: number
  taxAmount: number
  total: number
  notes: string | null
  paymentTerms: string | null
  dueAt: Date | null
  createdAt: Date
  lineItems: Array<{ description: string; quantity: number; unitPrice: number; amount: number }>
  operatorName: string
  brandColor: string
}): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    const doc = new PDFDocument({ size: "LETTER", margin: 56 })

    doc.on("data", (chunk: Buffer) => chunks.push(chunk))
    doc.on("end", () => resolve(Buffer.concat(chunks)))
    doc.on("error", reject)

    const gold = opts.brandColor
    const PW = 612
    const M = 56
    const CW = PW - M * 2

    // ── Header ──────────────────────────────────────────────────────────────
    doc
      .rect(M, 40, CW, 2)
      .fill(gold)

    doc
      .font("Helvetica-Bold")
      .fontSize(18)
      .fillColor("#111827")
      .text(opts.operatorName, M, 54)

    doc
      .font("Helvetica-Bold")
      .fontSize(10)
      .fillColor(gold)
      .text("INVOICE", PW - M - 80, 54, { width: 80, align: "right" })

    doc
      .font("Helvetica")
      .fontSize(10)
      .fillColor("#6B7280")
      .text(opts.invoiceNumber, PW - M - 80, 68, { width: 80, align: "right" })

    // ── Invoice title ────────────────────────────────────────────────────────
    doc.moveDown(2.5)
    doc
      .font("Helvetica-Bold")
      .fontSize(16)
      .fillColor("#111827")
      .text(opts.title, M)

    doc.moveDown(0.3)
    doc
      .font("Helvetica")
      .fontSize(9)
      .fillColor("#9CA3AF")
      .text(
        `Issued ${opts.createdAt.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`,
        M,
      )

    // ── Bill To / Details columns ────────────────────────────────────────────
    const colY = doc.y + 20
    const halfW = CW / 2 - 10

    // Bill To
    doc
      .font("Helvetica-Bold")
      .fontSize(8)
      .fillColor("#9CA3AF")
      .text("BILL TO", M, colY)

    let billY = colY + 14
    if (opts.recipientCompany) {
      doc.font("Helvetica-Bold").fontSize(11).fillColor("#111827").text(opts.recipientCompany, M, billY)
      billY += 15
    }
    if (opts.recipientName) {
      doc.font("Helvetica").fontSize(10).fillColor("#374151").text(opts.recipientName, M, billY)
      billY += 14
    }
    if (opts.recipientEmail) {
      doc.font("Helvetica").fontSize(10).fillColor("#374151").text(opts.recipientEmail, M, billY)
    }

    // Invoice details
    const detailX = M + halfW + 20
    doc
      .font("Helvetica-Bold")
      .fontSize(8)
      .fillColor("#9CA3AF")
      .text("INVOICE DETAILS", detailX, colY)

    const details: Array<[string, string]> = [
      ["Invoice #", opts.invoiceNumber],
      ["Due Date", opts.dueAt
        ? opts.dueAt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
        : "Upon receipt"],
    ]
    if (opts.paymentTerms) details.push(["Terms", opts.paymentTerms])

    let detailY = colY + 14
    details.forEach(([label, value]) => {
      doc
        .font("Helvetica")
        .fontSize(9)
        .fillColor("#6B7280")
        .text(label, detailX, detailY, { width: 70 })
      doc
        .font("Helvetica-Bold")
        .fontSize(9)
        .fillColor("#111827")
        .text(value, detailX + 75, detailY, { width: halfW - 75 })
      detailY += 14
    })

    // ── Line items table ─────────────────────────────────────────────────────
    const tableTop = Math.max(doc.y, detailY) + 30
    const col = { desc: M, qty: M + CW * 0.5, price: M + CW * 0.7, amount: M + CW * 0.85 }
    const colW = { desc: CW * 0.5, qty: CW * 0.2, price: CW * 0.15, amount: CW * 0.15 }

    // Table header bg
    doc.rect(M, tableTop, CW, 22).fill("#F3F4F6")

    const headerY = tableTop + 7
    doc.font("Helvetica-Bold").fontSize(8).fillColor("#6B7280")
    doc.text("DESCRIPTION", col.desc + 6, headerY, { width: colW.desc })
    doc.text("QTY", col.qty, headerY, { width: colW.qty, align: "center" })
    doc.text("UNIT PRICE", col.price, headerY, { width: colW.price, align: "right" })
    doc.text("AMOUNT", col.amount, headerY, { width: colW.amount, align: "right" })

    let rowY = tableTop + 22
    opts.lineItems.forEach((item, i) => {
      const rowBg = i % 2 === 0 ? "#FFFFFF" : "#F9FAFB"
      const rowH = 22

      doc.rect(M, rowY, CW, rowH).fill(rowBg)

      doc
        .font("Helvetica")
        .fontSize(9)
        .fillColor("#111827")
        .text(item.description, col.desc + 6, rowY + 7, { width: colW.desc - 6, ellipsis: true })

      doc
        .text(String(item.quantity), col.qty, rowY + 7, { width: colW.qty, align: "center" })

      doc
        .text(formatCurrency(item.unitPrice, opts.currency), col.price, rowY + 7, {
          width: colW.price,
          align: "right",
        })

      doc
        .font("Helvetica-Bold")
        .text(formatCurrency(item.amount, opts.currency), col.amount, rowY + 7, {
          width: colW.amount,
          align: "right",
        })

      rowY += rowH
    })

    // Bottom border
    doc.rect(M, rowY, CW, 1).fill("#E5E7EB")
    rowY += 16

    // ── Totals ───────────────────────────────────────────────────────────────
    const totalsX = M + CW * 0.6
    const totalsW = CW * 0.4

    const addTotalRow = (label: string, value: string, bold = false, y = 0) => {
      const ty = y || rowY
      doc
        .font(bold ? "Helvetica-Bold" : "Helvetica")
        .fontSize(9)
        .fillColor(bold ? "#111827" : "#6B7280")
        .text(label, totalsX, ty, { width: totalsW * 0.55 })
      doc
        .font(bold ? "Helvetica-Bold" : "Helvetica")
        .fontSize(9)
        .fillColor(bold ? "#111827" : "#374151")
        .text(value, totalsX + totalsW * 0.55, ty, { width: totalsW * 0.45, align: "right" })
      return ty + 16
    }

    rowY = addTotalRow("Subtotal", formatCurrency(opts.subtotal, opts.currency))
    if (opts.taxRate > 0) {
      rowY = addTotalRow(`Tax (${opts.taxRate}%)`, formatCurrency(opts.taxAmount, opts.currency))
    }

    // Total bar
    doc.rect(totalsX, rowY, totalsW, 26).fill(gold)
    doc
      .font("Helvetica-Bold")
      .fontSize(10)
      .fillColor("#FFFFFF")
      .text("TOTAL DUE", totalsX + 8, rowY + 8, { width: totalsW * 0.55 })
    doc
      .font("Helvetica-Bold")
      .fontSize(10)
      .fillColor("#FFFFFF")
      .text(formatCurrency(opts.total, opts.currency), totalsX + totalsW * 0.55, rowY + 8, {
        width: totalsW * 0.45 - 8,
        align: "right",
      })

    rowY += 40

    // ── Notes ────────────────────────────────────────────────────────────────
    if (opts.notes) {
      doc
        .font("Helvetica-Bold")
        .fontSize(8)
        .fillColor("#9CA3AF")
        .text("NOTES", M, rowY)
      doc
        .font("Helvetica")
        .fontSize(9)
        .fillColor("#374151")
        .text(opts.notes, M, rowY + 12, { width: CW })
    }

    // ── Footer ───────────────────────────────────────────────────────────────
    const footerY = 720
    doc.rect(M, footerY, CW, 1).fill("#E5E7EB")
    doc
      .font("Helvetica")
      .fontSize(8)
      .fillColor("#9CA3AF")
      .text(
        `Generated by AIMS · AI Managing Services · aioperatorcollective.com`,
        M,
        footerY + 8,
        { width: CW, align: "center" },
      )

    doc.end()
  })
}

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

    const invoice = await db.clientInvoice.findFirst({
      where: { id, userId: dbUser.id },
      include: { lineItems: { orderBy: { sortOrder: "asc" } } },
    })
    if (!invoice) return NextResponse.json({ error: "Invoice not found" }, { status: 404 })

    const operatorName = dbUser.memberProfile?.businessName ?? "AI Operator Collective"
    const brandColor = dbUser.memberProfile?.brandColor ?? "#C4972A"

    const pdfBuffer = await buildInvoicePDF({
      invoiceNumber: invoice.invoiceNumber,
      title: invoice.title,
      recipientName: invoice.recipientName,
      recipientEmail: invoice.recipientEmail,
      recipientCompany: invoice.recipientCompany,
      currency: invoice.currency,
      subtotal: invoice.subtotal,
      taxRate: invoice.taxRate,
      taxAmount: invoice.taxAmount,
      total: invoice.total,
      notes: invoice.notes,
      paymentTerms: invoice.paymentTerms,
      dueAt: invoice.dueAt,
      createdAt: invoice.createdAt,
      lineItems: invoice.lineItems,
      operatorName,
      brandColor,
    })

    return new Response(pdfBuffer as unknown as BodyInit, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${invoice.invoiceNumber}.pdf"`,
        "Content-Length": String(pdfBuffer.length),
      },
    })
  } catch (err) {
    logger.error("Failed to generate invoice PDF", err, { userId })
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
