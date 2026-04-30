"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  MapPin,
  Search,
  Loader2,
  Star,
  Phone,
  Globe,
  Check,
  Plus,
  Sparkles,
  AlertTriangle,
  Filter,
} from "lucide-react"

interface PlaceResult {
  place_id: string
  name: string
  address: string
  phone: string | null
  website: string | null
  rating: number | null
  reviews_count: number | null
  state: string | null
  zip: string | null
  types: string[]
  alreadyImported: boolean
  existingDealId: string | null
}

export function MapsDiscovery() {
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [industry, setIndustry] = useState("")
  const [minRating, setMinRating] = useState<number | "">("")
  const [minReviews, setMinReviews] = useState<number | "">("")
  const [enrichOnImport, setEnrichOnImport] = useState(false)
  const [results, setResults] = useState<PlaceResult[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [searching, setSearching] = useState(false)
  const [importing, setImporting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastCost, setLastCost] = useState<number | null>(null)
  const [importSummary, setImportSummary] = useState<{
    created: number
    skipped: number
    enriched: number
  } | null>(null)

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (!query.trim()) return
    setError(null)
    setSearching(true)
    setSelected(new Set())
    setImportSummary(null)
    try {
      const res = await fetch("/api/portal/crm/scout/maps-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: query.trim(),
          min_rating: minRating === "" ? undefined : minRating,
          min_reviews: minReviews === "" ? undefined : minReviews,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        if (res.status === 402) {
          setError(
            `You need ${data.required ?? 1} credits but have ${data.available ?? 0}. Top up to search.`,
          )
        } else {
          setError(typeof data.error === "string" ? data.error : "Search failed")
        }
        return
      }
      setResults(data.results ?? [])
      setLastCost(data.creditCost ?? 0)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error")
    } finally {
      setSearching(false)
    }
  }

  function toggleSelect(placeId: string, alreadyImported: boolean) {
    if (alreadyImported) return
    const next = new Set(selected)
    if (next.has(placeId)) next.delete(placeId)
    else next.add(placeId)
    setSelected(next)
  }

  function selectAll() {
    const next = new Set<string>()
    for (const r of results) {
      if (!r.alreadyImported) next.add(r.place_id)
    }
    setSelected(next)
  }

  async function handleImport() {
    if (selected.size === 0) return
    setError(null)
    setImporting(true)
    setImportSummary(null)
    try {
      const placesToImport = results.filter((r) => selected.has(r.place_id))
      const res = await fetch("/api/portal/crm/scout/maps-import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          places: placesToImport,
          industry: industry.trim() || undefined,
          enrichOnImport,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "Import failed")
        return
      }
      setImportSummary({
        created: data.created ?? 0,
        skipped: data.skipped ?? 0,
        enriched: data.enriched ?? 0,
      })
      setSelected(new Set())
      // Mark imported places as such in the local result set
      setResults((rs) =>
        rs.map((r) =>
          placesToImport.some((p) => p.place_id === r.place_id)
            ? { ...r, alreadyImported: true }
            : r,
        ),
      )
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error")
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-foreground flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary" />
            Discover via Google Maps
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Search for businesses by type + location, import as Deals, optionally
            auto-enrich each one.
          </p>
        </div>
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
          1 credit / search
        </span>
      </div>

      {/* Search form */}
      <form onSubmit={handleSearch} className="space-y-3">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="HVAC companies in Austin TX"
              className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              disabled={searching}
            />
          </div>
          <button
            type="submit"
            disabled={searching || !query.trim()}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {searching ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Searching…
              </>
            ) : (
              <>Search</>
            )}
          </button>
        </div>

        {/* Filter row */}
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Filter className="h-3.5 w-3.5" />
            <span>Filters:</span>
          </div>
          <label className="flex items-center gap-1.5">
            Min rating
            <input
              type="number"
              step="0.5"
              min={0}
              max={5}
              value={minRating}
              onChange={(e) =>
                setMinRating(e.target.value === "" ? "" : Number(e.target.value))
              }
              className="w-16 px-2 py-1 text-xs rounded border border-border bg-background text-foreground"
            />
          </label>
          <label className="flex items-center gap-1.5">
            Min reviews
            <input
              type="number"
              min={0}
              value={minReviews}
              onChange={(e) =>
                setMinReviews(e.target.value === "" ? "" : Number(e.target.value))
              }
              className="w-20 px-2 py-1 text-xs rounded border border-border bg-background text-foreground"
            />
          </label>
          <label className="flex items-center gap-1.5">
            Industry tag
            <input
              type="text"
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              placeholder="HVAC, dental, etc."
              className="w-40 px-2 py-1 text-xs rounded border border-border bg-background text-foreground"
            />
          </label>
        </div>
      </form>

      {error && (
        <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {importSummary && (
        <div className="flex items-start gap-2 rounded-md border border-emerald-500/30 bg-emerald-500/5 px-3 py-2 text-xs text-emerald-600">
          <Check className="h-3.5 w-3.5 shrink-0 mt-0.5" />
          <span>
            Imported <strong>{importSummary.created}</strong> new deal
            {importSummary.created === 1 ? "" : "s"}
            {importSummary.skipped > 0 ? ` (${importSummary.skipped} already in CRM)` : ""}
            {importSummary.enriched > 0 ? ` · enriched ${importSummary.enriched}` : ""}.
          </span>
        </div>
      )}

      {/* Results */}
      {results.length > 0 && (
        <>
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              {results.length} result{results.length === 1 ? "" : "s"}
              {lastCost !== null && lastCost > 0 ? ` · ${lastCost} credit charged` : ""}
              {selected.size > 0 ? ` · ${selected.size} selected` : ""}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={selectAll}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Select all
              </button>
            </div>
          </div>

          <ul className="divide-y divide-border rounded-lg border border-border bg-background overflow-hidden">
            {results.map((r) => {
              const isSelected = selected.has(r.place_id)
              return (
                <li
                  key={r.place_id}
                  className={`px-3 py-2.5 flex items-start gap-3 transition-colors ${
                    r.alreadyImported
                      ? "opacity-60"
                      : isSelected
                        ? "bg-primary/5"
                        : "hover:bg-muted/40 cursor-pointer"
                  }`}
                  onClick={() => toggleSelect(r.place_id, r.alreadyImported)}
                >
                  <input
                    type="checkbox"
                    checked={isSelected || r.alreadyImported}
                    disabled={r.alreadyImported}
                    onChange={() => toggleSelect(r.place_id, r.alreadyImported)}
                    onClick={(e) => e.stopPropagation()}
                    className="mt-1"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium text-foreground truncate">
                        {r.name}
                      </p>
                      {r.rating !== null && (
                        <span className="inline-flex items-center gap-0.5 text-[11px] text-amber-500 font-semibold">
                          <Star className="h-3 w-3 fill-current" />
                          {r.rating.toFixed(1)}
                          {r.reviews_count !== null && (
                            <span className="text-muted-foreground font-normal">
                              ({r.reviews_count.toLocaleString()})
                            </span>
                          )}
                        </span>
                      )}
                      {r.alreadyImported && (
                        <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider font-semibold text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded">
                          <Check className="h-2.5 w-2.5" />
                          In CRM
                        </span>
                      )}
                    </div>
                    {r.address && (
                      <p className="text-[11px] text-muted-foreground truncate">
                        {r.address}
                      </p>
                    )}
                    <div className="flex items-center gap-3 mt-0.5">
                      {r.phone && (
                        <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                          <Phone className="h-3 w-3" />
                          {r.phone}
                        </span>
                      )}
                      {r.website && (
                        <a
                          href={r.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline truncate max-w-[200px]"
                        >
                          <Globe className="h-3 w-3" />
                          {r.website.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                        </a>
                      )}
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>

          {/* Bulk import bar */}
          {selected.size > 0 && (
            <div className="rounded-lg border border-primary/30 bg-primary/5 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <p className="text-sm font-semibold text-foreground">
                  Import {selected.size} deal{selected.size === 1 ? "" : "s"}
                </p>
                <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enrichOnImport}
                    onChange={(e) => setEnrichOnImport(e.target.checked)}
                  />
                  <Sparkles className="h-3 w-3 text-primary" />
                  Auto-enrich each (~80 credits/deal)
                </label>
              </div>
              <button
                type="button"
                onClick={handleImport}
                disabled={importing}
                className="inline-flex items-center gap-1.5 rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {importing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Importing…
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    Import to CRM
                  </>
                )}
              </button>
            </div>
          )}
        </>
      )}

      {results.length === 0 && !searching && (
        <div className="text-xs text-muted-foreground text-center py-6 border border-dashed border-border rounded-lg">
          Search for a business type + location to discover prospects.
          <br />
          Examples: <em>&quot;HVAC companies Austin TX&quot;</em>,{" "}
          <em>&quot;dental offices in Denver&quot;</em>,{" "}
          <em>&quot;property management Miami&quot;</em>
        </div>
      )}
    </div>
  )
}
