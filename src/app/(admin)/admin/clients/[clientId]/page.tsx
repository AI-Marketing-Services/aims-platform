import { auth } from "@clerk/nextjs/server"
import { redirect, notFound } from "next/navigation"
import { db } from "@/lib/db"
import { ClientDetailClient } from "./ClientDetailClient"
import { Breadcrumbs } from "@/components/shared/Breadcrumbs"

export const dynamic = "force-dynamic"

export default async function AdminClientDetailPage({ params }: { params: Promise<{ clientId: string }> }) {
  const { clientId } = await params
  const { userId, sessionClaims } = await auth()
  if (!userId) redirect("/sign-in")
  const role = (sessionClaims?.metadata as { role?: string })?.role
  if (!role || !["ADMIN", "SUPER_ADMIN"].includes(role)) redirect("/portal/dashboard")

  const user = await db.user.findUnique({
    where: { id: clientId },
    include: {
      subscriptions: {
        include: {
          serviceArm: { select: { id: true, name: true, slug: true, pillar: true } },
          fulfillmentTasks: { orderBy: { createdAt: "desc" } },
        },
        orderBy: { createdAt: "desc" },
      },
      deals: {
        include: {
          activities: { orderBy: { createdAt: "desc" }, take: 10 },
          serviceArms: { include: { serviceArm: { select: { name: true } } } },
        },
        orderBy: { createdAt: "desc" },
      },
      supportTickets: {
        include: {
          replies: { orderBy: { createdAt: "desc" }, take: 3 },
        },
        orderBy: { createdAt: "desc" },
      },
      leadMagnetSubmissions: {
        orderBy: { createdAt: "desc" },
      },
    },
  })

  if (!user) notFound()

  // Calculate health score
  const now = new Date()
  const sevenDaysAgo = new Date(now.getTime() - 7 * 86_400_000)
  const activeSubs = user.subscriptions.filter((s) => s.status === "ACTIVE" || s.status === "TRIALING")
  const hasActiveSubs = activeSubs.length > 0
  const loggedInRecently = user.lastLoginAt ? new Date(user.lastLoginAt) > sevenDaysAgo : false
  const hasPastDue = user.subscriptions.some((s) => s.status === "PAST_DUE")
  const hasUrgentTicket = user.supportTickets.some(
    (t) => t.status === "open" && t.priority === "urgent"
  )
  const onboardingCompleted = activeSubs.every((s) => s.onboardingCompletedAt != null)

  let healthScore = 0
  if (hasActiveSubs) healthScore += 30
  if (loggedInRecently) healthScore += 20
  if (!hasPastDue) healthScore += 20
  if (!hasUrgentTicket) healthScore += 15
  if (onboardingCompleted) healthScore += 15

  const totalMRR = activeSubs.reduce((sum, s) => sum + s.monthlyAmount, 0)

  // Serialize dates for client component
  const serializedUser = {
    id: user.id,
    name: user.name,
    email: user.email,
    company: user.company,
    phone: user.phone,
    industry: user.industry,
    website: user.website,
    role: user.role,
    avatarUrl: user.avatarUrl,
    createdAt: user.createdAt.toISOString(),
    lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
  }

  const serializedSubscriptions = user.subscriptions.map((s) => ({
    id: s.id,
    status: s.status,
    tier: s.tier,
    monthlyAmount: s.monthlyAmount,
    fulfillmentStatus: s.fulfillmentStatus,
    onboardingCompletedAt: s.onboardingCompletedAt?.toISOString() ?? null,
    createdAt: s.createdAt.toISOString(),
    cancelledAt: s.cancelledAt?.toISOString() ?? null,
    serviceArm: s.serviceArm,
    fulfillmentTasks: s.fulfillmentTasks.map((t) => ({
      id: t.id,
      title: t.title,
      status: t.status,
      priority: t.priority,
      dueDate: t.dueDate?.toISOString() ?? null,
      completedAt: t.completedAt?.toISOString() ?? null,
      assignedTo: t.assignedTo,
    })),
  }))

  const serializedDeals = user.deals.map((d) => ({
    id: d.id,
    contactName: d.contactName,
    company: d.company,
    stage: d.stage,
    value: d.value,
    mrr: d.mrr,
    leadScore: d.leadScore,
    leadScoreTier: d.leadScoreTier,
    createdAt: d.createdAt.toISOString(),
    activities: d.activities.map((a) => ({
      id: a.id,
      type: a.type,
      detail: a.detail,
      createdAt: a.createdAt.toISOString(),
    })),
    serviceArms: d.serviceArms.map((sa) => sa.serviceArm.name),
  }))

  const serializedTickets = user.supportTickets.map((t) => ({
    id: t.id,
    subject: t.subject,
    status: t.status,
    priority: t.priority,
    createdAt: t.createdAt.toISOString(),
    resolvedAt: t.resolvedAt?.toISOString() ?? null,
  }))

  const serializedLeadMagnets = user.leadMagnetSubmissions.map((lm) => ({
    id: lm.id,
    type: lm.type,
    score: lm.score,
    convertedToDeal: lm.convertedToDeal,
    createdAt: lm.createdAt.toISOString(),
  }))

  return (
    <div className="max-w-7xl">
      <Breadcrumbs
        items={[
          { label: "Admin", href: "/admin/dashboard" },
          { label: "Clients", href: "/admin/clients" },
          { label: user.name ?? user.email ?? "Client" },
        ]}
      />

      <ClientDetailClient
        user={serializedUser}
        subscriptions={serializedSubscriptions}
        deals={serializedDeals}
        tickets={serializedTickets}
        leadMagnets={serializedLeadMagnets}
        healthScore={healthScore}
        totalMRR={totalMRR}
      />
    </div>
  )
}
