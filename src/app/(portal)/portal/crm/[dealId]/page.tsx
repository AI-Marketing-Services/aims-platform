import { auth } from "@clerk/nextjs/server"
import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { db } from "@/lib/db"
import { ActivityTimeline } from "@/components/portal/crm/ActivityTimeline"
import { StageSelector } from "@/components/portal/crm/StageSelector"
import { ChevronLeft, Building2, User, Mail, Phone, Globe, DollarSign } from "lucide-react"
import { EditDealInlineForm } from "@/components/portal/crm/EditDealInlineForm"

async function getDeal(dealId: string, clerkId: string) {
  const dbUser = await db.user.findUnique({ where: { clerkId }, select: { id: true } })
  if (!dbUser) return null

  return db.clientDeal.findFirst({
    where: { id: dealId, userId: dbUser.id },
    include: {
      contacts: { orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }] },
      activities: { orderBy: { createdAt: "desc" } },
    },
  })
}

export const dynamic = "force-dynamic"

export default async function DealDetailPage({
  params,
}: {
  params: Promise<{ dealId: string }>
}) {
  const { userId } = await auth()
  if (!userId) redirect("/sign-in")

  const { dealId } = await params
  const deal = await getDeal(dealId, userId)
  if (!deal) notFound()

  return (
    <div className="max-w-5xl mx-auto px-6 py-6 space-y-6">
      {/* Back */}
      <Link
        href="/portal/crm"
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        <ChevronLeft className="h-3.5 w-3.5" />
        Back to pipeline
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Building2 className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">{deal.companyName}</h1>
            {deal.industry && (
              <p className="text-xs text-muted-foreground mt-0.5">{deal.industry}</p>
            )}
          </div>
        </div>
        {deal.value > 0 && (
          <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-1.5">
            <DollarSign className="h-3.5 w-3.5 text-emerald-400" />
            <span className="text-sm font-bold text-emerald-400">
              {deal.value.toLocaleString()} {deal.currency}
            </span>
          </div>
        )}
      </div>

      {/* Stage selector */}
      <div className="bg-card border border-border rounded-xl p-4 space-y-2">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Stage</p>
        <StageSelector dealId={deal.id} currentStage={deal.stage} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-4">
        {/* Left: details + edit */}
        <div className="space-y-4">
          {/* Contact info card */}
          <div className="bg-card border border-border rounded-xl p-4 space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Contact</p>
            <div className="grid grid-cols-2 gap-y-2 gap-x-4">
              {deal.contactName && (
                <div className="flex items-center gap-2">
                  <User className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span className="text-sm text-foreground">{deal.contactName}</span>
                </div>
              )}
              {deal.contactEmail && (
                <div className="flex items-center gap-2">
                  <Mail className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <a
                    href={`mailto:${deal.contactEmail}`}
                    className="text-sm text-primary hover:underline truncate"
                  >
                    {deal.contactEmail}
                  </a>
                </div>
              )}
              {deal.contactPhone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <a href={`tel:${deal.contactPhone}`} className="text-sm text-foreground">
                    {deal.contactPhone}
                  </a>
                </div>
              )}
              {deal.website && (
                <div className="flex items-center gap-2">
                  <Globe className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <a
                    href={deal.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline truncate"
                  >
                    {deal.website.replace(/^https?:\/\//, "")}
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Edit form */}
          <div className="bg-card border border-border rounded-xl p-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Details
            </p>
            <EditDealInlineForm
              dealId={deal.id}
              defaults={{
                companyName: deal.companyName,
                contactName: deal.contactName ?? "",
                contactEmail: deal.contactEmail ?? "",
                contactPhone: deal.contactPhone ?? "",
                website: deal.website ?? "",
                industry: deal.industry ?? "",
                value: deal.value,
                notes: deal.notes ?? "",
                tags: deal.tags,
              }}
            />
          </div>
        </div>

        {/* Right: activity timeline */}
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Activity
          </p>
          <ActivityTimeline
            dealId={deal.id}
            activities={deal.activities.map((a) => ({
              id: a.id,
              type: a.type,
              description: a.description,
              createdAt: a.createdAt.toISOString(),
            }))}
          />
        </div>
      </div>
    </div>
  )
}
