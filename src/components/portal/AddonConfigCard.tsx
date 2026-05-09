"use client"

import { useState } from "react"
import { CheckCircle2 } from "lucide-react"

interface Field {
  name: string
  label: string
  type?: "text" | "email" | "tel" | "url" | "textarea"
  placeholder?: string
  required?: boolean
  rows?: number
}

interface Props {
  /** Addon slug — sent in the intake POST body. */
  slug: string
  title: string
  description: string
  fields: Field[]
  /** What user sees after submit. */
  successMessage?: string
}

/**
 * Reusable client form wrapper for "configure-only" add-ons.
 *
 * The entitlement gate has already let the user through (they bought
 * the add-on). This form captures whatever config the human-fulfillment
 * team needs to ship the add-on — phone numbers for the voice agent,
 * site URL for the chatbot, etc. POSTs to /api/portal/addons/intake.
 *
 * Once we automate fulfillment, the consuming page swaps this card out
 * for the real surface.
 */
export function AddonConfigCard({
  slug,
  title,
  description,
  fields,
  successMessage,
}: Props) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    const fd = new FormData(e.currentTarget)
    const data: Record<string, string> = {}
    fd.forEach((v, k) => {
      if (typeof v === "string") data[k] = v
    })
    try {
      const res = await fetch("/api/portal/addons/intake", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ slug, data }),
      })
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(j.error ?? `HTTP ${res.status}`)
      }
      setSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed")
    } finally {
      setBusy(false)
    }
  }

  if (success) {
    return (
      <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-8 text-center space-y-3 max-w-2xl mx-auto">
        <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto" />
        <h2 className="text-xl font-bold text-foreground">Configuration submitted</h2>
        <p className="text-sm text-muted-foreground">
          {successMessage ??
            "Our services team will reach out within 1 business day to walk you through setup. You'll see a status update right here."}
        </p>
      </div>
    )
  }

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-2xl border border-border bg-card p-6 space-y-4 max-w-2xl mx-auto"
    >
      <div>
        <h2 className="text-xl font-bold text-foreground">{title}</h2>
        <p className="text-sm text-muted-foreground mt-1">{description}</p>
      </div>

      <div className="space-y-3">
        {fields.map((f) => (
          <label key={f.name} className="block">
            <div className="text-xs text-muted-foreground mb-1">
              {f.label}
              {f.required ? <span className="text-red-500 ml-1">*</span> : null}
            </div>
            {f.type === "textarea" ? (
              <textarea
                name={f.name}
                placeholder={f.placeholder}
                required={f.required}
                rows={f.rows ?? 3}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            ) : (
              <input
                name={f.name}
                type={f.type ?? "text"}
                placeholder={f.placeholder}
                required={f.required}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            )}
          </label>
        ))}
      </div>

      {error ? (
        <div className="rounded-md border border-red-500/30 bg-red-500/5 px-3 py-2 text-xs text-red-500">
          {error}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={busy}
        className="w-full rounded-lg bg-primary text-primary-foreground py-2.5 text-sm font-bold hover:opacity-90 disabled:opacity-60"
      >
        {busy ? "Saving…" : "Submit configuration"}
      </button>
    </form>
  )
}
