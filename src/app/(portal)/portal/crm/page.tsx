import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { KanbanPipeline } from "@/components/portal/crm/KanbanPipeline"
import { BulkEnrichBanner } from "@/components/portal/crm/BulkEnrichBanner"
import { Briefcase, Download, MapPin } from "lucide-react"
import Link from "next/link"

async function getDeals(userId: string) {
  const dbUser = await db.user.findUnique({
    where: { clerkId: userId },
    select: { id: true, creditBalance: true },
  })
  if (!dbUser) return { deals: [], creditBalance: 0 }

  const deals = await db.clientDeal.findMany({
    where: { userId: dbUser.id },
    include: {
      _count: { select: { activities: true } },
    },
    orderBy: { updatedAt: "desc" },
  })
  return { deals, creditBalance: dbUser.creditBalance }
}

export const dynamic = "force-dynamic"

export default async function CrmPage() {
  const { userId } = await auth()
  if (!userId) redirect("/sign-in")

  const { deals, creditBalance } = await getDeals(userId)

  const pipelineValue = deals
    .filter((d) => !["COMPLETED", "LOST"].includes(d.stage))
    .reduce((sum, d) => sum + d.value, 0)

  const activeCount = deals.filter((d) => d.stage === "ACTIVE_RETAINER").length

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-border shrink-0">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
            <Briefcase className="h-4.5 w-4.5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">Client Pipeline</h1>
            <p className="text-xs text-muted-foreground">Track prospects through your sales process</p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-6">
          <div className="text-right">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Pipeline</p>
            <p className="text-sm font-bold text-foreground">
              {pipelineValue > 0 ? `$${pipelineValue.toLocaleString()}` : "—"}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Active</p>
            <p className="text-sm font-bold text-foreground">{activeCount}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Total</p>
            <p className="text-sm font-bold text-foreground">{deals.length}</p>
          </div>
          {deals.length > 0 && (
            <a
              href="/api/portal/crm/export"
              download
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground border border-border/50 hover:border-border hover:bg-surface transition-all"
            >
              <Download className="h-3.5 w-3.5" />
              Export CSV
            </a>
          )}
        </div>
      </div>

      {/* Bulk-enrich banner — shows only when there are unenriched deals */}
      <div className="px-6 pt-4">
        <BulkEnrichBanner creditBalance={creditBalance} />
      </div>

      {/* Board */}
      <div className="flex-1 overflow-x-auto px-6 py-5">
        {deals.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center mb-6">
            <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
              <Briefcase className="h-7 w-7 text-primary/60" />
            </div>
            <p className="text-base font-semibold text-foreground mb-1">No deals yet</p>
            <p className="text-sm text-muted-foreground mb-5">
              Add your first prospect below, or scout leads to auto-import.
            </p>
            <Link
              href="/portal/crm/scout"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-colors"
            >
              <MapPin className="h-4 w-4" />
              Find leads with Lead Scout
            </Link>
          </div>
        ) : null}
        <KanbanPipeline
          initialDeals={deals.map((d) => ({
            id: d.id,
            companyName: d.companyName,
            contactName: d.contactName,
            contactEmail: d.contactEmail,
            value: d.value,
            currency: d.currency,
            stage: d.stage,
            tags: d.tags,
            updatedAt: d.updatedAt.toISOString(),
            _count: d._count,
          }))}
        />
      </div>
    </div>
  )
}
