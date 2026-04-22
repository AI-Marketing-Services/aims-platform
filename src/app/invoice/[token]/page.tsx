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
  DRAFT: { label: "Draft", bg: "#1f2330", text: "#9CA3AF", border: "#2a3040" },
  SENT: { label: "Sent", bg: "rgba(59,130,246,0.1)", text: "#60a5fa", border: "rgba(59,130,246,0.2)" },
  PAID: { label: "Paid", bg: "rgba(16,185,129,0.1)", text: "#34d399", border: "rgba(16,185,129,0.2)" },
  OVERDUE: { label: "Overdue", bg: "rgba(239,68,68,0.1)", text: "#f87171", border: "rgba(239,68,68,0.2)" },
  CANCELLED: { label: "Cancelled", bg: "#1f2330", text: "#6B7280", border: "#2a3040" },
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
  const brandColor = profile?.brandColor ?? "#C4972A"
  const tagline = profile?.tagline ?? profile?.oneLiner ?? null

  const statusCfg = STATUS_CONFIG[invoice.status]
  const isPaid = invoice.status === "PAID"
  const dueStr = invoice.dueAt
    ? formatDate(invoice.dueAt)
    : "Upon receipt"

  return (
    <div className="min-h-screen" style={{ background: "#08090D", color: "#F0EBE0" }}>
      {/* Header */}
      <header
        className="border-b px-6 py-4"
        style={{ borderColor: `${brandColor}30` }}
      >
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            {profile?.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.logoUrl}
                alt={operatorName}
                className="h-8 w-8 rounded object-contain"
              />
            ) : (
              <div
                className="h-8 w-8 rounded flex items-center justify-center"
                style={{ backgroundColor: `${brandColor}20` }}
              >
                <FileText className="h-4 w-4" style={{ color: brandColor }} />
              </div>
            )}
            <div>
              <p className="text-sm font-semibold" style={{ color: "#F0EBE0" }}>
                {operatorName}
              </p>
              {tagline && (
                <p className="text-[11px]" style={{ color: "#9CA3AF" }}>
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

      <main className="max-w-3xl mx-auto px-6 py-10 space-y-8">
        {/* Invoice header */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: "#F0EBE0" }}>
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
            <p className="text-3xl font-bold" style={{ color: "#F0EBE0" }}>
              {formatCurrency(invoice.total, invoice.currency)}
            </p>
            <p className="text-xs mt-1" style={{ color: "#9CA3AF" }}>
              Due: {dueStr}
            </p>
          </div>
        </div>

        {/* Bill To */}
        {(invoice.recipientName || invoice.recipientCompany) && (
          <div
            className="rounded-xl p-5"
            style={{ background: "#141923", border: "1px solid #1f2d3d" }}
          >
            <p
              className="text-[10px] font-semibold uppercase tracking-wider mb-2"
              style={{ color: "#9CA3AF" }}
            >
              Bill To
            </p>
            {invoice.recipientCompany && (
              <p className="text-base font-bold" style={{ color: "#F0EBE0" }}>
                {invoice.recipientCompany}
              </p>
            )}
            {invoice.recipientName && (
              <p className="text-sm" style={{ color: "#9CA3AF" }}>
                {invoice.recipientName}
              </p>
            )}
          </div>
        )}

        {/* Line items */}
        <div
          className="rounded-xl overflow-hidden"
          style={{ background: "#141923", border: "1px solid #1f2d3d" }}
        >
          <table className="w-full">
            <thead>
              <tr style={{ background: "#0f1620" }}>
                {["Description", "Qty", "Unit Price", "Amount"].map((h, i) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-[10px] font-semibold uppercase tracking-wider"
                    style={{
                      color: "#9CA3AF",
                      textAlign: i === 0 ? "left" : "right",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(invoice.lineItems as LineItem[]).map((item, idx) => (
                <tr
                  key={idx}
                  style={{ borderTop: "1px solid #1f2d3d" }}
                >
                  <td
                    className="px-4 py-3 text-sm"
                    style={{ color: "#F0EBE0" }}
                  >
                    {item.description}
                  </td>
                  <td
                    className="px-4 py-3 text-sm text-right"
                    style={{ color: "#9CA3AF" }}
                  >
                    {item.quantity}
                  </td>
                  <td
                    className="px-4 py-3 text-sm text-right"
                    style={{ color: "#9CA3AF" }}
                  >
                    {formatCurrency(item.unitPrice, invoice.currency)}
                  </td>
                  <td
                    className="px-4 py-3 text-sm font-semibold text-right"
                    style={{ color: "#F0EBE0" }}
                  >
                    {formatCurrency(item.amount, invoice.currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <div
            className="px-4 py-4 space-y-2"
            style={{ borderTop: "1px solid #1f2d3d" }}
          >
            <div className="flex justify-end">
              <div className="w-64 space-y-2">
                <div className="flex justify-between text-sm">
                  <span style={{ color: "#9CA3AF" }}>Subtotal</span>
                  <span style={{ color: "#F0EBE0" }}>
                    {formatCurrency(invoice.subtotal, invoice.currency)}
                  </span>
                </div>
                {invoice.taxRate > 0 && (
                  <div className="flex justify-between text-sm">
                    <span style={{ color: "#9CA3AF" }}>Tax ({invoice.taxRate}%)</span>
                    <span style={{ color: "#F0EBE0" }}>
                      {formatCurrency(invoice.taxAmount, invoice.currency)}
                    </span>
                  </div>
                )}
                <div
                  className="flex justify-between text-base font-bold pt-2"
                  style={{ borderTop: "1px solid #1f2d3d" }}
                >
                  <span style={{ color: "#F0EBE0" }}>Total Due</span>
                  <span style={{ color: brandColor }}>
                    {formatCurrency(invoice.total, invoice.currency)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Invoice details */}
        <div
          className="rounded-xl p-5 grid grid-cols-2 gap-4"
          style={{ background: "#141923", border: "1px solid #1f2d3d" }}
        >
          {[
            ["Invoice #", invoice.invoiceNumber],
            ["Payment Terms", invoice.paymentTerms ?? "—"],
            ["Issue Date", formatDate(invoice.createdAt) ?? "—"],
            ["Due Date", dueStr ?? "—"],
            ...(invoice.paidAt ? [["Paid On", formatDate(invoice.paidAt) ?? "—"]] : []),
          ].map(([label, value]) => (
            <div key={String(label)}>
              <p
                className="text-[10px] font-semibold uppercase tracking-wider mb-1"
                style={{ color: "#9CA3AF" }}
              >
                {label}
              </p>
              <p className="text-sm font-medium" style={{ color: "#F0EBE0" }}>
                {value}
              </p>
            </div>
          ))}
        </div>

        {/* Notes */}
        {invoice.notes && (
          <div
            className="rounded-xl p-5"
            style={{ background: "#141923", border: "1px solid #1f2d3d" }}
          >
            <p
              className="text-[10px] font-semibold uppercase tracking-wider mb-2"
              style={{ color: "#9CA3AF" }}
            >
              Notes
            </p>
            <p
              className="text-sm whitespace-pre-wrap"
              style={{ color: "#F0EBE0", lineHeight: "1.7" }}
            >
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
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl text-sm font-bold transition-opacity hover:opacity-90"
              style={{
                background: brandColor,
                color: "#08090D",
              }}
            >
              <ExternalLink className="h-4 w-4" />
              Pay Now — {formatCurrency(invoice.total, invoice.currency)}
            </a>
          </div>
        )}

        {isPaid && (
          <div
            className="text-center py-6 rounded-xl"
            style={{
              background: "rgba(16,185,129,0.05)",
              border: "1px solid rgba(16,185,129,0.2)",
            }}
          >
            <p className="text-emerald-400 font-bold text-lg">Paid</p>
            {invoice.paidAt && (
              <p className="text-sm mt-1" style={{ color: "#9CA3AF" }}>
                Received on {formatDate(invoice.paidAt)}
              </p>
            )}
          </div>
        )}

        {/* Powered by */}
        <p className="text-center text-[11px]" style={{ color: "#4B5563" }}>
          Invoice powered by AIMS · AI Managing Services
        </p>
      </main>
    </div>
  )
}
