"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import {
  ChevronLeft,
  FileText,
  Send,
  Download,
  CheckCircle2,
  Copy,
  Check,
  Loader2,
  AlertTriangle,
  Trash2,
} from "lucide-react"
import type { ClientInvoiceStatus } from "@prisma/client"

interface LineItem {
  id: string
  description: string
  quantity: number
  unitPrice: number
  amount: number
  sortOrder: number
}

interface Invoice {
  id: string
  invoiceNumber: string
  title: string
  recipientName: string | null
  recipientEmail: string | null
  recipientCompany: string | null
  status: ClientInvoiceStatus
  currency: string
  subtotal: number
  taxRate: number
  taxAmount: number
  total: number
  notes: string | null
  paymentTerms: string | null
  shareToken: string | null
  stripePaymentLink: string | null
  dueAt: string | null
  sentAt: string | null
  paidAt: string | null
  createdAt: string
  lineItems: LineItem[]
  clientDeal?: { id: string; companyName: string; contactName: string | null } | null
}

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount)
}

function formatDate(d: string | null) {
  if (!d) return "—"
  return new Date(d).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  })
}

const STATUS_CONFIG: Record<
  ClientInvoiceStatus,
  { label: string; className: string }
> = {
  DRAFT: { label: "Draft", className: "bg-[#1f2330] text-[#9CA3AF] border border-[#2a3040]" },
  SENT: { label: "Sent", className: "bg-blue-500/10 text-blue-400 border border-blue-500/20" },
  PAID: { label: "Paid", className: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" },
  OVERDUE: { label: "Overdue", className: "bg-red-500/10 text-red-400 border border-red-500/20" },
  CANCELLED: { label: "Cancelled", className: "bg-[#1f2330] text-[#6B7280] border border-[#2a3040]" },
}

const BASE_URL =
  typeof window !== "undefined"
    ? window.location.origin
    : "https://www.aioperatorcollective.com"

export default function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sendConfirm, setSendConfirm] = useState(false)
  const [sending, setSending] = useState(false)
  const [markingPaid, setMarkingPaid] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [copied, setCopied] = useState(false)
  const [pdfLoading, setPdfLoading] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  const fetchInvoice = useCallback(async () => {
    try {
      const res = await fetch(`/api/portal/invoices/${id}`)
      if (!res.ok) throw new Error("Failed to load invoice")
      const data = await res.json()
      setInvoice(data.invoice)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load")
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { fetchInvoice() }, [fetchInvoice])

  const handleSend = useCallback(async () => {
    if (!invoice) return
    setSending(true)
    setActionError(null)
    try {
      const res = await fetch(`/api/portal/invoices/${id}/send`, { method: "POST" })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error ?? "Failed to send")
      }
      await fetchInvoice()
      setSendConfirm(false)
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Send failed")
    } finally {
      setSending(false)
    }
  }, [id, invoice, fetchInvoice])

  const handleMarkPaid = useCallback(async () => {
    if (!invoice) return
    setMarkingPaid(true)
    setActionError(null)
    try {
      const res = await fetch(`/api/portal/invoices/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "PAID", paidAt: new Date().toISOString() }),
      })
      if (!res.ok) throw new Error("Failed to mark paid")
      await fetchInvoice()
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed")
    } finally {
      setMarkingPaid(false)
    }
  }, [id, invoice, fetchInvoice])

  const handleDelete = useCallback(async () => {
    if (!invoice || invoice.status !== "DRAFT") return
    if (!confirm("Delete this draft invoice? This cannot be undone.")) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/portal/invoices/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to delete")
      router.push("/portal/invoices")
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Delete failed")
      setDeleting(false)
    }
  }, [id, invoice, router])

  const handleDownloadPdf = useCallback(async () => {
    setPdfLoading(true)
    try {
      const res = await fetch(`/api/portal/invoices/${id}/pdf`)
      if (!res.ok) throw new Error("PDF generation failed")
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${invoice?.invoiceNumber ?? "invoice"}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "PDF failed")
    } finally {
      setPdfLoading(false)
    }
  }, [id, invoice])

  const handleCopyLink = useCallback(async () => {
    if (!invoice?.shareToken) return
    await navigator.clipboard.writeText(`${BASE_URL}/invoice/${invoice.shareToken}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [invoice])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Loader2 className="h-6 w-6 animate-spin text-[#C4972A]" />
      </div>
    )
  }

  if (error || !invoice) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-12 text-center">
        <p className="text-[#9CA3AF]">{error ?? "Invoice not found"}</p>
        <Link href="/portal/invoices" className="mt-4 inline-block text-sm text-[#C4972A] hover:underline">
          Back to invoices
        </Link>
      </div>
    )
  }

  const statusCfg = STATUS_CONFIG[invoice.status]
  const shareUrl = invoice.shareToken ? `${BASE_URL}/invoice/${invoice.shareToken}` : null
  const canSend = invoice.status === "DRAFT" || invoice.status === "SENT"
  const canMarkPaid = invoice.status === "SENT" || invoice.status === "OVERDUE"
  const canDelete = invoice.status === "DRAFT"

  return (
    <div className="max-w-5xl mx-auto px-6 py-6 space-y-6">
      {/* Back */}
      <Link
        href="/portal/invoices"
        className="inline-flex items-center gap-1.5 text-xs text-[#9CA3AF] hover:text-[#F0EBE0] transition-colors"
      >
        <ChevronLeft className="h-3.5 w-3.5" />
        Back to invoices
      </Link>

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-[#C4972A]/10 flex items-center justify-center shrink-0">
            <FileText className="h-5 w-5 text-[#C4972A]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-[#F0EBE0]">{invoice.title}</h1>
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${statusCfg.className}`}
              >
                {statusCfg.label}
              </span>
            </div>
            <p className="text-xs font-mono text-[#C4972A] mt-0.5">{invoice.invoiceNumber}</p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {canDelete && (
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold hover:bg-red-500/20 transition-colors disabled:opacity-50"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete
            </button>
          )}

          <Link
            href={`/portal/invoices/${id}/edit`}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#141923] border border-[#1f2d3d] text-[#9CA3AF] text-xs font-semibold hover:text-[#F0EBE0] hover:border-[#C4972A]/40 transition-colors"
          >
            Edit
          </Link>

          <button
            onClick={handleDownloadPdf}
            disabled={pdfLoading}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#141923] border border-[#1f2d3d] text-[#9CA3AF] text-xs font-semibold hover:text-[#F0EBE0] hover:border-[#C4972A]/40 transition-colors disabled:opacity-50"
          >
            {pdfLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
            PDF
          </button>

          {canMarkPaid && (
            <button
              onClick={handleMarkPaid}
              disabled={markingPaid}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold hover:bg-emerald-500/20 transition-colors disabled:opacity-50"
            >
              {markingPaid ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <CheckCircle2 className="h-3.5 w-3.5" />
              )}
              Mark Paid
            </button>
          )}

          {canSend && (
            <button
              onClick={() => setSendConfirm(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#C4972A] text-[#08090D] text-xs font-bold hover:bg-[#d4a730] transition-colors"
            >
              <Send className="h-3.5 w-3.5" />
              Send Invoice
            </button>
          )}
        </div>
      </div>

      {/* Action error */}
      {actionError && (
        <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 text-sm text-red-400">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {actionError}
        </div>
      )}

      {/* Share link */}
      {shareUrl && (
        <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold text-blue-400 mb-1">Public Invoice Link</p>
            <p className="text-xs text-[#9CA3AF] font-mono truncate max-w-[400px]">{shareUrl}</p>
          </div>
          <button
            onClick={handleCopyLink}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold hover:bg-blue-500/20 transition-colors shrink-0"
          >
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? "Copied!" : "Copy Link"}
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        {/* Left: line items */}
        <div className="space-y-4">
          {/* Line items */}
          <div className="bg-[#141923] border border-[#1f2d3d] rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-[#1f2d3d]">
              <h2 className="text-sm font-semibold text-[#F0EBE0]">Line Items</h2>
            </div>
            <table className="w-full">
              <thead>
                <tr className="bg-[#0f1620]">
                  {["Description", "Qty", "Unit Price", "Amount"].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-2.5 text-left text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wider"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1f2d3d]">
                {invoice.lineItems.map((item) => (
                  <tr key={item.id}>
                    <td className="px-4 py-3 text-sm text-[#F0EBE0]">{item.description}</td>
                    <td className="px-4 py-3 text-sm text-[#9CA3AF] text-center">{item.quantity}</td>
                    <td className="px-4 py-3 text-sm text-[#9CA3AF] text-right">
                      {formatCurrency(item.unitPrice, invoice.currency)}
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-[#F0EBE0] text-right">
                      {formatCurrency(item.amount, invoice.currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totals */}
            <div className="border-t border-[#1f2d3d] p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-[#9CA3AF]">Subtotal</span>
                <span className="text-[#F0EBE0]">{formatCurrency(invoice.subtotal, invoice.currency)}</span>
              </div>
              {invoice.taxRate > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-[#9CA3AF]">Tax ({invoice.taxRate}%)</span>
                  <span className="text-[#F0EBE0]">{formatCurrency(invoice.taxAmount, invoice.currency)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-bold pt-2 border-t border-[#1f2d3d]">
                <span className="text-[#F0EBE0]">Total</span>
                <span className="text-[#C4972A]">{formatCurrency(invoice.total, invoice.currency)}</span>
              </div>
            </div>
          </div>

          {/* Notes */}
          {invoice.notes && (
            <div className="bg-[#141923] border border-[#1f2d3d] rounded-xl p-4">
              <p className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider mb-2">Notes</p>
              <p className="text-sm text-[#F0EBE0] whitespace-pre-wrap">{invoice.notes}</p>
            </div>
          )}
        </div>

        {/* Right: details */}
        <div className="space-y-4">
          {/* Invoice details */}
          <div className="bg-[#141923] border border-[#1f2d3d] rounded-xl p-4">
            <p className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider mb-3">
              Invoice Details
            </p>
            <dl className="space-y-2.5">
              {[
                ["Status", <span key="s" className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${statusCfg.className}`}>{statusCfg.label}</span>],
                ["Invoice #", invoice.invoiceNumber],
                ["Currency", invoice.currency],
                ["Terms", invoice.paymentTerms ?? "—"],
                ["Due Date", formatDate(invoice.dueAt)],
                ["Created", formatDate(invoice.createdAt)],
                ...(invoice.sentAt ? [["Sent", formatDate(invoice.sentAt)]] : []),
                ...(invoice.paidAt ? [["Paid", formatDate(invoice.paidAt)]] : []),
              ].map(([label, value]) => (
                <div key={String(label)} className="flex justify-between gap-2">
                  <dt className="text-xs text-[#9CA3AF]">{label}</dt>
                  <dd className="text-xs text-[#F0EBE0] font-medium text-right">{value}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Bill to */}
          {(invoice.recipientName || invoice.recipientEmail || invoice.recipientCompany || invoice.clientDeal) && (
            <div className="bg-[#141923] border border-[#1f2d3d] rounded-xl p-4">
              <p className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider mb-3">
                Bill To
              </p>
              {invoice.clientDeal && (
                <Link
                  href={`/portal/crm/${invoice.clientDeal.id}`}
                  className="text-xs text-[#C4972A] hover:underline mb-2 block"
                >
                  {invoice.clientDeal.companyName} →
                </Link>
              )}
              {invoice.recipientCompany && (
                <p className="text-sm font-semibold text-[#F0EBE0]">{invoice.recipientCompany}</p>
              )}
              {invoice.recipientName && (
                <p className="text-sm text-[#F0EBE0]">{invoice.recipientName}</p>
              )}
              {invoice.recipientEmail && (
                <p className="text-xs text-[#9CA3AF] mt-1">{invoice.recipientEmail}</p>
              )}
            </div>
          )}

          {/* Stripe link */}
          {invoice.stripePaymentLink && (
            <div className="bg-[#141923] border border-[#1f2d3d] rounded-xl p-4">
              <p className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider mb-2">
                Payment Link
              </p>
              <a
                href={invoice.stripePaymentLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-[#C4972A] hover:underline break-all"
              >
                {invoice.stripePaymentLink}
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Send confirmation modal */}
      {sendConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#141923] border border-[#1f2d3d] rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-lg font-bold text-[#F0EBE0] mb-2">Send Invoice?</h3>
            <p className="text-sm text-[#9CA3AF] mb-1">
              This will email invoice <span className="text-[#C4972A] font-mono">{invoice.invoiceNumber}</span> to:
            </p>
            <p className="text-sm font-semibold text-[#F0EBE0] mb-6">
              {invoice.recipientEmail ?? "No email set — add one first"}
            </p>
            {!invoice.recipientEmail && (
              <div className="flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/20 rounded-lg px-3 py-2 mb-4 text-xs text-yellow-400">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                Add a recipient email before sending.
              </div>
            )}
            {actionError && (
              <p className="text-xs text-red-400 mb-3">{actionError}</p>
            )}
            <div className="flex justify-end gap-3">
              <button
                onClick={() => { setSendConfirm(false); setActionError(null) }}
                className="px-4 py-2 rounded-lg text-sm text-[#9CA3AF] hover:text-[#F0EBE0] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSend}
                disabled={sending || !invoice.recipientEmail}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-[#C4972A] text-[#08090D] text-sm font-bold hover:bg-[#d4a730] transition-colors disabled:opacity-50"
              >
                {sending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Send Now
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
