"use client"

import { useEffect, useMemo, useState, useCallback } from "react"
import {
  Copy,
  Check,
  Trash2,
  Plus,
  RefreshCw,
  TrendingUp,
  Users,
  Calendar,
  UserCheck,
  Eye,
  Link2,
  BarChart3,
  Globe,
} from "lucide-react"
import { cn } from "@/lib/utils"

// ── Types ──────────────────────────────────────────────────────────────────

interface LinkStats {
  pageviews: number
  partials: number
  applications: number
  booked: number
  members: number
}

interface UtmLinkRow {
  id: string
  name: string
  baseUrl: string
  channel: string
  utmSource: string
  utmMedium: string
  utmCampaign: string
  utmContent: string | null
  utmTerm: string | null
  fullUrl: string
  createdAt: string
  stats: LinkStats
}

interface ChannelRow {
  source: string
  medium: string
  pageviews: number
  partials: number
  applications: number
  booked: number
  members: number
}

interface CampaignRow {
  campaign: string
  source: string
  medium: string
  pageviews: number
  applications: number
  booked: number
  members: number
}

interface AnalyticsData {
  byChannel: ChannelRow[]
  byCampaign: CampaignRow[]
  totals: {
    pageviews: number
    partials: number
    applications: number
    booked: number
    members: number
  }
}

// ── Channel presets ────────────────────────────────────────────────────────

const CHANNELS = [
  { id: "linkedin",   label: "LinkedIn",    source: "linkedin",    medium: "social", color: "bg-blue-700 text-white" },
  { id: "twitter",    label: "Twitter / X", source: "twitter",     medium: "social", color: "bg-sky-500 text-white" },
  { id: "instagram",  label: "Instagram",   source: "instagram",   medium: "social", color: "bg-pink-600 text-white" },
  { id: "email",      label: "Cold Email",  source: "email",       medium: "email",  color: "bg-emerald-700 text-white" },
  { id: "youtube",    label: "YouTube",     source: "youtube",     medium: "video",  color: "bg-red-600 text-white" },
  { id: "tiktok",     label: "TikTok",      source: "tiktok",      medium: "social", color: "bg-fuchsia-700 text-white" },
  { id: "podcast",    label: "Podcast",     source: "podcast",     medium: "audio",  color: "bg-orange-600 text-white" },
  { id: "newsletter", label: "Newsletter",  source: "newsletter",  medium: "email",  color: "bg-indigo-600 text-white" },
  { id: "sms",        label: "SMS",         source: "sms",         medium: "sms",    color: "bg-teal-600 text-white" },
  { id: "other",      label: "Custom",      source: "",            medium: "",       color: "bg-zinc-600 text-white" },
] as const

type ChannelId = (typeof CHANNELS)[number]["id"]

const CHANNEL_BADGE: Record<string, string> = Object.fromEntries(
  CHANNELS.map((c) => [c.id, c.color])
)

const DEFAULT_BASE = "https://aioperatorcollective.com/apply"
const TABS = ["builder", "links", "channels", "campaigns"] as const
type Tab = (typeof TABS)[number]

const TAB_LABELS: Record<Tab, string> = {
  builder:   "Link Builder",
  links:     "All Links",
  channels:  "By Channel",
  campaigns: "By Campaign",
}

// ── Helpers ────────────────────────────────────────────────────────────────

function rate(num: number, den: number) {
  if (den === 0) return "—"
  return `${Math.round((num / den) * 100)}%`
}

function channelLabel(source: string) {
  const found = CHANNELS.find((c) => c.id === source || c.source === source)
  return found?.label ?? source
}

function channelColor(source: string) {
  const found = CHANNELS.find((c) => c.id === source || c.source === source)
  return found ? CHANNEL_BADGE[found.id] : "bg-zinc-600 text-white"
}

// ── Stat card ──────────────────────────────────────────────────────────────

function StatCard({ label, value, sub }: { label: string; value: number; sub?: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4 space-y-1">
      <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">{label}</p>
      <p className="text-3xl font-bold text-foreground font-mono">{value.toLocaleString()}</p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </div>
  )
}

// ── Copy button ────────────────────────────────────────────────────────────

function CopyButton({ text, className }: { text: string; className?: string }) {
  const [copied, setCopied] = useState(false)
  async function handleCopy() {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button
      onClick={handleCopy}
      className={cn(
        "flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium transition-colors",
        copied
          ? "bg-emerald-500/20 text-emerald-400"
          : "bg-surface hover:bg-surface/80 text-muted-foreground hover:text-foreground",
        className
      )}
    >
      {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
      {copied ? "Copied" : "Copy"}
    </button>
  )
}

// ── Builder Tab ────────────────────────────────────────────────────────────

interface BuilderFormState {
  name: string
  baseUrl: string
  utmSource: string
  utmMedium: string
  utmCampaign: string
  utmContent: string
  utmTerm: string
}

function BuilderTab({ onSaved }: { onSaved: () => void }) {
  const [selectedChannel, setSelectedChannel] = useState<ChannelId>("linkedin")
  const [form, setForm] = useState<BuilderFormState>({
    name: "",
    baseUrl: DEFAULT_BASE,
    utmSource: "linkedin",
    utmMedium: "social",
    utmCampaign: "",
    utmContent: "",
    utmTerm: "",
  })
  const [saving, setSaving] = useState(false)
  const [savedMsg, setSavedMsg] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fullUrl = useMemo(() => {
    if (!form.utmSource || !form.utmMedium || !form.utmCampaign) return ""
    try {
      const url = new URL(form.baseUrl || DEFAULT_BASE)
      url.searchParams.set("utm_source", form.utmSource)
      url.searchParams.set("utm_medium", form.utmMedium)
      url.searchParams.set("utm_campaign", form.utmCampaign)
      if (form.utmContent) url.searchParams.set("utm_content", form.utmContent)
      if (form.utmTerm) url.searchParams.set("utm_term", form.utmTerm)
      return url.toString()
    } catch {
      return ""
    }
  }, [form])

  function selectChannel(id: ChannelId) {
    const preset = CHANNELS.find((c) => c.id === id)!
    setSelectedChannel(id)
    setForm((prev) => ({
      ...prev,
      utmSource: preset.source,
      utmMedium: preset.medium,
    }))
  }

  function setField<K extends keyof BuilderFormState>(key: K, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSave() {
    if (!form.name.trim()) { setError("Link name is required"); return }
    if (!form.utmCampaign.trim()) { setError("Campaign is required"); return }
    if (!fullUrl) { setError("Source, medium, and campaign are required"); return }

    setSaving(true)
    setError(null)
    try {
      const res = await fetch("/api/admin/utm-links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          baseUrl: form.baseUrl || DEFAULT_BASE,
          channel: selectedChannel,
          utmSource: form.utmSource,
          utmMedium: form.utmMedium,
          utmCampaign: form.utmCampaign.trim(),
          utmContent: form.utmContent.trim() || undefined,
          utmTerm: form.utmTerm.trim() || undefined,
        }),
      })
      if (!res.ok) {
        setError("Failed to save link")
        return
      }
      setSavedMsg(true)
      setTimeout(() => setSavedMsg(false), 3000)
      setForm((prev) => ({ ...prev, name: "", utmCampaign: "", utmContent: "", utmTerm: "" }))
      onSaved()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
      {/* Form */}
      <div className="space-y-5">
        {/* Channel selector */}
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Channel
          </label>
          <div className="flex flex-wrap gap-2">
            {CHANNELS.map((ch) => (
              <button
                key={ch.id}
                onClick={() => selectChannel(ch.id)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-semibold transition-all border",
                  selectedChannel === ch.id
                    ? cn(ch.color, "border-transparent ring-2 ring-primary ring-offset-1 ring-offset-background")
                    : "bg-surface text-muted-foreground border-border hover:text-foreground hover:border-foreground/30"
                )}
              >
                {ch.label}
              </button>
            ))}
          </div>
        </div>

        {/* Link name */}
        <Field
          label="Link Name (internal)"
          placeholder="e.g. LinkedIn Bio — April Launch"
          value={form.name}
          onChange={(v) => setField("name", v)}
          required
        />

        {/* Campaign */}
        <Field
          label="Campaign"
          placeholder="e.g. april-launch-2026"
          value={form.utmCampaign}
          onChange={(v) => setField("utmCampaign", v)}
          hint="Use lowercase-hyphen format. This becomes utm_campaign."
          required
        />

        {/* Source / Medium — editable for Custom channel */}
        {selectedChannel === "other" && (
          <div className="grid grid-cols-2 gap-3">
            <Field
              label="Source"
              placeholder="e.g. linkedin"
              value={form.utmSource}
              onChange={(v) => setField("utmSource", v)}
              required
            />
            <Field
              label="Medium"
              placeholder="e.g. social"
              value={form.utmMedium}
              onChange={(v) => setField("utmMedium", v)}
              required
            />
          </div>
        )}

        {/* Optional fields */}
        <div className="grid grid-cols-2 gap-3">
          <Field
            label="Content (optional)"
            placeholder="e.g. post-v1"
            value={form.utmContent}
            onChange={(v) => setField("utmContent", v)}
            hint="Differentiates variants within a campaign"
          />
          <Field
            label="Term (optional)"
            placeholder="e.g. ai-operator"
            value={form.utmTerm}
            onChange={(v) => setField("utmTerm", v)}
            hint="Paid search keywords"
          />
        </div>

        {/* Destination URL */}
        <Field
          label="Destination URL"
          placeholder={DEFAULT_BASE}
          value={form.baseUrl}
          onChange={(v) => setField("baseUrl", v)}
        />

        {error && <p className="text-xs text-red-400">{error}</p>}

        <button
          onClick={handleSave}
          disabled={saving || !fullUrl || !form.name.trim()}
          className={cn(
            "w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all",
            "bg-primary text-background hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed"
          )}
        >
          {saving ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : savedMsg ? (
            <>
              <Check className="w-4 h-4" />
              Saved!
            </>
          ) : (
            <>
              <Plus className="w-4 h-4" />
              Save Link
            </>
          )}
        </button>
      </div>

      {/* Preview */}
      <div className="space-y-4">
        <div className="rounded-lg border border-border bg-card p-5 space-y-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Live Preview
          </p>

          {fullUrl ? (
            <>
              <div className="rounded-md bg-surface p-3 break-all font-mono text-xs text-foreground leading-relaxed border border-border">
                {fullUrl}
              </div>
              <div className="flex items-center gap-2">
                <CopyButton text={fullUrl} className="flex-1 justify-center" />
              </div>
            </>
          ) : (
            <div className="rounded-md bg-surface p-4 text-xs text-muted-foreground border border-border">
              Fill in Source, Medium, and Campaign to generate your tracking link.
            </div>
          )}

          {/* UTM breakdown */}
          <div className="space-y-2 pt-2 border-t border-border">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Parameters</p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
              <ParamRow label="utm_source" value={form.utmSource} />
              <ParamRow label="utm_medium" value={form.utmMedium} />
              <ParamRow label="utm_campaign" value={form.utmCampaign} />
              {form.utmContent && <ParamRow label="utm_content" value={form.utmContent} />}
              {form.utmTerm && <ParamRow label="utm_term" value={form.utmTerm} />}
            </div>
          </div>
        </div>

        {/* UTM cheat sheet */}
        <div className="rounded-lg border border-border bg-card p-4 space-y-2">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Naming Conventions
          </p>
          <div className="space-y-1.5 text-xs text-muted-foreground">
            <p><span className="text-foreground font-medium">Campaign:</span> use lowercase-hyphen. Be consistent — e.g. <code className="bg-surface px-1 rounded">april-launch-2026</code></p>
            <p><span className="text-foreground font-medium">Content:</span> differentiate A/B variants — e.g. <code className="bg-surface px-1 rounded">post-v1</code> vs <code className="bg-surface px-1 rounded">post-v2</code></p>
            <p><span className="text-foreground font-medium">Source:</span> the platform — keep it identical across campaigns so channels aggregate correctly.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function Field({
  label,
  placeholder,
  value,
  onChange,
  hint,
  required,
}: {
  label: string
  placeholder?: string
  value: string
  onChange: (v: string) => void
  hint?: string
  required?: boolean
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-muted-foreground">
        {label}
        {required && <span className="text-primary ml-0.5">*</span>}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors"
      />
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  )
}

function ParamRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-1.5 items-baseline">
      <span className="text-muted-foreground shrink-0">{label}:</span>
      <span className="font-mono text-primary truncate">{value || "—"}</span>
    </div>
  )
}

// ── Links Tab ──────────────────────────────────────────────────────────────

function LinksTab({
  links,
  loading,
  onDelete,
}: {
  links: UtmLinkRow[]
  loading: boolean
  onDelete: (id: string) => void
}) {
  const [deleting, setDeleting] = useState<string | null>(null)

  async function handleDelete(id: string) {
    if (!confirm("Delete this link? Existing analytics data will still appear in the channel / campaign views.")) return
    setDeleting(id)
    await onDelete(id)
    setDeleting(null)
  }

  if (loading) {
    return (
      <div className="py-12 flex justify-center">
        <RefreshCw className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (links.length === 0) {
    return (
      <div className="py-12 flex flex-col items-center gap-3 text-muted-foreground">
        <Link2 className="w-8 h-8 opacity-40" />
        <p className="text-sm">No links yet. Build your first one in the Link Builder tab.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {links.map((link) => (
        <div
          key={link.id}
          className="rounded-lg border border-border bg-card p-4 space-y-3"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className={cn("shrink-0 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide", channelColor(link.channel))}>
                {channelLabel(link.channel)}
              </span>
              <p className="text-sm font-semibold text-foreground truncate">{link.name}</p>
            </div>
            <button
              onClick={() => handleDelete(link.id)}
              disabled={deleting === link.id}
              className="shrink-0 p-1.5 rounded text-muted-foreground hover:text-red-400 hover:bg-red-400/10 transition-colors disabled:opacity-40"
            >
              {deleting === link.id ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Trash2 className="w-3.5 h-3.5" />
              )}
            </button>
          </div>

          <div className="flex items-center gap-2 min-w-0">
            <p className="text-xs font-mono text-muted-foreground truncate flex-1">{link.fullUrl}</p>
            <CopyButton text={link.fullUrl} />
          </div>

          <div className="flex flex-wrap gap-4 pt-1 border-t border-border">
            <Metric icon={Eye} label="Views" value={link.stats.pageviews} />
            <Metric icon={Users} label="Partials" value={link.stats.partials} />
            <Metric icon={TrendingUp} label="Applied" value={link.stats.applications} />
            <Metric icon={Calendar} label="Booked" value={link.stats.booked} />
            <Metric icon={UserCheck} label="Members" value={link.stats.members} />
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-muted-foreground">Conv</span>
              <span className="font-semibold text-primary font-mono">
                {rate(link.stats.members, link.stats.applications)}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function Metric({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: number }) {
  return (
    <div className="flex items-center gap-1.5 text-xs">
      <Icon className="w-3.5 h-3.5 text-muted-foreground" />
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold text-foreground font-mono">{value.toLocaleString()}</span>
    </div>
  )
}

// ── Channels Tab ───────────────────────────────────────────────────────────

function ChannelsTab({ data, loading }: { data: AnalyticsData | null; loading: boolean }) {
  if (loading || !data) {
    return (
      <div className="py-12 flex justify-center">
        <RefreshCw className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const { totals, byChannel } = data

  return (
    <div className="space-y-6">
      {/* Totals */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <StatCard label="Pageviews" value={totals.pageviews} />
        <StatCard label="Partial Apps" value={totals.partials} />
        <StatCard label="Applications" value={totals.applications} />
        <StatCard label="Booked" value={totals.booked} sub={rate(totals.booked, totals.applications) + " of apps"} />
        <StatCard label="Members" value={totals.members} sub={rate(totals.members, totals.applications) + " of apps"} />
      </div>

      {byChannel.length === 0 ? (
        <div className="py-8 text-center text-sm text-muted-foreground">
          No UTM-tagged traffic yet. Start posting links and data will appear here.
        </div>
      ) : (
        <div className="rounded-lg border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface">
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Channel</th>
                <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Views</th>
                <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Partials</th>
                <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Applied</th>
                <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Booked</th>
                <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Members</th>
                <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Conv%</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {byChannel.map((row, i) => (
                <tr key={i} className="hover:bg-surface/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <span className={cn("px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide", channelColor(row.source))}>
                        {channelLabel(row.source)}
                      </span>
                      <span className="text-xs text-muted-foreground">{row.medium}</span>
                    </div>
                  </td>
                  <Num value={row.pageviews} />
                  <Num value={row.partials} />
                  <Num value={row.applications} />
                  <Num value={row.booked} />
                  <Num value={row.members} highlight />
                  <td className="px-4 py-3 text-right font-mono text-sm font-semibold text-primary">
                    {rate(row.members, row.applications)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function Num({ value, highlight }: { value: number; highlight?: boolean }) {
  return (
    <td className={cn("px-4 py-3 text-right font-mono text-sm", highlight ? "text-foreground font-semibold" : "text-muted-foreground")}>
      {value.toLocaleString()}
    </td>
  )
}

// ── Campaigns Tab ──────────────────────────────────────────────────────────

function CampaignsTab({ data, loading }: { data: AnalyticsData | null; loading: boolean }) {
  if (loading || !data) {
    return (
      <div className="py-12 flex justify-center">
        <RefreshCw className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const { byCampaign } = data

  if (byCampaign.length === 0) {
    return (
      <div className="py-8 text-center text-sm text-muted-foreground">
        No campaign data yet. UTM-tagged links will populate this table automatically.
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-surface">
            <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Campaign</th>
            <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Channel</th>
            <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Views</th>
            <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Applied</th>
            <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Booked</th>
            <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Members</th>
            <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Conv%</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {byCampaign.map((row, i) => (
            <tr key={i} className="hover:bg-surface/50 transition-colors">
              <td className="px-4 py-3 font-mono text-xs text-foreground">{row.campaign}</td>
              <td className="px-4 py-3">
                <span className={cn("px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide", channelColor(row.source))}>
                  {channelLabel(row.source)}
                </span>
              </td>
              <Num value={row.pageviews} />
              <Num value={row.applications} />
              <Num value={row.booked} />
              <Num value={row.members} highlight />
              <td className="px-4 py-3 text-right font-mono text-sm font-semibold text-primary">
                {rate(row.members, row.applications)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ── Root component ─────────────────────────────────────────────────────────

export function UtmAnalyticsClient() {
  const [tab, setTab] = useState<Tab>("builder")
  const [links, setLinks] = useState<UtmLinkRow[]>([])
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [linksLoading, setLinksLoading] = useState(true)
  const [analyticsLoading, setAnalyticsLoading] = useState(true)

  const loadLinks = useCallback(async () => {
    setLinksLoading(true)
    try {
      const res = await fetch("/api/admin/utm-links", { cache: "no-store" })
      if (res.ok) {
        const { links: data } = (await res.json()) as { links: UtmLinkRow[] }
        setLinks(data)
      }
    } finally {
      setLinksLoading(false)
    }
  }, [])

  const loadAnalytics = useCallback(async () => {
    setAnalyticsLoading(true)
    try {
      const res = await fetch("/api/admin/analytics/utm", { cache: "no-store" })
      if (res.ok) {
        const data = (await res.json()) as AnalyticsData
        setAnalytics(data)
      }
    } finally {
      setAnalyticsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadLinks()
    loadAnalytics()
  }, [loadLinks, loadAnalytics])

  async function handleDelete(id: string) {
    await fetch(`/api/admin/utm-links/${id}`, { method: "DELETE" })
    setLinks((prev) => prev.filter((l) => l.id !== id))
    loadAnalytics()
  }

  function handleSaved() {
    loadLinks()
    loadAnalytics()
  }

  return (
    <div className="space-y-5">
      {/* Tab bar */}
      <div className="flex items-center gap-1 p-1 bg-surface rounded-lg border border-border w-fit">
        {TABS.map((t) => {
          const icons: Record<Tab, React.ElementType> = {
            builder:   Plus,
            links:     Link2,
            channels:  BarChart3,
            campaigns: Globe,
          }
          const Icon = icons[t]
          return (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "flex items-center gap-2 px-3.5 py-1.5 rounded-md text-sm font-medium transition-all",
                tab === t
                  ? "bg-primary text-background shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-surface/80"
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              {TAB_LABELS[t]}
              {t === "links" && links.length > 0 && (
                <span className="ml-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-primary/20 text-primary text-[10px] font-mono font-bold inline-flex items-center justify-center">
                  {links.length}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Content */}
      {tab === "builder" && <BuilderTab onSaved={handleSaved} />}
      {tab === "links" && <LinksTab links={links} loading={linksLoading} onDelete={handleDelete} />}
      {tab === "channels" && <ChannelsTab data={analytics} loading={analyticsLoading} />}
      {tab === "campaigns" && <CampaignsTab data={analytics} loading={analyticsLoading} />}
    </div>
  )
}
