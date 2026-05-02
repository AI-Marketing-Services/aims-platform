import { auth } from "@clerk/nextjs/server"
import { redirect, notFound } from "next/navigation"
import { getDealById } from "@/lib/db/queries"
import { db } from "@/lib/db"
import { DealDetailClient } from "./DealDetailClient"
import { Breadcrumbs } from "@/components/shared/Breadcrumbs"
import { getProgressSummaryForAdmin } from "@/lib/onboarding/progress"

export const dynamic = "force-dynamic"

// Lead magnet types that have a public results page at /tools/{slug}/results/{id}
const TYPES_WITH_RESULTS_PAGE = new Set([
  "AI_READINESS_QUIZ",
  "ROI_CALCULATOR",
  "WEBSITE_AUDIT",
  "BUSINESS_CREDIT_SCORE",
  "EXECUTIVE_OPS_AUDIT",
  "BUSINESS_AI_AUDIT",
])

const STAGE_OPTIONS = [
  { value: "APPLICATION_SUBMITTED", label: "Application Submitted" },
  { value: "CONSULT_BOOKED", label: "Consult Booked" },
  { value: "CONSULT_COMPLETED", label: "Consult Completed" },
  { value: "MIGHTY_INVITED", label: "Mighty Invited" },
  { value: "MEMBER_JOINED", label: "Member Joined" },
  { value: "LOST", label: "Lost / Ghosted" },
]

const STAGE_COLORS: Record<string, string> = {
  APPLICATION_SUBMITTED: "text-muted-foreground bg-muted/50 border-border",
  CONSULT_BOOKED: "text-primary bg-primary/5 border-primary/30",
  CONSULT_COMPLETED: "text-primary bg-primary/10 border-primary/40",
  MIGHTY_INVITED: "text-primary bg-primary/15 border-primary/50",
  MEMBER_JOINED: "text-emerald-700 bg-emerald-50 border-emerald-200",
  LOST: "text-muted-foreground bg-muted/30 border-border",
}

export default async function AdminDealDetailPage({ params }: { params: Promise<{ dealId: string }> }) {
  const { dealId } = await params
  const { userId, sessionClaims } = await auth()
  if (!userId) redirect("/sign-in")
  const role = (sessionClaims?.metadata as { role?: string })?.role
  if (!role || !["ADMIN", "SUPER_ADMIN"].includes(role)) redirect("/portal/dashboard")

  const deal = await getDealById(dealId)
  if (!deal) notFound()

  // Look up the linked lead magnet submission (if this deal came in via a tool)
  // so the detail page can surface a "View full report" link.
  const linkedSubmission = await db.leadMagnetSubmission.findFirst({
    where: { dealId },
    select: { id: true, type: true },
    orderBy: { createdAt: "desc" },
  }).catch(() => null)

  // Fetch the Collective application submission to surface answers on the detail page
  const applicationSubmission = await db.leadMagnetSubmission.findFirst({
    where: { dealId, type: "COLLECTIVE_APPLICATION" },
    select: { data: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  }).catch(() => null)

  // The apply route spreads answers flat into the data blob:
  //   data: { ...answers, firstName, lastName, phone, zipCode, country, ... }
  // So timeline/revenue_goal/etc. live at the TOP LEVEL of appData — not nested.
  const appData = applicationSubmission?.data as Record<string, unknown> | null | undefined
  const zipCode = typeof appData?.zipCode === "string" ? appData.zipCode : null
  const country = typeof appData?.country === "string" ? appData.country : null
  const applicationAnswers =
    appData != null
      ? {
          timeline:       typeof appData.timeline       === "string" ? appData.timeline       : undefined,
          revenue_goal:   typeof appData.revenue_goal   === "string" ? appData.revenue_goal   : undefined,
          investment:     typeof appData.investment     === "string" ? appData.investment     : undefined,
          decision_maker: typeof appData.decision_maker === "string" ? appData.decision_maker : undefined,
          background:     typeof appData.background     === "string" ? appData.background     : undefined,
        }
      : null
  const applicationSubmittedAt = applicationSubmission?.createdAt?.toISOString() ?? null

  const mightyInvites = await db.mightyInvite
    .findMany({ where: { dealId }, orderBy: { sentAt: "desc" } })
    .catch(() => [])

  const onboardingSummary = await getProgressSummaryForAdmin(dealId).catch(() => ({
    userId: null,
    progress: null,
    profile: null,
  }))

  const submissionResultsUrl = linkedSubmission && TYPES_WITH_RESULTS_PAGE.has(linkedSubmission.type)
    ? `/tools/${linkedSubmission.type.toLowerCase().replace(/_/g, "-")}/results/${linkedSubmission.id}`
    : null

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

  const stageColor = STAGE_COLORS[deal.stage] ?? STAGE_COLORS.APPLICATION_SUBMITTED
  const stageLabel = STAGE_OPTIONS.find((s) => s.value === deal.stage)?.label ?? deal.stage

  const daysInPipeline = Math.max(0, Math.floor((Date.now() - new Date(deal.createdAt).getTime()) / 86_400_000))

  return (
    <div className="max-w-7xl">
      <Breadcrumbs
        items={[
          { label: "Admin", href: "/admin/dashboard" },
          { label: "CRM", href: "/admin/crm" },
          { label: deal.contactName || "Deal" },
        ]}
      />

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
        submissionResultsUrl={submissionResultsUrl}
        mightyInvites={mightyInvites.map((i) => ({
          id: i.id,
          email: i.email,
          planId: i.planId,
          planName: i.planName ?? null,
          mightyInviteId: i.mightyInviteId ?? null,
          mightyMemberId: i.mightyMemberId ?? null,
          status: i.status,
          errorMessage: i.errorMessage ?? null,
          sentAt: i.sentAt.toISOString(),
          acceptedAt: i.acceptedAt ? i.acceptedAt.toISOString() : null,
          resentAt: i.resentAt ? i.resentAt.toISOString() : null,
        }))}
        mightyInviteStatus={(deal as { mightyInviteStatus?: string | null }).mightyInviteStatus ?? null}
        mightyMemberId={(deal as { mightyMemberId?: number | null }).mightyMemberId ?? null}
        memberUserId={onboardingSummary.userId}
        onboardingCompletedKeys={onboardingSummary.progress ? [...onboardingSummary.progress.completedKeys] : []}
        onboardingCompletedCount={onboardingSummary.progress?.completedCount ?? 0}
        onboardingPercent={onboardingSummary.progress?.percent ?? 0}
        onboardingLastCompletedAt={onboardingSummary.progress?.lastCompletedAt?.toISOString() ?? null}
        onboardingProfile={onboardingSummary.profile}
        zipCode={zipCode}
        country={country}
        applicationAnswers={applicationAnswers}
        applicationSubmittedAt={applicationSubmittedAt}
      />
    </div>
  )
}
