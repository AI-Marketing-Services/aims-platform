import Link from "next/link"
import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import {
  Mail,
  Edit3,
  FileText,
  ArrowRight,
  Clock,
  AlertTriangle,
  ExternalLink,
} from "lucide-react"
import { db } from "@/lib/db"
import { Breadcrumbs } from "@/components/shared/Breadcrumbs"
import { EMAIL_TEMPLATES } from "@/lib/email/catalog"
import {
  TIMELINE,
  TIMELINE_BUCKETS,
  TIMELINE_INDEX,
  type BucketKey,
  type TimelineRow,
} from "@/lib/email/timeline"

export const dynamic = "force-dynamic"
export const metadata = { title: "Email Templates · Admin" }

export default async function EmailTemplatesAdminPage() {
  const { sessionClaims } = await auth()
  const role = (sessionClaims?.metadata as { role?: string })?.role
  if (!role || !["ADMIN", "SUPER_ADMIN"].includes(role)) {
    redirect("/")
  }

  // Fetch override status for every template key in the catalog so
  // we can stamp "Customised" vs "Default" badges on every row.
  const keys = EMAIL_TEMPLATES.map((t) => t.templateKey)
  const overrides = await db.emailTemplateOverride.findMany({
    where: { templateKey: { in: keys } },
    select: { templateKey: true, updatedAt: true, note: true },
  })
  const byKey = new Map(overrides.map((o) => [o.templateKey, o]))
  const catalogByKey = new Map(EMAIL_TEMPLATES.map((t) => [t.templateKey, t]))

  // Anything in the catalog NOT placed on the timeline lands here so
  // it's still visible/editable, just at the bottom.
  const orphans = EMAIL_TEMPLATES.filter(
    (t) => !TIMELINE_INDEX[t.templateKey],
  )

  const editedCount = overrides.length

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: "Admin", href: "/admin/dashboard" },
          { label: "Email Templates" },
        ]}
      />

      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center">
            <Mail className="h-5 w-5 text-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Email Templates</h1>
            <p className="text-sm text-muted-foreground max-w-2xl">
              Templates are listed in the order they fire across a
              member&apos;s journey. Click any row to edit. Saving overrides the
              code default at send-time; reverting restores it.
            </p>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Stat
          label="Total templates"
          value={EMAIL_TEMPLATES.length}
          sub="customer-facing emails"
        />
        <Stat
          label="With overrides"
          value={editedCount}
          sub="customised by team"
        />
        <Stat
          label="Using defaults"
          value={EMAIL_TEMPLATES.length - editedCount}
          sub="ship straight from code"
        />
        <Stat
          label="Recent edits"
          value={
            overrides.filter(
              (o) =>
                Date.now() - o.updatedAt.getTime() < 7 * 24 * 60 * 60 * 1000,
            ).length
          }
          sub="last 7 days"
        />
      </div>

      {/* Timeline reference link */}
      <div className="rounded-xl border border-border bg-muted/20 px-4 py-3 flex items-start gap-3">
        <Clock className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground">
            Need the full sending order with cron schedules + gotchas?
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            See{" "}
            <a
              href="https://github.com/AIMS-Product/AIOperatorCollective/blob/main/docs/EMAIL-TIMELINE.md"
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground underline underline-offset-2 hover:text-primary inline-flex items-center gap-0.5"
            >
              docs/EMAIL-TIMELINE.md
              <ExternalLink className="h-3 w-3" />
            </a>{" "}
            for the long-form prose version (every drip, every cron,
            every dependency between sends).
          </p>
        </div>
      </div>

      {/* Timeline buckets */}
      <div className="space-y-8">
        {TIMELINE_BUCKETS.map((bucket, idx) => {
          const rows = [...TIMELINE[bucket.key]].sort(
            (a, b) => a.order - b.order,
          )
          if (rows.length === 0) return null
          return (
            <BucketSection
              key={bucket.key}
              bucketIndex={idx + 1}
              bucketKey={bucket.key}
              label={bucket.label}
              blurb={bucket.blurb}
              rows={rows}
              catalogByKey={catalogByKey}
              overrideByKey={byKey}
            />
          )
        })}

        {/* Orphans — templates in the catalog but not yet placed on the
            timeline. Shown in a final neutral section so they remain
            editable. */}
        {orphans.length > 0 && (
          <div>
            <SectionHeader
              index={TIMELINE_BUCKETS.length + 1}
              label="Other / Unscheduled"
              blurb="Templates that exist in the catalog but aren't yet placed on the journey timeline. Editable, but their trigger isn't documented here yet."
            />
            <div className="rounded-2xl border border-border bg-card overflow-hidden">
              <ListHeader />
              <div className="divide-y divide-border">
                {orphans.map((t) => (
                  <TemplateRow
                    key={t.templateKey}
                    templateKey={t.templateKey}
                    displayName={t.displayName}
                    description={t.description}
                    dayOffset="—"
                    trigger="(unscheduled)"
                    notice={null}
                    overridden={Boolean(byKey.get(t.templateKey))}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function BucketSection({
  bucketIndex,
  bucketKey: _bucketKey,
  label,
  blurb,
  rows,
  catalogByKey,
  overrideByKey,
}: {
  bucketIndex: number
  bucketKey: BucketKey
  label: string
  blurb: string
  rows: TimelineRow[]
  catalogByKey: Map<
    string,
    { templateKey: string; displayName: string; description: string }
  >
  overrideByKey: Map<string, { templateKey: string; updatedAt: Date }>
}) {
  return (
    <div>
      <SectionHeader index={bucketIndex} label={label} blurb={blurb} />
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <ListHeader />
        <div className="divide-y divide-border">
          {rows.map((row) => {
            const entry = catalogByKey.get(row.templateKey)
            if (!entry) return null
            return (
              <TemplateRow
                key={row.templateKey}
                templateKey={row.templateKey}
                displayName={entry.displayName}
                description={entry.description}
                dayOffset={row.dayOffset}
                trigger={row.trigger}
                notice={row.notice ?? null}
                overridden={Boolean(overrideByKey.get(row.templateKey))}
              />
            )
          })}
        </div>
      </div>
    </div>
  )
}

function SectionHeader({
  index,
  label,
  blurb,
}: {
  index: number
  label: string
  blurb: string
}) {
  return (
    <div className="mb-3 flex items-baseline gap-3">
      <span className="text-xs font-mono font-semibold text-muted-foreground tabular-nums">
        {String(index).padStart(2, "0")}
      </span>
      <div className="flex-1 min-w-0">
        <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">
          {label}
        </h2>
        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
          {blurb}
        </p>
      </div>
    </div>
  )
}

function ListHeader() {
  return (
    <div className="hidden sm:grid grid-cols-12 px-5 py-2.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider bg-muted/20 border-b border-border">
      <div className="col-span-2">When</div>
      <div className="col-span-4">Template</div>
      <div className="col-span-4">Trigger</div>
      <div className="col-span-1">Status</div>
      <div className="col-span-1 text-right">Edit</div>
    </div>
  )
}

function TemplateRow({
  templateKey,
  displayName,
  description: _description,
  dayOffset,
  trigger,
  notice,
  overridden,
}: {
  templateKey: string
  displayName: string
  description: string
  dayOffset: string
  trigger: string
  notice: string | null
  overridden: boolean
}) {
  return (
    <Link
      href={`/admin/email-templates/${encodeURIComponent(templateKey)}`}
      className="grid grid-cols-1 sm:grid-cols-12 gap-2 px-5 py-3.5 text-sm hover:bg-muted/30 transition-colors items-center"
    >
      {/* When */}
      <div className="sm:col-span-2">
        <p className="text-[11px] font-mono font-semibold text-foreground tabular-nums">
          {dayOffset}
        </p>
      </div>

      {/* Template */}
      <div className="sm:col-span-4">
        <p className="font-semibold text-foreground leading-tight">
          {displayName}
        </p>
        <p className="text-[11px] text-muted-foreground font-mono mt-0.5 truncate">
          {templateKey}
        </p>
      </div>

      {/* Trigger */}
      <div className="sm:col-span-4 text-xs text-muted-foreground leading-relaxed">
        {trigger}
        {notice && (
          <p className="mt-1 inline-flex items-start gap-1 text-[11px] text-foreground">
            <AlertTriangle className="h-3 w-3 mt-0.5 shrink-0" />
            <span>{notice}</span>
          </p>
        )}
      </div>

      {/* Status */}
      <div className="sm:col-span-1">
        {overridden ? (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-foreground bg-muted border border-border px-2 py-0.5 rounded-full">
            <Edit3 className="h-3 w-3" />
            Edited
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground bg-muted/40 border border-border px-2 py-0.5 rounded-full">
            <FileText className="h-3 w-3" />
            Default
          </span>
        )}
      </div>

      {/* Edit chevron */}
      <div className="hidden sm:flex sm:col-span-1 items-center justify-end text-muted-foreground">
        <ArrowRight className="h-4 w-4" />
      </div>
    </Link>
  )
}

function Stat({
  label,
  value,
  sub,
}: {
  label: string
  value: number
  sub: string
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mb-1">
        {label}
      </p>
      <p className="text-2xl font-bold text-foreground">{value}</p>
      <p className="text-[10px] text-muted-foreground mt-0.5">{sub}</p>
    </div>
  )
}
