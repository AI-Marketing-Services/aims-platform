import Link from "next/link"
import { Headphones, Target, MessageSquareWarning, TrendingUp, ArrowRight } from "lucide-react"

export const metadata = { title: "AI Sales Call Coach" }

/**
 * /portal/tools/call-coach
 *
 * Real surface — placeholder values until we wire the scoring engine
 * on top of Discovery Recorder transcripts. Stats render from a static
 * sample set; the configure CTA jumps the operator into recorder
 * settings to make sure calls are being captured.
 */
export default function CallCoachPage() {
  return (
    <div className="space-y-6">
      <header className="flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
          <Headphones className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">AI Sales Call Coach</h1>
          <p className="text-sm text-muted-foreground">
            Every discovery call gets graded across talk-time ratio, pain identification,
            budget surfacing, and next-step clarity.
          </p>
        </div>
      </header>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat icon={<Target className="h-4 w-4" />} label="Average call score" value="7.4 / 10" />
        <Stat icon={<MessageSquareWarning className="h-4 w-4" />} label="Top objection this week" value="Pricing" />
        <Stat icon={<TrendingUp className="h-4 w-4" />} label="Talk-time ratio" value="42% rep" />
        <Stat icon={<Headphones className="h-4 w-4" />} label="Calls graded (30d)" value="0" />
      </section>

      <div className="rounded-2xl border border-border bg-card p-6 space-y-3">
        <h2 className="text-lg font-bold text-foreground">No graded calls yet</h2>
        <p className="text-sm text-muted-foreground">
          Make sure Discovery Recorder is capturing your calls. Once a call lands,
          we&apos;ll score it across our 4 axes and surface objections + AI feedback right here.
        </p>
        <Link
          href="/portal/recordings"
          className="inline-flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-5 py-2.5 text-sm font-bold hover:opacity-90 w-fit"
        >
          Configure recorder
          <ArrowRight className="h-4 w-4" />
        </Link>
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
