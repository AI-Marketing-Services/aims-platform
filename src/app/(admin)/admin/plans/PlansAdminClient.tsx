"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Search, Sparkles, Check, AlertCircle } from "lucide-react"

interface Row {
  id: string
  email: string
  name: string | null
  role: string
  planSlug: string
  creditBalance: number
  entitlementCount: number
  createdAt: string
}

const PLAN_OPTIONS = [
  { slug: "free", label: "Free" },
  { slug: "pro", label: "Pro" },
  { slug: "operator", label: "Operator" },
] as const

const PLAN_BADGE: Record<string, string> = {
  free: "bg-muted text-muted-foreground border-border",
  pro: "bg-primary/10 text-primary border-primary/30",
  operator: "bg-emerald-50 text-emerald-700 border-emerald-200",
}

export function PlansAdminClient({ users }: { users: Row[] }) {
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [filterPlan, setFilterPlan] = useState<string>("all")
  const [busyId, setBusyId] = useState<string | null>(null)
  const [message, setMessage] = useState<{ kind: "ok" | "err"; text: string } | null>(null)

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim()
    return users.filter((u) => {
      if (filterPlan !== "all" && u.planSlug !== filterPlan) return false
      if (!q) return true
      return (
        u.email.toLowerCase().includes(q) ||
        (u.name ?? "").toLowerCase().includes(q)
      )
    })
  }, [users, query, filterPlan])

  const grant = async (userId: string, planSlug: string, skipCredits: boolean) => {
    setBusyId(userId)
    setMessage(null)
    try {
      const res = await fetch(`/api/admin/users/${userId}/grant-plan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planSlug, skipCredits, note: "admin-ui-grant" }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error ?? `Grant failed (${res.status})`)
      setMessage({
        kind: "ok",
        text: `Granted ${planSlug} · +${data.creditsGranted ?? 0} credits · ${data.entitlementsGranted?.length ?? 0} features`,
      })
      router.refresh()
    } catch (err) {
      setMessage({
        kind: "err",
        text: err instanceof Error ? err.message : "Grant failed",
      })
    } finally {
      setBusyId(null)
      setTimeout(() => setMessage(null), 4000)
    }
  }

  return (
    <div className="space-y-3">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by email or name…"
            className="w-full pl-9 pr-3 py-2 bg-card border border-border rounded-lg text-sm focus:outline-none focus:border-primary/40"
          />
        </div>
        <div className="rounded-lg border border-border bg-card overflow-hidden flex">
          <button
            type="button"
            onClick={() => setFilterPlan("all")}
            className={`px-3 py-2 text-xs font-medium ${
              filterPlan === "all"
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            All
          </button>
          {PLAN_OPTIONS.map((p) => (
            <button
              key={p.slug}
              type="button"
              onClick={() => setFilterPlan(p.slug)}
              className={`px-3 py-2 text-xs font-medium ${
                filterPlan === p.slug
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Status message */}
      {message && (
        <div
          className={`rounded-xl border p-3 text-sm flex items-start gap-2 ${
            message.kind === "ok"
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-destructive/30 bg-destructive/5 text-destructive"
          }`}
        >
          {message.kind === "ok" ? (
            <Check className="h-4 w-4 mt-0.5 shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          )}
          {message.text}
        </div>
      )}

      {/* Table */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="hidden sm:grid grid-cols-12 px-5 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wider bg-muted/20 border-b border-border">
          <div className="col-span-4">User</div>
          <div className="col-span-2">Role</div>
          <div className="col-span-2">Plan</div>
          <div className="col-span-1">Credits</div>
          <div className="col-span-3 text-right">Grant plan</div>
        </div>
        <div className="divide-y divide-border">
          {filtered.length === 0 ? (
            <p className="px-5 py-6 text-center text-sm text-muted-foreground">
              No users match.
            </p>
          ) : (
            filtered.map((u) => (
              <div
                key={u.id}
                className="grid grid-cols-2 sm:grid-cols-12 gap-2 px-5 py-3 items-center"
              >
                <div className="col-span-2 sm:col-span-4 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">
                    {u.name ?? "—"}
                  </p>
                  <p className="text-[11px] text-muted-foreground font-mono truncate">
                    {u.email}
                  </p>
                </div>
                <div className="col-span-1 sm:col-span-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    {u.role}
                  </span>
                </div>
                <div className="col-span-1 sm:col-span-2">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${PLAN_BADGE[u.planSlug] ?? PLAN_BADGE.free}`}
                  >
                    {u.planSlug}
                  </span>
                  <span className="text-[10px] text-muted-foreground ml-1">
                    · {u.entitlementCount} feat.
                  </span>
                </div>
                <div className="col-span-1 sm:col-span-1 text-xs text-muted-foreground">
                  {u.creditBalance.toLocaleString()}
                </div>
                <div className="col-span-2 sm:col-span-3 flex items-center gap-1 justify-end flex-wrap">
                  {PLAN_OPTIONS.map((p) => (
                    <button
                      key={p.slug}
                      type="button"
                      onClick={() => grant(u.id, p.slug, p.slug === u.planSlug)}
                      disabled={busyId === u.id}
                      title={
                        p.slug === u.planSlug
                          ? `Already on ${p.label} — re-applies entitlements without crediting`
                          : `Switch to ${p.label}`
                      }
                      className={`text-[11px] font-medium px-2.5 py-1 rounded-lg border transition-colors disabled:opacity-50 ${
                        p.slug === u.planSlug
                          ? "border-primary/30 bg-primary/5 text-primary"
                          : "border-border hover:border-primary/40 hover:bg-primary/5 text-muted-foreground hover:text-primary"
                      }`}
                    >
                      {busyId === u.id ? "…" : (
                        <>
                          <Sparkles className="inline h-3 w-3 mr-1" />
                          {p.label}
                        </>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <p className="text-[11px] text-muted-foreground">
        Showing {filtered.length} of {users.length} users. Granting comps a plan
        without a Stripe charge — entitlements are applied + monthly credits
        granted (unless re-applying the user&apos;s current plan).
      </p>
    </div>
  )
}
