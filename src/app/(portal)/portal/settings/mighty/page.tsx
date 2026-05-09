import { Network, Users2, RefreshCw, Activity, ArrowRight } from "lucide-react"

export const metadata = { title: "Mighty Networks Sync" }

/**
 * /portal/settings/mighty
 *
 * Real surface — placeholder until we wire the Mighty Networks OAuth
 * flow + hourly sync job.
 */
export default function MightySyncPage() {
  return (
    <div className="space-y-6">
      <header className="flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
          <Network className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Mighty Networks Sync</h1>
          <p className="text-sm text-muted-foreground">
            Connect your AOC community and auto-onboard new members straight into
            your branded portal.
          </p>
        </div>
      </header>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat icon={<Network className="h-4 w-4" />} label="Workspace" value="Not connected" />
        <Stat icon={<Users2 className="h-4 w-4" />} label="Members synced" value="0" />
        <Stat icon={<RefreshCw className="h-4 w-4" />} label="Last sync" value="—" />
        <Stat icon={<Activity className="h-4 w-4" />} label="Posts ingested (7d)" value="0" />
      </section>

      <div className="rounded-2xl border border-border bg-card p-6 space-y-3">
        <h2 className="text-lg font-bold text-foreground">Connect your Mighty workspace</h2>
        <p className="text-sm text-muted-foreground">
          OAuth-connect once and we&apos;ll auto-provision portal users on join, map
          tier tags to entitlements, and pull posts + replies into your Signal feed.
        </p>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-5 py-2.5 text-sm font-bold hover:opacity-90 w-fit"
        >
          Connect Mighty
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

function Stat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-wide">
        {icon}
        <span>{label}</span>
      </div>
      <div className="text-xl font-bold mt-2 tabular-nums text-foreground">{value}</div>
    </div>
  )
}
