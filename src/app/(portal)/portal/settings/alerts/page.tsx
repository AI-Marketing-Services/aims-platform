import { Bell, Slack, Zap, Inbox, ArrowRight } from "lucide-react"

export const metadata = { title: "Slack / Teams Alerts" }

/**
 * /portal/settings/alerts
 *
 * Real surface — placeholder until we wire Slack / Teams OAuth + the
 * per-event channel routing UI.
 */
export default function AlertsPage() {
  return (
    <div className="space-y-6">
      <header className="flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
          <Bell className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Slack / Teams Alerts</h1>
          <p className="text-sm text-muted-foreground">
            Real-time pings when hot leads arrive, invoices clear, or deals stall.
            Pre-built rule packs plus full custom routing.
          </p>
        </div>
      </header>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat icon={<Slack className="h-4 w-4" />} label="Workspace" value="Not connected" />
        <Stat icon={<Zap className="h-4 w-4" />} label="Active rules" value="0" />
        <Stat icon={<Bell className="h-4 w-4" />} label="Alerts sent (7d)" value="0" />
        <Stat icon={<Inbox className="h-4 w-4" />} label="Channels in use" value="0" />
      </section>

      <div className="rounded-2xl border border-border bg-card p-6 space-y-3">
        <h2 className="text-lg font-bold text-foreground">Connect Slack or Teams</h2>
        <p className="text-sm text-muted-foreground">
          OAuth-connect a workspace, then enable a starter rule pack — sales,
          ops, or billing — to start getting pinged on the events that matter.
        </p>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-5 py-2.5 text-sm font-bold hover:opacity-90 w-fit"
        >
          Connect workspace
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
