"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"
import { Mail, UserPlus, X } from "lucide-react"

interface Props {
  /** Optional override of the button label. */
  buttonLabel?: string
  /** Default stage to file the deal under. */
  defaultStage?:
    | "APPLICATION_SUBMITTED"
    | "CONSULT_BOOKED"
    | "CONSULT_COMPLETED"
    | "MIGHTY_INVITED"
    | "MEMBER_JOINED"
  /** Optional callback after successful creation. */
  onCreated?: (dealId: string) => void
}

const INITIAL = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  company: "",
}

/**
 * Manual deal creation dialog. Use when an applicant didn't come through
 * the marketing-site form (e.g. DM, referral, hand-off from sales) but
 * still needs to live in the CRM so they can be invited, scored, and
 * tracked alongside everyone else.
 */
export function AddDealDialog({
  buttonLabel = "Add member manually",
  defaultStage = "APPLICATION_SUBMITTED",
  onCreated,
}: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(INITIAL)
  const [loading, setLoading] = useState(false)

  function reset() {
    setForm(INITIAL)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (loading) return
    setLoading(true)
    try {
      const res = await fetch("/api/admin/deals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          email: form.email.trim().toLowerCase(),
          phone: form.phone.trim() || null,
          company: form.company.trim() || null,
          stage: defaultStage,
          source: "manual-admin",
        }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(json?.error ?? "Failed to add member")
        return
      }

      if (json?.duplicate && json?.deal?.id) {
        toast.message("Member already exists — opening their record.")
        router.push(`/admin/crm/${json.deal.id}`)
        setOpen(false)
        return
      }

      toast.success(`Added ${form.firstName.trim() || form.email.trim()} to the CRM`)
      reset()
      setOpen(false)
      if (json?.deal?.id) {
        onCreated?.(json.deal.id)
        router.refresh()
      }
    } catch {
      toast.error("Network error — try again")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3.5 py-2 text-sm font-medium text-foreground hover:border-primary/40 hover:bg-primary/5 transition-colors"
      >
        <UserPlus className="h-4 w-4 text-primary" />
        {buttonLabel}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false)
          }}
        >
          <div className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl border border-border bg-card shadow-2xl">
            <div className="flex items-center justify-between px-6 py-5 border-b border-border">
              <div>
                <h2 className="text-base font-semibold text-foreground">
                  Add member manually
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Use this when someone joined off-platform and needs a CRM record.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-muted/50 text-muted-foreground transition-colors"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                    First name <span className="text-primary">*</span>
                  </label>
                  <input
                    required
                    type="text"
                    value={form.firstName}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, firstName: e.target.value }))
                    }
                    placeholder="Alex"
                    className="w-full h-9 rounded-lg border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                    Last name
                  </label>
                  <input
                    type="text"
                    value={form.lastName}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, lastName: e.target.value }))
                    }
                    placeholder="Morgan"
                    className="w-full h-9 rounded-lg border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                  Email <span className="text-primary">*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/60" />
                  <input
                    required
                    type="email"
                    autoComplete="email"
                    value={form.email}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, email: e.target.value }))
                    }
                    placeholder="alex@company.com"
                    className="w-full h-9 rounded-lg border border-border bg-background pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, phone: e.target.value }))
                    }
                    placeholder="Optional"
                    className="w-full h-9 rounded-lg border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                    Company
                  </label>
                  <input
                    type="text"
                    value={form.company}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, company: e.target.value }))
                    }
                    placeholder="Optional"
                    className="w-full h-9 rounded-lg border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
                  />
                </div>
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
                  disabled={loading || !form.email || !form.firstName}
                  className="flex-1 h-9 rounded-lg bg-primary text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? "Adding…" : "Add to CRM"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
