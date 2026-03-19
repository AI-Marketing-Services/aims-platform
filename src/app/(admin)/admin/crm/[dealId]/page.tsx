import { auth } from "@clerk/nextjs/server"
import { redirect, notFound } from "next/navigation"
import { getDealById } from "@/lib/db/queries"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { DealDetailClient } from "./DealDetailClient"

const STAGE_OPTIONS = [
  { value: "NEW_LEAD", label: "New Lead" },
  { value: "QUALIFIED", label: "Qualified" },
  { value: "DEMO_BOOKED", label: "Demo Booked" },
  { value: "PROPOSAL_SENT", label: "Proposal Sent" },
  { value: "NEGOTIATION", label: "Negotiation" },
  { value: "ACTIVE_CLIENT", label: "Active Client" },
  { value: "UPSELL_OPPORTUNITY", label: "Upsell Opportunity" },
  { value: "AT_RISK", label: "At Risk" },
  { value: "CHURNED", label: "Churned" },
  { value: "LOST", label: "Lost" },
]

const STAGE_COLORS: Record<string, string> = {
  NEW_LEAD: "text-muted-foreground bg-deep border-border",
  QUALIFIED: "text-blue-400 bg-blue-900/20 border-blue-800",
  DEMO_BOOKED: "text-purple-400 bg-purple-900/20 border-purple-800",
  PROPOSAL_SENT: "text-yellow-400 bg-yellow-900/20 border-yellow-800",
  NEGOTIATION: "text-orange-400 bg-orange-900/20 border-orange-800",
  ACTIVE_CLIENT: "text-green-400 bg-green-900/15 border-green-800",
  UPSELL_OPPORTUNITY: "text-emerald-400 bg-emerald-900/20 border-emerald-800",
  AT_RISK: "text-primary bg-primary/10 border-primary/30",
  CHURNED: "text-muted-foreground bg-deep border-border",
  LOST: "text-muted-foreground bg-deep border-border",
}

export default async function AdminDealDetailPage({ params }: { params: Promise<{ dealId: string }> }) {
  const { dealId } = await params
  const { userId, sessionClaims } = await auth()
  if (!userId) redirect("/sign-in")
  const role = (sessionClaims?.metadata as { role?: string })?.role
  if (!role || !["ADMIN", "SUPER_ADMIN"].includes(role)) redirect("/portal/dashboard")

  const deal = await getDealById(dealId)
  if (!deal) notFound()

  const activities = deal.activities.map((a) => ({
    id: a.id,
    type: a.type,
    detail: a.detail ?? "",
    authorId: a.authorId ?? null,
    createdAt: a.createdAt.toISOString(),
  }))

  const notes = deal.notes.map((n) => ({
    id: n.id,
    content: n.content,
    authorId: n.authorId,
    createdAt: n.createdAt.toISOString(),
  }))

  const serviceArms = deal.serviceArms.map((sa) => ({
    id: sa.id,
    name: sa.serviceArm.name,
    tier: sa.tier ?? null,
    monthlyPrice: sa.monthlyPrice ?? null,
    status: sa.status,
    activatedAt: sa.activatedAt ? sa.activatedAt.toISOString() : null,
  }))

  const stageColor = STAGE_COLORS[deal.stage] ?? STAGE_COLORS.NEW_LEAD
  const stageLabel = STAGE_OPTIONS.find((s) => s.value === deal.stage)?.label ?? deal.stage

  const daysInPipeline = Math.max(0, Math.floor((Date.now() - new Date(deal.createdAt).getTime()) / 86_400_000))

  return (
    <div className="max-w-7xl">
      <Link
        href="/admin/crm"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to CRM
      </Link>

      <DealDetailClient
        dealId={deal.id}
        currentStage={deal.stage}
        stageLabel={stageLabel}
        stageColor={stageColor}
        stageOptions={STAGE_OPTIONS}
        activities={activities}
        notes={notes}
        authorId={userId}
        contactName={deal.contactName}
        company={deal.company}
        contactEmail={deal.contactEmail}
        phone={deal.phone}
        website={deal.website}
        industry={deal.industry}
        closeLeadId={(deal as { closeLeadId?: string | null }).closeLeadId}
        leadScore={deal.leadScore}
        leadScoreTier={deal.leadScoreTier}
        priority={deal.priority}
        assignedTo={deal.assignedTo}
        serviceArms={serviceArms}
        value={deal.value}
        mrr={deal.mrr}
        daysInPipeline={daysInPipeline}
        source={deal.source}
        sourceDetail={deal.sourceDetail}
        channelTag={deal.channelTag}
        utmSource={deal.utmSource}
        utmMedium={deal.utmMedium}
        utmCampaign={deal.utmCampaign}
        createdAt={deal.createdAt.toISOString()}
      />
    </div>
  )
}
