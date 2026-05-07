import { notFound } from "next/navigation"
import { db } from "@/lib/db"
import { FileText, ExternalLink } from "lucide-react"
import type { ClientInvoiceStatus } from "@prisma/client"

interface LineItem {
  description: string
  quantity: number
  unitPrice: number
  amount: number
  sortOrder: number
}

async function getPublicInvoice(token: string) {
  const invoice = await db.clientInvoice.findUnique({
    where: { shareToken: token },
    select: {
      invoiceNumber: true,
      title: true,
      recipientName: true,
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

  return invoice
}

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount)
}

function formatDate(d: Date | null) {
  if (!d) return null
  return new Date(d).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  })
}

const STATUS_CONFIG: Record<
  ClientInvoiceStatus,
  { label: string; bg: string; text: string; border: string }
> = {
  DRAFT: { label: "Draft", bg: "#F5F5F5", text: "#737373", border: "#E3E3E3" },
  SENT: { label: "Sent", bg: "#EFF6FF", text: "#2563EB", border: "#BFDBFE" },
  PAID: { label: "Paid", bg: "#ECFDF5", text: "#047857", border: "#A7F3D0" },
  OVERDUE: { label: "Overdue", bg: "#FEF2F2", text: "#B91C1C", border: "#FECACA" },
  CANCELLED: { label: "Cancelled", bg: "#F5F5F5", text: "#737373", border: "#E3E3E3" },
}

export default async function PublicInvoicePage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const invoice = await getPublicInvoice(token)

  if (!invoice) notFound()

  const profile = invoice.user?.memberProfile
  const operatorName = profile?.businessName ?? "AI Operator Collective"
  // Default to AI Operator Collective crimson, but respect a member's
  // configured brand color when present.
  const brandColor = profile?.brandColor ?? "#981B1B"
  const tagline = profile?.tagline ?? profile?.oneLiner ?? null

  const statusCfg = STATUS_CONFIG[invoice.status]
  const isPaid = invoice.status === "PAID"
  const dueStr = invoice.dueAt
    ? formatDate(invoice.dueAt)
    : "Upon receipt"

  return (
    <div className="min-h-screen bg-[#F5F5F5] text-[#1A1A1A]">
      {/* Header */}
      <header className="border-b border-[#E3E3E3] bg-white px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            {profile?.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.logoUrl}
                alt={operatorName}
                className="h-9 w-9 rounded-md object-contain border border-[#E3E3E3]"
              />
            ) : (
              <div
                className="h-9 w-9 rounded-md flex items-center justify-center"
                style={{ backgroundColor: `${brandColor}10`, border: `1px solid ${brandColor}25` }}
              >
                <FileText className="h-4 w-4" style={{ color: brandColor }} />
              </div>
            )}
            <div>
              <p className="text-sm font-semibold text-[#1A1A1A]">
                {operatorName}
              </p>
              {tagline && (
                <p className="text-[11px] text-[#737373]">
                  {tagline}
                </p>
              )}
            </div>
          </div>

          <span
            className="text-[11px] font-semibold px-2.5 py-1 rounded-full border"
            style={{
              color: statusCfg.text,
              backgroundColor: statusCfg.bg,
              borderColor: statusCfg.border,
            }}
          >
            {statusCfg.label}
          </span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-10 space-y-6">
        {/* Invoice header */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-[#1A1A1A] break-words">
              {invoice.title}
            </h1>
            <p
              className="mt-1 text-sm font-mono font-semibold"
              style={{ color: brandColor }}
            >
              {invoice.invoiceNumber}
            </p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-[#1A1A1A] tabular-nums">
              {formatCurrency(invoice.total, invoice.currency)}
            </p>
            <p className="text-xs mt-1 text-[#737373]">
              Due: {dueStr}
            </p>
          </div>
        </div>

        {/* Bill To */}
        {(invoice.recipientName || invoice.recipientCompany) && (
          <div className="rounded-xl bg-white border border-[#E3E3E3] p-5">
            <p className="text-[10px] font-semibold uppercase tracking-wider mb-2 text-[#737373]">
              Bill To
            </p>
            {invoice.recipientCompany && (
              <p className="text-base font-bold text-[#1A1A1A]">
                {invoice.recipientCompany}
              </p>
            )}
            {invoice.recipientName && (
              <p className="text-sm text-[#737373]">
                {invoice.recipientName}
              </p>
            )}
          </div>
        )}

        {/* Line items */}
        <div className="rounded-xl overflow-hidden bg-white border border-[#E3E3E3]">
          <table className="w-full">
            <thead>
              <tr className="bg-[#FAFAFA]">
                {["Description", "Qty", "Unit Price", "Amount"].map((h, i) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-[#737373]"
                    style={{ textAlign: i === 0 ? "left" : "right" }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(invoice.lineItems as LineItem[]).map((item, idx) => (
                <tr key={idx} className="border-t border-[#E3E3E3]">
                  <td className="px-4 py-3 text-sm text-[#1A1A1A]">
                    {item.description}
                  </td>
                  <td className="px-4 py-3 text-sm text-right text-[#737373] tabular-nums">
                    {item.quantity}
                  </td>
                  <td className="px-4 py-3 text-sm text-right text-[#737373] tabular-nums">
                    {formatCurrency(item.unitPrice, invoice.currency)}
                  </td>
                  <td className="px-4 py-3 text-sm font-semibold text-right text-[#1A1A1A] tabular-nums">
                    {formatCurrency(item.amount, invoice.currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <div className="px-4 py-4 space-y-2 border-t border-[#E3E3E3] bg-[#FAFAFA]">
            <div className="flex justify-end">
              <div className="w-64 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-[#737373]">Subtotal</span>
                  <span className="text-[#1A1A1A] tabular-nums">
                    {formatCurrency(invoice.subtotal, invoice.currency)}
                  </span>
                </div>
                {invoice.taxRate > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-[#737373]">Tax ({invoice.taxRate}%)</span>
                    <span className="text-[#1A1A1A] tabular-nums">
                      {formatCurrency(invoice.taxAmount, invoice.currency)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-base font-bold pt-2 border-t border-[#E3E3E3]">
                  <span className="text-[#1A1A1A]">Total Due</span>
                  <span className="tabular-nums" style={{ color: brandColor }}>
                    {formatCurrency(invoice.total, invoice.currency)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Invoice details */}
        <div className="rounded-xl bg-white border border-[#E3E3E3] p-5 grid grid-cols-2 gap-x-6 gap-y-4">
          {[
            ["Invoice #", invoice.invoiceNumber],
            ["Payment Terms", invoice.paymentTerms ?? "—"],
            ["Issue Date", formatDate(invoice.createdAt) ?? "—"],
            ["Due Date", dueStr ?? "—"],
            ...(invoice.paidAt ? [["Paid On", formatDate(invoice.paidAt) ?? "—"]] : []),
          ].map(([label, value]) => (
            <div key={String(label)} className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-wider mb-1 text-[#737373]">
                {label}
              </p>
              <p className="text-sm font-medium text-[#1A1A1A] break-words">
                {value}
              </p>
            </div>
          ))}
        </div>

        {/* Notes */}
        {invoice.notes && (
          <div className="rounded-xl bg-white border border-[#E3E3E3] p-5">
            <p className="text-[10px] font-semibold uppercase tracking-wider mb-2 text-[#737373]">
              Notes
            </p>
            <p className="text-sm whitespace-pre-wrap text-[#374151] leading-7">
              {invoice.notes}
            </p>
          </div>
        )}

        {/* Pay Now CTA */}
        {!isPaid && invoice.stripePaymentLink && (
          <div className="text-center">
            <a
              href={invoice.stripePaymentLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-lg text-sm font-bold transition-opacity hover:opacity-90 shadow-sm"
              style={{
                background: brandColor,
                color: "#FFFFFF",
              }}
            >
              <ExternalLink className="h-4 w-4" />
              Pay Now — {formatCurrency(invoice.total, invoice.currency)}
            </a>
          </div>
        )}

        {isPaid && (
          <div className="text-center py-6 rounded-xl border border-[#A7F3D0] bg-[#ECFDF5]">
            <p className="text-[#047857] font-bold text-lg">Paid</p>
            {invoice.paidAt && (
              <p className="text-sm mt-1 text-[#065F46]">
                Received on {formatDate(invoice.paidAt)}
              </p>
            )}
          </div>
        )}

        {/* Powered by */}
        <p className="text-center text-[11px] text-[#9CA3AF]">
          Invoice powered by AI Operator Collective
        </p>
      </main>
    </div>
  )
}
