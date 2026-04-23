"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
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

const DEFAULT_LINE_ITEM: LineItem = { description: "", quantity: 1, unitPrice: 0, sortOrder: 0 }

export default function NewInvoicePage() {
  const router = useRouter()
  const [deals, setDeals] = useState<Deal[]>([])
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
  const [lineItems, setLineItems] = useState<LineItem[]>([{ ...DEFAULT_LINE_ITEM }])

  const { subtotal, taxAmount, total } = calcTotals(lineItems, taxRate)

  useEffect(() => {
    fetch("/api/portal/crm/deals")
      .then((r) => r.json())
      .then((d) => setDeals(d.deals ?? []))
      .catch(() => {})
  }, [])

  // Auto-fill recipient when deal selected
  useEffect(() => {
    if (!clientDealId) return
    const deal = deals.find((d) => d.id === clientDealId)
    if (!deal) return
    setRecipientCompany(deal.companyName)
    if (deal.contactName) setRecipientName(deal.contactName)
    if (deal.contactEmail) setRecipientEmail(deal.contactEmail)
  }, [clientDealId, deals])

  const addLineItem = useCallback(() => {
    setLineItems((prev) => [
      ...prev,
      { description: "", quantity: 1, unitPrice: 0, sortOrder: prev.length },
    ])
  }, [])

  const removeLineItem = useCallback((idx: number) => {
    setLineItems((prev) => prev.filter((_, i) => i !== idx).map((item, i) => ({ ...item, sortOrder: i })))
  }, [])

  const updateLineItem = useCallback(
    (idx: number, field: keyof LineItem, value: string | number) => {
      setLineItems((prev) =>
        prev.map((item, i) =>
          i === idx ? { ...item, [field]: value } : item,
        ),
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
      const res = await fetch("/api/portal/invoices", {
        method: "POST",
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
          dueAt: dueAt ? new Date(dueAt).toISOString() : null,
          lineItems: validItems,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? "Failed to create invoice")
      }

      const data = await res.json()
      router.push(`/portal/invoices/${data.invoice.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-6 space-y-6">
      {/* Back */}
      <Link
        href="/portal/invoices"
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        <ChevronLeft className="h-3.5 w-3.5" />
        Back to invoices
      </Link>

      <h1 className="text-xl font-bold text-foreground">Create Invoice</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Invoice info */}
        <div className="bg-card border border-border rounded-xl p-5 space-y-4">
          <h2 className="text-sm font-semibold text-foreground">Invoice Info</h2>

          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">
              Title <span className="text-red-400">*</span>
            </label>
            <input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Content Strategy — April 2026"
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                Link to Deal (optional)
              </label>
              <select
                value={clientDealId}
                onChange={(e) => setClientDealId(e.target.value)}
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary transition-colors"
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
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Currency</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary transition-colors"
              >
                {["USD", "EUR", "GBP", "CAD", "AUD"].map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Payment Terms</label>
              <select
                value={paymentTerms}
                onChange={(e) => setPaymentTerms(e.target.value)}
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary transition-colors"
              >
                {["Due on receipt", "Net 7", "Net 14", "Net 30", "Net 60"].map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Due Date</label>
              <input
                type="date"
                value={dueAt}
                onChange={(e) => setDueAt(e.target.value)}
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Recipient */}
        <div className="bg-card border border-border rounded-xl p-5 space-y-4">
          <h2 className="text-sm font-semibold text-foreground">Bill To</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                Company / Organization
              </label>
              <input
                value={recipientCompany}
                onChange={(e) => setRecipientCompany(e.target.value)}
                placeholder="Acme Corp"
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Contact Name</label>
              <input
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                placeholder="Jane Smith"
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
              placeholder="jane@acmecorp.com"
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
            />
          </div>
        </div>

        {/* Line items */}
        <div className="bg-card border border-border rounded-xl p-5 space-y-3">
          <h2 className="text-sm font-semibold text-foreground">Line Items</h2>

          {/* Header */}
          <div className="grid grid-cols-[1fr_80px_110px_100px_32px] gap-2">
            {["Description", "Qty", "Unit Price", "Amount", ""].map((h) => (
              <p key={h} className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                {h}
              </p>
            ))}
          </div>

          {lineItems.map((item, idx) => {
            const amount = item.quantity * item.unitPrice
            return (
              <div
                key={idx}
                className="grid grid-cols-[1fr_80px_110px_100px_32px] gap-2 items-center"
              >
                <input
                  value={item.description}
                  onChange={(e) => updateLineItem(idx, "description", e.target.value)}
                  placeholder="Service or product description"
                  className="bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                />
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={item.quantity}
                  onChange={(e) => updateLineItem(idx, "quantity", parseFloat(e.target.value) || 0)}
                  className="bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground text-center focus:outline-none focus:border-primary transition-colors"
                />
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={item.unitPrice}
                  onChange={(e) => updateLineItem(idx, "unitPrice", parseFloat(e.target.value) || 0)}
                  className="bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground text-right focus:outline-none focus:border-primary transition-colors"
                />
                <p className="text-sm font-semibold text-foreground text-right pr-1">
                  {formatCurrency(amount)}
                </p>
                <button
                  type="button"
                  onClick={() => removeLineItem(idx)}
                  disabled={lineItems.length === 1}
                  className="h-8 w-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-400/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            )
          })}

          <button
            type="button"
            onClick={addLineItem}
            className="inline-flex items-center gap-2 text-xs font-semibold text-primary hover:text-primary/80 transition-colors mt-1"
          >
            <Plus className="h-3.5 w-3.5" />
            Add line item
          </button>

          {/* Totals */}
          <div className="border-t border-border pt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="text-foreground font-semibold">{formatCurrency(subtotal)}</span>
            </div>

            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Tax</span>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={taxRate}
                    onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                    className="w-16 bg-background border border-border rounded px-2 py-0.5 text-xs text-foreground text-right focus:outline-none focus:border-primary transition-colors"
                  />
                  <span className="text-xs text-muted-foreground">%</span>
                </div>
              </div>
              <span className="text-sm text-foreground">{formatCurrency(taxAmount)}</span>
            </div>

            <div className="flex justify-between text-base font-bold pt-2 border-t border-border">
              <span className="text-foreground">Total</span>
              <span className="text-primary">{formatCurrency(total)}</span>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="bg-card border border-border rounded-xl p-5 space-y-3">
          <h2 className="text-sm font-semibold text-foreground">Notes (optional)</h2>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Payment instructions, thank you notes, or any additional details..."
            rows={3}
            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors resize-none"
          />
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between gap-4">
          <Link
            href="/portal/invoices"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting || !title.trim()}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              "Create Invoice"
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
