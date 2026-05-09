import { Webhook, KeyRound, Activity, BookOpen, ArrowRight } from "lucide-react"

export const metadata = { title: "API + Webhooks" }

/**
 * /portal/settings/api
 *
 * Real surface — placeholder until we ship the keys + webhook endpoints
 * UI. Today we display the meta and route to docs.
 */
export default function ApiWebhooksPage() {
  return (
    <div className="space-y-6">
      <header className="flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
          <Webhook className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">API + Webhooks</h1>
          <p className="text-sm text-muted-foreground">
            Issue API keys, subscribe to webhook events, and plug AIMS into Zapier,
            Make, or your own stack.
          </p>
        </div>
      </header>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat icon={<KeyRound className="h-4 w-4" />} label="API keys" value="0" />
        <Stat icon={<Webhook className="h-4 w-4" />} label="Webhook endpoints" value="0" />
        <Stat icon={<Activity className="h-4 w-4" />} label="Events delivered (24h)" value="0" />
        <Stat icon={<BookOpen className="h-4 w-4" />} label="Event types available" value="20+" />
      </section>

      <div className="rounded-2xl border border-border bg-card p-6 space-y-3">
        <h2 className="text-lg font-bold text-foreground">Create your first API key</h2>
        <p className="text-sm text-muted-foreground">
          API keys are scoped per integration. Each one comes with a delivery log so
          you can replay any webhook within 30 days.
        </p>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-5 py-2.5 text-sm font-bold hover:opacity-90 w-fit"
        >
          Generate API key
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
