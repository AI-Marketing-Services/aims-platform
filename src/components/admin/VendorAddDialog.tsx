"use client"

import { useState } from "react"
import { X, Plus } from "lucide-react"
import { cn } from "@/lib/utils"

interface FormState {
  vendorName: string
  monthlyCost: string
  category: string
  replacementName: string
  projectedSavings: string
  notes: string
}

const INITIAL: FormState = {
  vendorName: "",
  monthlyCost: "",
  category: "",
  replacementName: "",
  projectedSavings: "",
  notes: "",
}

export function VendorAddDialog({ onAdded }: { onAdded?: () => void }) {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<FormState>(INITIAL)
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null)

  function showToast(type: "success" | "error", msg: string) {
    setToast({ type, msg })
    setTimeout(() => setToast(null), 4000)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch("/api/admin/vendors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vendorName: form.vendorName,
          monthlyCost: parseFloat(form.monthlyCost) || 0,
          category: form.category,
          replacementName: form.replacementName || null,
          projectedSavings: parseFloat(form.projectedSavings) || 0,
          notes: form.notes || null,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? "Failed")
      setOpen(false)
      setForm(INITIAL)
      showToast("success", "Vendor added successfully.")
      onAdded?.()
    } catch (err) {
      showToast("error", err instanceof Error ? err.message : "Something went wrong.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {toast && (
        <div
          className={cn(
            "fixed bottom-5 right-5 z-[100] flex items-center gap-3 rounded-xl border px-4 py-3 text-sm shadow-xl",
            toast.type === "success"
              ? "border-green-500/30 bg-green-400/10 text-green-400"
              : "border-primary/30 bg-primary/100/10 text-primary"
          )}
        >
          {toast.msg}
          <button onClick={() => setToast(null)} className="ml-1 opacity-60 hover:opacity-100">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-lg bg-[#C4972A] px-4 py-2 text-sm font-medium text-white hover:bg-[#A17D22] transition-colors"
      >
        <Plus className="h-4 w-4" />
        Add Vendor
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false) }}
        >
          <div className="w-full max-w-md rounded-2xl border border-border bg-card shadow-2xl">
            <div className="flex items-center justify-between px-6 py-5 border-b border-border">
              <div>
                <h2 className="text-base font-semibold text-foreground">Add Vendor</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Track a new vendor for replacement savings</p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-muted/50 text-muted-foreground transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                  Vendor Name <span className="text-[#C4972A]">*</span>
                </label>
                <input
                  required
                  type="text"
                  value={form.vendorName}
                  onChange={(e) => setForm((f) => ({ ...f, vendorName: e.target.value }))}
                  placeholder="e.g. HubSpot"
                  className="w-full h-9 rounded-lg border border-border bg-muted px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-[#C4972A]/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                    Monthly Cost ($) <span className="text-[#C4972A]">*</span>
                  </label>
                  <input
                    required
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.monthlyCost}
                    onChange={(e) => setForm((f) => ({ ...f, monthlyCost: e.target.value }))}
                    placeholder="299"
                    className="w-full h-9 rounded-lg border border-border bg-muted px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-[#C4972A]/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                    Projected Savings ($)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.projectedSavings}
                    onChange={(e) => setForm((f) => ({ ...f, projectedSavings: e.target.value }))}
                    placeholder="200"
                    className="w-full h-9 rounded-lg border border-border bg-muted px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-[#C4972A]/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                  Category <span className="text-[#C4972A]">*</span>
                </label>
                <input
                  required
                  type="text"
                  value={form.category}
                  onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                  placeholder="e.g. CRM, Email, Analytics"
                  className="w-full h-9 rounded-lg border border-border bg-muted px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-[#C4972A]/50"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                  AIMS Replacement <span className="text-muted-foreground/50">(optional)</span>
                </label>
                <input
                  type="text"
                  value={form.replacementName}
                  onChange={(e) => setForm((f) => ({ ...f, replacementName: e.target.value }))}
                  placeholder="e.g. AIMS CRM Module"
                  className="w-full h-9 rounded-lg border border-border bg-muted px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-[#C4972A]/50"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                  Notes <span className="text-muted-foreground/50">(optional)</span>
                </label>
                <textarea
                  rows={2}
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  placeholder="Any relevant notes…"
                  className="w-full rounded-lg border border-border bg-muted px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-[#C4972A]/50 resize-none"
                />
              </div>

              <div className="flex items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="flex-1 h-9 rounded-lg border border-border text-sm font-medium text-muted-foreground hover:bg-muted/50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 h-9 rounded-lg bg-[#C4972A] text-sm font-medium text-white hover:bg-[#A17D22] disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? "Adding…" : "Add Vendor"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
