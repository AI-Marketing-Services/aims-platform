"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Check, Edit2 } from "lucide-react"

interface Defaults {
  companyName: string
  contactName: string
  contactEmail: string
  contactPhone: string
  website: string
  industry: string
  value: number
  notes: string
  tags: string[]
}

interface EditDealInlineFormProps {
  dealId: string
  defaults: Defaults
}

export function EditDealInlineForm({ dealId, defaults }: EditDealInlineFormProps) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = new FormData(e.currentTarget)

    const payload: Record<string, unknown> = {
      companyName: form.get("companyName") as string,
      contactName: (form.get("contactName") as string) || null,
      contactEmail: (form.get("contactEmail") as string) || null,
      contactPhone: (form.get("contactPhone") as string) || null,
      website: (form.get("website") as string) || null,
      industry: (form.get("industry") as string) || null,
      value: form.get("value") ? parseFloat(form.get("value") as string) : 0,
      notes: (form.get("notes") as string) || null,
      tags: (form.get("tags") as string)
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
    }

    setError(null)
    startTransition(async () => {
      const res = await fetch(`/api/portal/crm/deals/${dealId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? "Failed to save")
        return
      }

      setSaved(true)
      setEditing(false)
      setTimeout(() => setSaved(false), 2000)
      router.refresh()
    })
  }

  const inputClass =
    "w-full h-9 px-3 rounded-lg bg-surface border border-border text-foreground text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/50"

  if (!editing) {
    return (
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
          {defaults.value > 0 && (
            <Field label="Value" value={`$${defaults.value.toLocaleString()}`} />
          )}
          {defaults.industry && <Field label="Industry" value={defaults.industry} />}
          {defaults.website && <Field label="Website" value={defaults.website} />}
          {defaults.notes && <Field label="Notes" value={defaults.notes} span />}
          {defaults.tags.length > 0 && (
            <div className="col-span-2">
              <p className="text-[10px] text-muted-foreground/60 uppercase tracking-wider mb-1">Tags</p>
              <div className="flex flex-wrap gap-1">
                {defaults.tags.map((t) => (
                  <span
                    key={t}
                    className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary/80 font-medium"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          )}
          {!defaults.value && !defaults.industry && !defaults.website && !defaults.notes && defaults.tags.length === 0 && (
            <p className="col-span-2 text-xs text-muted-foreground/50">No details yet</p>
          )}
        </div>

        <button
          onClick={() => setEditing(true)}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          {saved ? (
            <>
              <Check className="h-3 w-3 text-primary" />
              <span className="text-primary">Saved</span>
            </>
          ) : (
            <>
              <Edit2 className="h-3 w-3" />
              Edit details
            </>
          )}
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="block text-xs text-muted-foreground mb-1">Company *</label>
        <input
          name="companyName"
          defaultValue={defaults.companyName}
          required
          className={inputClass}
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-xs text-muted-foreground mb-1">Contact</label>
          <input name="contactName" defaultValue={defaults.contactName} className={inputClass} />
        </div>
        <div>
          <label className="block text-xs text-muted-foreground mb-1">Value ($)</label>
          <input
            name="value"
            type="number"
            min="0"
            step="100"
            defaultValue={defaults.value || ""}
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-xs text-muted-foreground mb-1">Email</label>
          <input name="contactEmail" type="email" defaultValue={defaults.contactEmail} className={inputClass} />
        </div>
        <div>
          <label className="block text-xs text-muted-foreground mb-1">Phone</label>
          <input name="contactPhone" defaultValue={defaults.contactPhone} className={inputClass} />
        </div>
        <div>
          <label className="block text-xs text-muted-foreground mb-1">Website</label>
          <input name="website" defaultValue={defaults.website} className={inputClass} />
        </div>
        <div>
          <label className="block text-xs text-muted-foreground mb-1">Industry</label>
          <input name="industry" defaultValue={defaults.industry} className={inputClass} />
        </div>
      </div>

      <div>
        <label className="block text-xs text-muted-foreground mb-1">Tags (comma-separated)</label>
        <input
          name="tags"
          defaultValue={defaults.tags.join(", ")}
          placeholder="local-service, hvac, referral"
          className={inputClass}
        />
      </div>

      <div>
        <label className="block text-xs text-muted-foreground mb-1">Notes</label>
        <textarea
          name="notes"
          defaultValue={defaults.notes}
          rows={3}
          className="w-full px-3 py-2 rounded-lg bg-surface border border-border text-foreground text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/50 resize-none"
        />
      </div>

      {error && <p className="text-xs text-red-400">{error}</p>}

      <div className="flex gap-2 justify-end">
        <button
          type="button"
          onClick={() => setEditing(false)}
          disabled={isPending}
          className="px-3 py-1.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-surface transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="px-4 py-1.5 rounded-lg text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          {isPending ? "Saving…" : "Save"}
        </button>
      </div>
    </form>
  )
}

function Field({ label, value, span }: { label: string; value: string; span?: boolean }) {
  return (
    <div className={span ? "col-span-2" : ""}>
      <p className="text-[10px] text-muted-foreground/60 uppercase tracking-wider">{label}</p>
      <p className="text-sm text-foreground mt-0.5 leading-relaxed">{value}</p>
    </div>
  )
}
