import { FileSpreadsheet, CalendarClock, Download, Database, ArrowRight } from "lucide-react"

export const metadata = { title: "Scheduled Reports + BI Export" }

/**
 * /portal/settings/reports
 *
 * Real surface — placeholder until we wire the report scheduler +
 * BigQuery / Sheets export connectors.
 */
export default function ReportingProPage() {
  return (
    <div className="space-y-6">
      <header className="flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
          <FileSpreadsheet className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Scheduled Reports + BI Export</h1>
          <p className="text-sm text-muted-foreground">
            Weekly Monday-morning CSV digests and BigQuery / Sheets / Snowflake
            export for your finance + ops team.
          </p>
        </div>
      </header>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat icon={<CalendarClock className="h-4 w-4" />} label="Scheduled reports" value="0" />
        <Stat icon={<Download className="h-4 w-4" />} label="Sent in last 30d" value="0" />
        <Stat icon={<Database className="h-4 w-4" />} label="BI exports active" value="0" />
        <Stat icon={<FileSpreadsheet className="h-4 w-4" />} label="Templates available" value="10+" />
      </section>

      <div className="rounded-2xl border border-border bg-card p-6 space-y-3">
        <h2 className="text-lg font-bold text-foreground">Schedule your first report</h2>
        <p className="text-sm text-muted-foreground">
          Pick a template — revenue, pipeline, API spend, member activity — set the
          recipients, and we&apos;ll email a CSV every Monday at 8am ET.
        </p>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-5 py-2.5 text-sm font-bold hover:opacity-90 w-fit"
        >
          Schedule report
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
