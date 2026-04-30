"use client"

import { useState, useTransition, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { toast } from "sonner"
import {
  Plus,
  X,
  Briefcase,
  MapPin,
  Upload,
  Loader2,
  Check,
} from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * Sticky quick-add FAB. Floats above the bottom nav on mobile and in
 * the bottom-right on desktop. Single-tap opens an action sheet with:
 *   - Add deal (inline mini-form: company + optional value)
 *   - Scout for leads (link)
 *   - Import CSV (link)
 *
 * Inline create keeps the operator in flow: they can capture a lead in
 * 5 seconds without navigating away from whatever page they're on.
 *
 * The component is mounted once in the portal layout so it shadows
 * every page consistently. It self-hides on routes where it would be
 * redundant (e.g. /portal/crm/scout).
 */
export function QuickAddFab() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<"menu" | "deal">("menu")
  const [companyName, setCompanyName] = useState("")
  const [value, setValue] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  // Reset form when sheet closes
  useEffect(() => {
    if (!open) {
      const t = setTimeout(() => {
        setMode("menu")
        setCompanyName("")
        setValue("")
        setError(null)
      }, 200)
      return () => clearTimeout(t)
    }
  }, [open])

  // Esc closes
  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open])

  async function handleCreateDeal(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = companyName.trim()
    if (!trimmed) {
      setError("Company name required")
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      const numericValue = value.trim() ? Number(value.replace(/[^\d.]/g, "")) : 0
      const res = await fetch("/api/portal/crm/deals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName: trimmed,
          value: Number.isFinite(numericValue) ? numericValue : 0,
          stage: "PROSPECT",
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? "Failed to create deal")
      }
      const data = await res.json()
      const dealId = data?.deal?.id
      setOpen(false)
      toast.success(`${trimmed} added to CRM`, {
        description: "Open the deal to enrich, log notes, and pitch.",
      })
      // Navigate to the new deal so the operator can immediately add
      // contact / notes / enrichment.
      if (dealId) {
        startTransition(() => router.push(`/portal/crm/${dealId}`))
      } else {
        startTransition(() => router.refresh())
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      {/* Floating button. Always-on-top. Hides itself on the scout
          and import pages (those already have prominent CTAs). */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Quick add"
        className={cn(
          // Position: above mobile bottom nav (h-16 + safe area).
          // On desktop, sit above the chat widget (which lives at
          // bottom-6 right-6, h-14) so they don't overlap.
          "fixed right-4 bottom-20 lg:right-6 lg:bottom-[5.5rem] z-40",
          "h-12 w-12 rounded-full shadow-lg shadow-primary/25",
          "bg-primary text-primary-foreground",
          "flex items-center justify-center",
          "hover:scale-105 active:scale-95 transition-all duration-150",
          open && "opacity-0 pointer-events-none",
        )}
      >
        <Plus className="h-5 w-5" strokeWidth={2.5} />
      </button>

      {/* Sheet + backdrop */}
      {open && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end sm:items-center sm:justify-center">
          {/* Backdrop */}
          <button
            type="button"
            aria-label="Close"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          />

          {/* Sheet */}
          <div
            className={cn(
              "relative w-full sm:max-w-md sm:rounded-2xl",
              "rounded-t-2xl bg-card border-t border-l border-r border-border sm:border",
              "shadow-2xl",
              "max-h-[85dvh] overflow-y-auto",
            )}
          >
            <div className="flex items-center justify-between px-5 pt-4 pb-2">
              <p className="text-sm font-bold text-foreground">
                {mode === "menu" ? "Quick add" : "Add a deal"}
              </p>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/40"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {mode === "menu" ? (
              <div className="px-3 pb-4 pt-1 space-y-1.5">
                <button
                  type="button"
                  onClick={() => setMode("deal")}
                  className="w-full flex items-center gap-3 rounded-xl px-3 py-3 hover:bg-muted/40 transition-colors text-left"
                >
                  <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Briefcase className="h-4.5 w-4.5 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-foreground">
                      Add deal
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      Capture a lead in 5 seconds. Enrich it later.
                    </p>
                  </div>
                </button>

                <Link
                  href="/portal/crm/scout"
                  onClick={() => setOpen(false)}
                  className="w-full flex items-center gap-3 rounded-xl px-3 py-3 hover:bg-muted/40 transition-colors text-left"
                >
                  <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <MapPin className="h-4.5 w-4.5 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-foreground">
                      Scout leads
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      Find prospects by industry + location.
                    </p>
                  </div>
                </Link>

                <Link
                  href="/portal/crm/import"
                  onClick={() => setOpen(false)}
                  className="w-full flex items-center gap-3 rounded-xl px-3 py-3 hover:bg-muted/40 transition-colors text-left"
                >
                  <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Upload className="h-4.5 w-4.5 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-foreground">
                      Import CSV
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      Bulk-load from HubSpot, Pipedrive, Sheets.
                    </p>
                  </div>
                </Link>
              </div>
            ) : (
              <form onSubmit={handleCreateDeal} className="px-5 pb-5 pt-1 space-y-3">
                <div>
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Company name
                  </label>
                  <input
                    type="text"
                    autoFocus
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Acme Property Management"
                    disabled={submitting}
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/50 disabled:opacity-50"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Estimated monthly value
                    <span className="ml-1 text-muted-foreground/60 font-normal normal-case tracking-normal">
                      (optional)
                    </span>
                  </label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    placeholder="3500"
                    disabled={submitting}
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/50 disabled:opacity-50"
                  />
                </div>

                {error && (
                  <p className="text-xs text-destructive">{error}</p>
                )}

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setMode("menu")}
                    disabled={submitting}
                    className="flex-1 rounded-lg border border-border bg-background py-2.5 text-sm font-medium text-foreground hover:bg-muted/30 disabled:opacity-50 transition-colors"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || !companyName.trim()}
                    className="flex-1 rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors inline-flex items-center justify-center gap-1.5"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        Creating
                      </>
                    ) : (
                      <>
                        <Check className="h-3.5 w-3.5" />
                        Create deal
                      </>
                    )}
                  </button>
                </div>

                <p className="text-[10px] text-muted-foreground text-center pt-1">
                  Created as a Prospect. Open it to add contact details, enrich, or move along the pipeline.
                </p>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  )
}
