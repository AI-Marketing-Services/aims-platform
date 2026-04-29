"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import {
  Sparkles,
  Loader2,
  Building2,
  MapPin,
  Users,
  DollarSign,
  Calendar as CalendarIcon,
  Linkedin,
  Twitter,
  Facebook,
  Instagram,
  Globe,
  AlertTriangle,
  RefreshCw,
} from "lucide-react"

interface EnrichmentData {
  id: string
  domain: string | null
  description: string | null
  industry: string | null
  employeeCount: number | null
  employeeRange: string | null
  revenueRange: string | null
  foundedYear: number | null
  city: string | null
  state: string | null
  country: string | null
  linkedinUrl: string | null
  twitterUrl: string | null
  facebookUrl: string | null
  instagramUrl: string | null
  logoUrl: string | null
  managementCompany: string | null
  totalCreditsCost: number
  startedAt: string | Date
  completedAt: string | Date | null
}

export function EnrichmentCard({
  dealId,
  initialEnrichment,
  lastEnrichedAt,
  estimatedMaxCost,
  creditBalance,
}: {
  dealId: string
  initialEnrichment: EnrichmentData | null
  lastEnrichedAt: Date | string | null
  estimatedMaxCost: number
  creditBalance: number
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [running, setRunning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [enrichment, setEnrichment] = useState<EnrichmentData | null>(initialEnrichment)
  const [lastRun, setLastRun] = useState<Date | string | null>(lastEnrichedAt)

  const recentlyEnriched =
    lastRun && Date.now() - new Date(lastRun).getTime() < 24 * 60 * 60 * 1000

  const insufficientCredits = creditBalance < estimatedMaxCost

  async function handleEnrich() {
    setError(null)
    setRunning(true)
    try {
      const res = await fetch(`/api/portal/crm/deals/${dealId}/enrich`, {
        method: "POST",
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) {
        if (res.status === 402) {
          setError(
            `You need ${body.required ?? estimatedMaxCost} credits but have ${body.available ?? creditBalance}. Top up to enrich.`,
          )
        } else {
          setError(typeof body.error === "string" ? body.error : "Enrichment failed")
        }
        return
      }
      setLastRun(new Date())
      // Refetch the cached enrichment to populate the card
      const getRes = await fetch(`/api/portal/crm/deals/${dealId}/enrich`)
      const getBody = await getRes.json().catch(() => ({}))
      if (getRes.ok && getBody.enrichment) setEnrichment(getBody.enrichment)
      // Server-side data (contacts, deal industry) updated — refresh
      startTransition(() => router.refresh())
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error")
    } finally {
      setRunning(false)
    }
  }

  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Company research
          </p>
        </div>
        <button
          type="button"
          onClick={handleEnrich}
          disabled={running || isPending || insufficientCredits}
          className="inline-flex items-center gap-1.5 rounded-md bg-primary text-primary-foreground px-3 py-1.5 text-xs font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {running ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Enriching…
            </>
          ) : enrichment ? (
            <>
              <RefreshCw className="h-3.5 w-3.5" />
              Re-enrich
            </>
          ) : (
            <>
              <Sparkles className="h-3.5 w-3.5" />
              Enrich
            </>
          )}
        </button>
      </div>

      {/* Cost preview / status row */}
      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
        <span>
          Up to <strong className="text-foreground">{estimatedMaxCost} credits</strong>{" "}
          per run
        </span>
        <span>
          You have{" "}
          <strong className={insufficientCredits ? "text-destructive" : "text-foreground"}>
            {creditBalance}
          </strong>
        </span>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {recentlyEnriched && !running && (
        <p className="text-[11px] text-muted-foreground italic">
          Enriched {timeAgo(lastRun!)} — re-running may not return new data.
        </p>
      )}

      {!enrichment && !running && (
        <div className="text-xs text-muted-foreground py-3 text-center">
          Click Enrich to fill in company data, social profiles, and verified
          contact emails. Cheaper sources run first — you only pay for what we
          find.
        </div>
      )}

      {enrichment && (
        <div className="space-y-3 pt-1">
          {enrichment.description && (
            <p className="text-sm text-foreground leading-relaxed">
              {enrichment.description}
            </p>
          )}

          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
            {enrichment.industry && (
              <Field icon={<Building2 className="h-3 w-3" />} label="Industry" value={enrichment.industry} />
            )}
            {(enrichment.employeeRange || enrichment.employeeCount) && (
              <Field
                icon={<Users className="h-3 w-3" />}
                label="Employees"
                value={enrichment.employeeRange ?? `${enrichment.employeeCount}`}
              />
            )}
            {enrichment.revenueRange && (
              <Field
                icon={<DollarSign className="h-3 w-3" />}
                label="Revenue"
                value={enrichment.revenueRange}
              />
            )}
            {enrichment.foundedYear && (
              <Field
                icon={<CalendarIcon className="h-3 w-3" />}
                label="Founded"
                value={String(enrichment.foundedYear)}
              />
            )}
            {(enrichment.city || enrichment.state) && (
              <Field
                icon={<MapPin className="h-3 w-3" />}
                label="HQ"
                value={[enrichment.city, enrichment.state].filter(Boolean).join(", ")}
              />
            )}
            {enrichment.managementCompany && (
              <Field
                icon={<Building2 className="h-3 w-3" />}
                label="Managed by"
                value={enrichment.managementCompany}
              />
            )}
          </div>

          {/* Social links */}
          {(enrichment.linkedinUrl || enrichment.twitterUrl || enrichment.facebookUrl || enrichment.instagramUrl || enrichment.domain) && (
            <div className="flex flex-wrap items-center gap-2 pt-1">
              {enrichment.domain && (
                <SocialChip
                  icon={<Globe className="h-3 w-3" />}
                  label={enrichment.domain}
                  href={`https://${enrichment.domain}`}
                />
              )}
              {enrichment.linkedinUrl && (
                <SocialChip icon={<Linkedin className="h-3 w-3" />} label="LinkedIn" href={enrichment.linkedinUrl} />
              )}
              {enrichment.twitterUrl && (
                <SocialChip icon={<Twitter className="h-3 w-3" />} label="X / Twitter" href={enrichment.twitterUrl} />
              )}
              {enrichment.facebookUrl && (
                <SocialChip icon={<Facebook className="h-3 w-3" />} label="Facebook" href={enrichment.facebookUrl} />
              )}
              {enrichment.instagramUrl && (
                <SocialChip icon={<Instagram className="h-3 w-3" />} label="Instagram" href={enrichment.instagramUrl} />
              )}
            </div>
          )}

          {enrichment.completedAt && (
            <p className="text-[10px] text-muted-foreground pt-1 border-t border-border">
              Last enriched {timeAgo(enrichment.completedAt)} ·{" "}
              <strong>{enrichment.totalCreditsCost} credits</strong> used
            </p>
          )}
        </div>
      )}
    </div>
  )
}

function Field({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string
}) {
  return (
    <div>
      <div className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">
        {icon}
        {label}
      </div>
      <div className="text-foreground font-medium truncate">{value}</div>
    </div>
  )
}

function SocialChip({
  icon,
  label,
  href,
}: {
  icon: React.ReactNode
  label: string
  href: string
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2 py-1 text-[11px] text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors"
    >
      {icon}
      <span className="truncate max-w-[120px]">{label}</span>
    </a>
  )
}

function timeAgo(when: string | Date): string {
  const ms = Date.now() - new Date(when).getTime()
  const mins = Math.floor(ms / 60000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 30) return `${days}d ago`
  const months = Math.floor(days / 30)
  return `${months}mo ago`
}
