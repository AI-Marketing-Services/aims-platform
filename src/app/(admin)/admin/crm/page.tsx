import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { getDealsByStage } from "@/lib/db/queries"
import { CRMKanban } from "./CRMKanban"


export default async function AdminCRMPage() {
  const { userId, sessionClaims } = await auth()
  if (!userId) redirect("/sign-in")
  const role = (sessionClaims?.publicMetadata as { role?: string })?.role
  if (!role || !["ADMIN", "SUPER_ADMIN"].includes(role)) redirect("/portal/dashboard")

  const pipeline = await getDealsByStage()
  const now = Date.now()
  const initialDeals = pipeline
    .flatMap(({ deals }) =>
      deals.map((d) => ({
        id: d.id,
        contactName: d.contactName,
        company: d.company ?? undefined,
        stage: d.stage as "NEW_LEAD" | "QUALIFIED" | "DEMO_BOOKED" | "PROPOSAL_SENT" | "NEGOTIATION" | "ACTIVE_CLIENT" | "CHURNED" | "LOST",
        value: d.value,
        mrr: d.mrr,
        source: d.source ?? undefined,
        channelTag: d.channelTag ?? undefined,
        serviceArms: d.serviceArms.map((sa) => sa.serviceArm.name),
        daysInStage: Math.max(0, Math.floor((now - new Date(d.updatedAt).getTime()) / 86_400_000)),
        leadScore: d.leadScore ?? undefined,
        assignedTo: d.assignedTo ?? undefined,
        updatedAt: d.updatedAt.toISOString(),
      }))
    )

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      <div className="mb-6 flex-shrink-0">
        <h1 className="text-2xl font-bold text-foreground mb-1">CRM Pipeline</h1>
        <p className="text-gray-400">Drag deals between stages to update pipeline</p>
      </div>
      <CRMKanban initialDeals={initialDeals} />
    </div>
  )
}
