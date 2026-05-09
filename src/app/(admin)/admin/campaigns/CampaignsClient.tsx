"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

interface RolledRow {
  utmSource: string
  utmCampaign: string | null
  signups: number
  paidUsers: number
  revenueUsd: number
  spendUsd: number
  cacUsd: number | null
  roas: number | null
}

interface SpendRow {
  id: string
  utmSource: string
  utmMedium: string | null
  utmCampaign: string | null
  periodStart: string
  periodEnd: string
  spendUsd: number
  channel: string | null
  notes: string | null
}

/**
 * Two-pane UI: left = ROAS rollup table; right = "Add weekly spend" form
 * + recent spend rows. Editing a row reposts to the API which rewrites
 * the CampaignSpend record and triggers a router.refresh.
 */
export default function CampaignsClient({
  rolled,
  spendRows,
}: {
  rolled: RolledRow[]
  spendRows: SpendRow[]
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Per-campaign ROAS</h2>
        <div className="rounded-md border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-muted-foreground text-xs uppercase tracking-wide">
              <tr>
                <th className="text-left px-3 py-2">utm_source</th>
                <th className="text-left px-3 py-2">utm_campaign</th>
                <th className="text-right px-3 py-2">Signups</th>
                <th className="text-right px-3 py-2">Paid</th>
                <th className="text-right px-3 py-2">Revenue</th>
                <th className="text-right px-3 py-2">Spend</th>
                <th className="text-right px-3 py-2">CAC</th>
                <th className="text-right px-3 py-2">ROAS</th>
              </tr>
            </thead>
            <tbody>
              {rolled.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-3 py-6 text-center text-muted-foreground text-xs"
                  >
                    No campaign-attributed signups yet. Once UTM-tagged links start driving
                    signups, they'll appear here.
                  </td>
                </tr>
              ) : (
                rolled.map((r, i) => (
                  <tr key={i} className="border-t border-border">
                    <td className="px-3 py-2 font-medium">{r.utmSource}</td>
                    <td className="px-3 py-2">{r.utmCampaign ?? "—"}</td>
                    <td className="px-3 py-2 text-right">{r.signups}</td>
                    <td className="px-3 py-2 text-right">{r.paidUsers}</td>
                    <td className="px-3 py-2 text-right">{fmtUsd(r.revenueUsd)}</td>
                    <td className="px-3 py-2 text-right">{fmtUsd(r.spendUsd)}</td>
                    <td className="px-3 py-2 text-right">
                      {r.cacUsd != null ? fmtUsd(r.cacUsd) : "—"}
                    </td>
                    <td
                      className={`px-3 py-2 text-right ${
                        r.roas == null
                          ? ""
                          : r.roas >= 3
                            ? "text-emerald-500 font-semibold"
                            : r.roas < 1
                              ? "text-red-500 font-semibold"
                              : ""
                      }`}
                    >
                      {r.roas != null ? `${r.roas.toFixed(2)}x` : "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="space-y-6">
        <SpendForm />
        <RecentSpend rows={spendRows} />
      </div>
    </div>
  )
}

function SpendForm() {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    const fd = new FormData(e.currentTarget)
    try {
      const res = await fetch("/api/admin/campaigns", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          utmSource: fd.get("utmSource"),
          utmMedium: fd.get("utmMedium"),
          utmCampaign: fd.get("utmCampaign"),
          periodStart: fd.get("periodStart"),
          periodEnd: fd.get("periodEnd"),
          spendUsd: Number(fd.get("spendUsd")),
          channel: fd.get("channel"),
          notes: fd.get("notes"),
        }),
      })
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(j.error ?? "Save failed")
      }
      ;(e.target as HTMLFormElement).reset()
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed")
    } finally {
      setBusy(false)
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-md border border-border bg-card p-4 space-y-3"
    >
      <h3 className="text-sm font-semibold">Log weekly spend</h3>
      <div className="grid grid-cols-2 gap-2">
        <Field name="utmSource" label="utm_source" required placeholder="google" />
        <Field name="utmMedium" label="utm_medium" placeholder="cpc" />
      </div>
      <Field name="utmCampaign" label="utm_campaign" placeholder="branded-search" />
      <div className="grid grid-cols-2 gap-2">
        <Field name="periodStart" label="Start" type="date" required />
        <Field name="periodEnd" label="End" type="date" required />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Field name="spendUsd" label="Spend (USD)" type="number" step="0.01" required />
        <Field name="channel" label="Channel" placeholder="Google Ads" />
      </div>
      <label className="block">
        <div className="text-xs text-muted-foreground mb-1">Notes</div>
        <textarea
          name="notes"
          rows={2}
          className="w-full rounded-md border border-border bg-background px-2 py-1 text-sm"
        />
      </label>
      {error ? <div className="text-xs text-red-500">{error}</div> : null}
      <button
        type="submit"
        disabled={busy}
        className="w-full rounded-md bg-primary text-primary-foreground py-2 text-sm font-medium hover:opacity-90 disabled:opacity-50"
      >
        {busy ? "Saving…" : "Save"}
      </button>
    </form>
  )
}

function Field({
  name,
  label,
  type = "text",
  required,
  placeholder,
  step,
}: {
  name: string
  label: string
  type?: string
  required?: boolean
  placeholder?: string
  step?: string
}) {
  return (
    <label className="block">
      <div className="text-xs text-muted-foreground mb-1">{label}</div>
      <input
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        step={step}
        className="w-full rounded-md border border-border bg-background px-2 py-1 text-sm"
      />
    </label>
  )
}

function RecentSpend({ rows }: { rows: SpendRow[] }) {
  if (rows.length === 0) return null
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold">Recent spend</h3>
      <div className="rounded-md border border-border overflow-hidden">
        <table className="w-full text-xs">
          <thead className="bg-muted/40 text-muted-foreground uppercase tracking-wide">
            <tr>
              <th className="text-left px-2 py-1.5">Source</th>
              <th className="text-left px-2 py-1.5">Campaign</th>
              <th className="text-right px-2 py-1.5">Spend</th>
            </tr>
          </thead>
          <tbody>
            {rows.slice(0, 10).map((r) => (
              <tr key={r.id} className="border-t border-border">
                <td className="px-2 py-1.5">{r.utmSource}</td>
                <td className="px-2 py-1.5">{r.utmCampaign ?? "—"}</td>
                <td className="px-2 py-1.5 text-right">{fmtUsd(r.spendUsd)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function fmtUsd(n: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n)
}
