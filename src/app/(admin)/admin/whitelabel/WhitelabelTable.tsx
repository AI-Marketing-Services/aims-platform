"use client"

import { useState } from "react"
import Link from "next/link"
import { toast } from "sonner"
import { ExternalLink, RefreshCw, CheckCircle2, Circle, AlertCircle } from "lucide-react"

export type WhitelabelRow = {
  id: string
  subdomain: string
  customDomain: string | null
  customDomainVerified: boolean
  isPublished: boolean
  updatedAt: string
  owner: {
    id: string
    email: string
    name: string | null
    businessName: string | null
    role: string
  }
  referredDealCount: number
}

type Props = {
  rows: WhitelabelRow[]
  vercelConfigured: boolean
}

export function WhitelabelTable({ rows, vercelConfigured }: Props) {
  const [busy, setBusy] = useState<string | null>(null)

  async function recheck(ownerId: string) {
    setBusy(ownerId)
    try {
      const res = await fetch(`/api/admin/whitelabel/${ownerId}/recheck`, { method: "POST" })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(body.error ?? "Recheck failed")
        return
      }
      if (body.verified) {
        toast.success("Domain is verified and serving")
      } else {
        toast.info(`Still pending — ${body.reason ?? "DNS not detected yet"}`)
      }
    } catch {
      toast.error("Network error")
    } finally {
      setBusy(null)
    }
  }

  if (rows.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-8 text-center">
        <p className="text-sm text-muted-foreground">No whitelabel sites yet.</p>
        <p className="text-xs text-muted-foreground mt-1">
          A site is created the first time a reseller picks a subdomain or adds a custom domain.
        </p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-card">
      <table className="w-full text-sm">
        <thead className="bg-surface">
          <tr className="text-left text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
            <th className="px-4 py-3">Owner</th>
            <th className="px-4 py-3">Subdomain</th>
            <th className="px-4 py-3">Custom Domain</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3 text-right">Leads</th>
            <th className="px-4 py-3">Updated</th>
            <th className="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((r) => (
            <tr key={r.id} className="hover:bg-surface/50 transition-colors">
              <td className="px-4 py-3">
                <div className="font-medium text-foreground">
                  {r.owner.businessName ?? r.owner.name ?? r.owner.email.split("@")[0]}
                </div>
                <div className="text-xs text-muted-foreground flex items-center gap-2">
                  <span>{r.owner.email}</span>
                  <span className="font-mono text-[10px] uppercase text-primary">{r.owner.role}</span>
                </div>
              </td>
              <td className="px-4 py-3">
                <a
                  href={`https://${r.subdomain}.aioperatorcollective.com`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-xs text-primary hover:underline inline-flex items-center gap-1"
                >
                  {r.subdomain}
                  <ExternalLink className="h-3 w-3" />
                </a>
                <div className="text-[10px] text-muted-foreground mt-0.5">
                  <Link href={`/sites/${r.subdomain}`} className="hover:underline">
                    Direct path test
                  </Link>
                </div>
              </td>
              <td className="px-4 py-3">
                {r.customDomain ? (
                  <a
                    href={`https://${r.customDomain}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-xs text-foreground hover:text-primary hover:underline inline-flex items-center gap-1"
                  >
                    {r.customDomain}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                ) : (
                  <span className="text-xs text-muted-foreground">—</span>
                )}
              </td>
              <td className="px-4 py-3">
                <div className="flex flex-col gap-1">
                  <StatusBadge
                    label={r.isPublished ? "Published" : "Draft"}
                    tone={r.isPublished ? "good" : "neutral"}
                  />
                  {r.customDomain && (
                    <StatusBadge
                      label={r.customDomainVerified ? "DNS verified" : "DNS pending"}
                      tone={r.customDomainVerified ? "good" : "warn"}
                    />
                  )}
                </div>
              </td>
              <td className="px-4 py-3 text-right font-mono text-foreground">
                {r.referredDealCount}
              </td>
              <td className="px-4 py-3 text-xs text-muted-foreground">
                {new Date(r.updatedAt).toLocaleDateString()}
              </td>
              <td className="px-4 py-3 text-right">
                <div className="flex gap-2 justify-end">
                  {r.customDomain && vercelConfigured && (
                    <button
                      onClick={() => recheck(r.owner.id)}
                      disabled={busy === r.owner.id}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded border border-border text-xs hover:bg-surface disabled:opacity-50"
                      title="Recheck DNS with Vercel"
                    >
                      <RefreshCw className={`h-3 w-3 ${busy === r.owner.id ? "animate-spin" : ""}`} />
                      Recheck
                    </button>
                  )}
                  <Link
                    href={`/admin/users?search=${encodeURIComponent(r.owner.email)}`}
                    className="text-xs text-primary hover:underline"
                  >
                    Owner
                  </Link>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function StatusBadge({
  label,
  tone,
}: {
  label: string
  tone: "good" | "warn" | "neutral"
}) {
  const cls =
    tone === "good"
      ? "text-emerald-700 bg-emerald-500/10"
      : tone === "warn"
        ? "text-amber-700 bg-amber-500/10"
        : "text-muted-foreground bg-surface"
  const Icon = tone === "good" ? CheckCircle2 : tone === "warn" ? AlertCircle : Circle
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium ${cls}`}>
      <Icon className="h-3 w-3" />
      {label}
    </span>
  )
}
