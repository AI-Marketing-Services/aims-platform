import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { logger } from "@/lib/logger"

async function getDbUser(clerkId: string) {
  return db.user.findUnique({ where: { clerkId }, select: { id: true } })
}

async function generateInvoiceNumber(userId: string): Promise<string> {
  const year = new Date().getFullYear()
  const count = await db.clientInvoice.count({
    where: { userId, invoiceNumber: { startsWith: `INV-${year}-` } },
  })
  return `INV-${year}-${String(count + 1).padStart(3, "0")}`
}

const lineItemSchema = z.object({
  description: z.string().min(1),
  quantity: z.number().positive(),
  unitPrice: z.number().min(0),
  sortOrder: z.number().int().default(0),
})

const createInvoiceSchema = z.object({
  title: z.string().min(1).max(200),
  clientDealId: z.string().optional().nullable(),
  recipientName: z.string().optional().nullable(),
  recipientEmail: z.string().email().optional().nullable(),
  recipientCompany: z.string().optional().nullable(),
  currency: z.string().length(3).default("USD"),
  taxRate: z.number().min(0).max(100).default(0),
  notes: z.string().optional().nullable(),
  paymentTerms: z.string().optional().nullable(),
  dueAt: z.string().datetime({ offset: true }).optional().nullable(),
  lineItems: z.array(lineItemSchema).default([]),
})

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const dbUser = await getDbUser(userId)
  if (!dbUser) return NextResponse.json({ error: "Not found" }, { status: 404 })

  try {
    const invoices = await db.clientInvoice.findMany({
      where: { userId: dbUser.id },
      include: {
        lineItems: { orderBy: { sortOrder: "asc" } },
        clientDeal: { select: { id: true, companyName: true, contactName: true } },
      },
      orderBy: { createdAt: "desc" },
    })
    return NextResponse.json({ invoices })
  } catch (err) {
    logger.error("Failed to fetch invoices", err, { userId })
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const dbUser = await getDbUser(userId)
  if (!dbUser) return NextResponse.json({ error: "Not found" }, { status: 404 })

  try {
    const body = await req.json()
    const parsed = createInvoiceSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid data", issues: parsed.error.issues }, { status: 400 })
    }

    const { lineItems, dueAt, ...rest } = parsed.data

    const subtotal = lineItems.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0,
    )
    const taxAmount = subtotal * (parsed.data.taxRate / 100)
    const total = subtotal + taxAmount

    const invoiceNumber = await generateInvoiceNumber(dbUser.id)

    const invoice = await db.clientInvoice.create({
      data: {
        userId: dbUser.id,
        invoiceNumber,
        subtotal,
        taxAmount,
        total,
        dueAt: dueAt ? new Date(dueAt) : null,
        ...rest,
        lineItems: {
          create: lineItems.map((item, idx) => ({
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            amount: item.quantity * item.unitPrice,
            sortOrder: item.sortOrder ?? idx,
          })),
        },
      },
      include: {
        lineItems: { orderBy: { sortOrder: "asc" } },
      },
    })

    return NextResponse.json({ invoice }, { status: 201 })
  } catch (err) {
    logger.error("Failed to create invoice", err, { userId })
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
