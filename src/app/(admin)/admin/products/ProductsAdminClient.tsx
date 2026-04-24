"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Plus, Trash2, Save, Power, PowerOff } from "lucide-react"

export type ProductRow = {
  id: string
  slug: string
  name: string
  description: string | null
  type: string
  isActive: boolean
  sortOrder: number
  stripePriceMonthly: string | null
  stripePriceAnnual: string | null
  stripePriceOneTime: string | null
  entitlements: string[]
  commissionBps: number
  grantsRole: string | null
  purchaseCount: number
  createdAt: string
}

const PRODUCT_TYPES = ["tier", "tool", "addon"] as const
const KNOWN_ENTITLEMENTS = [
  "chatbot-premium",
  "voice-agent",
  "playbook-vault",
  "audit-tool",
  "whitelabel-tools",
  "commission-tracking",
  "member-only-content",
] as const
const ROLE_OPTIONS = ["", "CLIENT", "RESELLER"] as const

type Draft = Omit<ProductRow, "id" | "purchaseCount" | "createdAt"> & { id?: string }

function emptyDraft(): Draft {
  return {
    slug: "",
    name: "",
    description: "",
    type: "tier",
    isActive: true,
    sortOrder: 0,
    stripePriceMonthly: null,
    stripePriceAnnual: null,
    stripePriceOneTime: null,
    entitlements: [],
    commissionBps: 0,
    grantsRole: null,
  }
}

export function ProductsAdminClient({ initialRows }: { initialRows: ProductRow[] }) {
  const router = useRouter()
  const [editing, setEditing] = useState<Draft | null>(null)
  const [saving, setSaving] = useState(false)

  async function save() {
    if (!editing) return
    if (!editing.slug || !editing.name) {
      toast.error("Slug and name are required")
      return
    }
    setSaving(true)
    try {
      const isUpdate = !!editing.id
      const res = await fetch(
        isUpdate ? `/api/admin/products/${editing.id}` : "/api/admin/products",
        {
          method: isUpdate ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(editing),
        },
      )
      const body = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(body.error ?? "Save failed")
        return
      }
      toast.success(isUpdate ? "Product updated" : "Product created")
      setEditing(null)
      router.refresh()
    } finally {
      setSaving(false)
    }
  }

  async function toggleActive(id: string, current: boolean) {
    const res = await fetch(`/api/admin/products/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !current }),
    })
    if (res.ok) {
      toast.success(current ? "Deactivated" : "Activated")
      router.refresh()
    } else {
      toast.error("Failed to toggle")
    }
  }

  async function remove(id: string) {
    if (!confirm("Delete this product? Existing purchases will keep their reference but the product won't be sellable.")) return
    const res = await fetch(`/api/admin/products/${id}`, { method: "DELETE" })
    if (res.ok) {
      toast.success("Deleted")
      router.refresh()
    } else {
      const body = await res.json().catch(() => ({}))
      toast.error(body.error ?? "Delete failed")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button
          onClick={() => setEditing(emptyDraft())}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          New product
        </button>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-surface">
            <tr className="text-left text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Entitlements</th>
              <th className="px-4 py-3 text-right">Commission</th>
              <th className="px-4 py-3 text-right">Purchases</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {initialRows.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-sm text-muted-foreground">
                  No products yet. Click &quot;New product&quot; or run <code className="font-mono">npm run seed:products</code>.
                </td>
              </tr>
            )}
            {initialRows.map((p) => (
              <tr key={p.id} className={p.isActive ? "" : "opacity-60"}>
                <td className="px-4 py-3">
                  <div className="font-medium text-foreground">{p.name}</div>
                  <div className="text-xs text-muted-foreground font-mono">{p.slug}</div>
                </td>
                <td className="px-4 py-3 font-mono text-[11px] text-muted-foreground uppercase">{p.type}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {p.entitlements.length === 0 && <span className="text-xs text-muted-foreground">—</span>}
                    {p.entitlements.map((e) => (
                      <span key={e} className="inline-block px-1.5 py-0.5 rounded bg-muted text-[10px] font-mono text-muted-foreground">
                        {e}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3 text-right font-mono text-xs">
                  {p.commissionBps > 0 ? `${(p.commissionBps / 100).toFixed(1)}%` : "—"}
                </td>
                <td className="px-4 py-3 text-right font-mono text-xs">{p.purchaseCount}</td>
                <td className="px-4 py-3">
                  {p.isActive ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-700 text-[10px]">
                      <Power className="h-3 w-3" />
                      Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-muted text-muted-foreground text-[10px]">
                      <PowerOff className="h-3 w-3" />
                      Off
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setEditing({ ...p })}
                      className="text-xs text-primary hover:underline"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => toggleActive(p.id, p.isActive)}
                      className="text-xs text-muted-foreground hover:text-foreground"
                    >
                      {p.isActive ? "Deactivate" : "Activate"}
                    </button>
                    {p.purchaseCount === 0 && (
                      <button
                        onClick={() => remove(p.id)}
                        className="text-xs text-red-600 hover:text-red-700"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editing && (
        <ProductEditor
          draft={editing}
          onChange={setEditing}
          onSave={save}
          onCancel={() => setEditing(null)}
          saving={saving}
        />
      )}
    </div>
  )
}

function ProductEditor({
  draft,
  onChange,
  onSave,
  onCancel,
  saving,
}: {
  draft: Draft
  onChange: (d: Draft) => void
  onSave: () => void
  onCancel: () => void
  saving: boolean
}) {
  function toggleEnt(key: string) {
    const has = draft.entitlements.includes(key)
    onChange({
      ...draft,
      entitlements: has ? draft.entitlements.filter((k) => k !== key) : [...draft.entitlements, key],
    })
  }

  return (
    <div className="rounded-lg border border-border bg-card p-6 space-y-4">
      <h2 className="text-base font-semibold text-foreground">
        {draft.id ? "Edit product" : "New product"}
      </h2>

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Slug (immutable identifier)">
          <input
            type="text"
            value={draft.slug}
            disabled={!!draft.id}
            onChange={(e) => onChange({ ...draft, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-") })}
            placeholder="reseller-tier"
            className="w-full px-3 py-2 bg-background border border-border rounded text-sm font-mono disabled:opacity-50"
          />
        </Field>
        <Field label="Name (customer-facing)">
          <input
            type="text"
            value={draft.name}
            onChange={(e) => onChange({ ...draft, name: e.target.value })}
            placeholder="Reseller"
            className="w-full px-3 py-2 bg-background border border-border rounded text-sm"
          />
        </Field>
      </div>

      <Field label="Description">
        <textarea
          rows={2}
          value={draft.description ?? ""}
          onChange={(e) => onChange({ ...draft, description: e.target.value })}
          className="w-full px-3 py-2 bg-background border border-border rounded text-sm"
        />
      </Field>

      <div className="grid gap-4 md:grid-cols-3">
        <Field label="Type">
          <select
            value={draft.type}
            onChange={(e) => onChange({ ...draft, type: e.target.value })}
            className="w-full px-3 py-2 bg-background border border-border rounded text-sm"
          >
            {PRODUCT_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </Field>
        <Field label="Sort order">
          <input
            type="number"
            value={draft.sortOrder}
            onChange={(e) => onChange({ ...draft, sortOrder: parseInt(e.target.value, 10) || 0 })}
            className="w-full px-3 py-2 bg-background border border-border rounded text-sm"
          />
        </Field>
        <Field label="Grants role (on first purchase)">
          <select
            value={draft.grantsRole ?? ""}
            onChange={(e) => onChange({ ...draft, grantsRole: e.target.value || null })}
            className="w-full px-3 py-2 bg-background border border-border rounded text-sm"
          >
            {ROLE_OPTIONS.map((r) => (
              <option key={r} value={r}>{r || "(none)"}</option>
            ))}
          </select>
        </Field>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Field label="Stripe price (monthly)">
          <input
            type="text"
            value={draft.stripePriceMonthly ?? ""}
            onChange={(e) => onChange({ ...draft, stripePriceMonthly: e.target.value || null })}
            placeholder="price_..."
            className="w-full px-3 py-2 bg-background border border-border rounded text-sm font-mono"
          />
        </Field>
        <Field label="Stripe price (annual)">
          <input
            type="text"
            value={draft.stripePriceAnnual ?? ""}
            onChange={(e) => onChange({ ...draft, stripePriceAnnual: e.target.value || null })}
            placeholder="price_..."
            className="w-full px-3 py-2 bg-background border border-border rounded text-sm font-mono"
          />
        </Field>
        <Field label="Stripe price (one-time)">
          <input
            type="text"
            value={draft.stripePriceOneTime ?? ""}
            onChange={(e) => onChange({ ...draft, stripePriceOneTime: e.target.value || null })}
            placeholder="price_..."
            className="w-full px-3 py-2 bg-background border border-border rounded text-sm font-mono"
          />
        </Field>
      </div>

      <Field label="Commission rate (basis points; 2000 = 20%)">
        <input
          type="number"
          min={0}
          max={10000}
          value={draft.commissionBps}
          onChange={(e) => onChange({ ...draft, commissionBps: Math.max(0, Math.min(10000, parseInt(e.target.value, 10) || 0)) })}
          className="w-32 px-3 py-2 bg-background border border-border rounded text-sm"
        />
      </Field>

      <Field label="Entitlements granted">
        <div className="flex flex-wrap gap-2">
          {KNOWN_ENTITLEMENTS.map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => toggleEnt(k)}
              className={`px-3 py-1 rounded text-xs font-mono border transition-colors ${
                draft.entitlements.includes(k)
                  ? "bg-primary text-white border-primary"
                  : "bg-card border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {k}
            </button>
          ))}
        </div>
      </Field>

      <div className="flex justify-end gap-3 pt-2">
        <button onClick={onCancel} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground">
          Cancel
        </button>
        <button
          onClick={onSave}
          disabled={saving}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          {saving ? "Saving…" : "Save"}
        </button>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-1">{label}</span>
      {children}
    </label>
  )
}
