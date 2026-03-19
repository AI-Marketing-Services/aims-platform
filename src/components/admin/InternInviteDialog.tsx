"use client"

import { useState } from "react"
import { X, UserPlus } from "lucide-react"
import { cn } from "@/lib/utils"

interface FormState {
  name: string
  email: string
  role: string
  university: string
}

const INITIAL: FormState = { name: "", email: "", role: "BDR", university: "" }

export function InternInviteDialog() {
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
      const res = await fetch("/api/admin/interns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? "Failed")
      setOpen(false)
      setForm(INITIAL)
      showToast("success", "Intern invited successfully.")
    } catch (err) {
      showToast("error", err instanceof Error ? err.message : "Something went wrong.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Toast */}
      {toast && (
        <div
          className={cn(
            "fixed bottom-5 right-5 z-[100] flex items-center gap-3 rounded-xl border px-4 py-3 text-sm shadow-xl transition-all",
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

      {/* Trigger */}
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-lg bg-[#C4972A] px-4 py-2 text-sm font-medium text-white hover:bg-[#A17D22] transition-colors"
      >
        <UserPlus className="h-4 w-4" />
        Invite Intern
      </button>

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false) }}
        >
          <div className="w-full max-w-md rounded-2xl border border-border bg-card shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-border">
              <div>
                <h2 className="text-base font-semibold text-foreground">Invite Intern</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Add a new intern to the roster</p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-muted/50 text-muted-foreground transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                  Full Name <span className="text-[#C4972A]">*</span>
                </label>
                <input
                  required
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Enter full name"
                  className="w-full h-9 rounded-lg border border-border bg-muted px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-[#C4972A]/50"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                  Email <span className="text-[#C4972A]">*</span>
                </label>
                <input
                  required
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  placeholder="intern@example.com"
                  className="w-full h-9 rounded-lg border border-border bg-muted px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-[#C4972A]/50"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                  Role <span className="text-[#C4972A]">*</span>
                </label>
                <select
                  required
                  value={form.role}
                  onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
                  className="w-full h-9 rounded-lg border border-border bg-muted px-3 text-sm text-foreground focus:outline-none focus:border-[#C4972A]/50"
                >
                  <option value="AI_BUILDER">AI Builder</option>
                  <option value="BDR">BDR</option>
                  <option value="PM">PM</option>
                  <option value="COORDINATOR">Coordinator</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                  University <span className="text-muted-foreground/50">(optional)</span>
                </label>
                <input
                  type="text"
                  value={form.university}
                  onChange={(e) => setForm((f) => ({ ...f, university: e.target.value }))}
                  placeholder="e.g. University of Michigan"
                  className="w-full h-9 rounded-lg border border-border bg-muted px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-[#C4972A]/50"
                />
              </div>

              {/* Actions */}
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
                  {loading ? "Inviting…" : "Send Invite"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
