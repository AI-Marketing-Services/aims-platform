"use client"

import { useState } from "react"
import { Search, Download, CheckCircle, AlertTriangle, Clock } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

const statusConfig = {
  healthy: { icon: CheckCircle, label: "Healthy", class: "text-green-400 bg-green-500/10 border-green-500/20" },
  at_risk: { icon: AlertTriangle, label: "At Risk", class: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20" },
  past_due: { icon: AlertTriangle, label: "Past Due", class: "text-red-400 bg-red-500/10 border-red-500/20" },
  inactive: { icon: Clock, label: "Inactive", class: "text-gray-500 bg-white/5 border-white/10" },
}

type Status = keyof typeof statusConfig

interface ClientRow {
  id: string
  name: string
  email: string
  company: string
  mrr: number
  status: Status
  services: string[]
  createdAt: string
}

interface Props {
  rows: ClientRow[]
  totalMRR: number
  atRisk: number
}

export function ClientsTable({ rows, totalMRR, atRisk }: Props) {
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<Status | "all">("all")
  const [downloading, setDownloading] = useState(false)

  const filtered = rows.filter((r) => {
    const q = search.toLowerCase()
    if (q && !r.name.toLowerCase().includes(q) && !r.email.toLowerCase().includes(q) && !r.company.toLowerCase().includes(q)) {
      return false
    }
    if (statusFilter !== "all" && r.status !== statusFilter) return false
    return true
  })

  async function downloadCsv() {
    setDownloading(true)
    try {
      const res = await fetch("/api/admin/clients/export")
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `clients-${new Date().toISOString().slice(0, 10)}.csv`
      a.click()
      URL.revokeObjectURL(url)
    } catch {}
    setDownloading(false)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Clients</h1>
          <p className="text-gray-400">
            {rows.length} active client{rows.length !== 1 ? "s" : ""} · ${totalMRR.toLocaleString()}/mo MRR
            {atRisk > 0 && <span className="ml-2 text-yellow-400">· {atRisk} at risk</span>}
          </p>
        </div>
        <button
          onClick={downloadCsv}
          disabled={downloading}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
        >
          <Download className="w-3.5 h-3.5" />
          {downloading ? "Exporting..." : "Export CSV"}
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, or company..."
            className="w-full pl-9 pr-4 py-2 bg-[#151821] border border-white/10 rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none focus:border-white/20"
          />
        </div>
        <div className="flex items-center gap-1 bg-[#151821] border border-white/10 rounded-lg p-1">
          {(["all", "healthy", "at_risk", "past_due"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={cn(
                "px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
                statusFilter === s
                  ? "bg-white/10 text-white"
                  : "text-gray-500 hover:text-gray-300"
              )}
            >
              {s === "all" ? "All" : s === "at_risk" ? "At Risk" : s === "past_due" ? "Past Due" : "Healthy"}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-[#151821] border border-white/10 rounded-xl p-12 text-center">
          <p className="text-gray-400">{rows.length === 0 ? "No active clients yet." : "No clients match your filters."}</p>
        </div>
      ) : (
        <div className="bg-[#151821] border border-white/10 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left text-xs text-gray-500 font-medium px-5 py-3">Client</th>
                <th className="text-left text-xs text-gray-500 font-medium px-4 py-3">Services</th>
                <th className="text-right text-xs text-gray-500 font-medium px-4 py-3">MRR</th>
                <th className="text-center text-xs text-gray-500 font-medium px-4 py-3">Status</th>
                <th className="text-left text-xs text-gray-500 font-medium px-4 py-3">Since</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.map((r) => {
                const sc = statusConfig[r.status]
                return (
                  <tr key={r.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-4">
                      <div className="text-white font-medium text-sm">{r.name || r.email.split("@")[0]}</div>
                      <div className="text-gray-500 text-xs">{r.email}</div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-1">
                        {r.services.map((s) => (
                          <span key={s} className="text-xs px-2 py-0.5 bg-white/5 text-gray-400 rounded-md">{s}</span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <span className="text-white font-semibold text-sm">${r.mrr.toLocaleString()}</span>
                      <div className="text-xs text-gray-500">/mo</div>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className={cn("inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border", sc.class)}>
                        <sc.icon className="w-3 h-3" />
                        {sc.label}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-500">{r.createdAt}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {filtered.length < rows.length && (
            <div className="px-5 py-3 border-t border-white/5 text-xs text-gray-500">
              Showing {filtered.length} of {rows.length} clients
            </div>
          )}
        </div>
      )}
    </div>
  )
}
