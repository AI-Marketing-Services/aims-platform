import { auth } from "@clerk/nextjs/server"
import { redirect, notFound } from "next/navigation"
import { getDealById } from "@/lib/db/queries"
import { ArrowLeft, DollarSign } from "lucide-react"
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
  NEW_LEAD: "text-gray-400 bg-white/5 border-white/10",
  QUALIFIED: "text-blue-400 bg-blue-500/10 border-blue-500/20",
  DEMO_BOOKED: "text-purple-400 bg-purple-500/10 border-purple-500/20",
  PROPOSAL_SENT: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
  NEGOTIATION: "text-orange-400 bg-orange-500/10 border-orange-500/20",
  ACTIVE_CLIENT: "text-green-400 bg-green-500/10 border-green-500/20",
  UPSELL_OPPORTUNITY: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  AT_RISK: "text-red-400 bg-red-500/10 border-red-500/20",
  CHURNED: "text-gray-500 bg-white/5 border-white/10",
  LOST: "text-gray-600 bg-white/3 border-white/5",
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
    monthlyPrice: sa.monthlyPrice ?? null,
    status: sa.status,
  }))

  const stageColor = STAGE_COLORS[deal.stage] ?? STAGE_COLORS.NEW_LEAD
  const stageLabel = STAGE_OPTIONS.find((s) => s.value === deal.stage)?.label ?? deal.stage

  return (
    <div className="max-w-7xl">
      {/* Back */}
      <Link
        href="/admin/crm"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to CRM
      </Link>

      {/* Header summary bar */}
      <div className="flex items-center gap-4 mb-6 pb-4 border-b border-border">
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#DC2626]/10 border border-[#DC2626]/20 text-[#DC2626] font-bold text-base flex-shrink-0">
          {deal.contactName.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-bold text-foreground leading-tight truncate">{deal.contactName}</h1>
          {deal.company && <p className="text-sm text-muted-foreground">{deal.company}</p>}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="flex items-center gap-1.5 text-sm">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <span className="font-bold text-foreground">${deal.mrr.toLocaleString()}</span>
            <span className="text-muted-foreground">/mo</span>
          </div>
          <span
            className={`text-xs px-2 py-1 rounded-lg border font-medium ${stageColor}`}
          >
            {stageLabel}
          </span>
        </div>
      </div>

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
        priority={deal.priority}
        assignedTo={deal.assignedTo}
        serviceArms={serviceArms}
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
