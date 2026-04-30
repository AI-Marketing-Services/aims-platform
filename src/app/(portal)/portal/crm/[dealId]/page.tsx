import { auth } from "@clerk/nextjs/server"
import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { db } from "@/lib/db"
import { ActivityTimeline } from "@/components/portal/crm/ActivityTimeline"
import { StageSelector } from "@/components/portal/crm/StageSelector"
import { ChevronLeft, Building2, User, Mail, Phone, Globe, DollarSign } from "lucide-react"
import { EditDealInlineForm } from "@/components/portal/crm/EditDealInlineForm"
import { ProposalGenerator } from "@/components/portal/crm/ProposalGenerator"
import { FollowUpButton } from "@/components/portal/crm/FollowUpButton"
import { RecommendedPlaysCard } from "@/components/portal/crm/RecommendedPlaysCard"
import { ContactsManager } from "@/components/portal/crm/ContactsManager"
import { DealQuickActions } from "@/components/portal/crm/DealQuickActions"
import { MeetingNotesCard } from "@/components/portal/crm/MeetingNotesCard"
import { matchPlaybookForIndustry } from "@/lib/playbooks/match"
import { DealChecklist } from "@/components/portal/crm/DealChecklist"
import { EnrichmentCard } from "@/components/portal/crm/EnrichmentCard"
import { MAX_ENRICHMENT_COST } from "@/lib/enrichment/credits/pricing"

async function getDeal(dealId: string, clerkId: string) {
  const dbUser = await db.user.findUnique({ where: { clerkId }, select: { id: true } })
  if (!dbUser) return null

  return db.clientDeal.findFirst({
    where: { id: dealId, userId: dbUser.id },
    include: {
      contacts: { orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }] },
      activities: { orderBy: { createdAt: "desc" } },
      proposals: { orderBy: { createdAt: "desc" } },
      enrichment: true,
      meetingNotes: {
        orderBy: [{ meetingDate: "desc" }, { createdAt: "desc" }],
      },
    },
  })
}

async function getCreditBalance(clerkId: string): Promise<number> {
  const u = await db.user.findUnique({
    where: { clerkId },
    select: { creditBalance: true },
  })
  return u?.creditBalance ?? 0
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
  const [deal, creditBalance] = await Promise.all([
    getDeal(dealId, userId),
    getCreditBalance(userId),
  ])
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
          <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-1.5">
            <DollarSign className="h-3.5 w-3.5 text-emerald-700" />
            <span className="text-sm font-bold text-emerald-700">
              {deal.value.toLocaleString()} {deal.currency}
            </span>
          </div>
        )}
      </div>

      {/* Quick actions — most-used operator actions in one row */}
      <DealQuickActions
        dealId={deal.id}
        companyName={deal.companyName}
        defaultRecipientEmail={deal.contactEmail ?? deal.contacts[0]?.email ?? null}
        hasEnrichment={Boolean(deal.enrichment)}
      />

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

          {/* Company research / enrichment */}
          <EnrichmentCard
            dealId={deal.id}
            initialEnrichment={
              deal.enrichment
                ? {
                    id: deal.enrichment.id,
                    domain: deal.enrichment.domain,
                    description: deal.enrichment.description,
                    industry: deal.enrichment.industry,
                    employeeCount: deal.enrichment.employeeCount,
                    employeeRange: deal.enrichment.employeeRange,
                    revenueRange: deal.enrichment.revenueRange,
                    foundedYear: deal.enrichment.foundedYear,
                    city: deal.enrichment.city,
                    state: deal.enrichment.state,
                    country: deal.enrichment.country,
                    linkedinUrl: deal.enrichment.linkedinUrl,
                    twitterUrl: deal.enrichment.twitterUrl,
                    facebookUrl: deal.enrichment.facebookUrl,
                    instagramUrl: deal.enrichment.instagramUrl,
                    logoUrl: deal.enrichment.logoUrl,
                    managementCompany: deal.enrichment.managementCompany,
                    totalCreditsCost: deal.enrichment.totalCreditsCost,
                    startedAt: deal.enrichment.startedAt.toISOString(),
                    completedAt: deal.enrichment.completedAt?.toISOString() ?? null,
                  }
                : null
            }
            lastEnrichedAt={deal.lastEnrichedAt}
            estimatedMaxCost={MAX_ENRICHMENT_COST}
            creditBalance={creditBalance}
          />

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

        {/* Onboarding Checklist (only for ACTIVE_RETAINER / COMPLETED) */}
        <DealChecklist dealId={deal.id} stage={deal.stage} />

        {/* Contacts — add / edit / delete operator-facing UI on top of
            enrichment-derived contacts. Backend has been there; UI was
            missing until now. */}
        <ContactsManager
          dealId={deal.id}
          initialContacts={deal.contacts.map((c) => ({
            id: c.id,
            firstName: c.firstName,
            lastName: c.lastName,
            email: c.email,
            phone: c.phone,
            title: c.title,
            isPrimary: c.isPrimary,
            notes: c.notes,
          }))}
        />

        {/* Meeting notes / transcripts / PDFs — operator's structured
            context dump. AI follow-ups + proposals automatically read
            the most recent notes for context. */}
        <MeetingNotesCard
          dealId={deal.id}
          initialNotes={deal.meetingNotes.map((n) => ({
            id: n.id,
            kind: n.kind,
            title: n.title,
            content: n.content,
            fileUrl: n.fileUrl,
            fileName: n.fileName,
            fileSize: n.fileSize,
            fileType: n.fileType,
            meetingDate: n.meetingDate?.toISOString() ?? null,
            createdAt: n.createdAt.toISOString(),
          }))}
        />

        {/* AI-assisted follow-up — drafts email reading enrichment + activity */}
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Outreach
          </p>
          <FollowUpButton
            dealId={deal.id}
            companyName={deal.companyName}
            defaultRecipientEmail={deal.contactEmail ?? deal.contacts[0]?.email ?? null}
          />
        </div>

        {/* Industry-matched playbook recommendations — surfaced from
            PLAYBOOK_MANIFEST based on the deal's enriched/declared
            industry. Saves operators from browsing /portal/playbooks. */}
        {(() => {
          const industryToMatch =
            deal.enrichment?.industry ?? deal.industry ?? null
          const matched = matchPlaybookForIndustry(industryToMatch)
          if (!matched) return null
          return (
            <RecommendedPlaysCard
              dealId={deal.id}
              industry={industryToMatch}
              matchedIndustry={matched.playbook.industry}
              matchType={matched.matchType}
              industryId={matched.playbook.id}
              plays={matched.topUseCases.map((u) => ({
                id: u.id,
                title: u.title,
                problem: u.problem,
                solution: u.solution,
                tools: u.tools,
                monthlyValue: u.monthlyValue,
                difficulty: u.difficulty,
                timeToDeliver: u.timeToDeliver,
                pitchLine: u.pitchLine,
              }))}
            />
          )
        })()}

        {/* Proposals */}
        <div id="proposal-section" className="bg-card border border-border rounded-xl p-4 scroll-mt-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Proposals
          </p>
          <ProposalGenerator
            dealId={deal.id}
            companyName={deal.companyName}
            dealValue={deal.value}
            proposals={deal.proposals.map((p) => ({
              id: p.id,
              title: p.title,
              status: p.status,
              totalValue: p.totalValue,
              currency: p.currency,
              createdAt: p.createdAt.toISOString(),
              shareToken: p.shareToken,
            }))}
          />
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
