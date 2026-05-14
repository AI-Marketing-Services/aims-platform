"use client"

/**
 * ScoutDemoStep — the "wow moment" of the onboarding wizard.
 *
 * Operator picks a city + business type, we visibly fetch 5 real leads from
 * Google Maps, animate them appearing one by one, then import all 5 into their
 * CRM as ClientDeals. This is the first time the platform earns its keep:
 * the operator sees real prospects with names, phones, ratings appear in
 * front of them — before they've configured a single thing.
 */

import { useCallback, useState } from "react"
import {
  MapPin,
  Star,
  Phone,
  Globe,
  Loader2,
  CheckCircle2,
  Sparkles,
} from "lucide-react"

interface ScoutDemoStepProps {
  defaultLocation?: string
  defaultBusinessType?: string
  onComplete: (importedCount: number) => void
  onSkip: () => void
}

interface ScoutResult {
  place_id: string
  name: string
  address: string
  rating?: number | null
  reviews_count?: number | null
  phone?: string | null
  website?: string | null
  // Optional fields the maps-import endpoint can pass through to
  // ClientDeal rows — they're returned by maps-search but the demo
  // doesn't render them. Kept on the type so the import POST can
  // forward the full place object without `any`-casts.
  state?: string | null
  zip?: string | null
  lat?: number
  lng?: number
  types?: string[]
  alreadyImported?: boolean
}

type Phase =
  | "idle"
  | "searching"
  | "revealing"
  | "importing"
  | "done"
  | "error"
  | "empty"
  | "needs_credits"

const STAGGER_MS = 250

export default function ScoutDemoStep({
  defaultLocation = "",
  defaultBusinessType = "",
  onComplete,
  onSkip,
}: ScoutDemoStepProps) {
  const [location, setLocation] = useState(defaultLocation)
  const [businessType, setBusinessType] = useState(defaultBusinessType)
  const [phase, setPhase] = useState<Phase>("idle")
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [picks, setPicks] = useState<ScoutResult[]>([])
  const [visibleCount, setVisibleCount] = useState(0)

  const canSubmit =
    location.trim().length > 0 &&
    businessType.trim().length > 0 &&
    phase !== "searching" &&
    phase !== "revealing" &&
    phase !== "importing"

  const revealOneByOne = useCallback(
    (count: number, onDone: () => void) => {
      let i = 0
      const tick = () => {
        i += 1
        setVisibleCount(i)
        if (i < count) {
          setTimeout(tick, STAGGER_MS)
        } else {
          // small breath after the last card before we kick off import
          setTimeout(onDone, STAGGER_MS)
        }
      }
      setTimeout(tick, STAGGER_MS)
    },
    [],
  )

  const handleSearch = useCallback(async () => {
    setErrorMsg(null)
    setPicks([])
    setVisibleCount(0)
    setPhase("searching")

    const query = `${businessType.trim()} in ${location.trim()}`

    try {
      const res = await fetch("/api/portal/crm/scout/maps-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      })

      if (res.status === 402) {
        setPhase("needs_credits")
        return
      }

      if (res.status === 503) {
        setPhase("empty")
        return
      }

      if (!res.ok) {
        let detail = ""
        try {
          const body = await res.json()
          detail = body?.error || body?.message || ""
        } catch {
          // ignore JSON parse errors
        }
        setErrorMsg(detail || `Search failed (${res.status}). Try again.`)
        setPhase("error")
        return
      }

      const data = (await res.json()) as { results?: ScoutResult[] }
      const fresh = (data.results || []).filter((r) => !r.alreadyImported)
      const firstFive = fresh.slice(0, 5)

      if (firstFive.length === 0) {
        setPhase("empty")
        return
      }

      setPicks(firstFive)
      setPhase("revealing")
      revealOneByOne(firstFive.length, () => {
        void handleImport(firstFive)
      })
    } catch {
      setErrorMsg("Network hiccup. Try that one more time.")
      setPhase("error")
    }
  }, [businessType, location, revealOneByOne])

  const handleImport = useCallback(
    async (toImport: ScoutResult[]) => {
      setPhase("importing")
      try {
        // The maps-import route expects the FULL place objects (it
        // mirrors them straight into ClientDeal rows on the server),
        // not just place_ids. Earlier scaffold passed only ids which
        // tripped Zod's `places` min(1) and returned 400 "Invalid
        // payload" after the user had already seen the 5 cards
        // animate in — confusing UX. Send the same shape we got
        // back from maps-search.
        const res = await fetch("/api/portal/crm/scout/maps-import", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            places: toImport.map((r) => ({
              place_id: r.place_id,
              name: r.name,
              address: r.address ?? "",
              phone: r.phone ?? null,
              website: r.website ?? null,
              rating: r.rating ?? null,
              reviews_count: r.reviews_count ?? null,
              state: r.state ?? null,
              zip: r.zip ?? null,
              lat: r.lat,
              lng: r.lng,
              types: r.types ?? [],
            })),
            enrichOnImport: true,
          }),
        })

        if (res.status === 402) {
          setPhase("needs_credits")
          return
        }

        if (!res.ok) {
          let detail = ""
          try {
            const body = await res.json()
            detail = body?.error || body?.message || ""
          } catch {
            // ignore JSON parse errors
          }
          setErrorMsg(detail || `Import failed (${res.status}). Try again.`)
          setPhase("error")
          return
        }

        setPhase("done")
        onComplete(toImport.length)
      } catch {
        setErrorMsg("Network hiccup while importing. Try again.")
        setPhase("error")
      }
    },
    [onComplete],
  )

  const handleRetry = useCallback(() => {
    setErrorMsg(null)
    setPicks([])
    setVisibleCount(0)
    setPhase("idle")
  }, [])

  const isBusy =
    phase === "searching" || phase === "revealing" || phase === "importing"

  return (
    <section className="rounded-2xl border border-border bg-card p-6 space-y-5">
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
          <Sparkles className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-foreground">
            Let's find your first 5 leads
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Tell us where to look and what kind of business. We'll pull real
            prospects from Google Maps and drop them straight into your CRM.
          </p>
        </div>
      </div>

      {/* INPUTS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Location
          </span>
          <div className="relative">
            <MapPin className="h-4 w-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Austin TX"
              disabled={isBusy}
              className="w-full rounded-lg border border-border bg-background pl-9 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 disabled:opacity-60"
            />
          </div>
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Business type
          </span>
          <div className="relative">
            <Sparkles className="h-4 w-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={businessType}
              onChange={(e) => setBusinessType(e.target.value)}
              placeholder="e.g. HVAC companies"
              disabled={isBusy}
              className="w-full rounded-lg border border-border bg-background pl-9 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 disabled:opacity-60"
            />
          </div>
        </label>
      </div>

      {/* CTA + SKIP */}
      {phase !== "done" && phase !== "needs_credits" && (
        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          <button
            type="button"
            onClick={handleSearch}
            disabled={!canSubmit}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground hover:bg-primary/90 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {phase === "searching" ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Searching Google Maps…
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Find my first 5 leads
              </>
            )}
          </button>
          <button
            type="button"
            onClick={onSkip}
            disabled={isBusy}
            className="text-xs text-muted-foreground hover:text-foreground transition disabled:opacity-50"
          >
            Skip for now
          </button>
        </div>
      )}

      {/* INLINE ERROR */}
      {phase === "error" && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/5 px-3 py-2.5 flex items-start justify-between gap-3">
          <p className="text-xs text-foreground leading-relaxed">
            {errorMsg || "Something went wrong. Try again?"}
          </p>
          <button
            type="button"
            onClick={handleRetry}
            className="text-xs font-semibold text-primary hover:underline shrink-0"
          >
            Retry
          </button>
        </div>
      )}

      {/* EMPTY */}
      {phase === "empty" && (
        <div className="rounded-lg border border-border bg-background px-3 py-3 space-y-2">
          <p className="text-xs text-foreground leading-relaxed">
            Hmm, Google didn't find{" "}
            <span className="font-semibold">
              {businessType.trim() || "that"}
            </span>{" "}
            in{" "}
            <span className="font-semibold">
              {location.trim() || "that area"}
            </span>
            . Try a different location or skip for now.
          </p>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleRetry}
              className="text-xs font-semibold text-primary hover:underline"
            >
              Try a different search
            </button>
            <button
              type="button"
              onClick={onSkip}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Skip for now
            </button>
          </div>
        </div>
      )}

      {/* NEEDS CREDITS */}
      {phase === "needs_credits" && (
        <div className="rounded-lg border border-primary/30 bg-primary/5 px-3 py-3 space-y-2">
          <p className="text-xs text-foreground leading-relaxed">
            You'll need a couple credits to scout leads. Skip for now and come
            back from the CRM tab.
          </p>
          <button
            type="button"
            onClick={onSkip}
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition"
          >
            Skip for now
          </button>
        </div>
      )}

      {/* RESULTS LIST (revealed one at a time) */}
      {picks.length > 0 && (phase === "revealing" || phase === "importing" || phase === "done") && (
        <ul className="space-y-2">
          {picks.slice(0, visibleCount).map((r) => (
            <li
              key={r.place_id}
              className="rounded-lg border border-border bg-background p-3 animate-in fade-in slide-in-from-bottom-2 duration-300"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-foreground truncate">
                    {r.name}
                  </p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5 truncate">
                    <MapPin className="h-3 w-3 shrink-0" />
                    <span className="truncate">{r.address}</span>
                  </p>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-xs text-muted-foreground">
                    {typeof r.rating === "number" && (
                      <span className="inline-flex items-center gap-1">
                        <Star className="h-3 w-3 text-primary" />
                        {r.rating.toFixed(1)}
                        {typeof r.reviews_count === "number" && (
                          <span className="text-muted-foreground">
                            ({r.reviews_count})
                          </span>
                        )}
                      </span>
                    )}
                    {r.phone && (
                      <span className="inline-flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {r.phone}
                      </span>
                    )}
                    {r.website && (
                      <span className="inline-flex items-center gap-1 truncate max-w-[180px]">
                        <Globe className="h-3 w-3 shrink-0" />
                        <span className="truncate">
                          {r.website.replace(/^https?:\/\//, "")}
                        </span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* IMPORT PROGRESS */}
      {phase === "importing" && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground border-t border-border/50 pt-3">
          <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
          <span>Importing your first 5 leads…</span>
        </div>
      )}

      {/* DONE */}
      {phase === "done" && (
        <div className="flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2.5">
          <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
          <span className="text-sm font-semibold text-foreground">
            {picks.length} leads imported to your CRM — let's go
          </span>
        </div>
      )}
    </section>
  )
}
