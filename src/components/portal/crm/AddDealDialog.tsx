"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Plus, X } from "lucide-react"

interface AddDealDialogProps {
  defaultStage?: string
  onCreated?: () => void
}

export function AddDealDialog({ defaultStage = "PROSPECT", onCreated }: AddDealDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = new FormData(e.currentTarget)

    const payload = {
      companyName: form.get("companyName") as string,
      contactName: (form.get("contactName") as string) || null,
      contactEmail: (form.get("contactEmail") as string) || null,
      contactPhone: (form.get("contactPhone") as string) || null,
      industry: (form.get("industry") as string) || null,
      value: form.get("value") ? parseFloat(form.get("value") as string) : 0,
      notes: (form.get("notes") as string) || null,
      stage: defaultStage,
    }

    setError(null)
    startTransition(async () => {
      const res = await fetch("/api/portal/crm/deals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? "Failed to create deal")
        return
      }

      setOpen(false)
      onCreated?.()
      router.refresh()
    })
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="w-full flex items-center justify-center gap-1.5 py-2 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/60 rounded-lg border border-dashed border-border/60 hover:border-border transition-all duration-150"
      >
        <Plus className="h-3.5 w-3.5" />
        Add deal
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <div className="relative z-10 w-full max-w-md bg-card border border-border rounded-xl shadow-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-foreground">New Deal</h2>
              <button
                onClick={() => setOpen(false)}
                className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Company *</label>
                <input
                  name="companyName"
                  required
                  placeholder="Acme Corp"
                  className="w-full h-9 px-3 rounded-lg bg-muted border border-border text-foreground text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Contact</label>
                  <input
                    name="contactName"
                    placeholder="Jane Smith"
                    className="w-full h-9 px-3 rounded-lg bg-muted border border-border text-foreground text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/50"
                  />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Value ($)</label>
                  <input
                    name="value"
                    type="number"
                    min="0"
                    step="100"
                    placeholder="2500"
                    className="w-full h-9 px-3 rounded-lg bg-muted border border-border text-foreground text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/50"
                  />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Email</label>
                  <input
                    name="contactEmail"
                    type="email"
                    placeholder="jane@acme.com"
                    className="w-full h-9 px-3 rounded-lg bg-muted border border-border text-foreground text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/50"
                  />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Phone</label>
                  <input
                    name="contactPhone"
                    placeholder="+1 555-0100"
                    className="w-full h-9 px-3 rounded-lg bg-muted border border-border text-foreground text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-muted-foreground mb-1">Industry</label>
                <input
                  name="industry"
                  placeholder="e.g. HVAC, Dental, E-commerce"
                  className="w-full h-9 px-3 rounded-lg bg-muted border border-border text-foreground text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/50"
                />
              </div>

              <div>
                <label className="block text-xs text-muted-foreground mb-1">Notes</label>
                <textarea
                  name="notes"
                  placeholder="Initial context, source, pain points…"
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-foreground text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/50 resize-none"
                />
              </div>

              {error && <p className="text-xs text-red-400">{error}</p>}

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  disabled={isPending}
                  className="px-3 py-1.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-4 py-1.5 rounded-lg text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
                >
                  {isPending ? "Creating…" : "Create Deal"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
