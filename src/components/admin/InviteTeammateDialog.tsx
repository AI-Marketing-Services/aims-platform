"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Mail, UserPlus, X } from "lucide-react"

const ROLES = [
  { value: "ADMIN", label: "Admin", hint: "Full access to the AIMS admin platform" },
  { value: "INTERN", label: "Intern", hint: "Limited access — task board + EOD reports" },
  { value: "RESELLER", label: "Reseller", hint: "Reseller portal only" },
  { value: "CLIENT", label: "Client", hint: "Customer portal only" },
] as const

type Role = (typeof ROLES)[number]["value"]

interface Props {
  onInvited?: () => void
}

const INITIAL = {
  email: "",
  firstName: "",
  lastName: "",
  role: "ADMIN" as Role,
}

export function InviteTeammateDialog({ onInvited }: Props) {
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
      const res = await fetch("/api/admin/users/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email.trim().toLowerCase(),
          role: form.role,
          firstName: form.firstName.trim() || null,
          lastName: form.lastName.trim() || null,
        }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(json?.error ?? "Failed to send invite")
        return
      }
      toast.success(`Invite sent to ${form.email.trim()}`)
      reset()
      setOpen(false)
      onInvited?.()
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
        className="inline-flex items-center gap-2 rounded-lg bg-primary px-3.5 py-2 text-sm font-medium text-white hover:bg-primary/90 transition-colors"
      >
        <UserPlus className="h-4 w-4" />
        Invite teammate
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
                  Invite teammate
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  They&apos;ll get a branded email to set up their account.
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
                    placeholder="teammate@aims.com"
                    className="w-full h-9 rounded-lg border border-border bg-background pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                    First name
                  </label>
                  <input
                    type="text"
                    value={form.firstName}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, firstName: e.target.value }))
                    }
                    placeholder="Optional"
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
                    placeholder="Optional"
                    className="w-full h-9 rounded-lg border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                  Role <span className="text-primary">*</span>
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {ROLES.map((r) => (
                    <label
                      key={r.value}
                      className={`flex items-start gap-3 rounded-lg border px-3 py-2.5 cursor-pointer transition-colors ${
                        form.role === r.value
                          ? "border-primary/50 bg-primary/5"
                          : "border-border hover:bg-muted/30"
                      }`}
                    >
                      <input
                        type="radio"
                        name="role"
                        value={r.value}
                        checked={form.role === r.value}
                        onChange={() =>
                          setForm((f) => ({ ...f, role: r.value }))
                        }
                        className="mt-1 accent-primary"
                      />
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-foreground">
                          {r.label}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {r.hint}
                        </div>
                      </div>
                    </label>
                  ))}
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
                  disabled={loading || !form.email}
                  className="flex-1 h-9 rounded-lg bg-primary text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? "Sending…" : "Send invite"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
