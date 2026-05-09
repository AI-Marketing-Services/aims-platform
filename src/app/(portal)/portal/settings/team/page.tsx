import { Users2, UserPlus, Crown, Shield, ArrowRight } from "lucide-react"

export const metadata = { title: "Team Seats" }

/**
 * /portal/settings/team
 *
 * Real surface — placeholder list until we wire User + invite flow.
 */
export default function TeamSeatsPage() {
  return (
    <div className="space-y-6">
      <header className="flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
          <Users2 className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Team Seats</h1>
          <p className="text-sm text-muted-foreground">
            Invite teammates by email and set their role. The first user is included
            with every plan; each additional seat is $25/month.
          </p>
        </div>
      </header>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat icon={<Users2 className="h-4 w-4" />} label="Active seats" value="1" />
        <Stat icon={<UserPlus className="h-4 w-4" />} label="Invites pending" value="0" />
        <Stat icon={<Crown className="h-4 w-4" />} label="Owner" value="You" />
        <Stat icon={<Shield className="h-4 w-4" />} label="Roles available" value="4" />
      </section>

      <div className="rounded-2xl border border-border bg-card p-6 space-y-3">
        <h2 className="text-lg font-bold text-foreground">Invite your first teammate</h2>
        <p className="text-sm text-muted-foreground">
          Pick a role — SDR, AM, Admin, or View-only — and we&apos;ll send the invite.
          Cancel any seat at any time.
        </p>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-5 py-2.5 text-sm font-bold hover:opacity-90 w-fit"
        >
          Invite teammate
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
