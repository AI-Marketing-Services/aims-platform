"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import {
  BarChart3,
  Briefcase,
  Check,
  ClipboardCopy,
  ExternalLink,
  FileText,
  Globe,
  Hammer,
  Home,
  Layers,
  Lock,
  Megaphone,
  Search,
  Settings,
  Sparkle,
  TrendingUp,
  Wrench,
  UtensilsCrossed,
  Zap,
  type LucideIcon,
} from "lucide-react"
import type { MarketplaceLeadMagnetSku } from "@/lib/tenant/lead-magnet-registry"

/**
 * Map iconName strings (kept on the server registry to avoid bundling
 * lucide on the server) to actual Lucide components for render.
 * Keeping this map small and explicit so we don't pull in the entire
 * lucide-react barrel.
 */
const ICONS: Record<string, LucideIcon> = {
  Zap,
  BarChart3,
  Globe,
  TrendingUp,
  Briefcase,
  Search,
  Layers,
  Wrench,
  Sparkle,
  Home,
  Hammer,
  UtensilsCrossed,
  FileText,
}

interface ToolCard {
  slug: string
  name: string
  tagline: string
  iconName: string
  estimatedMinutes: number
  hasBrandedPdf: boolean
  submissionType: string
  shareUrl: string
  totalLeads: number
  last30Days: number
}

interface OperatorSiteSummary {
  subdomain: string | null
  customDomain: string | null
  customDomainVerified: boolean
  isPublished: boolean
}

interface Props {
  operatorSite: OperatorSiteSummary | null
  tools: ToolCard[]
  marketplace: MarketplaceLeadMagnetSku[]
}

export function LeadMagnetsDashboard({
  operatorSite,
  tools,
  marketplace,
}: Props) {
  const totalLeads = useMemo(
    () => tools.reduce((acc, t) => acc + t.totalLeads, 0),
    [tools],
  )
  const recentLeads = useMemo(
    () => tools.reduce((acc, t) => acc + t.last30Days, 0),
    [tools],
  )

  const noSite = !operatorSite || !operatorSite.subdomain
  const sitePublished = !!operatorSite?.isPublished

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
            <Megaphone className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">Lead Magnets</h1>
            <p className="text-xs text-muted-foreground">
              Host any of these tools on your own domain. Every submission
              lands in your CRM as a Deal — automatically.
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-6 text-right">
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
              Total leads
            </p>
            <p className="text-base font-bold text-foreground tabular-nums">
              {totalLeads.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
              Last 30 days
            </p>
            <p className="text-base font-bold text-foreground tabular-nums">
              {recentLeads.toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* Setup banner — shown until the operator has a published site */}
      {(noSite || !sitePublished) && (
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 flex items-start gap-3">
          <Lock className="h-4 w-4 text-primary mt-0.5 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground">
              {noSite
                ? "Set up your operator site to start capturing leads"
                : "Publish your site to activate share URLs"}
            </p>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              {noSite
                ? "Your share URLs need a subdomain. Pick one in Branding to mint links like acme.aioperatorcollective.com/tools/website-audit."
                : "Your subdomain is reserved but the site isn't published yet. Publish it so visitors hit your branded version of the tool instead of the platform default."}
            </p>
            <div className="mt-2.5 flex items-center gap-2 flex-wrap">
              <Link
                href="/reseller/settings/branding"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                <Settings className="h-3.5 w-3.5" />
                {noSite ? "Set up branding" : "Open settings"}
              </Link>
              <Link
                href="/reseller/settings/domain"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold border border-border hover:border-primary/40 hover:text-primary transition-colors"
              >
                <Globe className="h-3.5 w-3.5" />
                Connect custom domain
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Tool grid */}
      <div>
        <h2 className="text-sm font-semibold text-foreground mb-3">
          Your branded lead magnets
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {tools.map((tool) => (
            <ToolCardView
              key={tool.slug}
              tool={tool}
              shareReady={!noSite && sitePublished}
            />
          ))}
        </div>
      </div>

      {/* Marketplace SKUs */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-sm font-semibold text-foreground">
              Industry-specific lead magnets
            </h2>
            <p className="text-xs text-muted-foreground">
              Pre-order to lock in launch pricing. We&apos;ll email you the day
              your funnel goes live.
            </p>
          </div>
          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
            Coming soon
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {marketplace.map((sku) => (
            <MarketplaceCardView key={sku.slug} sku={sku} />
          ))}
        </div>
      </div>
    </div>
  )
}

function ToolCardView({
  tool,
  shareReady,
}: {
  tool: ToolCard
  shareReady: boolean
}) {
  const Icon = ICONS[tool.iconName] ?? FileText
  const [copied, setCopied] = useState<"share" | "embed" | null>(null)

  async function copy(value: string, kind: "share" | "embed") {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(kind)
      setTimeout(() => setCopied(null), 1500)
    } catch {
      // ignore — older browsers without permission policy support
    }
  }

  const embedSnippet = `<iframe src="${tool.shareUrl}" width="100%" height="800" style="border:none;border-radius:12px" loading="lazy" title="${tool.name}"></iframe>`

  return (
    <div className="rounded-xl border border-border bg-card p-4 flex flex-col">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Icon className="h-4 w-4 text-primary" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-foreground leading-tight truncate">
              {tool.name}
            </h3>
            <p className="text-[11px] text-muted-foreground">
              ~{tool.estimatedMinutes} min{tool.hasBrandedPdf && " · branded PDF"}
            </p>
          </div>
        </div>
        <span className="text-[10px] font-semibold tabular-nums px-1.5 py-0.5 rounded bg-muted/60 text-muted-foreground border border-border/60">
          {tool.totalLeads}
        </span>
      </div>

      <p className="text-xs text-muted-foreground leading-relaxed flex-1">
        {tool.tagline}
      </p>

      {/* Share URL row */}
      <div className="mt-3 rounded-lg border border-border bg-muted/20 p-2 flex items-center gap-1.5">
        <code className="flex-1 text-[11px] text-foreground/80 truncate font-mono">
          {tool.shareUrl}
        </code>
        <button
          type="button"
          onClick={() => copy(tool.shareUrl, "share")}
          disabled={!shareReady}
          className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-card transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          title={shareReady ? "Copy share URL" : "Publish your site to activate"}
        >
          {copied === "share" ? (
            <Check className="h-3.5 w-3.5 text-emerald-600" />
          ) : (
            <ClipboardCopy className="h-3.5 w-3.5" />
          )}
        </button>
        <a
          href={tool.shareUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={`p-1.5 rounded transition-colors ${
            shareReady
              ? "text-muted-foreground hover:text-primary hover:bg-card"
              : "text-muted-foreground/30 pointer-events-none"
          }`}
          title="Open"
        >
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>

      <div className="mt-2 flex items-center justify-between">
        <button
          type="button"
          onClick={() => copy(embedSnippet, "embed")}
          className="text-[11px] text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
        >
          {copied === "embed" ? (
            <>
              <Check className="h-3 w-3 text-emerald-600" />
              Embed copied
            </>
          ) : (
            <>
              <ClipboardCopy className="h-3 w-3" />
              Copy embed snippet
            </>
          )}
        </button>
        <span className="text-[11px] text-muted-foreground tabular-nums">
          {tool.last30Days} last 30d
        </span>
      </div>
    </div>
  )
}

function MarketplaceCardView({ sku }: { sku: MarketplaceLeadMagnetSku }) {
  const Icon = ICONS[sku.iconName] ?? FileText
  return (
    <div className="rounded-xl border border-dashed border-border bg-muted/10 p-4 flex flex-col">
      <div className="flex items-start gap-2.5 mb-2">
        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <Icon className="h-4 w-4 text-primary/70" />
        </div>
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-foreground leading-tight">
            {sku.name}
          </h3>
          <p className="text-[11px] text-muted-foreground">{sku.industry}</p>
        </div>
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed flex-1">
        {sku.description}
      </p>
      <div className="mt-3 flex items-center justify-between">
        <span className="text-sm font-bold text-foreground tabular-nums">
          ${sku.price}
        </span>
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
          Ships {sku.expectedShip}
        </span>
      </div>
      <Link
        href={`/portal/marketplace?sku=${sku.slug}`}
        className="mt-2 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold border border-border hover:border-primary/40 hover:text-primary transition-colors"
      >
        <Sparkle className="h-3.5 w-3.5" />
        Pre-order
      </Link>
    </div>
  )
}
