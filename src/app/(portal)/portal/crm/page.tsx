import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { KanbanPipeline } from "@/components/portal/crm/KanbanPipeline"
import { Briefcase } from "lucide-react"

async function getDeals(userId: string) {
  const dbUser = await db.user.findUnique({ where: { clerkId: userId }, select: { id: true } })
  if (!dbUser) return []

  return db.clientDeal.findMany({
    where: { userId: dbUser.id },
    include: {
      _count: { select: { activities: true } },
    },
    orderBy: { updatedAt: "desc" },
  })
}

export const dynamic = "force-dynamic"

export default async function CrmPage() {
  const { userId } = await auth()
  if (!userId) redirect("/sign-in")

  const deals = await getDeals(userId)

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
        </div>
      </div>

      {/* Board */}
      <div className="flex-1 overflow-x-auto px-6 py-5">
        {deals.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <Briefcase className="h-10 w-10 text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground font-medium">No deals yet</p>
            <p className="text-sm text-muted-foreground/60 mt-1">
              Add your first prospect to start tracking your pipeline.
            </p>
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
