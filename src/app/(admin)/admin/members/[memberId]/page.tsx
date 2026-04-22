import { notFound } from "next/navigation"
import Link from "next/link"
import { db } from "@/lib/db"
import { requireAdmin } from "@/lib/auth"
import { Breadcrumbs } from "@/components/shared/Breadcrumbs"
import { getProgressForUser } from "@/lib/onboarding/progress"
import { ONBOARDING_STEPS, TOTAL_STEPS } from "@/lib/onboarding/steps"
import { MONTHLY_ALLOWANCES } from "@/lib/usage"
import { formatDistanceToNow } from "date-fns"
import {
  User,
  Briefcase,
  TrendingUp,
  CheckCircle2,
  Circle,
  Zap,
  Mail,
  Phone,
  Globe,
  Calendar,
  ArrowLeft,
} from "lucide-react"

export const dynamic = "force-dynamic"

async function getMember(memberId: string) {
  return db.user.findFirst({
    where: { id: memberId, role: "CLIENT" },
    include: {
      memberProfile: true,
      memberOnboardingSteps: {
        select: { stepKey: true, completedAt: true, method: true },
        orderBy: { completedAt: "desc" },
      },
      clientDeals: {
        include: {
          activities: { orderBy: { createdAt: "desc" }, take: 5 },
          contacts: { where: { isPrimary: true }, take: 1 },
        },
        orderBy: { updatedAt: "desc" },
      },
      usageEvents: {
        where: {
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
      },
      notifications: {
        orderBy: { sentAt: "desc" },
        take: 10,
      },
    },
  })
}

const STAGE_LABELS: Record<string, string> = {
  PROSPECT: "Prospect",
  DISCOVERY_CALL: "Discovery",
  PROPOSAL_SENT: "Proposal",
  ACTIVE_RETAINER: "Active",
  COMPLETED: "Completed",
  LOST: "Lost",
}

const STAGE_COLORS: Record<string, string> = {
  PROSPECT: "text-blue-400 bg-blue-400/10",
  DISCOVERY_CALL: "text-violet-400 bg-violet-400/10",
  PROPOSAL_SENT: "text-amber-400 bg-amber-400/10",
  ACTIVE_RETAINER: "text-emerald-400 bg-emerald-400/10",
  COMPLETED: "text-primary bg-primary/10",
  LOST: "text-red-400 bg-red-400/10",
}

const TYPE_LABELS: Record<string, string> = {
  lead_scout: "Lead Scout",
  proposal_generate: "Proposals",
  signal_digest: "Signal",
  ai_chat: "AI Chat",
}

export default async function AdminMemberDetailPage({
  params,
}: {
  params: Promise<{ memberId: string }>
}) {
  await requireAdmin()
  const { memberId } = await params
  const member = await getMember(memberId)
  if (!member) notFound()

  const progress = await getProgressForUser(member.id)
  const completedStepKeys = new Set(member.memberOnboardingSteps.map((s) => s.stepKey))

  // Usage this month
  const usageByType = new Map<string, number>()
  for (const evt of member.usageEvents) {
    usageByType.set(evt.type, (usageByType.get(evt.type) ?? 0) + evt.credits)
  }

  const activeMrr = member.clientDeals
    .filter((d) => d.stage === "ACTIVE_RETAINER")
    .reduce((s, d) => s + d.value, 0)

  const pipeline = member.clientDeals
    .filter((d) => !["COMPLETED", "LOST"].includes(d.stage))
    .reduce((s, d) => s + d.value, 0)

  return (
    <div className="px-6 py-6 space-y-6 max-w-5xl mx-auto">
      <Breadcrumbs
        items={[
          { label: "Admin", href: "/admin/dashboard" },
          { label: "Members", href: "/admin/members" },
          { label: member.memberProfile?.businessName ?? member.name ?? member.email },
        ]}
      />

      <Link href="/admin/members" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to members
      </Link>

      {/* Header */}
      <div className="flex items-start gap-4">
        {member.memberProfile?.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={member.memberProfile.logoUrl} alt="" className="h-14 w-14 rounded-xl object-contain border border-border" />
        ) : (
          <div className="h-14 w-14 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
            <User className="h-6 w-6 text-primary" />
          </div>
        )}
        <div className="flex-1">
          <h1 className="text-xl font-bold text-foreground">
            {member.memberProfile?.businessName ?? member.name ?? member.email}
          </h1>
          {member.memberProfile?.oneLiner && (
            <p className="text-sm text-muted-foreground mt-0.5">{member.memberProfile.oneLiner}</p>
          )}
          <div className="flex flex-wrap gap-3 mt-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{member.email}</span>
            {member.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{member.phone}</span>}
            {member.memberProfile?.businessUrl && (
              <a href={member.memberProfile.businessUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-foreground">
                <Globe className="h-3 w-3" />{member.memberProfile.businessUrl}
              </a>
            )}
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Joined {formatDistanceToNow(new Date(member.createdAt), { addSuffix: true })}
            </span>
          </div>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Onboarding", value: `${progress.percent}%`, sub: `${progress.completedCount}/${TOTAL_STEPS} steps`, color: "text-primary" },
          { label: "Active MRR", value: activeMrr > 0 ? `$${activeMrr.toLocaleString()}` : "—", sub: "from retainers", color: "text-emerald-400" },
          { label: "Pipeline", value: pipeline > 0 ? `$${pipeline.toLocaleString()}` : "—", sub: `${member.clientDeals.length} deals`, color: "text-blue-400" },
          { label: "AI Credits Used", value: String(member.usageEvents.length), sub: "events this month", color: "text-amber-400" },
        ].map(({ label, value, sub, color }) => (
          <div key={label} className="bg-card border border-border rounded-xl p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">{label}</p>
            <p className={`text-xl font-bold ${color}`}>{value}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-5">
        {/* Left: CRM deals */}
        <div className="space-y-4">
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <div className="flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm font-semibold text-foreground">CRM Deals</p>
              </div>
              <span className="text-xs text-muted-foreground">{member.clientDeals.length} total</span>
            </div>
            {member.clientDeals.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-sm text-muted-foreground/60">No deals tracked yet</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {member.clientDeals.map((deal) => (
                  <div key={deal.id} className="px-5 py-3 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground">{deal.companyName}</p>
                      {deal.contacts[0] && (
                        <p className="text-xs text-muted-foreground">{deal.contacts[0].firstName} {deal.contacts[0].lastName ?? ""}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      {deal.value > 0 && (
                        <span className="text-xs font-semibold text-foreground">${deal.value.toLocaleString()}</span>
                      )}
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STAGE_COLORS[deal.stage] ?? "text-muted-foreground bg-muted"}`}>
                        {STAGE_LABELS[deal.stage] ?? deal.stage}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* AI usage */}
          <div className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Zap className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm font-semibold text-foreground">AI Credit Usage (This Month)</p>
            </div>
            {usageByType.size === 0 ? (
              <p className="text-sm text-muted-foreground/60">No AI usage this month</p>
            ) : (
              <div className="space-y-3">
                {Object.entries(MONTHLY_ALLOWANCES).map(([type, allowance]) => {
                  const used = usageByType.get(type) ?? 0
                  const pct = Math.min(100, Math.round((used / allowance) * 100))
                  return (
                    <div key={type}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-foreground">{TYPE_LABELS[type] ?? type}</span>
                        <span className="text-muted-foreground font-mono">{used}/{allowance}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-surface overflow-hidden">
                        <div
                          className={`h-full rounded-full ${pct >= 80 ? "bg-amber-400" : "bg-primary"}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right: Onboarding + profile */}
        <div className="space-y-4">
          {/* Onboarding progress */}
          <div className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm font-semibold text-foreground">Onboarding</p>
              </div>
              <span className="text-xs font-bold text-primary">{progress.percent}%</span>
            </div>
            <div className="h-2 rounded-full bg-surface overflow-hidden mb-4">
              <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress.percent}%` }} />
            </div>
            <div className="space-y-1.5">
              {ONBOARDING_STEPS.map((step) => {
                const done = completedStepKeys.has(step.key)
                return (
                  <div key={step.key} className="flex items-center gap-2">
                    {done ? (
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
                    ) : (
                      <Circle className="h-3.5 w-3.5 shrink-0 text-muted-foreground/40" />
                    )}
                    <span className={`text-xs ${done ? "text-foreground" : "text-muted-foreground/60"}`}>
                      {step.title}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Business profile */}
          {member.memberProfile && (
            <div className="bg-card border border-border rounded-xl p-5 space-y-3">
              <p className="text-sm font-semibold text-foreground">Business Profile</p>
              {[
                { label: "Niche", value: member.memberProfile.niche },
                { label: "Ideal Client", value: member.memberProfile.idealClient },
                { label: "Tagline", value: member.memberProfile.tagline },
              ].filter((f) => f.value).map(({ label, value }) => (
                <div key={label}>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">{label}</p>
                  <p className="text-xs text-foreground mt-0.5">{value}</p>
                </div>
              ))}
              {member.memberProfile.brandColor && (
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Brand Color</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <div className="h-4 w-4 rounded border border-border" style={{ backgroundColor: member.memberProfile.brandColor }} />
                    <span className="text-xs font-mono text-foreground">{member.memberProfile.brandColor}</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
