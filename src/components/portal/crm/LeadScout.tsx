"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import {
  Search,
  MapPin,
  Building2,
  Phone,
  Mail,
  Globe,
  Plus,
  Check,
  Loader2,
  X,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface ScoutedLead {
  companyName: string
  contactName: string | null
  contactEmail: string | null
  contactPhone: string | null
  website: string | null
  industry: string
  location: string
  sourceUrl: string
  snippet: string
}

interface ImportState {
  status: "idle" | "importing" | "done" | "error"
  dealId?: string
}

export function LeadScout() {
  const router = useRouter()
  const [businessType, setBusinessType] = useState("")
  const [location, setLocation] = useState("")
  const [leads, setLeads] = useState<ScoutedLead[]>([])
  const [isSearching, startSearch] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [importStates, setImportStates] = useState<Record<number, ImportState>>({})

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (!businessType.trim() || !location.trim()) return
    setError(null)
    setLeads([])
    setImportStates({})

    startSearch(async () => {
      const res = await fetch("/api/portal/crm/lead-scout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessType: businessType.trim(), location: location.trim() }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? "Search failed")
        return
      }

      const { leads: found } = await res.json()
      setLeads(found)
      if (found.length === 0) {
        setError("No leads found — try a different business type or location.")
      }
    })
  }

  async function importLead(lead: ScoutedLead, index: number) {
    setImportStates((prev) => ({ ...prev, [index]: { status: "importing" } }))

    const res = await fetch("/api/portal/crm/deals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        companyName: lead.companyName,
        contactName: lead.contactName,
        contactEmail: lead.contactEmail,
        contactPhone: lead.contactPhone,
        website: lead.website,
        industry: lead.industry,
        notes: `Scouted via Lead Scout — ${lead.location}\n\n${lead.snippet}`,
        stage: "PROSPECT",
        tags: ["lead-scout"],
      }),
    })

    if (!res.ok) {
      setImportStates((prev) => ({ ...prev, [index]: { status: "error" } }))
      return
    }

    const { deal } = await res.json()
    setImportStates((prev) => ({ ...prev, [index]: { status: "done", dealId: deal.id } }))
    router.refresh()
  }

  const inputClass =
    "h-10 px-3 rounded-lg bg-surface border border-border text-foreground text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/50"

  return (
    <div className="space-y-5">
      {/* Search form */}
      <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <input
            value={businessType}
            onChange={(e) => setBusinessType(e.target.value)}
            placeholder="Business type (e.g. HVAC, dental, roofing)"
            required
            className={cn(inputClass, "w-full pl-9")}
          />
        </div>
        <div className="relative flex-1">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="City, state (e.g. Austin, TX)"
            required
            className={cn(inputClass, "w-full pl-9")}
          />
        </div>
        <button
          type="submit"
          disabled={isSearching || !businessType || !location}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors shrink-0"
        >
          {isSearching ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Search className="h-4 w-4" />
          )}
          {isSearching ? "Scouting…" : "Scout"}
        </button>
      </form>

      {error && (
        <div className="flex items-center gap-2 text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">
          <X className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {isSearching && (
        <div className="flex items-center gap-3 text-sm text-muted-foreground py-6 justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          Searching for {businessType} businesses in {location}…
        </div>
      )}

      {/* Results */}
      {leads.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-foreground">
              {leads.length} leads found
            </p>
            <p className="text-xs text-muted-foreground">Click import to add to your CRM pipeline</p>
          </div>

          {leads.map((lead, idx) => {
            const state = importStates[idx] ?? { status: "idle" }
            const isImported = state.status === "done"
            const isImporting = state.status === "importing"

            return (
              <div
                key={idx}
                className={cn(
                  "flex items-start gap-3 p-4 rounded-xl border transition-all",
                  isImported
                    ? "bg-emerald-500/5 border-emerald-500/20"
                    : "bg-card border-border"
                )}
              >
                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <Building2 className="h-4 w-4 text-primary" />
                </div>

                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{lead.companyName}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <MapPin className="h-3 w-3 shrink-0" />
                        {lead.location || location}
                      </p>
                    </div>

                    <div className="shrink-0">
                      {isImported ? (
                        <a
                          href={`/portal/crm/${state.dealId}`}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors"
                        >
                          <Check className="h-3.5 w-3.5" />
                          View in CRM
                        </a>
                      ) : (
                        <button
                          onClick={() => importLead(lead, idx)}
                          disabled={isImporting}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 disabled:opacity-50 transition-colors"
                        >
                          {isImporting ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Plus className="h-3.5 w-3.5" />
                          )}
                          {isImporting ? "Importing…" : "Import"}
                        </button>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground leading-relaxed">{lead.snippet}</p>

                  <div className="flex flex-wrap items-center gap-3 pt-0.5">
                    {lead.contactPhone && (
                      <a
                        href={`tel:${lead.contactPhone}`}
                        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <Phone className="h-3 w-3" />
                        {lead.contactPhone}
                      </a>
                    )}
                    {lead.contactEmail && (
                      <a
                        href={`mailto:${lead.contactEmail}`}
                        className="flex items-center gap-1 text-xs text-primary hover:underline"
                      >
                        <Mail className="h-3 w-3" />
                        {lead.contactEmail}
                      </a>
                    )}
                    {lead.website && (
                      <a
                        href={lead.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs text-primary hover:underline truncate max-w-[200px]"
                      >
                        <Globe className="h-3 w-3 shrink-0" />
                        {lead.website.replace(/^https?:\/\//, "")}
                      </a>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
