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
  const [mapSrc, setMapSrc] = useState(
    "https://www.google.com/maps?q=United+States&output=embed"
  )
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
    setMapSrc(
      `https://www.google.com/maps?q=${encodeURIComponent(location.trim())}&output=embed`
    )

    startSearch(async () => {
      const res = await fetch("/api/portal/crm/lead-scout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessType: businessType.trim(),
          location: location.trim(),
        }),
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
    setImportStates((prev) => ({
      ...prev,
      [index]: { status: "done", dealId: deal.id },
    }))
    router.refresh()
  }

  return (
    <div className="flex h-full overflow-hidden">
      {/* Map — takes most of the width */}
      <div className="flex-1 relative bg-muted/20">
        <iframe
          key={mapSrc}
          src={mapSrc}
          className="w-full h-full border-0"
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          title="Location Map"
        />
      </div>

      {/* Right panel */}
      <div className="w-80 flex-shrink-0 border-l border-border bg-card flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-4 pt-4 pb-3 border-b border-border">
          <div className="flex items-center gap-2 mb-3">
            <MapPin className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">Lead Scout</h2>
          </div>

          <form onSubmit={handleSearch} className="space-y-2">
            <div>
              <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">
                Search Location
              </label>
              <div className="relative">
                <MapPin className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                <input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Austin, TX"
                  required
                  className="w-full h-8 pl-8 pr-3 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/50"
                />
              </div>
            </div>
            <div>
              <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">
                Business Type
              </label>
              <div className="relative">
                <Building2 className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                <input
                  value={businessType}
                  onChange={(e) => setBusinessType(e.target.value)}
                  placeholder="HVAC, dental, roofing..."
                  required
                  className="w-full h-8 pl-8 pr-3 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/50"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={isSearching || !businessType || !location}
              className="w-full flex items-center justify-center gap-2 h-9 rounded-lg text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {isSearching ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
              {isSearching ? "Searching…" : "Search for Leads"}
            </button>
          </form>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {error && (
            <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              <X className="h-3.5 w-3.5 shrink-0" />
              {error}
            </div>
          )}

          {isSearching && (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Loader2 className="h-5 w-5 animate-spin text-primary mb-2" />
              <p className="text-xs text-muted-foreground">
                Searching for {businessType} in {location}…
              </p>
            </div>
          )}

          {leads.length > 0 && (
            <>
              <p className="text-xs font-semibold text-foreground px-1">
                {leads.length} businesses found
              </p>
              {leads.map((lead, idx) => {
                const state = importStates[idx] ?? { status: "idle" }
                const isImported = state.status === "done"
                const isImporting = state.status === "importing"
                return (
                  <div
                    key={idx}
                    className={cn(
                      "rounded-lg border p-3 transition-all",
                      isImported
                        ? "bg-green-50 border-green-200"
                        : "bg-background border-border"
                    )}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <p className="text-xs font-semibold text-foreground leading-tight">
                        {lead.companyName}
                      </p>
                      {isImported ? (
                        <a
                          href={`/portal/crm/${state.dealId}`}
                          className="shrink-0 flex items-center gap-1 px-2 py-1 rounded text-[10px] font-semibold bg-green-100 text-green-700 hover:bg-green-200 transition-colors"
                        >
                          <Check className="h-3 w-3" />
                          In CRM
                        </a>
                      ) : (
                        <button
                          onClick={() => importLead(lead, idx)}
                          disabled={isImporting}
                          className="shrink-0 flex items-center gap-1 px-2 py-1 rounded text-[10px] font-semibold bg-primary/10 text-primary hover:bg-primary/20 disabled:opacity-50 transition-colors"
                        >
                          {isImporting ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Plus className="h-3 w-3" />
                          )}
                          {isImporting ? "…" : "Import"}
                        </button>
                      )}
                    </div>
                    <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-2.5 w-2.5 shrink-0" />
                      {lead.location || location}
                    </p>
                    {lead.snippet && (
                      <p className="text-[10px] text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                        {lead.snippet}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-2 mt-1.5">
                      {lead.contactPhone && (
                        <a
                          href={`tel:${lead.contactPhone}`}
                          className="flex items-center gap-0.5 text-[10px] text-muted-foreground hover:text-foreground"
                        >
                          <Phone className="h-2.5 w-2.5" />
                          {lead.contactPhone}
                        </a>
                      )}
                      {lead.contactEmail && (
                        <a
                          href={`mailto:${lead.contactEmail}`}
                          className="flex items-center gap-0.5 text-[10px] text-primary hover:underline"
                        >
                          <Mail className="h-2.5 w-2.5" />
                          {lead.contactEmail}
                        </a>
                      )}
                      {lead.website && (
                        <a
                          href={lead.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-0.5 text-[10px] text-primary hover:underline truncate max-w-[120px]"
                        >
                          <Globe className="h-2.5 w-2.5 shrink-0" />
                          {lead.website.replace(/^https?:\/\//, "")}
                        </a>
                      )}
                    </div>
                  </div>
                )
              })}
            </>
          )}

          {!isSearching && leads.length === 0 && !error && (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <MapPin className="h-8 w-8 text-muted-foreground/20 mb-2" />
              <p className="text-xs text-muted-foreground">Search for businesses nearby</p>
              <p className="text-[10px] text-muted-foreground/60 mt-1">
                Enter a location and business type above
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
