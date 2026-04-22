"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { ChevronLeft, Plus, Trash2, Loader2 } from "lucide-react"

interface LineItem {
  description: string
  quantity: number
  unitPrice: number
  sortOrder: number
}

interface Deal {
  id: string
  companyName: string
  contactName: string | null
  contactEmail: string | null
}

function calcTotals(items: LineItem[], taxRate: number) {
  const subtotal = items.reduce((s, i) => s + i.quantity * i.unitPrice, 0)
  const taxAmount = subtotal * (taxRate / 100)
  const total = subtotal + taxAmount
  return { subtotal, taxAmount, total }
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount)
}

export default function EditInvoicePage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [deals, setDeals] = useState<Deal[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [title, setTitle] = useState("")
  const [clientDealId, setClientDealId] = useState("")
  const [recipientName, setRecipientName] = useState("")
  const [recipientEmail, setRecipientEmail] = useState("")
  const [recipientCompany, setRecipientCompany] = useState("")
  const [currency, setCurrency] = useState("USD")
  const [taxRate, setTaxRate] = useState(0)
  const [notes, setNotes] = useState("")
  const [paymentTerms, setPaymentTerms] = useState("Net 30")
  const [dueAt, setDueAt] = useState("")
  const [stripePaymentLink, setStripePaymentLink] = useState("")
  const [lineItems, setLineItems] = useState<LineItem[]>([])
  const [status, setStatus] = useState<string>("")

  const { subtotal, taxAmount, total } = calcTotals(lineItems, taxRate)

  useEffect(() => {
    Promise.all([
      fetch(`/api/portal/invoices/${id}`).then((r) => r.json()),
      fetch("/api/portal/crm/deals").then((r) => r.json()),
    ])
      .then(([invoiceData, dealsData]) => {
        const inv = invoiceData.invoice
        if (!inv) return
        setTitle(inv.title ?? "")
        setClientDealId(inv.clientDealId ?? "")
        setRecipientName(inv.recipientName ?? "")
        setRecipientEmail(inv.recipientEmail ?? "")
        setRecipientCompany(inv.recipientCompany ?? "")
        setCurrency(inv.currency ?? "USD")
        setTaxRate(inv.taxRate ?? 0)
        setNotes(inv.notes ?? "")
        setPaymentTerms(inv.paymentTerms ?? "Net 30")
        setStatus(inv.status ?? "DRAFT")
        setStripePaymentLink(inv.stripePaymentLink ?? "")
        if (inv.dueAt) {
          setDueAt(new Date(inv.dueAt).toISOString().split("T")[0])
        }
        setLineItems(
          (inv.lineItems ?? []).map((item: { description: string; quantity: number; unitPrice: number; sortOrder: number }) => ({
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            sortOrder: item.sortOrder,
          })),
        )
        setDeals(dealsData.deals ?? [])
      })
      .catch(() => setError("Failed to load invoice"))
      .finally(() => setLoading(false))
  }, [id])

  const addLineItem = useCallback(() => {
    setLineItems((prev) => [
      ...prev,
      { description: "", quantity: 1, unitPrice: 0, sortOrder: prev.length },
    ])
  }, [])

  const removeLineItem = useCallback((idx: number) => {
    setLineItems((prev) =>
      prev.filter((_, i) => i !== idx).map((item, i) => ({ ...item, sortOrder: i })),
    )
  }, [])

  const updateLineItem = useCallback(
    (idx: number, field: keyof LineItem, value: string | number) => {
      setLineItems((prev) =>
        prev.map((item, i) => (i === idx ? { ...item, [field]: value } : item)),
      )
    },
    [],
  )

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const validItems = lineItems.filter((i) => i.description.trim())
    if (validItems.length === 0) {
      setError("Add at least one line item with a description.")
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch(`/api/portal/invoices/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          clientDealId: clientDealId || null,
          recipientName: recipientName || null,
          recipientEmail: recipientEmail || null,
          recipientCompany: recipientCompany || null,
          currency,
          taxRate,
          notes: notes || null,
          paymentTerms: paymentTerms || null,
          stripePaymentLink: stripePaymentLink || null,
          dueAt: dueAt ? new Date(dueAt).toISOString() : null,
          lineItems: validItems,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? "Failed to update invoice")
      }

      router.push(`/portal/invoices/${id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Loader2 className="h-6 w-6 animate-spin text-[#C4972A]" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-6 space-y-6">
      <Link
        href={`/portal/invoices/${id}`}
        className="inline-flex items-center gap-1.5 text-xs text-[#9CA3AF] hover:text-[#F0EBE0] transition-colors"
      >
        <ChevronLeft className="h-3.5 w-3.5" />
        Back to invoice
      </Link>

      <h1 className="text-xl font-bold text-[#F0EBE0]">Edit Invoice</h1>

      {status === "PAID" && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg px-4 py-3 text-sm text-yellow-400">
          This invoice is marked as paid. Editing is still allowed but use caution.
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Invoice info */}
        <div className="bg-[#141923] border border-[#1f2d3d] rounded-xl p-5 space-y-4">
          <h2 className="text-sm font-semibold text-[#F0EBE0]">Invoice Info</h2>

          <div>
            <label className="block text-xs font-medium text-[#9CA3AF] mb-1.5">
              Title <span className="text-red-400">*</span>
            </label>
            <input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Content Strategy — April 2026"
              className="w-full bg-[#0f1620] border border-[#2a3040] rounded-lg px-3 py-2 text-sm text-[#F0EBE0] placeholder:text-[#4B5563] focus:outline-none focus:border-[#C4972A] transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#9CA3AF] mb-1.5">Link to Deal</label>
              <select
                value={clientDealId}
                onChange={(e) => setClientDealId(e.target.value)}
                className="w-full bg-[#0f1620] border border-[#2a3040] rounded-lg px-3 py-2 text-sm text-[#F0EBE0] focus:outline-none focus:border-[#C4972A] transition-colors"
              >
                <option value="">— None —</option>
                {deals.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.companyName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#9CA3AF] mb-1.5">Currency</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full bg-[#0f1620] border border-[#2a3040] rounded-lg px-3 py-2 text-sm text-[#F0EBE0] focus:outline-none focus:border-[#C4972A] transition-colors"
              >
                {["USD", "EUR", "GBP", "CAD", "AUD"].map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#9CA3AF] mb-1.5">Payment Terms</label>
              <select
                value={paymentTerms}
                onChange={(e) => setPaymentTerms(e.target.value)}
                className="w-full bg-[#0f1620] border border-[#2a3040] rounded-lg px-3 py-2 text-sm text-[#F0EBE0] focus:outline-none focus:border-[#C4972A] transition-colors"
              >
                {["Due on receipt", "Net 7", "Net 14", "Net 30", "Net 60"].map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#9CA3AF] mb-1.5">Due Date</label>
              <input
                type="date"
                value={dueAt}
                onChange={(e) => setDueAt(e.target.value)}
                className="w-full bg-[#0f1620] border border-[#2a3040] rounded-lg px-3 py-2 text-sm text-[#F0EBE0] focus:outline-none focus:border-[#C4972A] transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#9CA3AF] mb-1.5">
              Stripe Payment Link (optional)
            </label>
            <input
              type="url"
              value={stripePaymentLink}
              onChange={(e) => setStripePaymentLink(e.target.value)}
              placeholder="https://buy.stripe.com/..."
              className="w-full bg-[#0f1620] border border-[#2a3040] rounded-lg px-3 py-2 text-sm text-[#F0EBE0] placeholder:text-[#4B5563] focus:outline-none focus:border-[#C4972A] transition-colors"
            />
          </div>
        </div>

        {/* Recipient */}
        <div className="bg-[#141923] border border-[#1f2d3d] rounded-xl p-5 space-y-4">
          <h2 className="text-sm font-semibold text-[#F0EBE0]">Bill To</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#9CA3AF] mb-1.5">Company</label>
              <input
                value={recipientCompany}
                onChange={(e) => setRecipientCompany(e.target.value)}
                placeholder="Acme Corp"
                className="w-full bg-[#0f1620] border border-[#2a3040] rounded-lg px-3 py-2 text-sm text-[#F0EBE0] placeholder:text-[#4B5563] focus:outline-none focus:border-[#C4972A] transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#9CA3AF] mb-1.5">Contact Name</label>
              <input
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                placeholder="Jane Smith"
                className="w-full bg-[#0f1620] border border-[#2a3040] rounded-lg px-3 py-2 text-sm text-[#F0EBE0] placeholder:text-[#4B5563] focus:outline-none focus:border-[#C4972A] transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#9CA3AF] mb-1.5">Email Address</label>
            <input
              type="email"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
              placeholder="jane@acmecorp.com"
              className="w-full bg-[#0f1620] border border-[#2a3040] rounded-lg px-3 py-2 text-sm text-[#F0EBE0] placeholder:text-[#4B5563] focus:outline-none focus:border-[#C4972A] transition-colors"
            />
          </div>
        </div>

        {/* Line items */}
        <div className="bg-[#141923] border border-[#1f2d3d] rounded-xl p-5 space-y-3">
          <h2 className="text-sm font-semibold text-[#F0EBE0]">Line Items</h2>

          <div className="grid grid-cols-[1fr_80px_110px_100px_32px] gap-2">
            {["Description", "Qty", "Unit Price", "Amount", ""].map((h) => (
              <p key={h} className="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wider">
                {h}
              </p>
            ))}
          </div>

          {lineItems.map((item, idx) => {
            const amount = item.quantity * item.unitPrice
            return (
              <div key={idx} className="grid grid-cols-[1fr_80px_110px_100px_32px] gap-2 items-center">
                <input
                  value={item.description}
                  onChange={(e) => updateLineItem(idx, "description", e.target.value)}
                  placeholder="Service or product description"
                  className="bg-[#0f1620] border border-[#2a3040] rounded-lg px-3 py-2 text-sm text-[#F0EBE0] placeholder:text-[#4B5563] focus:outline-none focus:border-[#C4972A] transition-colors"
                />
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={item.quantity}
                  onChange={(e) => updateLineItem(idx, "quantity", parseFloat(e.target.value) || 0)}
                  className="bg-[#0f1620] border border-[#2a3040] rounded-lg px-3 py-2 text-sm text-[#F0EBE0] text-center focus:outline-none focus:border-[#C4972A] transition-colors"
                />
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={item.unitPrice}
                  onChange={(e) => updateLineItem(idx, "unitPrice", parseFloat(e.target.value) || 0)}
                  className="bg-[#0f1620] border border-[#2a3040] rounded-lg px-3 py-2 text-sm text-[#F0EBE0] text-right focus:outline-none focus:border-[#C4972A] transition-colors"
                />
                <p className="text-sm font-semibold text-[#F0EBE0] text-right pr-1">
                  {formatCurrency(amount)}
                </p>
                <button
                  type="button"
                  onClick={() => removeLineItem(idx)}
                  disabled={lineItems.length === 1}
                  className="h-8 w-8 flex items-center justify-center rounded-lg text-[#9CA3AF] hover:text-red-400 hover:bg-red-400/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            )
          })}

          <button
            type="button"
            onClick={addLineItem}
            className="inline-flex items-center gap-2 text-xs font-semibold text-[#C4972A] hover:text-[#d4a730] transition-colors mt-1"
          >
            <Plus className="h-3.5 w-3.5" />
            Add line item
          </button>

          {/* Totals */}
          <div className="border-t border-[#1f2d3d] pt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-[#9CA3AF]">Subtotal</span>
              <span className="text-[#F0EBE0] font-semibold">{formatCurrency(subtotal)}</span>
            </div>

            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="text-sm text-[#9CA3AF]">Tax</span>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={taxRate}
                    onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                    className="w-16 bg-[#0f1620] border border-[#2a3040] rounded px-2 py-0.5 text-xs text-[#F0EBE0] text-right focus:outline-none focus:border-[#C4972A] transition-colors"
                  />
                  <span className="text-xs text-[#9CA3AF]">%</span>
                </div>
              </div>
              <span className="text-sm text-[#F0EBE0]">{formatCurrency(taxAmount)}</span>
            </div>

            <div className="flex justify-between text-base font-bold pt-2 border-t border-[#1f2d3d]">
              <span className="text-[#F0EBE0]">Total</span>
              <span className="text-[#C4972A]">{formatCurrency(total)}</span>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="bg-[#141923] border border-[#1f2d3d] rounded-xl p-5 space-y-3">
          <h2 className="text-sm font-semibold text-[#F0EBE0]">Notes (optional)</h2>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Payment instructions, thank you notes, or any additional details..."
            rows={3}
            className="w-full bg-[#0f1620] border border-[#2a3040] rounded-lg px-3 py-2 text-sm text-[#F0EBE0] placeholder:text-[#4B5563] focus:outline-none focus:border-[#C4972A] transition-colors resize-none"
          />
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        <div className="flex items-center justify-between gap-4">
          <Link
            href={`/portal/invoices/${id}`}
            className="text-sm text-[#9CA3AF] hover:text-[#F0EBE0] transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting || !title.trim()}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-[#C4972A] text-[#08090D] text-sm font-bold hover:bg-[#d4a730] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
