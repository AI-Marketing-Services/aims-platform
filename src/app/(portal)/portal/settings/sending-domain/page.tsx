import { AtSign, ShieldCheck, Activity, Mail, ArrowRight } from "lucide-react"

export const metadata = { title: "Dedicated Sending Domain" }

/**
 * /portal/settings/sending-domain
 *
 * Real surface — placeholder until we wire the Resend domain
 * provisioning + DNS verification flow.
 */
export default function SendingDomainPage() {
  return (
    <div className="space-y-6">
      <header className="flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
          <AtSign className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dedicated Sending Domain</h1>
          <p className="text-sm text-muted-foreground">
            Stop sharing send-reputation. Provision a dedicated subdomain for all
            outbound mail — sequences, invoices, audits, client updates.
          </p>
        </div>
      </header>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat icon={<AtSign className="h-4 w-4" />} label="Domain status" value="Not configured" />
        <Stat icon={<ShieldCheck className="h-4 w-4" />} label="DKIM / SPF / DMARC" value="—" />
        <Stat icon={<Activity className="h-4 w-4" />} label="Reputation score" value="—" />
        <Stat icon={<Mail className="h-4 w-4" />} label="Outbound (30d)" value="0" />
      </section>

      <div className="rounded-2xl border border-border bg-card p-6 space-y-3">
        <h2 className="text-lg font-bold text-foreground">Provision your subdomain</h2>
        <p className="text-sm text-muted-foreground">
          Pick a subdomain (e.g. <span className="font-mono text-foreground">mail.youragency.com</span>),
          add three DNS records, and we&apos;ll verify + route all outbound through it.
        </p>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-5 py-2.5 text-sm font-bold hover:opacity-90 w-fit"
        >
          Start provisioning
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
