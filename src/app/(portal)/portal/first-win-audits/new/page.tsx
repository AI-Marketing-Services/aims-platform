import { Sparkles } from "lucide-react"
import { ensureDbUser } from "@/lib/auth/ensure-user"
import { db } from "@/lib/db"
import { FirstWinAuditCreateForm } from "./FirstWinAuditCreateForm"

export const dynamic = "force-dynamic"

export default async function NewFirstWinAuditPage() {
  const user = await ensureDbUser()
  const deals = await db.clientDeal.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
    take: 100,
    select: {
      id: true,
      companyName: true,
      industry: true,
      stage: true,
      contactName: true,
    },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
          <Sparkles className="h-4 w-4 text-primary" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-foreground">New First Win Audit</h1>
          <p className="text-xs text-muted-foreground">
            Create the newer AI readiness diagnostic without touching the original AI Audit quiz builder.
          </p>
        </div>
      </div>

      <FirstWinAuditCreateForm deals={deals} />
    </div>
  )
}
