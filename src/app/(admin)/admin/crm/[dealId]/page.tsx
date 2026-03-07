import { auth } from "@clerk/nextjs/server"
import { redirect, notFound } from "next/navigation"
import { db } from "@/lib/db"
import { getDealById } from "@/lib/db/queries"
import { ArrowLeft, DollarSign, Building2, Mail, Phone, Globe, Tag, User, ExternalLink } from "lucide-react"
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

function InfoRow({ icon: Icon, label, value }: { icon: React.FC<{ className?: string }>; label: string; value: string | null | undefined }) {
  if (!value) return null
  return (
    <div className="flex items-center gap-3">
      <Icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
      <div>
        <p className="text-[11px] text-muted-foreground">{label}</p>
        <p className="text-sm text-foreground">{value}</p>
      </div>
    </div>
  )
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

  const stageColor = STAGE_COLORS[deal.stage] ?? STAGE_COLORS.NEW_LEAD
  const stageLabel = STAGE_OPTIONS.find((s) => s.value === deal.stage)?.label ?? deal.stage

  return (
    <div className="max-w-6xl">
      {/* Back */}
      <Link
        href="/admin/crm"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to CRM
      </Link>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left: Contact + Details */}
        <div className="lg:col-span-1 space-y-4">
          {/* Contact card */}
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-foreground font-semibold text-sm flex-shrink-0">
                {deal.contactName.charAt(0)}
              </div>
              <div>
                <h1 className="font-semibold text-foreground">{deal.contactName}</h1>
                {deal.company && <p className="text-xs text-muted-foreground">{deal.company}</p>}
              </div>
            </div>

            <div className="space-y-3">
              <InfoRow icon={Mail} label="Email" value={deal.contactEmail} />
              <InfoRow icon={Phone} label="Phone" value={deal.phone} />
              <InfoRow icon={Globe} label="Website" value={deal.website} />
              <InfoRow icon={Building2} label="Industry" value={deal.industry} />
              <InfoRow icon={Tag} label="Source" value={deal.source} />
              <InfoRow icon={User} label="Assigned" value={deal.assignedTo} />
            </div>

            {(deal as { closeLeadId?: string | null }).closeLeadId && (
              <a
                href={`https://app.close.com/lead/${(deal as { closeLeadId?: string | null }).closeLeadId}/`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors w-full"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                View in Close CRM
              </a>
            )}
          </div>

          {/* Value card */}
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center gap-2 mb-3">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-semibold text-foreground">Deal Value</span>
            </div>
            <div className="space-y-2">
              <div>
                <p className="text-xs text-muted-foreground">Monthly Value</p>
                <p className="text-xl font-bold text-foreground">${deal.mrr.toLocaleString()}<span className="text-sm font-normal text-muted-foreground">/mo</span></p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Contract</p>
                <p className="text-base font-semibold text-foreground">${deal.value.toLocaleString()}</p>
              </div>
            </div>
          </div>

          {/* Services */}
          {deal.serviceArms.length > 0 && (
            <div className="rounded-xl border border-border bg-card p-5">
              <p className="text-sm font-semibold text-foreground mb-3">Services</p>
              <div className="flex flex-wrap gap-2">
                {deal.serviceArms.map((sa) => (
                  <span key={sa.id} className="text-xs px-2 py-1 bg-muted text-muted-foreground rounded-md">
                    {sa.serviceArm.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* UTM */}
          {(deal.utmSource || deal.utmMedium || deal.utmCampaign) && (
            <div className="rounded-xl border border-border bg-card p-5">
              <p className="text-sm font-semibold text-foreground mb-3">Attribution</p>
              <div className="space-y-1.5 text-xs">
                {deal.utmSource && <div className="flex justify-between"><span className="text-muted-foreground">Source</span><span className="text-foreground">{deal.utmSource}</span></div>}
                {deal.utmMedium && <div className="flex justify-between"><span className="text-muted-foreground">Medium</span><span className="text-foreground">{deal.utmMedium}</span></div>}
                {deal.utmCampaign && <div className="flex justify-between"><span className="text-muted-foreground">Campaign</span><span className="text-foreground">{deal.utmCampaign}</span></div>}
              </div>
            </div>
          )}
        </div>

        {/* Right: Stage + Activity + Notes */}
        <div className="lg:col-span-2 space-y-4">
          <DealDetailClient
            dealId={deal.id}
            currentStage={deal.stage}
            stageLabel={stageLabel}
            stageColor={stageColor}
            stageOptions={STAGE_OPTIONS}
            activities={activities}
            notes={notes}
            authorId={userId}
          />
        </div>
      </div>
    </div>
  )
}
