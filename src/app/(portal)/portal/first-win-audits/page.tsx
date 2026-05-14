import Link from "next/link"
import { ClipboardCheck, FileText, Plus, Sparkles } from "lucide-react"
import { ensureDbUser } from "@/lib/auth/ensure-user"
import { db } from "@/lib/db"

export const dynamic = "force-dynamic"

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft",
  SURVEY_OPEN: "Survey Open",
  ANALYZING: "Analyzing",
  REPORT_READY: "Report Ready",
  PRESENTED: "Presented",
  CONVERTED: "Converted",
  ARCHIVED: "Archived",
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

function statusClass(status: string): string {
  switch (status) {
    case "REPORT_READY":
    case "CONVERTED":
      return "bg-primary/10 text-primary border-primary/20"
    case "SURVEY_OPEN":
    case "ANALYZING":
      return "bg-blue-500/10 text-blue-300 border-blue-500/20"
    case "ARCHIVED":
      return "bg-muted/30 text-muted-foreground border-border"
    default:
      return "bg-surface text-muted-foreground border-border"
  }
}

export default async function FirstWinAuditsPage() {
  const user = await ensureDbUser()
  const audits = await db.firstWinAudit.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: {
      clientDeal: {
        select: {
          companyName: true,
          stage: true,
          contactName: true,
        },
      },
      _count: {
        select: {
          respondents: true,
          responses: true,
          useCases: true,
          reports: true,
        },
      },
    },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-foreground">First Win Audit</h1>
              <span className="rounded-full border border-primary/20 bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                V2
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              AI readiness and workflow friction audits for finding a client&apos;s first practical AI win.
            </p>
          </div>
        </div>
        <Link
          href="/portal/first-win-audits/new"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
        >
          <Plus className="h-3.5 w-3.5" />
          New audit
        </Link>
      </div>

      <div className="rounded-xl border border-border bg-card/60 p-5">
        <div className="flex items-start gap-3">
          <ClipboardCheck className="mt-0.5 h-5 w-5 text-primary" />
          <div>
            <h2 className="text-sm font-semibold text-foreground">Separate from the existing AI Audit</h2>
            <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
              This is the newer diagnostic workflow. The original AI Audit quiz builder stays at /portal/audits.
              This area is for client/prospect readiness audits, survey collection, use-case scoring, and reports.
            </p>
          </div>
        </div>
      </div>

      {audits.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center rounded-xl border border-dashed border-border bg-card/40">
          <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
            <FileText className="h-7 w-7 text-primary/60" />
          </div>
          <p className="text-foreground font-medium mb-1">No First Win Audits yet</p>
          <p className="text-sm text-muted-foreground mb-4 max-w-md">
            Start with a prospect or client from your CRM. The first version creates the audit record;
            survey links, reports, and client sharing come next.
          </p>
          <Link
            href="/portal/first-win-audits/new"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
          >
            <Plus className="h-3.5 w-3.5" />
            Create first audit
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {audits.map((audit) => (
            <div key={audit.id} className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-foreground truncate">{audit.companyName}</h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {audit.industry ?? audit.clientDeal.stage} · Created {formatDate(audit.createdAt)}
                  </p>
                  {audit.clientDeal.contactName && (
                    <p className="mt-1 text-xs text-muted-foreground">Contact: {audit.clientDeal.contactName}</p>
                  )}
                </div>
                <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${statusClass(audit.status)}`}>
                  {STATUS_LABELS[audit.status] ?? audit.status}
                </span>
              </div>

              <div className="mt-4 grid grid-cols-4 gap-2 border-t border-border pt-4 text-center">
                <div>
                  <p className="text-sm font-bold text-foreground">{audit._count.respondents}</p>
                  <p className="text-[10px] text-muted-foreground">People</p>
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">{audit._count.responses}</p>
                  <p className="text-[10px] text-muted-foreground">Answers</p>
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">{audit._count.useCases}</p>
                  <p className="text-[10px] text-muted-foreground">Use cases</p>
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">{audit._count.reports}</p>
                  <p className="text-[10px] text-muted-foreground">Reports</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
