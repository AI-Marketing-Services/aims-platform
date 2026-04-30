import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { db } from "@/lib/db"
import { Breadcrumbs } from "@/components/shared/Breadcrumbs"
import { TOTAL_STEPS } from "@/lib/onboarding/steps"
import { Users, CheckCircle2, TrendingUp, Clock, Briefcase, ShieldCheck } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { RefreshButton } from "@/components/admin/RefreshButton"
import type { UserRole } from "@prisma/client"

export const dynamic = "force-dynamic"

export const metadata = { title: "Portal Members" }

const ROLE_FILTERS = [
  { key: "all", label: "All", roles: null },
  { key: "client", label: "Members", roles: ["CLIENT"] },
  { key: "admin", label: "Admins", roles: ["ADMIN", "SUPER_ADMIN"] },
  { key: "reseller", label: "Resellers", roles: ["RESELLER"] },
  { key: "intern", label: "Interns", roles: ["INTERN"] },
] as const

type RoleFilterKey = (typeof ROLE_FILTERS)[number]["key"]

function isValidFilter(key: string | undefined): key is RoleFilterKey {
  return ROLE_FILTERS.some((f) => f.key === key)
}

async function getMembers(roles: readonly UserRole[] | null) {
  return db.user.findMany({
    where: roles ? { role: { in: [...roles] } } : undefined,
    include: {
      memberProfile: { select: { businessName: true, logoUrl: true, onboardingCompletedAt: true } },
      memberOnboardingSteps: { select: { completedAt: true }, orderBy: { completedAt: "desc" } },
      clientDeals: {
        select: { stage: true, value: true, updatedAt: true },
        orderBy: { updatedAt: "desc" },
      },
      deals: {
        select: { id: true },
        take: 1,
      },
    },
    orderBy: { createdAt: "desc" },
  })
}

type Member = Awaited<ReturnType<typeof getMembers>>[number]

function getOnboardingPercent(member: Member) {
  return Math.round((member.memberOnboardingSteps.length / TOTAL_STEPS) * 100)
}

function getPipelineValue(member: Member) {
  return member.clientDeals
    .filter((d) => !["COMPLETED", "LOST"].includes(d.stage))
    .reduce((sum, d) => sum + d.value, 0)
}

function getMrr(member: Member) {
  return member.clientDeals
    .filter((d) => d.stage === "ACTIVE_RETAINER")
    .reduce((sum, d) => sum + d.value, 0)
}

function getLastActivity(member: Member) {
  if (member.clientDeals.length === 0) return null
  return member.clientDeals[0].updatedAt
}

const ROLE_BADGE: Record<UserRole, { label: string; className: string }> = {
  CLIENT: { label: "Member", className: "text-muted-foreground bg-muted" },
  RESELLER: { label: "Reseller", className: "text-foreground bg-primary/[0.08]" },
  INTERN: { label: "Intern", className: "text-foreground bg-muted" },
  ADMIN: { label: "Admin", className: "text-primary bg-primary/15 font-semibold" },
  SUPER_ADMIN: {
    label: "Super Admin",
    className: "text-primary-foreground bg-primary font-semibold",
  },
}

export default async function AdminMembersPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string }>
}) {
  const { userId, sessionClaims } = await auth()
  if (!userId) redirect("/sign-in")
  const callerRole = (sessionClaims?.metadata as { role?: string })?.role
  if (!callerRole || !["ADMIN", "SUPER_ADMIN"].includes(callerRole)) {
    redirect("/portal/dashboard")
  }

  const params = await searchParams
  const filterKey: RoleFilterKey = isValidFilter(params.role) ? params.role : "all"
  const activeFilter =
    ROLE_FILTERS.find((f) => f.key === filterKey) ?? ROLE_FILTERS[0]

  const members = await getMembers(activeFilter.roles)

  const totalOnboarded = members.filter((m) => getOnboardingPercent(m) === 100).length
  const totalWithDeals = members.filter((m) => m.clientDeals.length > 0).length
  const totalMrr = members.reduce((sum, m) => sum + getMrr(m), 0)

  return (
    <div className="max-w-6xl">
      <Breadcrumbs
        items={[
          { label: "Admin", href: "/admin/dashboard" },
          { label: "Portal Members" },
        ]}
      />

      <div className="mb-5 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-foreground">Portal Members</h1>
            <RefreshButton />
          </div>
          <p className="text-muted-foreground text-sm">
            {members.length} {activeFilter.key === "all" ? "users total" : `${activeFilter.label.toLowerCase()}`}, onboarding progress and CRM activity across the platform
          </p>
        </div>

        {/* Summary stats */}
        <div className="flex gap-4 flex-wrap">
          <div className="text-right">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Users</p>
            <p className="text-lg font-bold text-foreground">{members.length}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Onboarded</p>
            <p className="text-lg font-bold text-primary">{totalOnboarded}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Using CRM</p>
            <p className="text-lg font-bold text-foreground">{totalWithDeals}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Member MRR</p>
            <p className="text-lg font-bold text-primary">
              {totalMrr > 0 ? `$${totalMrr.toLocaleString()}` : "—"}
            </p>
          </div>
        </div>
      </div>

      {/* Role filter pills */}
      <div className="mb-4 flex items-center gap-1.5 flex-wrap">
        {ROLE_FILTERS.map((f) => {
          const isActive = f.key === filterKey
          const href = f.key === "all" ? "/admin/members" : `/admin/members?role=${f.key}`
          return (
            <Link
              key={f.key}
              href={href}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "border border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground"
              }`}
            >
              {f.label}
            </Link>
          )
        })}
      </div>

      {members.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-12 text-center">
          <Users className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground">
            No {activeFilter.label.toLowerCase()} found
          </p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Member
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden sm:table-cell">
                  Role
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">
                  Onboarding
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden lg:table-cell">
                  CRM Deals
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden lg:table-cell">
                  Pipeline / MRR
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden xl:table-cell">
                  Last Active
                </th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {members.map((member) => {
                const percent = getOnboardingPercent(member)
                const pipeline = getPipelineValue(member)
                const mrr = getMrr(member)
                const lastActivity = getLastActivity(member)
                const adminDealId = member.deals[0]?.id
                const isCaller = member.clerkId === userId
                const roleBadge = ROLE_BADGE[member.role]

                return (
                  <tr
                    key={member.id}
                    className={`border-b border-border/50 last:border-0 hover:bg-surface/30 transition-colors ${
                      isCaller ? "bg-primary/[0.03]" : ""
                    }`}
                  >
                    {/* Member */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <span className="text-xs font-bold text-primary">
                            {(member.name ?? member.email)[0].toUpperCase()}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="text-sm font-medium text-foreground truncate">
                              {member.memberProfile?.businessName ?? member.name ?? "—"}
                            </p>
                            {isCaller && (
                              <span className="text-[9px] uppercase tracking-wider text-primary font-semibold shrink-0">
                                You
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                        </div>
                      </div>
                    </td>

                    {/* Role badge */}
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${roleBadge.className}`}
                      >
                        {(member.role === "ADMIN" || member.role === "SUPER_ADMIN") && (
                          <ShieldCheck className="h-2.5 w-2.5" />
                        )}
                        {roleBadge.label}
                      </span>
                    </td>

                    {/* Onboarding */}
                    <td className="px-4 py-3 hidden md:table-cell">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <div className="h-1.5 flex-1 bg-surface rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary rounded-full"
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground w-8 text-right shrink-0">
                            {percent}%
                          </span>
                        </div>
                        <p className="text-[10px] text-muted-foreground">
                          {member.memberOnboardingSteps.length}/{TOTAL_STEPS} steps
                          {member.memberProfile?.onboardingCompletedAt && (
                            <span className="ml-1 text-primary font-semibold">done</span>
                          )}
                        </p>
                      </div>
                    </td>

                    {/* CRM deals */}
                    <td className="px-4 py-3 hidden lg:table-cell">
                      {member.clientDeals.length > 0 ? (
                        <div className="flex items-center gap-1.5">
                          <Briefcase className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-sm text-foreground">
                            {member.clientDeals.length}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            ({member.clientDeals.filter((d) => d.stage === "ACTIVE_RETAINER").length} active)
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground/50">No deals</span>
                      )}
                    </td>

                    {/* Pipeline / MRR */}
                    <td className="px-4 py-3 hidden lg:table-cell">
                      {pipeline > 0 || mrr > 0 ? (
                        <div className="space-y-0.5">
                          {pipeline > 0 && (
                            <div className="flex items-center gap-1">
                              <TrendingUp className="h-3 w-3 text-muted-foreground" />
                              <span className="text-xs text-foreground tabular-nums">
                                ${pipeline.toLocaleString()}
                              </span>
                            </div>
                          )}
                          {mrr > 0 && (
                            <div className="flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3 text-primary" />
                              <span className="text-xs text-primary font-semibold tabular-nums">
                                ${mrr.toLocaleString()}/mo
                              </span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground/50">—</span>
                      )}
                    </td>

                    {/* Last active */}
                    <td className="px-4 py-3 hidden xl:table-cell">
                      {lastActivity ? (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {formatDistanceToNow(new Date(lastActivity), { addSuffix: true })}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground/50">No activity</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 justify-end">
                        {adminDealId && (
                          <Link
                            href={`/admin/crm/${adminDealId}`}
                            className="px-2.5 py-1 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-surface border border-border/40 hover:border-border transition-all"
                          >
                            CRM
                          </Link>
                        )}
                        <Link
                          href={`/admin/members/${member.id}`}
                          className="px-2.5 py-1 rounded-lg text-xs text-primary hover:bg-primary/10 border border-primary/20 hover:border-primary/40 transition-all font-medium"
                        >
                          Detail
                        </Link>
                        <Link
                          href={`/admin/clients/${member.id}`}
                          className="px-2.5 py-1 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-surface border border-border/40 hover:border-border transition-all"
                        >
                          View
                        </Link>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
