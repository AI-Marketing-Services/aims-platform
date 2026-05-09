import { Flame, ShieldCheck, Activity } from "lucide-react"
import { AddonConfigCard } from "@/components/portal/AddonConfigCard"

export const metadata = { title: "Cold Email Inbox Warmup" }

/**
 * /portal/tools/inbox-warmup
 *
 * Real surface — captures the dedicated sending domain + warmup
 * profile, then displays a status card. Day-to-day warmup volume +
 * deliverability scoring is rendered from a placeholder set until
 * we wire EmailEvent + Resend reputation into the dashboard.
 */
export default function InboxWarmupPage() {
  return (
    <div className="space-y-6">
      <header className="flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
          <Flame className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Inbox Warmup</h1>
          <p className="text-sm text-muted-foreground">
            Auto-warm your sending domain so cold outreach lands in primary tabs, not
            spam folders.
          </p>
        </div>
      </header>

      {/* Health strip — placeholder values until we wire the scoring engine. */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Stat
          icon={<Activity className="h-4 w-4" />}
          label="Reputation score"
          value="92 / 100"
          tone="positive"
        />
        <Stat
          icon={<Flame className="h-4 w-4" />}
          label="Daily warmup volume"
          value="48 sends"
        />
        <Stat
          icon={<ShieldCheck className="h-4 w-4" />}
          label="DKIM / SPF / DMARC"
          value="All green"
          tone="positive"
        />
      </section>

      <AddonConfigCard
        slug="addon-inbox-warmup"
        title="Configure your warmup profile"
        description="We'll join your domain to the peer-to-peer warmup network and start ramping daily volume."
        fields={[
          {
            name: "sendingDomain",
            label: "Dedicated sending domain (e.g. mail.youragency.com)",
            required: true,
            placeholder: "mail.youragency.com",
          },
          {
            name: "fromName",
            label: "From name",
            required: true,
            placeholder: "Adam at Acme",
          },
          {
            name: "fromEmail",
            label: "From email",
            type: "email",
            required: true,
            placeholder: "adam@mail.youragency.com",
          },
          {
            name: "dailyVolumeTarget",
            label: "Eventual daily send target",
            placeholder: "200",
          },
        ]}
      />
    </div>
  )
}

function Stat({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode
  label: string
  value: string
  tone?: "positive" | "warning"
}) {
  const toneClass =
    tone === "positive"
      ? "border-emerald-500/30 bg-emerald-500/5"
      : tone === "warning"
        ? "border-amber-500/30 bg-amber-500/5"
        : "border-border bg-card"
  return (
    <div className={`rounded-xl border p-4 ${toneClass}`}>
      <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-wide">
        {icon}
        <span>{label}</span>
      </div>
      <div className="text-xl font-bold mt-2 tabular-nums">{value}</div>
    </div>
  )
}
