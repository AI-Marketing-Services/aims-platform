import Link from "next/link"
import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { Mail, Edit3, FileText, ArrowRight } from "lucide-react"
import { db } from "@/lib/db"
import { Breadcrumbs } from "@/components/shared/Breadcrumbs"
import { EMAIL_TEMPLATES } from "@/lib/email/catalog"

export const dynamic = "force-dynamic"
export const metadata = { title: "Email Templates · Admin" }

const PHASE_LABEL: Record<string, { label: string; tone: string }> = {
  foundation: {
    label: "Foundation",
    tone: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  prospecting: {
    label: "Prospecting",
    tone: "bg-amber-50 text-amber-700 border-amber-200",
  },
  revenue_activities: {
    label: "Revenue",
    tone: "bg-yellow-50 text-yellow-700 border-yellow-200",
  },
  problem_diagnosis: {
    label: "Diagnosis",
    tone: "bg-blue-50 text-blue-700 border-blue-200",
  },
  solutioning: {
    label: "Solutioning",
    tone: "bg-purple-50 text-purple-700 border-purple-200",
  },
  transactional: {
    label: "Transactional",
    tone: "bg-muted text-muted-foreground border-border",
  },
}

export default async function EmailTemplatesAdminPage() {
  const { sessionClaims } = await auth()
  const role = (sessionClaims?.metadata as { role?: string })?.role
  if (!role || !["ADMIN", "SUPER_ADMIN"].includes(role)) {
    redirect("/")
  }

  // Fetch override status for every template key in the catalog.
  const keys = EMAIL_TEMPLATES.map((t) => t.templateKey)
  const overrides = await db.emailTemplateOverride.findMany({
    where: { templateKey: { in: keys } },
    select: { templateKey: true, updatedAt: true, note: true },
  })
  const byKey = new Map(overrides.map((o) => [o.templateKey, o]))

  // Group by phase for the table.
  const byPhase = new Map<string, typeof EMAIL_TEMPLATES>()
  for (const t of EMAIL_TEMPLATES) {
    const arr = byPhase.get(t.phase) ?? []
    arr.push(t)
    byPhase.set(t.phase, arr)
  }
  const phaseOrder = [
    "foundation",
    "prospecting",
    "revenue_activities",
    "problem_diagnosis",
    "solutioning",
    "transactional",
  ] as const

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
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Mail className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Email Templates</h1>
            <p className="text-sm text-muted-foreground">
              See, edit, and save every email the platform sends. Saves
              override the code defaults at send-time. Reverting a template
              deletes the override and falls back to the default.
            </p>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Stat
          label="Total templates"
          value={EMAIL_TEMPLATES.length}
          sub="all customer-facing emails"
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

      {/* Templates grouped by phase */}
      <div className="space-y-6">
        {phaseOrder.map((phase) => {
          const items = byPhase.get(phase) ?? []
          if (items.length === 0) return null
          const phaseInfo = PHASE_LABEL[phase] ?? PHASE_LABEL.transactional
          return (
            <div key={phase}>
              <div className="flex items-center gap-2 mb-3">
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${phaseInfo.tone}`}
                >
                  {phaseInfo.label}
                </span>
                <p className="text-xs text-muted-foreground">
                  {items.length} template{items.length === 1 ? "" : "s"}
                </p>
              </div>

              <div className="rounded-2xl border border-border bg-card overflow-hidden">
                <div className="hidden sm:grid grid-cols-12 px-5 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wider bg-muted/20 border-b border-border">
                  <div className="col-span-5">Template</div>
                  <div className="col-span-4">When it fires</div>
                  <div className="col-span-2">Status</div>
                  <div className="col-span-1 text-right">Edit</div>
                </div>
                <div className="divide-y divide-border">
                  {items.map((t) => {
                    const override = byKey.get(t.templateKey)
                    return (
                      <Link
                        key={t.templateKey}
                        href={`/admin/email-templates/${encodeURIComponent(t.templateKey)}`}
                        className="grid grid-cols-2 sm:grid-cols-12 gap-2 px-5 py-3.5 text-sm hover:bg-muted/20 transition-colors items-center"
                      >
                        <div className="col-span-2 sm:col-span-5">
                          <p className="font-semibold text-foreground">
                            {t.displayName}
                          </p>
                          <p className="text-[11px] text-muted-foreground font-mono mt-0.5">
                            {t.templateKey}
                          </p>
                        </div>
                        <div className="col-span-1 sm:col-span-4 text-xs text-muted-foreground line-clamp-2">
                          {t.description}
                        </div>
                        <div className="col-span-1 sm:col-span-2">
                          {override ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 border border-primary/30 px-2 py-0.5 rounded-full">
                              <Edit3 className="h-3 w-3" />
                              Customised
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground bg-muted/40 border border-border px-2 py-0.5 rounded-full">
                              <FileText className="h-3 w-3" />
                              Default
                            </span>
                          )}
                        </div>
                        <div className="hidden sm:flex col-span-1 items-center justify-end text-muted-foreground">
                          <ArrowRight className="h-4 w-4" />
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
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
